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

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function slugify(value) {
  return String(value || "discovery-review")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "discovery-review";
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeDecision(value) {
  return normalizeEnum(value, [
    "accept-for-authoring",
    "merge",
    "reject",
    "defer",
    "needs-enrichment"
  ], "defer");
}

function normalizePriority(value, fallback = "normal") {
  return normalizeEnum(value, ["high", "normal", "low", "none"], fallback);
}

function normalizeDepth(value, fallback = "normal") {
  return normalizeEnum(value, ["brief", "normal", "deep", "none"], fallback);
}

function normalizeDuplicateRisk(value) {
  return normalizeEnum(value, ["none", "low", "medium", "high"], "medium");
}

function normalizeCurriculumDecision(value = {}) {
  return {
    status: normalizeEnum(value.status, ["accept", "change", "reject", "defer"], "defer"),
    curriculumId: value.curriculumId || "",
    sectionId: value.sectionId || "",
    moduleId: value.moduleId || "",
    reason: value.reason || ""
  };
}

function normalizeRelationshipDecision(value = {}) {
  return {
    status: normalizeEnum(value.status, ["accept-some", "accept-all", "reject-all", "defer"], "defer"),
    accepted: asArray(value.accepted).map(String),
    rejected: asArray(value.rejected).map(String),
    notes: asArray(value.notes).map(String)
  };
}

function normalizeConceptDecision(item, index) {
  const decision = normalizeDecision(item.decision);
  const priorityFallback = decision === "accept-for-authoring" ? "normal" : "none";
  const depthFallback = decision === "accept-for-authoring" ? "normal" : "none";

  return {
    conceptId: item.conceptId || `DISC-${String(index + 1).padStart(3, "0")}`,
    title: item.title || item.proposedKnowledgeId || "Untitled concept",
    proposedKnowledgeId: item.proposedKnowledgeId || "",
    decision,
    targetKnowledgeId: item.targetKnowledgeId || "",
    authoringPriority: normalizePriority(item.authoringPriority, priorityFallback),
    recommendedDepth: normalizeDepth(item.recommendedDepth, depthFallback),
    reason: item.reason || "No review reason provided.",
    mustCover: asArray(item.mustCover).map(String),
    avoidAuthoringAsStandalone: item.avoidAuthoringAsStandalone === true,
    duplicateRisk: normalizeDuplicateRisk(item.duplicateRisk),
    curriculumDecision: normalizeCurriculumDecision(item.curriculumDecision),
    relationshipDecision: normalizeRelationshipDecision(item.relationshipDecision),
    reviewFlags: asArray(item.reviewFlags).map(String)
  };
}

function normalizeQueueItem(item, decisionByConceptId = new Map()) {
  const source = decisionByConceptId.get(item.conceptId) || {};
  return {
    conceptId: item.conceptId || source.conceptId || "",
    proposedKnowledgeId: item.proposedKnowledgeId || source.proposedKnowledgeId || "",
    title: item.title || source.title || "Untitled concept",
    priority: normalizePriority(item.priority || source.authoringPriority, "normal"),
    recommendedDepth: normalizeDepth(item.recommendedDepth || source.recommendedDepth, "normal"),
    reason: item.reason || source.reason || "Selected for next-stage processing.",
    mustCover: asArray(item.mustCover || source.mustCover).map(String)
  };
}

function normalizeMerge(item) {
  return {
    sourceConceptId: item.sourceConceptId || "",
    sourceKnowledgeId: item.sourceKnowledgeId || "",
    targetKnowledgeId: item.targetKnowledgeId || "",
    reason: item.reason || "Merge recommended during discovery review.",
    preserveAuthoringGuidance: item.preserveAuthoringGuidance !== false
  };
}

function normalizeEnrichment(item, decisionByConceptId = new Map()) {
  const source = decisionByConceptId.get(item.conceptId) || {};
  return {
    conceptId: item.conceptId || source.conceptId || "",
    proposedKnowledgeId: item.proposedKnowledgeId || source.proposedKnowledgeId || "",
    title: item.title || source.title || "Untitled concept",
    neededEvidenceOrContext: asArray(item.neededEvidenceOrContext).map(String),
    reason: item.reason || source.reason || "Needs enrichment before authoring."
  };
}

function normalizeRejected(item, decisionByConceptId = new Map()) {
  const source = decisionByConceptId.get(item.conceptId) || {};
  return {
    conceptId: item.conceptId || source.conceptId || "",
    proposedKnowledgeId: item.proposedKnowledgeId || source.proposedKnowledgeId || "",
    title: item.title || source.title || "Untitled concept",
    reason: item.reason || source.reason || "Rejected during discovery review."
  };
}

function normalizeGap(item, index) {
  return {
    gapId: item.gapId || `GAP-${String(index + 1).padStart(3, "0")}`,
    decision: normalizeEnum(item.decision, ["accept", "reject", "defer", "convert-to-authoring-target"], "defer"),
    relatedConceptIds: asArray(item.relatedConceptIds).map(String),
    reason: item.reason || "No gap review reason provided.",
    recommendedAction: item.recommendedAction || "Review required."
  };
}

function auditReview(output) {
  const flags = [];

  for (const decision of output.conceptDecisions) {
    if (decision.decision === "merge" && !decision.targetKnowledgeId) {
      flags.push({ code: "merge-missing-target", conceptId: decision.conceptId, message: "Merge decision has no targetKnowledgeId." });
    }
    if (decision.decision === "accept-for-authoring" && decision.avoidAuthoringAsStandalone) {
      flags.push({ code: "accepted-but-avoid-standalone", conceptId: decision.conceptId, message: "Concept is accepted for authoring but marked avoidAuthoringAsStandalone." });
    }
    if (decision.decision === "accept-for-authoring" && decision.authoringPriority === "none") {
      flags.push({ code: "accepted-no-priority", conceptId: decision.conceptId, message: "Accepted concept has authoringPriority none." });
    }
    if (decision.decision !== "accept-for-authoring" && output.authoringQueue.some(item => item.conceptId === decision.conceptId)) {
      flags.push({ code: "nonaccepted-in-authoring-queue", conceptId: decision.conceptId, message: "Non-accepted concept appears in authoringQueue." });
    }
  }

  const acceptedIds = new Set(output.conceptDecisions.filter(item => item.decision === "accept-for-authoring").map(item => item.conceptId));
  for (const item of output.authoringQueue) {
    if (!acceptedIds.has(item.conceptId)) {
      flags.push({ code: "authoring-queue-id-not-accepted", conceptId: item.conceptId, message: "Authoring queue item was not accepted for authoring." });
    }
  }

  return {
    status: flags.length ? "needs-review" : "passed",
    flags
  };
}

if (!inputFile) fail("Usage: node tools/ai/normalize-discovery-review.mjs --file=data/ai-imports/responses/<discovery-review>.json");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Discovery Review response not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (data.schemaVersion !== "discovery-review.v1") {
  fail(`Expected schemaVersion discovery-review.v1, received ${data.schemaVersion || "missing"}`);
}

const lessonId = String(data.lessonId || args.lesson || "00").padStart(2, "0");
const lessonTitle = data.lessonTitle || args.title || `Lesson ${lessonId}`;
const outDir = path.resolve(root, "data", "imports", "reviewed");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-${slugify(lessonTitle)}-discovery-review.json`);

const conceptDecisions = asArray(data.conceptDecisions).map(normalizeConceptDecision);
const decisionByConceptId = new Map(conceptDecisions.map(item => [item.conceptId, item]));

const output = {
  id: `DISCOVERY-REVIEW-${lessonId}`,
  schemaVersion: "normalized-discovery-review.v1",
  sourceSchemaVersion: data.schemaVersion,
  lessonId,
  lessonTitle,
  sourceReviewInput: data.sourceReviewInput || "",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "reviewed-for-authoring",
  createdAt: new Date().toISOString(),
  reviewSummary: {
    acceptedForAuthoring: conceptDecisions.filter(item => item.decision === "accept-for-authoring").length,
    merge: conceptDecisions.filter(item => item.decision === "merge").length,
    rejected: conceptDecisions.filter(item => item.decision === "reject").length,
    deferred: conceptDecisions.filter(item => item.decision === "defer").length,
    needsEnrichment: conceptDecisions.filter(item => item.decision === "needs-enrichment").length,
    reviewNotes: asArray(data.reviewSummary?.reviewNotes).map(String)
  },
  conceptDecisions,
  mergePlan: asArray(data.mergePlan).map(normalizeMerge),
  authoringQueue: asArray(data.authoringQueue).map(item => normalizeQueueItem(item, decisionByConceptId)),
  enrichmentQueue: asArray(data.enrichmentQueue).map(item => normalizeEnrichment(item, decisionByConceptId)),
  rejectedConcepts: asArray(data.rejectedConcepts).map(item => normalizeRejected(item, decisionByConceptId)),
  gapReview: asArray(data.gapReview).map(normalizeGap),
  globalReviewNotes: asArray(data.globalReviewNotes).map(String)
};

output.audit = auditReview(output);

fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  acceptedForAuthoring: output.reviewSummary.acceptedForAuthoring,
  merge: output.reviewSummary.merge,
  rejected: output.reviewSummary.rejected,
  deferred: output.reviewSummary.deferred,
  needsEnrichment: output.reviewSummary.needsEnrichment,
  authoringQueue: output.authoringQueue.length,
  enrichmentQueue: output.enrichmentQueue.length,
  mergePlan: output.mergePlan.length,
  gapReview: output.gapReview.length,
  auditStatus: output.audit.status,
  auditFlags: output.audit.flags.length,
  next: [
    "Use the normalized discovery review file as the source for Knowledge Authoring prompts.",
    "Only concepts in authoringQueue should be sent to Knowledge Authoring."
  ]
}, null, 2));
