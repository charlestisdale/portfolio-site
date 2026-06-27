import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const expectationsRoot = path.join(root, "content", "expectations");
const knowledgeRoot = path.join(root, "content", "knowledge");
const curriculumRoot = path.join(root, "content", "curriculum");
const objectivesRoot = path.join(root, "content", "objectives");

const knowledgeIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;
const slugPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const expectationIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*){2,}$/;

const allowedStatuses = new Set(["draft", "needs-review", "reviewed", "deprecated"]);
const allowedDepths = new Set([
  "recognize",
  "recognize-and-explain",
  "explain-and-apply",
  "analyze-and-troubleshoot",
  "configure",
  "configure-and-troubleshoot",
  "teach-or-design"
]);
const allowedPbqRelevance = new Set(["none", "low", "medium", "high"]);
const allowedConfidence = new Set(["low", "medium", "high"]);

const errors = [];
const warnings = [];

function rel(file) {
  return path.relative(root, file);
}

function error(file, message) {
  errors.push(`${rel(file)}: ${message}`);
}

function warning(file, message) {
  warnings.push(`${rel(file)}: ${message}`);
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
    if (typeof value !== "string" || !value.trim()) {
      error(file, `${field}[${index}] must be a non-empty string`);
    }
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

async function collectObjectiveIds() {
  const ids = new Set();

  function collect(nodes) {
    for (const node of nodes || []) {
      if (node?.id) ids.add(node.id);
      collect(node.children || []);
    }
  }

  for (const file of await walk(objectivesRoot)) {
    const obj = await readJson(file);
    collect(obj?.objectives || []);
  }

  return ids;
}

async function collectCurriculumIdsAndModules() {
  const curriculumIds = new Set();
  const moduleIdsByCurriculum = new Map();

  for (const file of await walk(curriculumRoot)) {
    const curriculum = await readJson(file);
    if (!curriculum?.id) continue;

    curriculumIds.add(curriculum.id);
    if (!moduleIdsByCurriculum.has(curriculum.id)) moduleIdsByCurriculum.set(curriculum.id, new Set());

    const moduleIds = moduleIdsByCurriculum.get(curriculum.id);
    for (const section of curriculum.sections || []) {
      for (const module of section.modules || []) {
        if (module?.id) moduleIds.add(module.id);
      }
    }
  }

  return { curriculumIds, moduleIdsByCurriculum };
}

function validateRequiredSkill(file, skill, index) {
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) {
    error(file, `requiredSkills[${index}] must be an object`);
    return;
  }

  requireFields(file, skill, ["id", "description", "depth"]);
  if (!slugPattern.test(skill.id || "")) error(file, `requiredSkills[${index}].id must be lowercase kebab-case`);
  if (typeof skill.description !== "string" || !skill.description.trim()) error(file, `requiredSkills[${index}].description must be a non-empty string`);
  if (typeof skill.depth !== "string" || !skill.depth.trim()) error(file, `requiredSkills[${index}].depth must be a non-empty string`);
}

function validateQuality(file, quality) {
  if (!quality || typeof quality !== "object" || Array.isArray(quality)) {
    error(file, "quality must be an object");
    return;
  }

  requireFields(file, quality, ["createdAt", "updatedAt", "needsHumanReview"]);
  if (typeof quality.needsHumanReview !== "boolean") error(file, "quality.needsHumanReview must be boolean");
  if (quality.confidence !== undefined && !allowedConfidence.has(quality.confidence)) error(file, `quality.confidence must be one of: ${[...allowedConfidence].join(", ")}`);
  if (quality.reviewNotes !== undefined && !Array.isArray(quality.reviewNotes)) error(file, "quality.reviewNotes must be an array when present");
}

