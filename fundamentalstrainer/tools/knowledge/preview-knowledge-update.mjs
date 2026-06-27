#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const updateFile = args.file || args.update || "";
const reportsRoot = path.resolve(root, "data", "imports", "reports");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return String(value || "preview")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "preview";
}

function walkJsonFiles(dir) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function findKnowledgeObject(knowledgeId) {
  for (const file of walkJsonFiles("content/knowledge")) {
    const object = readJson(file);
    if (object.id === knowledgeId) return { file, object };
  }
  return null;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function existingTexts(items, selector = item => item?.text) {
  return new Set(asArray(items).map(selector).filter(Boolean).map(normalizeText));
}

function classifyTextAdditions(existingItems, proposedItems, selector = item => item?.text) {
  const existing = existingTexts(existingItems, selector);
  return asArray(proposedItems).map(item => {
    const text = selector(item);
    return {
      item,
      duplicateRisk: existing.has(normalizeText(text))
    };
  });
}

function classifyQuestionTargets(existingTargets, proposedTargets) {
  const existing = new Set(asArray(existingTargets).map(normalizeText));
  return asArray(proposedTargets).map(item => ({
    item,
    duplicateRisk: existing.has(normalizeText(item))
  }));
}

function classifyRelationships(existingRelationships, proposedRelationships) {
  const existing = new Set(asArray(existingRelationships).map(item => `${item.id}|${item.relationship}`));
  return asArray(proposedRelationships).map(item => ({
    item,
    duplicateRisk: existing.has(`${item.id}|${item.relationship}`)
  }));
}

function previewMerge(target, update) {
  const changes = update.proposedChanges || {};
  const learning = target.learning || {};
  const seeds = target.assessmentSeeds || {};
  const relationships = target.relationships || {};

  return {
    targetKnowledgeId: target.id,
    targetTitle: target.title,
    targetFileStatus: target.status,
    updateFileStatus: update.status,
    workItemId: update.workItemId,
    updateType: update.type,
    sourceLessonId: update.sourceLessonId,
    summary: {
      current: learning.summary || null,
      proposedAdditions: classifyTextAdditions([{ text: learning.summary }], changes.summaryUpdates)
    },
    explanation: {
      currentLength: String(learning.explanation || "").length,
      proposedAdditions: classifyTextAdditions([], changes.explanationUpdates)
    },
    facts: {
      currentCount: asArray(learning.facts).length,
      proposedAdditions: classifyTextAdditions(learning.facts, changes.factsToAdd)
    },
    examples: {
      currentCount: asArray(learning.examples).length,
      proposedAdditions: classifyTextAdditions(learning.examples, changes.examplesToAdd)
    },
    commands: {
      currentCount: asArray(learning.commands).length,
      proposedAdditions: classifyTextAdditions(learning.commands, changes.commandsToAdd, item => item?.command || item?.text)
    },
    assessmentSeeds: {
      examTips: classifyTextAdditions(seeds.examTips, changes.assessmentSeedsToAdd?.examTips),
      commonMistakes: classifyTextAdditions(seeds.commonMistakes, changes.assessmentSeedsToAdd?.commonMistakes),
      scenarios: classifyTextAdditions(seeds.scenarios, changes.assessmentSeedsToAdd?.scenarios, item => item?.situation || item?.text),
      pbqIdeas: classifyTextAdditions(seeds.pbqIdeas, changes.assessmentSeedsToAdd?.pbqIdeas, item => item?.task || item?.text),
      questionTargets: classifyQuestionTargets(seeds.questionTargets, changes.assessmentSeedsToAdd?.questionTargets)
    },
    relationships: {
      related: classifyRelationships(relationships.related, changes.relationshipsToAdd)
    },
    preservationNotes: asArray(update.preservationNotes),
    duplicateChecks: asArray(update.duplicateChecks),
    quality: update.quality || null
  };
}

function previewMarkdown(report) {
  const duplicateCount = countDuplicates(report.preview);
  const lines = [];
  lines.push(`# Knowledge Update Preview: ${report.targetKnowledgeId}`);
  lines.push("");
  lines.push(`- updateFile: ${report.updateFile}`);
  lines.push(`- targetFile: ${report.targetFile}`);
  lines.push(`- workItemId: ${report.workItemId}`);
  lines.push(`- updateType: ${report.updateType}`);
  lines.push(`- duplicateRiskItems: ${duplicateCount}`);
  lines.push("");
  lines.push("## Summary additions");
  appendItems(lines, report.preview.summary.proposedAdditions, item => item.text);
  lines.push("");
  lines.push("## Explanation additions");
  appendItems(lines, report.preview.explanation.proposedAdditions, item => item.text);
  lines.push("");
  lines.push("## Facts to add");
  appendItems(lines, report.preview.facts.proposedAdditions, item => item.text);
  lines.push("");
  lines.push("## Examples to add");
  appendItems(lines, report.preview.examples.proposedAdditions, item => item.text);
  lines.push("");
  lines.push("## Assessment seeds to add");
  for (const [key, items] of Object.entries(report.preview.assessmentSeeds)) {
    lines.push(`### ${key}`);
    appendItems(lines, items, item => typeof item === "string" ? item : item.text || item.situation || item.task || JSON.stringify(item));
  }
  lines.push("");
  lines.push("## Relationships to add");
  appendItems(lines, report.preview.relationships.related, item => `${item.relationship} -> ${item.id}: ${item.reason || ""}`);
  lines.push("");
  lines.push("## Preservation notes");
  for (const note of report.preview.preservationNotes) lines.push(`- ${note}`);
  lines.push("");
  lines.push("## Duplicate checks from maintainer");
  for (const check of report.preview.duplicateChecks) lines.push(`- ${check.checkedAgainst || "check"}: ${check.result || JSON.stringify(check)}`);
  lines.push("");
  lines.push("## Next step");
  lines.push("Review this preview. Do not apply the update until the preview and validation are acceptable.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function appendItems(lines, classifiedItems, selector) {
  const items = asArray(classifiedItems);
  if (!items.length) {
    lines.push("- None");
    return;
  }
  for (const entry of items) {
    const prefix = entry.duplicateRisk ? "- [DUPLICATE RISK]" : "- [ADD]";
    lines.push(`${prefix} ${selector(entry.item)}`);
  }
}

function countDuplicates(value) {
  let count = 0;
  if (Array.isArray(value)) {
    for (const item of value) count += countDuplicates(item);
  } else if (value && typeof value === "object") {
    if (value.duplicateRisk === true) count += 1;
    for (const child of Object.values(value)) count += countDuplicates(child);
  }
  return count;
}

function runUpdateValidation() {
  return spawnSync(process.execPath, ["tools/validate-knowledge-updates.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

if (!updateFile) fail("Usage: node tools/knowledge/preview-knowledge-update.mjs --file=data/ai-imports/responses/knowledge-maintainer/<update>.json");

const validation = runUpdateValidation();
if (validation.status !== 0) {
  console.error(validation.stdout || "");
  console.error(validation.stderr || "");
  fail("Knowledge update validation failed. Preview aborted.");
}

const resolvedUpdateFile = path.resolve(root, updateFile);
if (!fs.existsSync(resolvedUpdateFile)) fail(`Update file not found: ${updateFile}`);
const update = readJson(resolvedUpdateFile);
const target = findKnowledgeObject(update.targetKnowledgeId);
if (!target) fail(`Target Knowledge Object not found: ${update.targetKnowledgeId}`);

const preview = previewMerge(target.object, update);
const report = {
  generatedBy: "knowledge-update-preview",
  schemaVersion: "1.0.0",
  generatedAt: new Date().toISOString(),
  updateFile: toProjectPath(resolvedUpdateFile, root),
  targetFile: toProjectPath(target.file, root),
  targetKnowledgeId: update.targetKnowledgeId,
  workItemId: update.workItemId,
  updateType: update.type,
  duplicateRiskItems: countDuplicates(preview),
  preview
};

const baseName = `${slugify(update.workItemId || update.targetKnowledgeId)}-preview`;
const jsonReport = path.join(reportsRoot, `${baseName}.json`);
const mdReport = path.join(reportsRoot, `${baseName}.md`);
writeJson(jsonReport, report);
fs.writeFileSync(mdReport, previewMarkdown(report), "utf8");

console.log(JSON.stringify({
  generatedBy: "knowledge-update-preview",
  updateFile: report.updateFile,
  targetFile: report.targetFile,
  targetKnowledgeId: report.targetKnowledgeId,
  workItemId: report.workItemId,
  duplicateRiskItems: report.duplicateRiskItems,
  outputs: [
    toProjectPath(jsonReport, root),
    toProjectPath(mdReport, root)
  ],
  next: [
    "Open the Markdown preview and review the proposed additions.",
    "If the preview looks correct, the next future step is an explicit apply command that only runs after human approval."
  ]
}, null, 2));
