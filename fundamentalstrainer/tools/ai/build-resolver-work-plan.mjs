#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const resolverRoot = path.resolve(root, "data", "imports", "resolver");
const reportsRoot = path.resolve(root, "data", "imports", "reports");
const write = args.write !== "false";

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function resolverFiles() {
  if (!fs.existsSync(resolverRoot)) return [];
  return fs.readdirSync(resolverRoot, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".json"))
    .map(entry => path.join(resolverRoot, entry.name))
    .filter(file => !lesson || path.basename(file).startsWith(`${lesson}-`))
    .sort();
}

function groupBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

function resultFromFile(file) {
  const result = readJson(file);
  return {
    file: toProjectPath(file, root),
    sourceLessonId: result.sourceLessonId,
    conceptId: result.conceptId,
    title: result.discoveredTitle,
    knowledgeId: result.proposedKnowledgeId,
    decision: result.decision,
    confidence: result.confidence,
    topMatch: result.candidateMatches?.[0]?.knowledgeId || null,
    topMatchScore: result.candidateMatches?.[0]?.matchScore || 0,
    notes: asArray(result.reviewNotes)
  };
}

function conceptLine(item) {
  return {
    conceptId: item.conceptId,
    title: item.title,
    decision: item.decision,
    confidence: item.confidence,
    topMatch: item.topMatch,
    topMatchScore: item.topMatchScore,
    notes: item.notes
  };
}

function updateItems(results) {
  return [...groupBy(results.filter(item => item.decision === "expand-existing-object"), item => item.knowledgeId).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([knowledgeId, items]) => {
      const sorted = items.sort(byConceptId);
      const isPackage = sorted.length > 1;
      return {
        action: isPackage ? "create-update-package" : "create-knowledge-update",
        knowledgeId,
        workItemId: `${lesson || "all"}.${isPackage ? "package" : "update"}.${knowledgeId}`,
        conceptCount: sorted.length,
        concepts: sorted.map(conceptLine),
        reason: isPackage
          ? "Multiple discoveries target the same canonical object. Review together as one update package."
          : "One discovery enriches an existing canonical object. Review as a single knowledge update."
      };
    });
}

function expectationItems(results) {
  return [...groupBy(results.filter(item => item.decision === "expectation-only"), item => item.knowledgeId).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([knowledgeId, items]) => ({
      action: "create-or-update-expectation",
      knowledgeId,
      workItemId: `${lesson || "all"}.expectation.${knowledgeId}`,
      conceptCount: items.length,
      concepts: items.sort(byConceptId).map(conceptLine),
      reason: "Canonical object already exists. Capture curriculum-specific depth as an expectation."
    }));
}

function deferredItems(results) {
  return results
    .filter(item => item.decision === "defer")
    .sort(byConceptId)
    .map(item => ({
      action: "defer-human-review",
      knowledgeId: item.knowledgeId,
      workItemId: `${lesson || "all"}.defer.${item.conceptId.toLowerCase()}`,
      conceptCount: 1,
      concepts: [conceptLine(item)],
      reason: "Resolver could not safely route this concept."
    }));
}

function newObjectItems(results) {
  return results
    .filter(item => item.decision === "new-object")
    .sort(byConceptId)
    .map(item => ({
      action: "create-new-object",
      knowledgeId: item.knowledgeId,
      workItemId: `${lesson || "all"}.new.${item.conceptId.toLowerCase()}`,
      conceptCount: 1,
      concepts: [conceptLine(item)],
      reason: "No existing canonical object was selected. Confirm before authoring."
    }));
}

function otherItems(results) {
  return results
    .filter(item => ["relationship-only", "duplicate-no-change", "reject"].includes(item.decision))
    .sort(byConceptId)
    .map(item => ({
      action: item.decision,
      knowledgeId: item.knowledgeId,
      workItemId: `${lesson || "all"}.${item.decision}.${item.conceptId.toLowerCase()}`,
      conceptCount: 1,
      concepts: [conceptLine(item)],
      reason: `Resolver decision: ${item.decision}`
    }));
}

function byConceptId(a, b) {
  return a.conceptId.localeCompare(b.conceptId);
}

const files = resolverFiles();
const results = files.map(resultFromFile);
const workItems = [
  ...deferredItems(results),
  ...newObjectItems(results),
  ...updateItems(results),
  ...expectationItems(results),
  ...otherItems(results)
];

const report = {
  generatedBy: "resolver-work-plan",
  schemaVersion: "1.1.0",
  lesson,
  generatedAt: new Date().toISOString(),
  resolverFileCount: files.length,
  counts: {
    workItems: workItems.length,
    updatePackages: workItems.filter(item => item.action === "create-update-package").length,
    knowledgeUpdates: workItems.filter(item => item.action === "create-knowledge-update").length,
    expectations: workItems.filter(item => item.action === "create-or-update-expectation").length,
    newObjects: workItems.filter(item => item.action === "create-new-object").length,
    deferred: workItems.filter(item => item.action === "defer-human-review").length
  },
  workItems,
  sourceFiles: files.map(file => toProjectPath(file, root))
};

if (write) {
  fs.mkdirSync(reportsRoot, { recursive: true });
  const reportFile = path.join(reportsRoot, `${lesson || "all"}-resolver-work-plan.json`);
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  report.output = toProjectPath(reportFile, root);
}

console.log(JSON.stringify(report, null, 2));
