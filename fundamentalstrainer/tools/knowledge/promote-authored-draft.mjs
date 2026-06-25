#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;
const dryRun = args["dry-run"] === "true";
const allowOverwrite = args["allow-overwrite"] === "true";
const markReviewed = args.reviewed === "true";

const allowedTypes = new Set([
  "concept",
  "command",
  "tool",
  "protocol",
  "service",
  "file-system",
  "operating-system",
  "procedure",
  "security-control",
  "hardware",
  "troubleshooting-pattern"
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function slugify(value, fallback = "item") {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(full);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function canonicalPathForObject(object) {
  const domainFolder = slugify(object.domains?.[0] || object.id.split(".")[0]);
  return path.resolve(root, "content", "knowledge", domainFolder, `${object.slug}.json`);
}

function allCanonicalObjects() {
  const knowledgeRoot = path.resolve(root, "content", "knowledge");
  return walkJsonFiles(knowledgeRoot).map(file => ({ file, obj: readJson(file) }));
}

function existingById(id) {
  return allCanonicalObjects().filter(record => record.obj?.id === id);
}

function validateDraftObject(object) {
  const errors = [];

  if (object.schemaVersion !== "1.0.0") errors.push("schemaVersion must be 1.0.0");
  if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(object.id || "")) errors.push("id must look like domain.slug");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(object.slug || "")) errors.push("slug must be lowercase kebab-case");
  if (!allowedTypes.has(object.type)) errors.push(`invalid type ${object.type}`);
  if (!asArray(object.domains).length) errors.push("domains must be a non-empty array");
  if (!asArray(object.certificationMappings).length) errors.push("certificationMappings must be a non-empty array");
  if (!object.learning?.summary) errors.push("learning.summary is required");
  if (!object.learning?.explanation) errors.push("learning.explanation is required");
  if (!asArray(object.learning?.facts).length) errors.push("learning.facts must contain at least one fact");
  if (!object.assessmentSeeds) errors.push("assessmentSeeds is required");
  if (!object.relationships) errors.push("relationships is required");
  if (!object.sources || Object.keys(object.sources).some(key => key !== "references")) errors.push("sources must exist and may only contain references");
  if (!Array.isArray(object.sources?.references)) errors.push("sources.references must be an array");
  if (!object.quality) errors.push("quality is required");

  if (object.audit?.status && object.audit.status !== "passed") {
    errors.push(`draft audit status must be passed before promotion; received ${object.audit.status}`);
  }

  return errors;
}

function stripDraftOnlyFields(object) {
  const clone = structuredClone(object);
  delete clone.audit;
  return clone;
}

function relationshipEdgesFor(object) {
  const today = new Date().toISOString().slice(0, 10);
  const scalarGroups = [
    ["prerequisite", object.relationships?.prerequisites],
    ["parent", object.relationships?.parents],
    ["child", object.relationships?.children],
    ["replaced_by", object.relationships?.replacedBy]
  ];
  const objectGroups = [
    ["related", object.relationships?.related],
    ["contrasts_with", object.relationships?.contrastsWith]
  ];

  const scalarEdges = scalarGroups.flatMap(([type, ids]) => asArray(ids).map(targetId => ({ targetId, type, reason: "Promoted from reviewed authored draft." })));
  const objectEdges = objectGroups.flatMap(([type, items]) => asArray(items).map(item => ({
    targetId: item.id,
    type,
    reason: item.reason || "Promoted from reviewed authored draft.",
    strength: item.strength || "medium"
  })));

  return [...scalarEdges, ...objectEdges]
    .filter(edge => edge.targetId && edge.targetId !== object.id)
    .map(edge => ({
      schemaVersion: "1.0.0",
      id: `rel.${object.id}.${edge.type}.${edge.targetId}`.replace(/[^a-zA-Z0-9.-]+/g, "-"),
      sourceId: object.id,
      targetId: edge.targetId,
      type: edge.type,
      strength: edge.strength || "medium",
      direction: "outbound",
      status: "draft",
      evidence: [],
      notes: edge.reason,
      createdAt: today,
      updatedAt: today
    }));
}

function mergeIndex(newPath) {
  const indexPath = path.resolve(root, "content", "indexes", "knowledge-index.json");
  const index = fs.existsSync(indexPath) ? readJson(indexPath) : {
    description: "Central index of canonical Knowledge Object files.",
    objects: []
  };
  const objects = [...new Set([...(index.objects || []), newPath])].sort();
  const updated = {
    ...index,
    generatedBy: "authored-draft-promotion",
    updatedAt: new Date().toISOString(),
    objects
  };
  writeJson(indexPath, updated);
  return { path: indexPath, count: objects.length };
}

function mergeGraph(certification, edges) {
  const graphPath = path.resolve(root, "content", "relationships", `${certification}.graph.json`);
  const graph = fs.existsSync(graphPath) ? readJson(graphPath) : {
    schemaVersion: "1.0.0",
    certification,
    relationships: []
  };
  const byId = new Map(asArray(graph.relationships).map(edge => [edge.id, edge]));
  for (const edge of edges) byId.set(edge.id, edge);
  const updated = {
    ...graph,
    schemaVersion: "1.0.0",
    certification,
    generatedBy: "authored-draft-promotion",
    updatedAt: new Date().toISOString(),
    relationships: [...byId.values()].sort((a, b) => a.id.localeCompare(b.id))
  };
  writeJson(graphPath, updated);
  return { path: graphPath, count: updated.relationships.length };
}

function runValidateKnowledge() {
  return spawnSync(process.execPath, ["tools/validate-knowledge.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

if (!inputFile) fail("Usage: node tools/knowledge/promote-authored-draft.mjs --file=data/imports/authored/<draft>.json [--dry-run=true] [--allow-overwrite=true] [--reviewed=true]");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Authored draft not found: ${inputFile}`);

const draft = readJson(sourcePath);
const validationErrors = validateDraftObject(draft);
if (validationErrors.length) {
  console.error(JSON.stringify({ stage: "validate-authored-draft", validationErrors }, null, 2));
  process.exit(1);
}

const duplicateFiles = existingById(draft.id);
if (duplicateFiles.length && !allowOverwrite) {
  console.error(JSON.stringify({
    stage: "duplicate-check",
    blocked: true,
    id: draft.id,
    existing: duplicateFiles.map(record => toProjectPath(record.file, root)),
    message: "Canonical Knowledge Object with this id already exists. Use --allow-overwrite=true only after deliberate review."
  }, null, 2));
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const promotedObject = stripDraftOnlyFields(draft);
promotedObject.status = markReviewed ? "reviewed" : "needs-review";
promotedObject.quality = {
  ...promotedObject.quality,
  updatedAt: today,
  lastReviewedAt: markReviewed ? today : promotedObject.quality.lastReviewedAt || null,
  reviewedBy: markReviewed ? (args.reviewer || "human-review") : promotedObject.quality.reviewedBy || null,
  needsHumanReview: !markReviewed,
  reviewNotes: [
    ...asArray(promotedObject.quality.reviewNotes),
    markReviewed
      ? "Promoted from authored draft after explicit reviewed=true flag."
      : "Promoted from authored draft as needs-review canonical content."
  ]
};

const canonicalPath = canonicalPathForObject(promotedObject);
const canonicalProjectPath = toProjectPath(canonicalPath, root);
writeJson(canonicalPath, promotedObject);
const indexResult = mergeIndex(canonicalProjectPath);
const certification = promotedObject.certificationMappings?.[0]?.certification || args.cert || args.certification || "a-plus-220-1202";
const edges = relationshipEdgesFor(promotedObject);
const graphResult = mergeGraph(certification, edges);

const validate = dryRun ? { status: 0, stdout: "dry run; validation not executed", stderr: "" } : runValidateKnowledge();
if (validate.status !== 0) {
  console.error(validate.stdout || "");
  console.error(validate.stderr || "");
  console.error("Promotion wrote files but validation failed. Fix validation errors before continuing.");
  process.exit(validate.status || 1);
}

const report = {
  generatedBy: "authored-draft-promotion",
  dryRun,
  allowOverwrite,
  markReviewed,
  source: toProjectPath(sourcePath, root),
  promoted: {
    id: promotedObject.id,
    title: promotedObject.title,
    status: promotedObject.status,
    path: canonicalProjectPath
  },
  duplicateOverwriteCount: duplicateFiles.length,
  relationshipEdges: edges.length,
  index: { path: toProjectPath(indexResult.path, root), count: indexResult.count },
  graph: { path: toProjectPath(graphResult.path, root), count: graphResult.count },
  validation: dryRun ? "skipped-dry-run" : "passed"
};

const reportDir = path.resolve(root, "data", "knowledge-builder", "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportFile = path.join(reportDir, `authored-promotion-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
if (!dryRun) fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({
  ...report,
  report: dryRun ? null : toProjectPath(reportFile, root),
  next: [
    "Run npm run validate:all.",
    "Open the app and confirm the Knowledge Object appears in Learn/Search/Graph as expected.",
    "Do not use the older bulk promotion path for authored drafts unless you intentionally want compiler behavior."
  ]
}, null, 2));
