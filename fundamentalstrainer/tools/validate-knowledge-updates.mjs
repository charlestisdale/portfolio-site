#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedTypes = new Set(["knowledge-update", "knowledge-update-package"]);
const allowedStatus = new Set(["needs-review", "approved", "rejected", "superseded"]);
const allowedConfidence = new Set(["low", "medium", "high"]);
const allowedImportance = new Set(["low", "medium", "high", "exam-critical"]);

let errors = 0;
let warnings = 0;
const missingRelationshipTargets = new Map();

function fail(file, message) {
  console.error(`Error: ${relative(file)}: ${message}`);
  errors += 1;
}

function warn(file, message) {
  console.warn(`Warning: ${relative(file)}: ${message}`);
  warnings += 1;
}

function relative(file) {
  return path.relative(root, file).replace(/\\/g, "/");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
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

function knowledgeIds() {
  const ids = new Set();
  for (const file of walkJsonFiles("content/knowledge")) {
    const object = readJson(file);
    if (object.id) ids.add(object.id);
  }
  return ids;
}

function updateFiles() {
  return [
    ...walkJsonFiles("data/imports/updates"),
    ...walkJsonFiles("data/ai-imports/responses/knowledge-maintainer")
  ].filter(file => !file.includes(`${path.sep}_templates${path.sep}`));
}

function mustBeObject(file, value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(file, `${label} must be an object.`);
    return false;
  }
  return true;
}

function mustBeArray(file, value, label) {
  if (!Array.isArray(value)) {
    fail(file, `${label} must be an array.`);
    return false;
  }
  return true;
}

function validateTextItemArray(file, items, label, options = {}) {
  if (!mustBeArray(file, items, label)) return;
  items.forEach((item, index) => {
    if (!mustBeObject(file, item, `${label}[${index}]`)) return;
    if (!item.text || typeof item.text !== "string") fail(file, `${label}[${index}].text is required.`);
    if (item.importance && !allowedImportance.has(item.importance)) fail(file, `${label}[${index}].importance must be one of ${[...allowedImportance].join(", ")}.`);
    if (item.tags && !Array.isArray(item.tags)) fail(file, `${label}[${index}].tags must be an array.`);
    if (options.requireReason && (!item.reason || typeof item.reason !== "string")) fail(file, `${label}[${index}].reason is required.`);
  });
}

function validateAssessmentSeeds(file, seeds) {
  if (!mustBeObject(file, seeds, "proposedChanges.assessmentSeedsToAdd")) return;
  for (const key of ["examTips", "commonMistakes", "scenarios", "pbqIdeas", "questionTargets"]) {
    if (!Array.isArray(seeds[key])) fail(file, `proposedChanges.assessmentSeedsToAdd.${key} must be an array.`);
  }
}

function addMissingRelationshipTarget(file, id) {
  if (!missingRelationshipTargets.has(id)) missingRelationshipTargets.set(id, new Set());
  missingRelationshipTargets.get(id).add(relative(file));
}

function validateRelationships(file, relationships, ids) {
  if (!mustBeArray(file, relationships, "proposedChanges.relationshipsToAdd")) return;
  relationships.forEach((relationship, index) => {
    if (!mustBeObject(file, relationship, `proposedChanges.relationshipsToAdd[${index}]`)) return;
    if (!relationship.id || typeof relationship.id !== "string") fail(file, `proposedChanges.relationshipsToAdd[${index}].id is required.`);
    if (!relationship.relationship || typeof relationship.relationship !== "string") fail(file, `proposedChanges.relationshipsToAdd[${index}].relationship is required.`);
    if (relationship.id && !ids.has(relationship.id)) addMissingRelationshipTarget(file, relationship.id);
  });
}

function validateUpdate(file, ids) {
  let update;
  try {
    update = readJson(file);
  } catch (error) {
    fail(file, `Invalid JSON: ${error.message}`);
    return;
  }

  if (update.schemaVersion !== "1.0.0") fail(file, "schemaVersion must be 1.0.0.");
  if (!allowedTypes.has(update.type)) fail(file, `type must be one of ${[...allowedTypes].join(", ")}.`);
  if (!update.workItemId || typeof update.workItemId !== "string") fail(file, "workItemId is required.");
  if (!update.targetKnowledgeId || typeof update.targetKnowledgeId !== "string") fail(file, "targetKnowledgeId is required.");
  if (update.targetKnowledgeId && !ids.has(update.targetKnowledgeId)) fail(file, `targetKnowledgeId does not exist: ${update.targetKnowledgeId}`);
  if (!allowedStatus.has(update.status)) fail(file, `status must be one of ${[...allowedStatus].join(", ")}.`);
  if (!update.sourceLessonId || typeof update.sourceLessonId !== "string") warn(file, "sourceLessonId is missing or not a string.");

  if (!mustBeObject(file, update.proposedChanges, "proposedChanges")) return;
  const changes = update.proposedChanges;

  validateTextItemArray(file, changes.summaryUpdates, "proposedChanges.summaryUpdates", { requireReason: true });
  validateTextItemArray(file, changes.explanationUpdates, "proposedChanges.explanationUpdates", { requireReason: true });
  validateTextItemArray(file, changes.factsToAdd, "proposedChanges.factsToAdd");
  validateTextItemArray(file, changes.examplesToAdd, "proposedChanges.examplesToAdd");
  if (!mustBeArray(file, changes.commandsToAdd, "proposedChanges.commandsToAdd")) return;
  validateAssessmentSeeds(file, changes.assessmentSeedsToAdd);
  validateRelationships(file, changes.relationshipsToAdd, ids);

  mustBeArray(file, update.preservationNotes, "preservationNotes");
  mustBeArray(file, update.duplicateChecks, "duplicateChecks");

  if (mustBeObject(file, update.quality, "quality")) {
    if (!allowedConfidence.has(update.quality.confidence)) fail(file, `quality.confidence must be one of ${[...allowedConfidence].join(", ")}.`);
    if (update.quality.needsHumanReview !== true) fail(file, "quality.needsHumanReview must be true for maintainer updates.");
    if (!Array.isArray(update.quality.reviewNotes)) fail(file, "quality.reviewNotes must be an array.");
  }
}

const ids = knowledgeIds();
const files = updateFiles();
for (const file of files) validateUpdate(file, ids);

if (missingRelationshipTargets.size) {
  warnings += missingRelationshipTargets.size;
  console.warn(`Warning: ${missingRelationshipTargets.size} missing/planned relationship target(s) referenced by Knowledge Maintainer updates.`);
  for (const [id, refs] of [...missingRelationshipTargets.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.warn(`  - ${id} <- ${[...refs].sort().join(", ")}`);
  }
}

if (errors > 0) {
  console.error(`Knowledge update validation failed with ${errors} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}

console.log(`Knowledge update validation passed for ${files.length} update file(s). ${warnings} warning(s).`);
