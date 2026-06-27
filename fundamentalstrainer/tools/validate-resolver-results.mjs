import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const resolverRoot = path.join(root, "data", "imports", "resolver");
const knowledgeRoot = path.join(root, "content", "knowledge");
const expectationsRoot = path.join(root, "content", "expectations");
const curriculumRoot = path.join(root, "content", "curriculum");

const knowledgeIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const allowedDecisions = new Set([
  "new-object",
  "expand-existing-object",
  "expectation-only",
  "relationship-only",
  "duplicate-no-change",
  "reject",
  "defer"
]);
const allowedConfidence = new Set(["low", "medium", "high"]);
const allowedActionTypes = new Set([
  "create-new-object",
  "create-update-package",
  "create-expectation",
  "update-expectation",
  "create-relationship",
  "no-change",
  "reject",
  "defer"
]);
const decisionActionCompatibility = new Map([
  ["new-object", new Set(["create-new-object", "create-expectation"])],
  ["expand-existing-object", new Set(["create-update-package", "create-expectation", "update-expectation", "create-relationship"])],
  ["expectation-only", new Set(["create-expectation", "update-expectation"])],
  ["relationship-only", new Set(["create-relationship"])],
  ["duplicate-no-change", new Set(["no-change"])],
  ["reject", new Set(["reject"])],
  ["defer", new Set(["defer"])]
]);

const errors = [];
const warnings = [];
const duplicateRisks = [];

function rel(file) {
  return path.relative(root, file);
}

function error(file, message) {
  errors.push(`${rel(file)}: ${message}`);
}

function warning(file, message) {
  warnings.push(`${rel(file)}: ${message}`);
}

function duplicateRisk(file, message) {
  duplicateRisks.push(`${rel(file)}: ${message}`);
}

async function exists(dir) {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir) {
  if (!(await exists(dir))) return [];

  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") continue;
      files.push(...await walk(full));
    } else if (entry.name.endsWith(".json")) {
      files.push(full);
    }
  }

  return files;
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    error(file, `invalid JSON: ${err.message}`);
    return null;
  }
}

function requireFields(file, obj, fields) {
  for (const field of fields) {
    if (!(field in obj)) error(file, `missing required field "${field}"`);
  }
}

function requireArray(file, obj, field) {
  if (!Array.isArray(obj[field])) error(file, `${field} must be an array`);
}

function validateStringArray(file, obj, field) {
  requireArray(file, obj, field);
  if (!Array.isArray(obj[field])) return;

  for (const [index, value] of obj[field].entries()) {
    if (typeof value !== "string" || !value.trim()) error(file, `${field}[${index}] must be a non-empty string`);
  }
}

async function collectKnowledgeIds() {
  const ids = new Set();
  for (const file of await walk(knowledgeRoot)) {
    const obj = await readJson(file);
    if (obj?.id) ids.add(obj.id);
  }
  return ids;
}

async function collectExpectationIds() {
  const ids = new Set();
  for (const file of await walk(expectationsRoot)) {
    const obj = await readJson(file);
    if (obj?.id) ids.add(obj.id);
  }
  return ids;
}

async function collectCurriculumIds() {
  const ids = new Set();
  for (const file of await walk(curriculumRoot)) {
    const obj = await readJson(file);
    if (obj?.id) ids.add(obj.id);
  }
  return ids;
}

function validateCandidateMatch(file, match, index, context) {
  if (!match || typeof match !== "object" || Array.isArray(match)) {
    error(file, `candidateMatches[${index}] must be an object`);
    return;
  }

  requireFields(file, match, ["knowledgeId", "title", "matchScore", "matchReasons"]);
  if (!knowledgeIdPattern.test(match.knowledgeId || "")) error(file, `candidateMatches[${index}].knowledgeId must look like domain.slug`);
  if (typeof match.title !== "string" || !match.title.trim()) error(file, `candidateMatches[${index}].title must be a non-empty string`);
  if (!Number.isInteger(match.matchScore) || match.matchScore < 0 || match.matchScore > 100) error(file, `candidateMatches[${index}].matchScore must be an integer from 0 to 100`);

  validateStringArray(file, match, "matchReasons");

  if (match.knowledgeId && !context.knowledgeIds.has(match.knowledgeId)) {
    warning(file, `candidateMatches[${index}].knowledgeId is missing/planned: ${match.knowledgeId}`);
  }

  if (match.existingExpectationIds !== undefined) {
    validateStringArray(file, match, "existingExpectationIds");
    for (const expectationId of match.existingExpectationIds || []) {
      if (!context.expectationIds.has(expectationId)) warning(file, `candidateMatches[${index}].existingExpectationIds references missing/planned expectation: ${expectationId}`);
    }
  }
}

function validateRecommendedAction(file, action, index, decision, context) {
  if (!action || typeof action !== "object" || Array.isArray(action)) {
    error(file, `recommendedActions[${index}] must be an object`);
    return;
  }

  requireFields(file, action, ["type"]);

  if (!allowedActionTypes.has(action.type)) {
    error(file, `recommendedActions[${index}].type must be one of: ${[...allowedActionTypes].join(", ")}`);
  }

  const compatibleActions = decisionActionCompatibility.get(decision);
  if (compatibleActions && action.type && !compatibleActions.has(action.type)) {
    warning(file, `recommendedActions[${index}].type "${action.type}" does not usually match decision "${decision}"`);
  }

  if (action.knowledgeId !== undefined) {
    if (!knowledgeIdPattern.test(action.knowledgeId || "")) error(file, `recommendedActions[${index}].knowledgeId must look like domain.slug`);
    if (["create-update-package", "create-expectation", "update-expectation", "create-relationship"].includes(action.type) && !context.knowledgeIds.has(action.knowledgeId)) {
      warning(file, `recommendedActions[${index}].knowledgeId is missing/planned: ${action.knowledgeId}`);
    }
  }

  if (action.curriculumId !== undefined) {
    if (!slugPattern.test(action.curriculumId || "")) error(file, `recommendedActions[${index}].curriculumId must be lowercase kebab-case`);
    if (!context.curriculumIds.has(action.curriculumId)) warning(file, `recommendedActions[${index}].curriculumId is missing/planned: ${action.curriculumId}`);
  }
}

