#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function confidence(value, fallback = 0.7) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  if (number > 1) return Math.max(0, Math.min(1, number / 100));
  return Math.max(0, Math.min(1, number));
}

function normalizeKnowledgeId(value, name, domains) {
  const raw = String(value || "").trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(raw)) return raw;
  return `${slugify(domains[0] || "general")}.${slugify(name)}`;
}

function normalizeEvidence(item, index) {
  const evidenceId = item?.evidenceId || `EVID-${String(index + 1).padStart(3, "0")}`;
  const quote = String(item?.quote || item?.text || item?.excerpt || "").trim();
  return {
    evidenceId,
    quote,
    type: item?.type || item?.evidenceType || "mention",
    supports: asArray(item?.supports).map(String),
    notes: item?.notes || item?.reason || ""
  };
}

function normalizeConcept(item, index) {
  const name = String(item?.name || item?.title || `Concept ${index + 1}`).trim();
  const domains = asArray(item?.domains).map(String).filter(Boolean);
  const finalDomains = domains.length ? domains : ["general"];
  return {
    discoveryId: item?.discoveryId || item?.id || `DISC-C${String(index + 1).padStart(3, "0")}`,
    name,
    proposedKnowledgeId: normalizeKnowledgeId(item?.proposedKnowledgeId || item?.knowledgeId, name, finalDomains),
    type: item?.type || "concept",
    domains: finalDomains,
    aliases: asArray(item?.aliases).map(String),
    confidence: confidence(item?.confidence),
    evidenceIds: asArray(item?.evidenceIds).map(String),
    notes: item?.notes || item?.reason || ""
  };
}

function normalizeRelationship(item, index) {
  return {
    relationshipId: item?.relationshipId || item?.id || `REL-${String(index + 1).padStart(3, "0")}`,
    sourceDiscoveryId: item?.sourceDiscoveryId || item?.source || item?.sourceId || "",
    targetDiscoveryId: item?.targetDiscoveryId || item?.target || item?.targetId || "",
    type: item?.type || "related_to",
    evidenceIds: asArray(item?.evidenceIds).map(String),
    reason: item?.reason || item?.notes || "",
    confidence: confidence(item?.confidence)
  };
}

function normalizeLinkedItem(item, index, prefix) {
  return {
    id: item?.id || `${prefix}-${String(index + 1).padStart(3, "0")}`,
    ...item,
    evidenceIds: asArray(item?.evidenceIds).map(String)
  };
}

function auditPackage(pkg) {
  const evidenceIds = new Set(pkg.evidence.map(item => item.evidenceId));
  const conceptIds = new Set(pkg.concepts.map(item => item.discoveryId));
  const warnings = [];

  for (const concept of pkg.concepts) {
    if (!concept.evidenceIds.length) warnings.push({ code: "concept-missing-evidence", itemId: concept.discoveryId, message: `${concept.name} has no evidenceIds.` });
    for (const evidenceId of concept.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) warnings.push({ code: "concept-bad-evidence-link", itemId: concept.discoveryId, message: `${concept.name} links to missing evidence ${evidenceId}.` });
    }
  }

  for (const evidence of pkg.evidence) {
    if (!evidence.quote) warnings.push({ code: "empty-evidence", itemId: evidence.evidenceId, message: `${evidence.evidenceId} has no quote.` });
    for (const supportId of evidence.supports) {
      if (!conceptIds.has(supportId)) warnings.push({ code: "evidence-bad-support-link", itemId: evidence.evidenceId, message: `${evidence.evidenceId} supports missing concept ${supportId}.` });
    }
  }

  for (const relationship of pkg.relationships) {
    if (!conceptIds.has(relationship.sourceDiscoveryId)) warnings.push({ code: "relationship-missing-source", itemId: relationship.relationshipId, message: `${relationship.relationshipId} has missing source concept.` });
    if (!conceptIds.has(relationship.targetDiscoveryId)) warnings.push({ code: "relationship-missing-target", itemId: relationship.relationshipId, message: `${relationship.relationshipId} has missing target concept.` });
    if (!relationship.evidenceIds.length) warnings.push({ code: "relationship-missing-evidence", itemId: relationship.relationshipId, message: `${relationship.relationshipId} has no evidenceIds.` });
    for (const evidenceId of relationship.evidenceIds) {
      if (!evidenceIds.has(evidenceId)) warnings.push({ code: "relationship-bad-evidence-link", itemId: relationship.relationshipId, message: `${relationship.relationshipId} links to missing evidence ${evidenceId}.` });
    }
  }

  return {
    warnings,
    valid: warnings.length === 0,
    score: Math.max(0, 100 - warnings.length * 8)
  };
}

if (!inputFile) fail("Usage: node tools/ai/normalize-discovery-package.mjs --file=data/ai-discovery/responses/<response>.json");
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Discovery response not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const lessonId = String(data.lessonId || args.lesson || "00").padStart(2, "0");
const certificationId = data.certificationId || args.cert || args.certification || "a-plus-220-1202";
const lessonTitle = data.lessonTitle || args.title || `Lesson ${lessonId}`;

const output = {
  schemaVersion: "discovery-package.v1",
  sourceSchemaVersion: data.schemaVersion || "unknown",
  packageId: `DISCOVERY-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  lessonId,
  lessonTitle,
  sourceTranscript: data.sourceTranscript || "",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "pending-review",
  createdAt: new Date().toISOString(),
  concepts: asArray(data.concepts).map(normalizeConcept),
  evidence: asArray(data.evidence).map(normalizeEvidence),
  relationships: asArray(data.relationships).map(normalizeRelationship),
  definitions: asArray(data.definitions).map((item, index) => normalizeLinkedItem(item, index, "DEF")),
  examples: asArray(data.examples).map((item, index) => normalizeLinkedItem(item, index, "EX")),
  comparisons: asArray(data.comparisons).map((item, index) => normalizeLinkedItem(item, index, "CMP")),
  procedures: asArray(data.procedures).map((item, index) => normalizeLinkedItem(item, index, "PROC")),
  rejectedMentions: asArray(data.rejectedMentions),
  importNotes: asArray(data.importNotes)
};

output.audit = auditPackage(output);
output.metrics = {
  concepts: output.concepts.length,
  evidence: output.evidence.length,
  relationships: output.relationships.length,
  definitions: output.definitions.length,
  examples: output.examples.length,
  comparisons: output.comparisons.length,
  procedures: output.procedures.length,
  rejectedMentions: output.rejectedMentions.length,
  warnings: output.audit.warnings.length
};

const outDir = path.resolve(root, "data", "ai-discovery", "packages");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-discovery-package.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  valid: output.audit.valid,
  score: output.audit.score,
  metrics: output.metrics,
  next: [
    "Review the Discovery Package before building Knowledge Objects.",
    "Next planned step: Knowledge Builder converts reviewed discoveries into candidate Knowledge Objects."
  ]
}, null, 2));

if (!output.audit.valid && args.strict === "true") process.exit(1);
