import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
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

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (err) {
    error(file, `invalid or missing JSON: ${err.message}`);
    return null;
  }
}

async function walk(dir) {
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

  for (const ref of [cert.objectiveManifest, cert.lessonManifest, cert.knowledgeIndex, cert.relationshipGraph].filter(Boolean)) {
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
  validateId(file, obj.id, /^[a-z0-9]+(\.[a-z0-9-]+)+$/, "knowledge id");
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
      if (!knowledgeIds.has(kid)) warning(file, `objective references missing/planned knowledge object: ${kid}`);
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
      if (!objectiveIds.has(oid)) warning(lessonFile, `lesson references missing/planned objective: ${oid}`);
    }
    for (const kid of lesson.knowledgeIds || []) {
      if (!knowledgeIds.has(kid)) warning(lessonFile, `lesson references missing/planned knowledge object: ${kid}`);
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
    if (!knowledgeIds.has(edge.sourceId)) warning(graphFile, `relationship source is missing/planned: ${edge.sourceId}`);
    if (!knowledgeIds.has(edge.targetId) && !objectiveIds.has(edge.targetId) && !lessonIds.has(edge.targetId)) warning(graphFile, `relationship target is missing/planned: ${edge.targetId}`);
  }
}

for (const message of warnings) console.warn(`Warning: ${message}`);

if (errors.length) {
  console.error("Architecture validation failed:\n" + errors.map(e => `- ${e}`).join("\n"));
  process.exit(1);
}

console.log(`Architecture validation passed. ${knowledgeIds.size} knowledge object(s), ${objectiveIds.size} objective(s), ${lessonIds.size} lesson(s), ${relationshipIds.size} relationship(s).`);
