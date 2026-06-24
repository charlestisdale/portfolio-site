#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;
const dryRun = args["dry-run"] === "true";
const cleanBuild = args.clean === "true";
const createStubs = args.stubs !== "false";

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

const typeMap = new Map([
  ["core-concept", "concept"],
  ["feature", "concept"],
  ["maintenance", "procedure"],
  ["process", "procedure"],
  ["comparison", "concept"],
  ["mobile-os", "operating-system"],
  ["os", "operating-system"]
]);

const domainIdMap = new Map([
  ["operating-systems", "operating"],
  ["mobile-operating-systems", "mobile"],
  ["software-troubleshooting", "troubleshooting"],
  ["operational-procedures", "procedures"],
  ["file-systems", "filesystems"]
]);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function slugify(value, fallback = "item") {
  return String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || fallback;
}

function titleFromId(id) {
  return String(id || "Knowledge Object")
    .split(".")
    .at(-1)
    .split("-")
    .map(word => word ? word[0].toUpperCase() + word.slice(1) : word)
    .join(" ");
}

function canonicalDomain(value) {
  const slug = slugify(value || "general", "general");
  return domainIdMap.get(slug) || slug.replaceAll("-", "") || "general";
}

function normalizeId(rawId, title, domains = []) {
  const original = String(rawId || "").trim().toLowerCase();
  const parts = original.split(".").filter(Boolean);
  const domain = canonicalDomain(parts[0] || domains[0] || "general");
  const slug = slugify(parts.slice(1).join("-") || title || original || "knowledge-object", "knowledge-object");
  return `${domain}.${slug}`;
}

function normalizeRelationshipTarget(value) {
  if (!value) return "";
  return normalizeId(value, value);
}