function validateResolverContext(file, resolverContext) {
  if (!resolverContext || typeof resolverContext !== "object" || Array.isArray(resolverContext)) {
    error(file, "resolverContext must be an object");
    return;
  }

  requireFields(file, resolverContext, ["searchedFields", "searchTerms", "relationshipHints", "expectationHints"]);
  validateStringArray(file, resolverContext, "searchedFields");
  validateStringArray(file, resolverContext, "searchTerms");
  requireArray(file, resolverContext, "relationshipHints");
  requireArray(file, resolverContext, "expectationHints");
}

function validateResolverResult(obj, file, context) {
  requireFields(file, obj, [
    "schemaVersion",
    "sourceLessonId",
    "curriculumId",
    "conceptId",
    "discoveredTitle",
    "proposedKnowledgeId",
    "decision",
    "confidence",
    "candidateMatches",
    "recommendedActions",
    "resolverContext",
    "humanReviewRequired",
    "reviewNotes"
  ]);

  if (obj.schemaVersion !== "1.0.0") error(file, "schemaVersion must be 1.0.0");
  if (typeof obj.sourceLessonId !== "string" || !obj.sourceLessonId.trim()) error(file, "sourceLessonId must be a non-empty string");
  if (!slugPattern.test(obj.curriculumId || "")) error(file, "curriculumId must be lowercase kebab-case");
  if (typeof obj.conceptId !== "string" || !obj.conceptId.trim()) error(file, "conceptId must be a non-empty string");
  if (typeof obj.discoveredTitle !== "string" || !obj.discoveredTitle.trim()) error(file, "discoveredTitle must be a non-empty string");
  if (!knowledgeIdPattern.test(obj.proposedKnowledgeId || "")) error(file, "proposedKnowledgeId must look like domain.slug");
  if (!allowedDecisions.has(obj.decision)) error(file, `decision must be one of: ${[...allowedDecisions].join(", ")}`);
  if (!allowedConfidence.has(obj.confidence)) error(file, `confidence must be one of: ${[...allowedConfidence].join(", ")}`);
  if (typeof obj.humanReviewRequired !== "boolean") error(file, "humanReviewRequired must be boolean");

  requireArray(file, obj, "candidateMatches");
  requireArray(file, obj, "recommendedActions");
  validateStringArray(file, obj, "reviewNotes");

  if (obj.curriculumId && !context.curriculumIds.has(obj.curriculumId)) warning(file, `curriculumId is missing/planned: ${obj.curriculumId}`);

  if (obj.decision === "new-object" && obj.proposedKnowledgeId && context.knowledgeIds.has(obj.proposedKnowledgeId)) {
    error(file, `decision is new-object but proposedKnowledgeId already exists: ${obj.proposedKnowledgeId}`);
  }

  if (["expand-existing-object", "expectation-only", "relationship-only", "duplicate-no-change"].includes(obj.decision) && !context.knowledgeIds.has(obj.proposedKnowledgeId)) {
    warning(file, `decision "${obj.decision}" usually requires proposedKnowledgeId to already exist: ${obj.proposedKnowledgeId}`);
  }

  if (["expand-existing-object", "expectation-only", "relationship-only", "duplicate-no-change"].includes(obj.decision) && (!Array.isArray(obj.candidateMatches) || obj.candidateMatches.length === 0)) {
    warning(file, `decision "${obj.decision}" should include at least one candidate match`);
  }

  for (const [index, match] of (obj.candidateMatches || []).entries()) {
    validateCandidateMatch(file, match, index, context);
  }

  for (const [index, action] of (obj.recommendedActions || []).entries()) {
    validateRecommendedAction(file, action, index, obj.decision, context);
  }

  validateResolverContext(file, obj.resolverContext);

  const strongMatches = (obj.candidateMatches || []).filter(match => Number.isInteger(match?.matchScore) && match.matchScore >= 85);
  if (obj.decision === "new-object" && strongMatches.length) {
    duplicateRisk(file, `new-object decision has ${strongMatches.length} strong candidate match(es): ${strongMatches.map(match => `${match.knowledgeId} (${match.matchScore})`).join(", ")}`);
  }
}

const context = {
  knowledgeIds: await collectKnowledgeIds(),
  expectationIds: await collectExpectationIds(),
  curriculumIds: await collectCurriculumIds()
};

const files = await walk(resolverRoot);
const parsed = [];
const resolverKeys = new Set();

for (const file of files) {
  const obj = await readJson(file);
  if (!obj) continue;
  parsed.push({ file, obj });

  const key = [obj.sourceLessonId, obj.curriculumId, obj.conceptId].filter(Boolean).join("::");
  if (key) {
    if (resolverKeys.has(key)) error(file, `duplicate resolver result key: ${key}`);
    resolverKeys.add(key);
  }
}

for (const { file, obj } of parsed) validateResolverResult(obj, file, context);

for (const message of warnings) console.warn(`Warning: ${message}`);
for (const message of duplicateRisks) console.warn(`Duplicate risk: ${message}`);

if (errors.length) {
  console.error("Resolver result validation failed:\n" + errors.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Resolver result validation passed for ${parsed.length} resolver result file(s). ${duplicateRisks.length} duplicate risk(s) reported.`);
