import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const errors = [];
const warnings = [];
const missingRefs = new Map();
const knowledgeIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;

function rel(file) {
  return path.relative(root, file);
}

function error(file, message) {
  errors.push(`${rel(file)}: ${message}`);
}

function warning(file, message) {
  warnings.push(`${rel(file)}: ${message}`);
}

function missingRef(file, missingId, refType, referencedBy) {
  const key = `${refType}:${missingId}`;
  if (!missingRefs.has(key)) {
    missingRefs.set(key, {
      missingId,
      refType,
      references: new Map()
    });
  }

  const bucket = missingRefs.get(key);
  const location = rel(file);
  if (!bucket.references.has(location)) bucket.references.set(location, new Set());
  bucket.references.get(location).add(referencedBy);
}

function printMissingRefSummary() {
  if (!missingRefs.size) return;

  console.warn(`Warning: ${missingRefs.size} missing/planned architecture reference(s).`);

  for (const bucket of [...missingRefs.values()].sort((a, b) => a.refType.localeCompare(b.refType) || a.missingId.localeCompare(b.missingId))) {
    const locations = [...bucket.references.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([location, references]) => `${location} (${[...references].sort().slice(0, 4).join(", ")}${references.size > 4 ? `, and ${references.size - 4} more` : ""})`);
    const preview = locations.slice(0, 3).join("; ");
    const suffix = locations.length > 3 ? `; and ${locations.length - 3} more file(s)` : "";
    console.warn(`  - ${bucket.refType} ${bucket.missingId} <- ${preview}${suffix}`);
  }
}

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    error(file, `invalid or missing JSON: ${err.message}`);
    return null;
  }
}

async function walk(dir) {
  try {
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
  } catch {
    return [];
  }
}

function requireFields(file, obj, fields) {
  for (const field of fields) {
    if (!(field in obj)) error(file, `missing required field "${field}"`);
  }
}

function validateId(file, id, pattern, label = "id") {
  if (!pattern.test(id || "")) error(file, `${label} has invalid format: ${id}`);
}

const certificationFile = path.join(root, "content", "certifications", "a-plus-220-1202.json");
const cert = await readJson(certificationFile);

if (cert) {
  requireFields(certificationFile, cert, ["schemaVersion", "id", "name", "vendor", "status", "objectiveManifest", "lessonManifest", "knowledgeIndex"]);
  validateId(certificationFile, cert.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);

  for (const ref of [cert.objectiveManifest, cert.lessonManifest, cert.knowledgeIndex, cert.relationshipGraph, cert.curriculumManifest].filter(Boolean)) {
    try {
      await fs.access(path.join(root, ref));
    } catch {
      error(certificationFile, `referenced file does not exist: ${ref}`);
    }
  }
}

const knowledgeFiles = await walk(path.join(root, "content", "knowledge"));
const knowledgeIds = new Set();

for (const file of knowledgeFiles) {
  const obj = await readJson(file);
  if (!obj) continue;
  validateId(file, obj.id, knowledgeIdPattern, "knowledge id");
  if (knowledgeIds.has(obj.id)) error(file, `duplicate knowledge id: ${obj.id}`);
  knowledgeIds.add(obj.id);
}

const objectiveFile = path.join(root, "content", "objectives", "a-plus-220-1202.json");
const objectives = await readJson(objectiveFile);
const objectiveIds = new Set();

function collectObjectives(nodes, file) {
  for (const node of nodes || []) {
    requireFields(file, node, ["id", "name", "order"]);
    if (objectiveIds.has(node.id)) error(file, `duplicate objective id: ${node.id}`);
    objectiveIds.add(node.id);
    for (const kid of node.knowledgeIds || []) {
      if (!knowledgeIds.has(kid)) missingRef(file, kid, "knowledge", `objective ${node.id}`);
    }
    collectObjectives(node.children || [], file);
  }
}

if (objectives) {
  requireFields(objectiveFile, objectives, ["schemaVersion", "certification", "objectives"]);
  collectObjectives(objectives.objectives, objectiveFile);
}

const lessonFile = path.join(root, "content", "lessons", "a-plus-220-1202", "lessons.json");
const lessons = await readJson(lessonFile);
const lessonIds = new Set();

