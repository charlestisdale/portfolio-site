#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;
const dryRun = args["dry-run"] === "true";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function slugify(value) {
  return String(value || "knowledge-object")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "knowledge-object";
}

function domainForObject(object) {
  return slugify(object.domains?.[0] || object.id?.split(".")[0] || "general");
}

function canonicalPathForObject(object) {
  return path.resolve(root, "content", "knowledge", domainForObject(object), `${slugify(object.slug || object.title || object.id)}.json`);
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function unique(values) {
  return [...new Set(asArray(values).filter(Boolean))];
}

function normalizeObject(object) {
  const id = object.id || `${domainForObject(object)}.${slugify(object.title)}`;
  const today = new Date().toISOString().slice(0, 10);
  return {
    schemaVersion: object.schemaVersion || "1.0.0",
    id,
    slug: slugify(object.slug || object.title || id.split(".").at(-1)),
    title: object.title || id,
    aliases: unique(object.aliases || []),
    type: object.type || "concept",
    status: object.status || "draft",
    domains: unique(object.domains || [id.split(".")[0]]),
    difficulty: object.difficulty || "foundational",
    importance: object.importance || "medium",
    certificationMappings: asArray(object.certificationMappings),
    learning: {
      summary: object.learning?.summary || "",
      explanation: object.learning?.explanation || object.learning?.summary || "",
      facts: asArray(object.learning?.facts),
      commands: asArray(object.learning?.commands),
      examples: asArray(object.learning?.examples),
      tables: asArray(object.learning?.tables),
      media: asArray(object.learning?.media),
      notes: asArray(object.learning?.notes)
    },
    assessmentSeeds: {
      examTips: asArray(object.assessmentSeeds?.examTips),
      commonMistakes: asArray(object.assessmentSeeds?.commonMistakes),
      scenarios: asArray(object.assessmentSeeds?.scenarios),
      pbqIdeas: asArray(object.assessmentSeeds?.pbqIdeas),
      questionTargets: asArray(object.assessmentSeeds?.questionTargets)
    },
    relationships: {
      prerequisites: asArray(object.relationships?.prerequisites),
      parents: asArray(object.relationships?.parents),
      children: asArray(object.relationships?.children),
      related: asArray(object.relationships?.related),
      contrastsWith: asArray(object.relationships?.contrastsWith),
      replacedBy: asArray(object.relationships?.replacedBy)
    },
    sources: {
      transcripts: asArray(object.sources?.transcripts),
      videos: asArray(object.sources?.videos),
      references: asArray(object.sources?.references)
    },
    quality: {
      ...(object.quality || {}),
      createdAt: object.quality?.createdAt || today,
      updatedAt: today,
      lastReviewedAt: object.quality?.lastReviewedAt || today,
      reviewedBy: object.quality?.reviewedBy || "knowledge-builder",
      needsHumanReview: Boolean(object.quality?.needsHumanReview)
    }
  };
}

function validateObject(object) {
  const errors = [];
  if (!object.id) errors.push("missing id");
  if (!object.title) errors.push("missing title");
  if (!object.domains?.length) errors.push("missing domains");
  if (!object.learning?.summary) errors.push("missing learning.summary");
  if (!object.learning?.facts?.length) errors.push("missing learning.facts");
  return errors;
}

function relationshipEdgesFor(object) {
  const groups = [
    ["prerequisite", object.relationships?.prerequisites],
    ["parent", object.relationships?.parents],
    ["child", object.relationships?.children],
    ["related", object.relationships?.related],
    ["contrasts_with", object.relationships?.contrastsWith],
    ["replaced_by", object.relationships?.replacedBy]
  ];

  return groups.flatMap(([type, items]) => asArray(items).map(item => {
    const targetId = typeof item === "string" ? item : item.id || item.targetId;
    if (!targetId) return null;
    return {
      schemaVersion: "1.0.0",
      id: `rel.${object.id}.${type}.${targetId}`.replace(/[^a-zA-Z0-9.-]+/g, "-"),
      sourceId: object.id,
      targetId,
      type,
      strength: typeof item === "string" ? "medium" : item.strength || "medium",
      direction: "outbound",
      status: "draft",
      evidence: object.sources?.transcripts?.map(source => source.lessonId).filter(Boolean) || [],
      notes: typeof item === "string" ? "Promoted from reviewed candidate relationship." : item.reason || item.notes || "Promoted from reviewed candidate relationship.",
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10)
    };
  }).filter(Boolean));
}

