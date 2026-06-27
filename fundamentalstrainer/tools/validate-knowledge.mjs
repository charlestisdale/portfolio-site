import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const knowledgeRoot = path.join(root, "content", "knowledge");
const knowledgeIdPattern = /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)+$/;
const requiredTopLevel = [
  "schemaVersion",
  "id",
  "slug",
  "title",
  "type",
  "status",
  "domains",
  "certificationMappings",
  "learning",
  "assessmentSeeds",
  "relationships",
  "sources",
  "quality"
];

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

const allowedStatuses = new Set(["stub", "draft", "needs-review", "reviewed", "deprecated"]);
const privateSourceFields = ["transcripts", "videos"];
const publicSourceKeys = new Set(["references"]);
const missingRelationshipRefs = new Map();

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

function relativeFile(file) {
  return path.relative(root, file);
}

function fail(errors, file, message) {
  errors.push(`${relativeFile(file)}: ${message}`);
}

function isArray(value) {
  return Array.isArray(value);
}

function addMissingRelationshipRef(missingId, sourceId) {
  if (!missingRelationshipRefs.has(missingId)) missingRelationshipRefs.set(missingId, new Set());
  missingRelationshipRefs.get(missingId).add(sourceId);
}

function printMissingRelationshipSummary() {
  if (!missingRelationshipRefs.size) return;

  console.warn(`Warning: ${missingRelationshipRefs.size} missing/planned relationship target(s) referenced by Knowledge Objects.`);

  for (const [missingId, sourceIds] of [...missingRelationshipRefs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sources = [...sourceIds].sort();
    const preview = sources.slice(0, 5).join(", ");
    const suffix = sources.length > 5 ? `, and ${sources.length - 5} more` : "";
    console.warn(`  - ${missingId} <- ${preview}${suffix}`);
  }
}

function validatePublicSources(obj, file, errors) {
  if (!obj.sources || typeof obj.sources !== "object" || Array.isArray(obj.sources)) return;

  for (const field of privateSourceFields) {
    if (field in obj.sources) {
      fail(errors, file, `sources.${field} is private/admin provenance and must not be stored in public knowledge JSON`);
    }
  }

  for (const key of Object.keys(obj.sources)) {
    if (!publicSourceKeys.has(key)) {
      fail(errors, file, `sources.${key} is not allowed in public knowledge JSON`);
    }
  }

  if (!isArray(obj.sources.references)) {
    fail(errors, file, "sources.references must be an array");
  }
}

function validateObject(obj, file, allIds, errors) {
  for (const field of requiredTopLevel) {
    if (!(field in obj)) fail(errors, file, `missing top-level field "${field}"`);
  }

  if (obj.schemaVersion !== "1.0.0") fail(errors, file, "schemaVersion must be 1.0.0");
  if (!knowledgeIdPattern.test(obj.id || "")) fail(errors, file, "id must look like domain.slug and may use hyphens inside segments");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(obj.slug || "")) fail(errors, file, "slug must be lowercase kebab-case");
  if (!allowedTypes.has(obj.type)) fail(errors, file, `invalid type "${obj.type}"`);
  if (!allowedStatuses.has(obj.status)) fail(errors, file, `invalid status "${obj.status}"`);
  if (!isArray(obj.domains) || obj.domains.length === 0) fail(errors, file, "domains must be a non-empty array");
  if (!isArray(obj.certificationMappings) || obj.certificationMappings.length === 0) fail(errors, file, "certificationMappings must be a non-empty array");

  if (!obj.learning?.summary) fail(errors, file, "learning.summary is required");
  if (!isArray(obj.learning?.facts)) fail(errors, file, "learning.facts must be an array");
  if (!obj.assessmentSeeds) fail(errors, file, "assessmentSeeds is required");
  if (!obj.relationships) fail(errors, file, "relationships is required");
  if (!obj.sources) fail(errors, file, "sources is required");
  if (!obj.quality) fail(errors, file, "quality is required");

  validatePublicSources(obj, file, errors);

  const relatedIds = [
    ...(obj.relationships?.prerequisites || []),
    ...(obj.relationships?.parents || []),
    ...(obj.relationships?.children || []),
    ...(obj.relationships?.replacedBy || []),
    ...((obj.relationships?.related || []).map(item => item.id)),
    ...((obj.relationships?.contrastsWith || []).map(item => item.id))
  ].filter(Boolean);

  for (const id of relatedIds) {
    if (!allIds.has(id)) {
      // Relationship targets may be planned but not written yet. This is a warning, not a hard failure.
      addMissingRelationshipRef(id, obj.id || relativeFile(file));
    }
  }
}

const files = await walk(knowledgeRoot);
const parsed = [];
const errors = [];
const ids = new Set();
const idFiles = new Map();

for (const file of files) {
  try {
    const obj = JSON.parse(await fs.readFile(file, "utf8"));
    parsed.push({ file, obj });

    if (ids.has(obj.id)) {
      const firstFile = idFiles.get(obj.id);
      fail(errors, file, `duplicate id "${obj.id}"; first seen in ${relativeFile(firstFile)}`);
    } else {
      ids.add(obj.id);
      idFiles.set(obj.id, file);
    }
  } catch (error) {
    fail(errors, file, `invalid JSON: ${error.message}`);
  }
}

for (const { file, obj } of parsed) {
  validateObject(obj, file, ids, errors);
}

printMissingRelationshipSummary();

if (errors.length) {
  console.error("Knowledge validation failed:\n" + errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Knowledge validation passed for ${parsed.length} object(s).`);
