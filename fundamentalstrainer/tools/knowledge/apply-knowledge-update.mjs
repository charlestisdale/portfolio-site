#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const updateFile = args.file || args.update || "";
const approved = args.approve === "true";
const reportsRoot = path.resolve(root, "data", "imports", "reports");
const backupRoot = path.resolve(root, "data", "backups", "knowledge-updates");

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
  return String(value || "update")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "update";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
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

function hasText(items, text, selector = item => item?.text) {
  const normalized = normalizeText(text);
  return asArray(items).some(item => normalizeText(selector(item)) === normalized);
}

function addUniqueTextItems(targetArray, proposedItems, selector = item => item?.text) {
  const added = [];
  const skipped = [];
  for (const item of asArray(proposedItems)) {
    const text = selector(item);
    if (!text || hasText(targetArray, text, selector)) {
      skipped.push(item);
      continue;
    }
    targetArray.push(item);
    added.push(item);
  }
  return { added, skipped };
}

function addUniqueQuestionTargets(targetArray, proposedItems) {
  const added = [];
  const skipped = [];
  for (const item of asArray(proposedItems)) {
    if (!item || asArray(targetArray).some(existing => normalizeText(existing) === normalizeText(item))) {
      skipped.push(item);
      continue;
    }
    targetArray.push(item);
    added.push(item);
  }
  return { added, skipped };
}

function addUniqueRelationships(targetArray, proposedItems) {
  const added = [];
  const skipped = [];
  for (const item of asArray(proposedItems)) {
    if (!item?.id || !item?.relationship || asArray(targetArray).some(existing => existing.id === item.id && existing.relationship === item.relationship)) {
      skipped.push(item);
      continue;
    }
    targetArray.push(item);
    added.push(item);
  }
  return { added, skipped };
}

