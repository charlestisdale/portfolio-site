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
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listResolverFiles() {
  if (!fs.existsSync(resolverRoot)) return [];
  return fs.readdirSync(resolverRoot, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(resolverRoot, entry.name))
    .filter(file => file.endsWith(".json"))
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

function summarizeResult(file) {
  const result = readJson(file);
  return {
    file: toProjectPath(file, root),
    sourceLessonId: result.sourceLessonId,
    conceptId: result.conceptId,
    discoveredTitle: result.discoveredTitle,
    proposedKnowledgeId: result.proposedKnowledgeId,
    decision: result.decision,
    confidence: result.confidence,
    topMatch: result.candidateMatches?.[0]?.knowledgeId || null,
    topMatchScore: result.candidateMatches?.[0]?.matchScore || 0,
    recommendedActionTypes: asArray(result.recommendedActions).map(action => action.type),
    humanReviewRequired: result.humanReviewRequired === true,
    reviewNotes: asArray(result.reviewNotes)
  };
}

function summarizeDecisionGroups(results) {
  return [...groupBy(results, item => item.decision).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([decision, items]) => ({
      decision,
      count: items.length,
      items: items
        .sort((a, b) => a.conceptId.localeCompare(b.conceptId))
        .map(item => ({
          conceptId: item.conceptId,
          discoveredTitle: item.discoveredTitle,
          proposedKnowledgeId: item.proposedKnowledgeId,
          confidence: item.confidence,
          topMatch: item.topMatch,
          topMatchScore: item.topMatchScore,
          recommendedActionTypes: item.recommendedActionTypes
        }))
    }));
}

function summarizeTargetClusters(results) {
  const actionable = results.filter(item => !["reject", "defer"].includes(item.decision));
  return [...groupBy(actionable, item => item.proposedKnowledgeId).entries()]
    .filter(([, items]) => items.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([knowledgeId, items]) => ({
      knowledgeId,
      count: items.length,
      decisions: [...new Set(items.map(item => item.decision))].sort(),
      concepts: items
        .sort((a, b) => a.conceptId.localeCompare(b.conceptId))
        .map(item => ({
          conceptId: item.conceptId,
          discoveredTitle: item.discoveredTitle,
          decision: item.decision,
          confidence: item.confidence,
          topMatchScore: item.topMatchScore
        }))
    }));
}

function summarizeReviewQueue(results) {
  return results
    .filter(item => item.humanReviewRequired || item.decision === "defer" || item.confidence !== "high")
    .sort((a, b) => {
      const decisionRank = { defer: 0, "new-object": 1, "expand-existing-object": 2, "expectation-only": 3, "relationship-only": 4, "duplicate-no-change": 5, reject: 6 };
      return (decisionRank[a.decision] ?? 99) - (decisionRank[b.decision] ?? 99) || a.conceptId.localeCompare(b.conceptId);
    })
    .map(item => ({
      conceptId: item.conceptId,
      discoveredTitle: item.discoveredTitle,
      proposedKnowledgeId: item.proposedKnowledgeId,
      decision: item.decision,
      confidence: item.confidence,
      topMatch: item.topMatch,
      topMatchScore: item.topMatchScore,
      reviewNotes: item.reviewNotes
    }));
}

function countsBy(results, field) {
  return Object.fromEntries([...groupBy(results, item => item[field] || "unknown").entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => [key, items.length]));
}

const files = listResolverFiles();
const results = files.map(summarizeResult);
const report = {
  generatedBy: "resolver-summary-report",
  schemaVersion: "1.0.0",
  lesson,
  generatedAt: new Date().toISOString(),
  resolverFileCount: files.length,
  counts: {
    byDecision: countsBy(results, "decision"),
    byConfidence: countsBy(results, "confidence")
  },
  decisionGroups: summarizeDecisionGroups(results),
  targetClusters: summarizeTargetClusters(results),
  reviewQueue: summarizeReviewQueue(results),
  sourceFiles: files.map(file => toProjectPath(file, root))
};

if (write) {
  fs.mkdirSync(reportsRoot, { recursive: true });
  const reportName = `${lesson || "all"}-resolver-summary.json`;
  const reportFile = path.join(reportsRoot, reportName);
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  report.output = toProjectPath(reportFile, root);
}

console.log(JSON.stringify(report, null, 2));
