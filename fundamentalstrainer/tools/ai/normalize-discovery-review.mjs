#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;
const reservedPlaceholderIdPattern = /^(concept|topic|object|knowledge|placeholder|draft)\.\d+$/;
const placeholderTitlePattern = /^(concept|topic|object|knowledge|placeholder|draft)\s+\d+$/i;

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

function isPlaceholderKnowledgeId(value) {
  return reservedPlaceholderIdPattern.test(String(value || "").trim());
}

function isPlaceholderTitle(value) {
  return placeholderTitlePattern.test(String(value || "").trim());
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeDecision(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const map = {
    accept: "accept-for-authoring",
    approved: "accept-for-authoring",
    "send-to-authoring": "accept-for-authoring",
    "accept-for-authoring": "accept-for-authoring",
    merge: "merge",
    "merge-existing": "merge",
    reject: "reject",
    rejected: "reject",
    defer: "defer",
    deferred: "defer",
    "needs-enrichment": "needs-enrichment",
    "enrich-before-authoring": "needs-enrichment"
  };
  return map[normalized] || normalizeEnum(value, ["accept-for-authoring", "merge", "reject", "defer", "needs-enrichment"], "defer");
}

function normalizePriority(value, fallback = "normal") {
  return normalizeEnum(value, ["high", "normal", "medium", "low", "none"], fallback).replace("medium", "normal");
}

function normalizeDepth(value, fallback = "normal") {
  return normalizeEnum(value, ["brief", "normal", "deep", "none"], fallback);
}

function normalizeDuplicateRisk(value) {
  return normalizeEnum(value, ["none", "low", "medium", "high"], "medium");
}

function normalizeCurriculumDecision(value = {}) {
  return {
    status: normalizeEnum(value.status || value.decision, ["accept", "change", "reject", "defer", "approve"], "defer").replace("approve", "accept"),
    curriculumId: value.curriculumId || value.certificationId || "",
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
  const rawDecision = item.decision || item.reviewDecision || item.promotionStatus;
  const decision = normalizeDecision(rawDecision);
  const priorityFallback = decision === "accept-for-authoring" ? "normal" : "none";
  const depthFallback = decision === "accept-for-authoring" ? "normal" : "none";

  return {
    conceptId: item.conceptId || `DISC-${String(index + 1).padStart(3, "0")}`,
    title: item.title || item.proposedKnowledgeId || "Untitled concept",
    proposedKnowledgeId: item.proposedKnowledgeId || item.sourceKnowledgeId || "",
    decision,
    targetKnowledgeId: item.targetKnowledgeId || item.authoringAction?.targetKnowledgeId || "",
    authoringPriority: normalizePriority(item.authoringPriority || item.reviewPriority, priorityFallback),
    recommendedDepth: normalizeDepth(item.recommendedDepth, depthFallback),
    reason: item.reason || item.decisionReason || "No review reason provided.",
    mustCover: asArray(item.mustCover || item.authoringAction?.notes).map(String),
    avoidAuthoringAsStandalone: item.avoidAuthoringAsStandalone === true || item.authoringAction?.shouldAuthorNow === false,
    duplicateRisk: normalizeDuplicateRisk(item.duplicateRisk),
    curriculumDecision: normalizeCurriculumDecision(item.curriculumDecision),
    relationshipDecision: normalizeRelationshipDecision(item.relationshipDecision),
    reviewFlags: asArray(item.reviewFlags).map(String)
  };
}

function normalizeQueueItem(item, decisionByConceptId = new Map(), decisionByKnowledgeId = new Map()) {
  if (typeof item === "string") {
    const source = decisionByKnowledgeId.get(item) || {};
    return {
      conceptId: source.conceptId || "",
      proposedKnowledgeId: item,
      title: source.title || item,
      priority: normalizePriority(source.authoringPriority, "normal"),
      recommendedDepth: normalizeDepth(source.recommendedDepth, "normal"),
      reason: source.reason || "Selected for next-stage processing.",
      mustCover: asArray(source.mustCover).map(String)
    };
  }

  const source = decisionByConceptId.get(item.conceptId) || decisionByKnowledgeId.get(item.proposedKnowledgeId) || {};
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

function normalizeEnrichment(item, decisionByConceptId = new Map(), decisionByKnowledgeId = new Map()) {
  if (typeof item === "string") {
    const source = decisionByKnowledgeId.get(item) || {};
    return {
      conceptId: source.conceptId || "",
      proposedKnowledgeId: item,
      title: source.title || item,
      neededEvidenceOrContext: [],
      reason: source.reason || "Needs enrichment before authoring."
    };
  }

  const source = decisionByConceptId.get(item.conceptId) || decisionByKnowledgeId.get(item.proposedKnowledgeId) || {};
  return {
    conceptId: item.conceptId || source.conceptId || "",
    proposedKnowledgeId: item.proposedKnowledgeId || source.proposedKnowledgeId || "",
    title: item.title || source.title || "Untitled concept",
    neededEvidenceOrContext: asArray(item.neededEvidenceOrContext || item.notes).map(String),
    reason: item.reason || source.reason || "Needs enrichment before authoring."
  };
}

function normalizeRejected(item, decisionByConceptId = new Map(), decisionByKnowledgeId = new Map()) {
  const source = decisionByConceptId.get(item.conceptId) || decisionByKnowledgeId.get(item.proposedKnowledgeId) || {};
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
    decision: normalizeEnum(item.decision, ["accept", "reject", "defer", "convert-to-authoring-target", "accept-gap"], "defer").replace("accept-gap", "accept"),
    relatedConceptIds: asArray(item.relatedConceptIds).map(String),
    reason: item.reason || item.title || "No gap review reason provided.",
    recommendedAction: item.recommendedAction || "Review required."
  };
}

function normalizeAlternateConceptDecisions(data) {
  if (Array.isArray(data.conceptDecisions)) return data.conceptDecisions;
  if (Array.isArray(data.conceptReviews)) return data.conceptReviews.map(item => ({
    ...item,
    decision: item.reviewDecision,
    reason: item.decisionReason,
    authoringPriority: item.reviewPriority,
    targetKnowledgeId: item.authoringAction?.targetKnowledgeId || item.targetKnowledgeId || ""
  }));
  return [];
}

function auditReview(output) {
  const flags = [];

  for (const decision of output.conceptDecisions) {
    if (!decision.conceptId || !decision.proposedKnowledgeId || !decision.title) {
      flags.push({ code: "incomplete-concept-decision", conceptId: decision.conceptId, message: "Concept decision is missing conceptId, proposedKnowledgeId, or title." });
    }
    if (isPlaceholderKnowledgeId(decision.proposedKnowledgeId)) {
      flags.push({ code: "placeholder-knowledge-id", conceptId: decision.conceptId, message: `proposedKnowledgeId ${decision.proposedKnowledgeId} is a reserved placeholder. Use a semantic canonical id.` });
    }
    if (isPlaceholderTitle(decision.title)) {
      flags.push({ code: "placeholder-title", conceptId: decision.conceptId, message: `title ${decision.title} is a placeholder. Use the actual discovered concept title.` });
    }
    if (decision.targetKnowledgeId && isPlaceholderKnowledgeId(decision.targetKnowledgeId)) {
      flags.push({ code: "placeholder-merge-target", conceptId: decision.conceptId, message: `targetKnowledgeId ${decision.targetKnowledgeId} is a reserved placeholder. Use a real canonical target id.` });
    }
    if (decision.decision === "merge" && !decision.targetKnowledgeId) {
      flags.push({ code: "merge-missing-target", conceptId: decision.conceptId, message: "Merge decision has no targetKnowledgeId." });
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
    if (isPlaceholderKnowledgeId(item.proposedKnowledgeId)) {
      flags.push({ code: "authoring-queue-placeholder-id", conceptId: item.conceptId, message: `authoringQueue proposedKnowledgeId ${item.proposedKnowledgeId} is a reserved placeholder.` });
    }
    if (isPlaceholderTitle(item.title)) {
      flags.push({ code: "authoring-queue-placeholder-title", conceptId: item.conceptId, message: `authoringQueue title ${item.title} is a placeholder.` });
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

const conceptDecisions = normalizeAlternateConceptDecisions(data).map(normalizeConceptDecision);
const decisionByConceptId = new Map(conceptDecisions.map(item => [item.conceptId, item]));
const decisionByKnowledgeId = new Map(conceptDecisions.map(item => [item.proposedKnowledgeId, item]));
const authoringQueueSource = asArray(data.authoringQueue).length
  ? data.authoringQueue
  : conceptDecisions.filter(item => item.decision === "accept-for-authoring");

const output = {
  id: `DISCOVERY-REVIEW-${lessonId}`,
  schemaVersion: "normalized-discovery-review.v1",
  sourceSchemaVersion: data.schemaVersion,
  lessonId,
  lessonTitle,
  sourceReviewInput: data.sourceReviewInput || data.sourcePackage?.sourceManifest || "",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "reviewed-for-authoring",
  createdAt: new Date().toISOString(),
  reviewSummary: {
    acceptedForAuthoring: conceptDecisions.filter(item => item.decision === "accept-for-authoring").length,
    merge: conceptDecisions.filter(item => item.decision === "merge").length,
    rejected: conceptDecisions.filter(item => item.decision === "reject").length,
    deferred: conceptDecisions.filter(item => item.decision === "defer").length,
    needsEnrichment: conceptDecisions.filter(item => item.decision === "needs-enrichment").length,
    reviewNotes: asArray(data.reviewSummary?.reviewNotes || data.reviewSummary?.qualityNotes || data.reviewNotes).map(String)
  },
  conceptDecisions,
  mergePlan: asArray(data.mergePlan || data.mergeActions).map(normalizeMerge),
  authoringQueue: asArray(authoringQueueSource).map(item => normalizeQueueItem(item, decisionByConceptId, decisionByKnowledgeId)),
  enrichmentQueue: asArray(data.enrichmentQueue || data.deferredQueue).map(item => normalizeEnrichment(item, decisionByConceptId, decisionByKnowledgeId)),
  rejectedConcepts: asArray(data.rejectedConcepts).map(item => normalizeRejected(item, decisionByConceptId, decisionByKnowledgeId)),
  gapReview: asArray(data.gapReview || data.knowledgeGapReview).map(normalizeGap),
  globalReviewNotes: asArray(data.globalReviewNotes || data.reviewNotes).map(String)
};

output.audit = auditReview(output);

fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

const result = {
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
  next: output.audit.status === "passed"
    ? [
        "Use the normalized discovery review file as the source for Knowledge Authoring prompts.",
        "Only concepts in authoringQueue should be sent to Knowledge Authoring."
      ]
    : [
        "Fix the Discovery Review AI response and rerun normalization.",
        "Do not send this file to Knowledge Authoring while auditStatus is needs-review."
      ]
};

console.log(JSON.stringify(result, null, 2));

if (output.audit.status !== "passed") {
  console.error(`Discovery Review normalization audit failed with ${output.audit.flags.length} flag(s).`);
  process.exit(1);
}