function runNodeScript(script) {
  return spawnSync(process.execPath, [script], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

function requireValidation(script, label) {
  const result = runNodeScript(script);
  if (result.status !== 0) {
    console.error(result.stdout || "");
    console.error(result.stderr || "");
    fail(`${label} failed.`);
  }
  return result;
}

function applyUpdate(target, update) {
  const merged = structuredClone(target);
  const changes = update.proposedChanges || {};
  const summary = {
    summaryUpdates: { added: 0, skipped: 0 },
    explanationUpdates: { added: 0, skipped: 0 },
    factsToAdd: { added: 0, skipped: 0 },
    examplesToAdd: { added: 0, skipped: 0 },
    commandsToAdd: { added: 0, skipped: 0 },
    assessmentSeedsToAdd: {},
    relationshipsToAdd: { added: 0, skipped: 0 }
  };

  merged.learning ||= {};
  merged.learning.facts ||= [];
  merged.learning.examples ||= [];
  merged.learning.commands ||= [];
  merged.learning.notes ||= [];
  merged.assessmentSeeds ||= {};
  merged.assessmentSeeds.examTips ||= [];
  merged.assessmentSeeds.commonMistakes ||= [];
  merged.assessmentSeeds.scenarios ||= [];
  merged.assessmentSeeds.pbqIdeas ||= [];
  merged.assessmentSeeds.questionTargets ||= [];
  merged.relationships ||= {};
  merged.relationships.related ||= [];
  merged.quality ||= {};
  merged.quality.reviewNotes ||= [];

  const summaryUpdates = addUniqueTextItems([], changes.summaryUpdates);
  if (summaryUpdates.added.length) {
    merged.learning.summary = `${merged.learning.summary || ""}\n\n${summaryUpdates.added.map(item => item.text).join("\n\n")}`.trim();
  }
  summary.summaryUpdates = { added: summaryUpdates.added.length, skipped: summaryUpdates.skipped.length };

  const explanationUpdates = addUniqueTextItems([], changes.explanationUpdates);
  if (explanationUpdates.added.length) {
    merged.learning.explanation = `${merged.learning.explanation || ""}\n\n${explanationUpdates.added.map(item => item.text).join("\n\n")}`.trim();
  }
  summary.explanationUpdates = { added: explanationUpdates.added.length, skipped: explanationUpdates.skipped.length };

  for (const [key, targetArray, proposed, selector] of [
    ["factsToAdd", merged.learning.facts, changes.factsToAdd, item => item?.text],
    ["examplesToAdd", merged.learning.examples, changes.examplesToAdd, item => item?.text],
    ["commandsToAdd", merged.learning.commands, changes.commandsToAdd, item => item?.command || item?.text]
  ]) {
    const result = addUniqueTextItems(targetArray, proposed, selector);
    summary[key] = { added: result.added.length, skipped: result.skipped.length };
  }

  const seeds = changes.assessmentSeedsToAdd || {};
  for (const [key, targetArray, proposed, selector] of [
    ["examTips", merged.assessmentSeeds.examTips, seeds.examTips, item => item?.text],
    ["commonMistakes", merged.assessmentSeeds.commonMistakes, seeds.commonMistakes, item => item?.text],
    ["scenarios", merged.assessmentSeeds.scenarios, seeds.scenarios, item => item?.situation || item?.text],
    ["pbqIdeas", merged.assessmentSeeds.pbqIdeas, seeds.pbqIdeas, item => item?.task || item?.text]
  ]) {
    const result = addUniqueTextItems(targetArray, proposed, selector);
    summary.assessmentSeedsToAdd[key] = { added: result.added.length, skipped: result.skipped.length };
  }

  const qTargets = addUniqueQuestionTargets(merged.assessmentSeeds.questionTargets, seeds.questionTargets);
  summary.assessmentSeedsToAdd.questionTargets = { added: qTargets.added.length, skipped: qTargets.skipped.length };

  const relationships = addUniqueRelationships(merged.relationships.related, changes.relationshipsToAdd);
  summary.relationshipsToAdd = { added: relationships.added.length, skipped: relationships.skipped.length };

  merged.quality.updatedAt = today();
  merged.quality.needsHumanReview = true;
  merged.quality.reviewNotes.push(`Applied Knowledge Maintainer update ${update.workItemId} from lesson ${update.sourceLessonId || "unknown"} on ${today()}.`);
  for (const note of asArray(update.quality?.reviewNotes)) {
    const text = `Maintainer note (${update.workItemId}): ${note}`;
    if (!merged.quality.reviewNotes.includes(text)) merged.quality.reviewNotes.push(text);
  }

  return { merged, summary };
}

if (!updateFile) fail("Usage: node tools/knowledge/apply-knowledge-update.mjs --file=<knowledge-update.json> --approve=true");
if (!approved) fail("Refusing to modify canonical knowledge without --approve=true. Run the preview command first, then re-run with --approve=true after human review.");

requireValidation("tools/validate-knowledge-updates.mjs", "Knowledge update validation");

const resolvedUpdateFile = path.resolve(root, updateFile);
if (!fs.existsSync(resolvedUpdateFile)) fail(`Update file not found: ${updateFile}`);
const update = readJson(resolvedUpdateFile);
const target = findKnowledgeObject(update.targetKnowledgeId);
if (!target) fail(`Target Knowledge Object not found: ${update.targetKnowledgeId}`);

const { merged, summary } = applyUpdate(target.object, update);
const backupFile = path.join(backupRoot, today(), `${slugify(update.targetKnowledgeId)}-${timestamp()}.json`);
writeJson(backupFile, target.object);
writeJson(target.file, merged);

const validation = requireValidation("tools/validate-knowledge.mjs", "Knowledge validation after apply");

const report = {
  generatedBy: "knowledge-update-apply",
  schemaVersion: "1.0.0",
  appliedAt: new Date().toISOString(),
  updateFile: toProjectPath(resolvedUpdateFile, root),
  targetFile: toProjectPath(target.file, root),
  backupFile: toProjectPath(backupFile, root),
  targetKnowledgeId: update.targetKnowledgeId,
  workItemId: update.workItemId,
  updateType: update.type,
  summary,
  validation: {
    knowledge: "passed",
    output: validation.stdout.trim()
  }
};

const reportFile = path.join(reportsRoot, `${slugify(update.workItemId || update.targetKnowledgeId)}-apply-report.json`);
writeJson(reportFile, report);

console.log(JSON.stringify({
  generatedBy: "knowledge-update-apply",
  applied: true,
  targetKnowledgeId: report.targetKnowledgeId,
  targetFile: report.targetFile,
  backupFile: report.backupFile,
  reportFile: toProjectPath(reportFile, root),
  summary,
  validation: "passed",
  next: [
    "Review the modified canonical Knowledge Object.",
    "Run npm run validate:all.",
    "Commit the canonical update only if the result is acceptable."
  ]
}, null, 2));