function mergeIndex(newPaths) {
  const indexPath = path.resolve(root, "content", "indexes", "knowledge-index.json");
  const index = readJsonIfExists(indexPath, {
    generatedBy: "knowledge-builder",
    description: "Central index of canonical Knowledge Object files.",
    objects: []
  });
  const objects = unique([...(index.objects || []), ...newPaths]).sort();
  const updated = {
    ...index,
    generatedBy: "knowledge-builder",
    updatedAt: new Date().toISOString(),
    objects
  };
  writeJson(indexPath, updated);
  return { path: indexPath, count: objects.length };
}

function mergeGraph(certification, newEdges) {
  const graphPath = path.resolve(root, "content", "relationships", `${certification}.graph.json`);
  const graph = readJsonIfExists(graphPath, {
    schemaVersion: "1.0.0",
    certification,
    relationships: []
  });
  const byId = new Map(asArray(graph.relationships).map(edge => [edge.id, edge]));
  for (const edge of newEdges) byId.set(edge.id, edge);
  const relationships = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const updated = {
    ...graph,
    schemaVersion: graph.schemaVersion || "1.0.0",
    certification,
    generatedBy: "knowledge-builder",
    updatedAt: new Date().toISOString(),
    relationships
  };
  writeJson(graphPath, updated);
  return { path: graphPath, count: relationships.length };
}

if (!inputFile) fail("Usage: node tools/knowledge/promote-approved-objects.mjs --file=approved-knowledge-objects.json");
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Approved export not found: ${inputFile}`);

const exportData = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceObjects = asArray(exportData.objects || exportData);
if (!sourceObjects.length) fail("No approved objects found in export.");

const promoted = [];
const skipped = [];
const edges = [];
const indexPaths = [];

for (const sourceObject of sourceObjects) {
  const object = normalizeObject(sourceObject);
  const errors = validateObject(object);
  if (errors.length) {
    skipped.push({ id: object.id || sourceObject.id || sourceObject.title, errors });
    continue;
  }

  const filePath = canonicalPathForObject(object);
  const projectPath = toProjectPath(filePath, root);
  writeJson(filePath, object);
  promoted.push({ id: object.id, title: object.title, path: projectPath });
  indexPaths.push(projectPath);
  edges.push(...relationshipEdgesFor(object));
}

const certification = sourceObjects[0]?.certificationMappings?.[0]?.certification || args.cert || args.certification || "a-plus-220-1202";
const indexResult = mergeIndex(indexPaths);
const graphResult = mergeGraph(certification, edges);

const report = {
  generatedBy: "knowledge-builder",
  dryRun,
  source: toProjectPath(sourcePath, root),
  promotedCount: promoted.length,
  skippedCount: skipped.length,
  relationshipEdges: edges.length,
  promoted,
  skipped,
  index: { path: toProjectPath(indexResult.path, root), count: indexResult.count },
  graph: { path: toProjectPath(graphResult.path, root), count: graphResult.count }
};

const reportDir = path.resolve(root, "data", "knowledge-builder", "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportFile = path.join(reportDir, `promotion-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
if (!dryRun) fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify({
  ...report,
  report: dryRun ? null : toProjectPath(reportFile, root),
  next: [
    "Run npm run validate:knowledge.",
    "Reload the app and confirm Knowledge Objects and graph edges increased.",
    "Archive or remove promoted pending candidates after verification."
  ]
}, null, 2));

if (skipped.length) process.exit(1);