if (lessons) {
  requireFields(lessonFile, lessons, ["schemaVersion", "certification", "lessons"]);
  for (const lesson of lessons.lessons || []) {
    requireFields(lessonFile, lesson, ["id", "order", "title", "status"]);
    if (lessonIds.has(lesson.id)) error(lessonFile, `duplicate lesson id: ${lesson.id}`);
    lessonIds.add(lesson.id);
    for (const oid of lesson.objectiveIds || []) {
      if (!objectiveIds.has(oid)) missingRef(lessonFile, oid, "objective", `lesson ${lesson.id}`);
    }
    for (const kid of lesson.knowledgeIds || []) {
      if (!knowledgeIds.has(kid)) missingRef(lessonFile, kid, "knowledge", `lesson ${lesson.id}`);
    }
  }
}

const curriculumFiles = await walk(path.join(root, "content", "curriculum"));
let curriculumCount = 0;
let curriculumModuleCount = 0;
let curriculumKnowledgeRefs = 0;

function validateAutoMap(file, module) {
  const autoMap = module.autoMap;
  if (!autoMap) return;
  const hasRule = ["domains", "types", "idPrefixes", "titleIncludes", "tags"].some(key => Array.isArray(autoMap[key]) && autoMap[key].length);
  if (!hasRule) warning(file, `curriculum module ${module.id} has empty autoMap rules`);
}

for (const file of curriculumFiles) {
  const curriculum = await readJson(file);
  if (!curriculum) continue;
  curriculumCount += 1;
  requireFields(file, curriculum, ["schemaVersion", "id", "title", "sections"]);
  validateId(file, curriculum.id, /^[a-z0-9]+(-[a-z0-9]+)*$/);

  const sectionIds = new Set();
  const moduleIds = new Set();

  for (const section of curriculum.sections || []) {
    requireFields(file, section, ["id", "title", "order", "modules"]);
    if (sectionIds.has(section.id)) error(file, `duplicate curriculum section id: ${section.id}`);
    sectionIds.add(section.id);

    for (const objectiveId of section.objectiveIds || []) {
      if (!objectiveIds.has(objectiveId)) missingRef(file, objectiveId, "objective", `curriculum section ${section.id}`);
    }

    for (const module of section.modules || []) {
      requireFields(file, module, ["id", "title", "order"]);
      const moduleKey = `${section.id}.${module.id}`;
      if (moduleIds.has(moduleKey)) error(file, `duplicate curriculum module id: ${moduleKey}`);
      moduleIds.add(moduleKey);
      curriculumModuleCount += 1;
      validateId(file, module.id, /^[a-z0-9]+(-[a-z0-9]+)*$/, "module id");
      validateAutoMap(file, module);

      for (const kid of module.knowledge || []) {
        curriculumKnowledgeRefs += 1;
        if (!knowledgeIds.has(kid)) missingRef(file, kid, "knowledge", `curriculum module ${moduleKey}`);
      }
    }
  }
}

const graphFile = path.join(root, "content", "relationships", "a-plus-220-1202.graph.json");
const graph = await readJson(graphFile);
const relationshipIds = new Set();
const allowedRelationshipTypes = new Set(["requires", "uses", "configures", "manages", "troubleshoots", "compares", "contrasts_with", "supersedes", "belongs_to", "parent_of", "child_of", "alternative_to", "precedes", "follows", "appears_in"]);

if (graph) {
  requireFields(graphFile, graph, ["schemaVersion", "certification", "relationships"]);
  for (const edge of graph.relationships || []) {
    requireFields(graphFile, edge, ["id", "sourceId", "targetId", "type", "strength", "status"]);
    if (relationshipIds.has(edge.id)) error(graphFile, `duplicate relationship id: ${edge.id}`);
    relationshipIds.add(edge.id);
    if (!allowedRelationshipTypes.has(edge.type)) error(graphFile, `invalid relationship type: ${edge.type}`);
    if (!knowledgeIds.has(edge.sourceId)) missingRef(graphFile, edge.sourceId, "knowledge", `relationship source ${edge.id}`);
    if (!knowledgeIds.has(edge.targetId) && !objectiveIds.has(edge.targetId) && !lessonIds.has(edge.targetId)) missingRef(graphFile, edge.targetId, "knowledge/objective/lesson", `relationship target ${edge.id}`);
  }
}

for (const message of warnings) console.warn(`Warning: ${message}`);
printMissingRefSummary();

if (errors.length) {
  console.error("Architecture validation failed:\n" + errors.map(e => `- ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Architecture validation passed. ${knowledgeIds.size} knowledge object(s), ${objectiveIds.size} objective(s), ${lessonIds.size} lesson(s), ${relationshipIds.size} relationship(s), ${curriculumCount} curriculum file(s), ${curriculumModuleCount} curriculum module(s), ${curriculumKnowledgeRefs} curriculum knowledge reference(s).`);