function normalizeType(value) {
  const type = slugify(value || "concept", "concept");
  const mapped = typeMap.get(type) || type;
  return allowedTypes.has(mapped) ? mapped : "concept";
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const result = [];
  for (const value of asArray(values)) {
    const key = keyFn(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function mergeTextRecords(records) {
  return uniqueBy(asArray(records).filter(item => item && (item.text || typeof item === "string")), item => typeof item === "string" ? item : item.text)
    .map(item => typeof item === "string" ? { text: item, importance: "medium", tags: [] } : {
      text: item.text,
      importance: item.importance || "medium",
      tags: asArray(item.tags)
    });
}

function normalizeRelationshipItem(item) {
  const id = normalizeRelationshipTarget(typeof item === "string" ? item : item?.id || item?.targetId);
  if (!id) return null;
  return {
    id,
    reason: typeof item === "string" ? "Promoted from reviewed candidate relationship." : item.reason || item.rationale || item.notes || "Promoted from reviewed candidate relationship.",
    strength: typeof item === "string" ? "medium" : item.strength || "medium"
  };
}

function normalizeRelationshipList(items) {
  return uniqueBy(asArray(items).map(normalizeRelationshipItem).filter(Boolean), item => item.id);
}

function normalizeObjectForCompile(sourceObject) {
  const domains = asArray(sourceObject.domains).map(domain => slugify(domain)).filter(Boolean);
  const id = normalizeId(sourceObject.id, sourceObject.title, domains);
  const title = sourceObject.title || titleFromId(id);
  const today = new Date().toISOString().slice(0, 10);
  const summary = sourceObject.learning?.summary || sourceObject.learning?.explanation || sourceObject.summaryDraft || `${title} is a reviewed concept from the learning platform import pipeline.`;
  const facts = mergeTextRecords(sourceObject.learning?.facts?.length ? sourceObject.learning.facts : sourceObject.factsDraft || []);

  return {
    schemaVersion: "1.0.0",
    id,
    slug: slugify(sourceObject.slug || title || id.split(".").at(-1)),
    title,
    aliases: uniqueBy(asArray(sourceObject.aliases).map(String), item => item.toLowerCase()),
    type: normalizeType(sourceObject.type),
    status: sourceObject.status === "reviewed" ? "reviewed" : "draft",
    domains: domains.length ? domains : [id.split(".")[0]],
    difficulty: sourceObject.difficulty || "foundational",
    importance: sourceObject.importance || "medium",
    certificationMappings: asArray(sourceObject.certificationMappings),
    learning: {
      summary,
      explanation: sourceObject.learning?.explanation || summary,
      facts,
      commands: asArray(sourceObject.learning?.commands),
      examples: asArray(sourceObject.learning?.examples),
      tables: asArray(sourceObject.learning?.tables),
      media: asArray(sourceObject.learning?.media),
      notes: asArray(sourceObject.learning?.notes)
    },
    assessmentSeeds: {
      examTips: asArray(sourceObject.assessmentSeeds?.examTips),
      commonMistakes: asArray(sourceObject.assessmentSeeds?.commonMistakes),
      scenarios: asArray(sourceObject.assessmentSeeds?.scenarios),
      pbqIdeas: asArray(sourceObject.assessmentSeeds?.pbqIdeas),
      questionTargets: asArray(sourceObject.assessmentSeeds?.questionTargets)
    },
    relationships: {
      prerequisites: asArray(sourceObject.relationships?.prerequisites).map(normalizeRelationshipTarget).filter(Boolean),
      parents: asArray(sourceObject.relationships?.parents).map(normalizeRelationshipTarget).filter(Boolean),
      children: asArray(sourceObject.relationships?.children).map(normalizeRelationshipTarget).filter(Boolean),
      related: normalizeRelationshipList(sourceObject.relationships?.related),
      contrastsWith: normalizeRelationshipList(sourceObject.relationships?.contrastsWith),
      replacedBy: asArray(sourceObject.relationships?.replacedBy).map(normalizeRelationshipTarget).filter(Boolean)
    },
    sources: {
      references: asArray(sourceObject.sources?.references)
    },
    quality: {
      createdAt: sourceObject.quality?.createdAt || today,
      updatedAt: today,
      lastReviewedAt: sourceObject.quality?.lastReviewedAt || today,
      reviewedBy: sourceObject.quality?.reviewedBy || "knowledge-builder",
      confidence: sourceObject.quality?.confidence || sourceObject.confidence || "medium",
      needsHumanReview: false,
      reviewNotes: asArray(sourceObject.quality?.reviewNotes)
    },
    _compiler: {
      originalId: sourceObject.id || null,
      originalType: sourceObject.type || null,
      provenanceStripped: Boolean(sourceObject.sources?.transcripts?.length || sourceObject.sources?.videos?.length)
    }
  };
}

function mergeObjects(existing, incoming) {
  const merged = structuredClone(existing);
  merged.aliases = uniqueBy([...asArray(existing.aliases), ...asArray(incoming.aliases)], item => item.toLowerCase());
  merged.domains = uniqueBy([...asArray(existing.domains), ...asArray(incoming.domains)], item => item);
  merged.learning.summary = existing.learning?.summary || incoming.learning?.summary || "";
  merged.learning.explanation = existing.learning?.explanation || incoming.learning?.explanation || merged.learning.summary;
  merged.learning.facts = mergeTextRecords([...asArray(existing.learning?.facts), ...asArray(incoming.learning?.facts)]);
  merged.learning.examples = uniqueBy([...asArray(existing.learning?.examples), ...asArray(incoming.learning?.examples)], item => item.text || JSON.stringify(item));
  merged.learning.notes = uniqueBy([...asArray(existing.learning?.notes), ...asArray(incoming.learning?.notes)], item => item.text || JSON.stringify(item));
  merged.relationships.prerequisites = uniqueBy([...asArray(existing.relationships?.prerequisites), ...asArray(incoming.relationships?.prerequisites)], item => item);
  merged.relationships.parents = uniqueBy([...asArray(existing.relationships?.parents), ...asArray(incoming.relationships?.parents)], item => item);
  merged.relationships.children = uniqueBy([...asArray(existing.relationships?.children), ...asArray(incoming.relationships?.children)], item => item);
  merged.relationships.related = normalizeRelationshipList([...asArray(existing.relationships?.related), ...asArray(incoming.relationships?.related)]);
  merged.relationships.contrastsWith = normalizeRelationshipList([...asArray(existing.relationships?.contrastsWith), ...asArray(incoming.relationships?.contrastsWith)]);
  merged.relationships.replacedBy = uniqueBy([...asArray(existing.relationships?.replacedBy), ...asArray(incoming.relationships?.replacedBy)], item => item);
  merged.sources = { references: uniqueBy([...asArray(existing.sources?.references), ...asArray(incoming.sources?.references)], item => item.url || item.title || JSON.stringify(item)) };
  merged.quality.updatedAt = new Date().toISOString().slice(0, 10);
  merged.quality.lastReviewedAt = merged.quality.lastReviewedAt || incoming.quality.lastReviewedAt;
  merged._compiler = {
    mergedFrom: uniqueBy([...(existing._compiler?.mergedFrom || [existing._compiler?.originalId || existing.id]), incoming._compiler?.originalId || incoming.id], item => item).filter(Boolean),
    provenanceStripped: Boolean(existing._compiler?.provenanceStripped || incoming._compiler?.provenanceStripped)
  };
  return merged;
}

function compileObjects(sourceObjects) {
  const byId = new Map();
  const duplicateInputs = [];

  for (const sourceObject of sourceObjects) {
    const normalized = normalizeObjectForCompile(sourceObject);
    const existing = byId.get(normalized.id);
    if (existing) {
      duplicateInputs.push({ id: normalized.id, title: normalized.title });
      byId.set(normalized.id, mergeObjects(existing, normalized));
    } else {
      byId.set(normalized.id, normalized);
    }
  }

  const objects = [...byId.values()];
  resolveRelationshipTargets(objects);
  const stubs = createStubs ? createMissingRelationshipStubs(objects) : [];
  for (const stub of stubs) objects.push(stub);

  return {
    objects: objects.map(stripCompilerMetadata),
    duplicateInputs,
    stubs
  };
}

function relationshipTargetAliasMap(objects) {
  const aliases = new Map();
  for (const object of objects) {
    const idParts = object.id.split(".");
    const slug = idParts.at(-1);
    aliases.set(object.id, object.id);
    aliases.set(slug, object.id);
    aliases.set(`${idParts[0]}.${slug}`, object.id);
    aliases.set(slugify(object.title), object.id);
    for (const alias of object.aliases || []) aliases.set(slugify(alias), object.id);
  }
  return aliases;
}

function resolveTargetId(targetId, objectIds, aliases) {
  if (!targetId) return "";
  if (objectIds.has(targetId)) return targetId;
  const slug = targetId.split(".").at(-1);
  return aliases.get(targetId) || aliases.get(slug) || targetId;
}

function resolveRelationshipTargets(objects) {
  const objectIds = new Set(objects.map(object => object.id));
  const aliases = relationshipTargetAliasMap(objects);

  for (const object of objects) {
    object.relationships.prerequisites = object.relationships.prerequisites.map(id => resolveTargetId(id, objectIds, aliases));
    object.relationships.parents = object.relationships.parents.map(id => resolveTargetId(id, objectIds, aliases));
    object.relationships.children = object.relationships.children.map(id => resolveTargetId(id, objectIds, aliases));
    object.relationships.replacedBy = object.relationships.replacedBy.map(id => resolveTargetId(id, objectIds, aliases));
    object.relationships.related = object.relationships.related.map(item => ({ ...item, id: resolveTargetId(item.id, objectIds, aliases) }));
    object.relationships.contrastsWith = object.relationships.contrastsWith.map(item => ({ ...item, id: resolveTargetId(item.id, objectIds, aliases) }));
  }
}

function allRelationshipTargetIds(objects) {
  return uniqueBy(objects.flatMap(object => [
    ...asArray(object.relationships?.prerequisites),
    ...asArray(object.relationships?.parents),
    ...asArray(object.relationships?.children),
    ...asArray(object.relationships?.replacedBy),
    ...asArray(object.relationships?.related).map(item => item.id),
    ...asArray(object.relationships?.contrastsWith).map(item => item.id)
  ]).filter(Boolean), item => item);
}

function createMissingRelationshipStubs(objects) {
  const existingIds = new Set(objects.map(object => object.id));
  const certificationMappings = objects[0]?.certificationMappings || [];
  const today = new Date().toISOString().slice(0, 10);

  return allRelationshipTargetIds(objects)
    .filter(id => !existingIds.has(id))
    .map(id => {
      const title = titleFromId(id);
      const domain = id.split(".")[0];
      return {
        schemaVersion: "1.0.0",
        id,
        slug: slugify(id.split(".").at(-1)),
        title,
        aliases: [],
        type: "concept",
        status: "stub",
        domains: [domain],
        difficulty: "foundational",
        importance: "medium",
        certificationMappings,
        learning: {
          summary: `${title} is a placeholder concept created because another reviewed Knowledge Object references it.`,
          explanation: `${title} needs review and enrichment before it becomes a complete Knowledge Object.`,
          facts: [{ text: `${title} is referenced by another Knowledge Object and needs human review.`, importance: "low", tags: ["stub"] }],
          commands: [],
          examples: [],
          tables: [],
          media: [],
          notes: [{ text: "Auto-created by the Knowledge Builder to prevent dangling relationship targets.", type: "builder-note" }]
        },
        assessmentSeeds: {
          examTips: [],
          commonMistakes: [],
          scenarios: [],
          pbqIdeas: [],
          questionTargets: []
        },
        relationships: {
          prerequisites: [],
          parents: [],
          children: [],
          related: [],
          contrastsWith: [],
          replacedBy: []
        },
        sources: {
          references: []
        },
        quality: {
          createdAt: today,
          updatedAt: today,
          lastReviewedAt: today,
          reviewedBy: "knowledge-builder",
          confidence: "low",
          needsHumanReview: true,
          reviewNotes: ["Auto-created relationship target stub."]
        },
        _compiler: {
          stub: true
        }
      };
    });
}

function stripCompilerMetadata(object) {
  const clone = structuredClone(object);
  delete clone._compiler;
  return clone;
}

function validateCompiledObject(object) {
  const errors = [];
  if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(object.id || "")) errors.push("id must look like domain.slug");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(object.slug || "")) errors.push("slug must be lowercase kebab-case");
  if (!allowedTypes.has(object.type)) errors.push(`invalid type ${object.type}`);
  if (!object.sources || Object.keys(object.sources).some(key => key !== "references")) errors.push("sources must only contain references");
  if (!Array.isArray(object.sources?.references)) errors.push("sources.references must be an array");
  if (!object.learning?.summary) errors.push("missing learning.summary");
  if (!Array.isArray(object.learning?.facts)) errors.push("learning.facts must be an array");
  if (!object.learning?.facts?.length) errors.push("missing learning.facts");
  if (!Array.isArray(object.certificationMappings) || !object.certificationMappings.length) errors.push("missing certificationMappings");
  return errors;
}

function canonicalPathForObject(object) {
  return path.resolve(root, "content", "knowledge", slugify(object.domains[0] || object.id.split(".")[0]), `${object.slug}.json`);
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

function cleanKnowledgeDirectory() {
  const knowledgeRoot = path.resolve(root, "content", "knowledge");
  const removed = [];
  if (!cleanBuild || dryRun) return removed;
  for (const file of walkJsonFiles(knowledgeRoot)) {
    fs.rmSync(file, { force: true });
    removed.push(toProjectPath(file, root));
  }
  return removed;
}

function mergeIndex(newPaths) {
  const indexPath = path.resolve(root, "content", "indexes", "knowledge-index.json");
  const index = readJsonIfExists(indexPath, {
    description: "Central index of canonical Knowledge Object files.",
    objects: []
  });
  const objects = cleanBuild ? newPaths.sort() : uniqueBy([...(index.objects || []), ...newPaths], item => item).sort();
  const updated = {
    ...index,
    generatedBy: "knowledge-builder-compiler",
    updatedAt: new Date().toISOString(),
    objects
  };
  writeJson(indexPath, updated);
  return { path: indexPath, count: objects.length };
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

  const scalarEdges = scalarGroups.flatMap(([type, ids]) => asArray(ids).map(targetId => ({ targetId, type, reason: "Promoted from reviewed relationship." })));
  const objectEdges = objectGroups.flatMap(([type, items]) => asArray(items).map(item => ({ targetId: item.id, type, reason: item.reason || "Promoted from reviewed relationship.", strength: item.strength || "medium" })));

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

function mergeGraph(certification, newEdges) {
  const graphPath = path.resolve(root, "content", "relationships", `${certification}.graph.json`);
  const graph = readJsonIfExists(graphPath, {
    schemaVersion: "1.0.0",
    certification,
    relationships: []
  });
  const byId = new Map((cleanBuild ? [] : asArray(graph.relationships)).map(edge => [edge.id, edge]));
  for (const edge of newEdges) byId.set(edge.id, edge);
  const relationships = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  const updated = {
    ...graph,
    schemaVersion: "1.0.0",
    certification,
    generatedBy: "knowledge-builder-compiler",
    updatedAt: new Date().toISOString(),
    relationships
  };
  writeJson(graphPath, updated);
  return { path: graphPath, count: relationships.length };
}

if (!inputFile) fail("Usage: node tools/knowledge/promote-approved-objects.mjs --file=approved-knowledge-objects.json [--clean=true] [--stubs=false]");
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Approved export not found: ${inputFile}`);

const exportData = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceObjects = asArray(exportData.objects || exportData);
if (!sourceObjects.length) fail("No approved objects found in export.");

const compilation = compileObjects(sourceObjects);
const validationErrors = compilation.objects.flatMap(object => validateCompiledObject(object).map(error => ({ id: object.id, error })));
if (validationErrors.length) {
  console.error(JSON.stringify({ generatedBy: "knowledge-builder-compiler", stage: "validate", validationErrors }, null, 2));
  process.exit(1);
}

const removedDuringClean = cleanKnowledgeDirectory();
const promoted = [];
const stubs = [];
const edges = [];
const indexPaths = [];

for (const object of compilation.objects) {
  const filePath = canonicalPathForObject(object);
  const projectPath = toProjectPath(filePath, root);
  writeJson(filePath, object);
  const record = { id: object.id, title: object.title, status: object.status, path: projectPath };
  if (object.status === "stub") stubs.push(record);
  else promoted.push(record);
  indexPaths.push(projectPath);
  edges.push(...relationshipEdgesFor(object));
}

const certification = sourceObjects[0]?.certificationMappings?.[0]?.certification || args.cert || args.certification || "a-plus-220-1202";
const indexResult = mergeIndex(indexPaths);
const graphResult = mergeGraph(certification, edges);

const report = {
  generatedBy: "knowledge-builder-compiler",
  dryRun,
  cleanBuild,
  createStubs,
  source: toProjectPath(sourcePath, root),
  inputCount: sourceObjects.length,
  promotedCount: promoted.length,
  stubCount: stubs.length,
  duplicateInputCount: compilation.duplicateInputs.length,
  relationshipEdges: edges.length,
  removedDuringClean,
  duplicateInputs: compilation.duplicateInputs,
  promoted,
  stubs,
  skipped: [],
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
    "Review stub Knowledge Objects and replace them with full discoveries when lessons teach them directly."
  ]
}, null, 2));