function validateExpectation(obj, file, context) {
  requireFields(file, obj, [
    "schemaVersion",
    "id",
    "curriculumId",
    "knowledgeId",
    "status",
    "expectedDepth",
    "objectiveIds",
    "moduleIds",
    "includeTags",
    "excludeTags",
    "requiredSkills",
    "assessmentStyles",
    "labRequired",
    "pbqRelevance",
    "notes",
    "quality"
  ]);

  if (obj.schemaVersion !== "1.0.0") error(file, "schemaVersion must be 1.0.0");
  if (!expectationIdPattern.test(obj.id || "")) error(file, "id must look like curriculum-id.domain.concept-slug");
  if (!slugPattern.test(obj.curriculumId || "")) error(file, "curriculumId must be lowercase kebab-case");
  if (!knowledgeIdPattern.test(obj.knowledgeId || "")) error(file, "knowledgeId must look like domain.slug and may use hyphens inside segments");
  if (obj.id !== `${obj.curriculumId}.${obj.knowledgeId}`) error(file, "id must equal curriculumId + '.' + knowledgeId");

  if (!allowedStatuses.has(obj.status)) error(file, `status must be one of: ${[...allowedStatuses].join(", ")}`);
  if (!allowedDepths.has(obj.expectedDepth)) error(file, `expectedDepth must be one of: ${[...allowedDepths].join(", ")}`);
  if (typeof obj.labRequired !== "boolean") error(file, "labRequired must be boolean");
  if (!allowedPbqRelevance.has(obj.pbqRelevance)) error(file, `pbqRelevance must be one of: ${[...allowedPbqRelevance].join(", ")}`);

  validateStringArray(file, obj, "objectiveIds");
  validateStringArray(file, obj, "moduleIds");
  validateStringArray(file, obj, "includeTags");
  validateStringArray(file, obj, "excludeTags");
  validateStringArray(file, obj, "assessmentStyles");
  validateStringArray(file, obj, "notes");

  requireArray(file, obj, "requiredSkills");
  if (Array.isArray(obj.requiredSkills)) {
    obj.requiredSkills.forEach((skill, index) => validateRequiredSkill(file, skill, index));
  }

  validateQuality(file, obj.quality);

  if (obj.knowledgeId && !context.knowledgeIds.has(obj.knowledgeId)) {
    error(file, `knowledgeId does not reference an existing canonical Knowledge Object: ${obj.knowledgeId}`);
  }

  if (obj.curriculumId && !context.curriculumIds.has(obj.curriculumId)) {
    warning(file, `curriculumId does not reference an existing curriculum plan: ${obj.curriculumId}`);
  }

  for (const objectiveId of obj.objectiveIds || []) {
    if (!context.objectiveIds.has(objectiveId)) warning(file, `objectiveId is missing/planned: ${objectiveId}`);
  }

  const moduleIds = context.moduleIdsByCurriculum.get(obj.curriculumId) || new Set();
  for (const moduleId of obj.moduleIds || []) {
    if (!moduleIds.has(moduleId)) warning(file, `moduleId is missing/planned for ${obj.curriculumId}: ${moduleId}`);
  }
}

const files = await walk(expectationsRoot);
const parsed = [];
const ids = new Set();
const idFiles = new Map();

const context = {
  knowledgeIds: await collectKnowledgeIds(),
  objectiveIds: await collectObjectiveIds(),
  ...(await collectCurriculumIdsAndModules())
};

for (const file of files) {
  const obj = await readJson(file);
  if (!obj) continue;
  parsed.push({ file, obj });

  if (ids.has(obj.id)) {
    error(file, `duplicate expectation id "${obj.id}"; first seen in ${rel(idFiles.get(obj.id))}`);
  } else if (obj.id) {
    ids.add(obj.id);
    idFiles.set(obj.id, file);
  }
}

for (const { file, obj } of parsed) validateExpectation(obj, file, context);

for (const message of warnings) console.warn(`Warning: ${message}`);

if (errors.length) {
  console.error("Curriculum expectation validation failed:\n" + errors.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Curriculum expectation validation passed for ${parsed.length} expectation file(s).`);
