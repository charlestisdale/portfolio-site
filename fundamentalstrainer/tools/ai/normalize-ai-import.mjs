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
  return String(value || "concept")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "concept";
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function normalizeId(value, fallbackTitle, domains = []) {
  const raw = String(value || "").trim().toLowerCase();
  if (/^[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)+$/.test(raw)) return raw;
  const domain = slugify(domains[0] || "general");
  return `${domain}.${slugify(fallbackTitle)}`;
}

function normalizeConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.7;
  if (number > 1) return Math.max(0, Math.min(1, number / 100));
  return Math.max(0, Math.min(1, number));
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeBasis(value, fallback = "ai-inference") {
  return normalizeEnum(value, [
    "source-supported",
    "ai-inference",
    "general-it-knowledge",
    "common-practice",
    "exam-knowledge",
    "transcript-supported",
    "ai-enriched"
  ], fallback)
    .replace("transcript-supported", "source-supported")
    .replace("ai-enriched", "general-it-knowledge");
}

function normalizeEvidence(evidence, index) {
  if (typeof evidence === "string") {
    return {
      evidenceId: `EVID-${String(index + 1).padStart(3, "0")}`,
      quote: evidence,
      reason: "Source excerpt selected during AI analysis.",
      evidenceType: "mention",
      supports: "topic-trigger"
    };
  }

  const quote = String(evidence?.quote || evidence?.text || evidence?.excerpt || "").trim();
  return {
    evidenceId: evidence?.evidenceId || `EVID-${String(index + 1).padStart(3, "0")}`,
    quote,
    reason: evidence?.reason || "Source excerpt selected during AI analysis.",
    evidenceType: evidence?.evidenceType || "mention",
    supports: evidence?.supports || "topic-trigger"
  };
}

function normalizeReviewRequired(item) {
  return {
    ...item,
    basis: normalizeBasis(item?.basis),
    requiresReview: item?.requiresReview !== false
  };
}

function normalizePlacement(suggestion, concept = {}, defaults = {}) {
  return normalizeReviewRequired({
    conceptId: suggestion?.conceptId || concept.conceptId || "",
    proposedKnowledgeId: suggestion?.proposedKnowledgeId || concept.proposedKnowledgeId || concept.id || "",
    curriculumId: String(suggestion?.curriculumId || defaults.certificationId || "a-plus-220-1202"),
    sectionId: String(suggestion?.sectionId || "").trim(),
    moduleId: String(suggestion?.moduleId || "").trim(),
    proposedModuleTitle: suggestion?.proposedModuleTitle || "",
    reason: suggestion?.reason || "AI-suggested curriculum placement.",
    evidenceIds: asArray(suggestion?.evidenceIds).map(String)
  });
}

function normalizeRelationship(relationship, concept = {}) {
  return normalizeReviewRequired({
    sourceConceptId: relationship?.sourceConceptId || concept.conceptId || "",
    sourceKnowledgeId: relationship?.sourceKnowledgeId || relationship?.source || concept.proposedKnowledgeId || "",
    targetKnowledgeId: relationship?.targetKnowledgeId || relationship?.target || relationship?.id || "",
    type: relationship?.type || "related_to",
    reason: relationship?.reason || relationship?.evidence || "AI-suggested relationship.",
    evidenceIds: asArray(relationship?.evidenceIds).map(String)
  });
}

function normalizePrerequisite(prerequisite) {
  if (typeof prerequisite === "string") {
    return normalizeReviewRequired({
      proposedKnowledgeId: prerequisite,
      reason: "AI-suggested prerequisite."
    });
  }

  return normalizeReviewRequired({
    proposedKnowledgeId: prerequisite?.proposedKnowledgeId || prerequisite?.knowledgeId || prerequisite?.id || "",
    reason: prerequisite?.reason || "AI-suggested prerequisite.",
    evidenceIds: asArray(prerequisite?.evidenceIds).map(String)
  });
}

function normalizeMergeRecommendation(recommendation, concept = {}) {
  if (!recommendation) return null;
  if (recommendation.shouldMerge === false && !recommendation.targetKnowledgeId) return null;

  return normalizeReviewRequired({
    sourceConceptId: recommendation.sourceConceptId || concept.conceptId || "",
    sourceKnowledgeId: recommendation.sourceKnowledgeId || concept.proposedKnowledgeId || "",
    targetKnowledgeId: recommendation.targetKnowledgeId || recommendation.targetId || recommendation.id || "",
    reason: recommendation.reason || "AI-suggested merge review.",
    shouldMerge: recommendation.shouldMerge !== false
  });
}

function normalizeAuthoringGuidance(guidance = {}, classification = "teachable") {
  const shouldAuthor = guidance.shouldAuthor ?? ["teachable", "merge-existing", "needs-enrichment"].includes(classification);
  return {
    shouldAuthor,
    recommendedDepth: normalizeEnum(guidance.recommendedDepth, ["brief", "normal", "deep"], shouldAuthor ? "normal" : "brief"),
    mustCover: asArray(guidance.mustCover).map(String),
    niceToCover: asArray(guidance.niceToCover).map(String),
    avoidCreatingDuplicateOf: asArray(guidance.avoidCreatingDuplicateOf).map(String),
    notes: asArray(guidance.notes).map(String)
  };
}

function normalizeDiscoveryConcept(concept, index, defaults = {}) {
  const domains = Array.isArray(concept.domains) && concept.domains.length ? concept.domains.map(String) : [concept.category || "general"];
  const proposedKnowledgeId = normalizeId(concept.proposedKnowledgeId || concept.knowledgeId || concept.id, concept.title, domains);
  const classification = normalizeEnum(
    concept.classification || concept.importClassification,
    ["teachable", "merge-existing", "mentioned-only", "ignore", "needs-enrichment"],
    "teachable"
  );
  const conceptId = concept.conceptId || concept.candidateId || `DISC-${String(index + 1).padStart(3, "0")}`;
  const sourceEvidence = asArray(concept.sourceEvidence || concept.transcriptEvidence || concept.evidence)
    .map(normalizeEvidence)
    .filter(item => item.quote);

  const normalized = {
    conceptId,
    title: String(concept.title || proposedKnowledgeId).trim(),
    slug: slugify(concept.slug || concept.title || proposedKnowledgeId.split(".").at(-1)),
    proposedKnowledgeId,
    type: concept.type || "concept",
    domains,
    aliases: Array.isArray(concept.aliases) ? concept.aliases.map(String) : [],
    classification,
    teachingValue: normalizeEnum(concept.teachingValue || concept.importance, ["high", "medium", "low", "exam-critical"], "medium").replace("exam-critical", "high"),
    topicConfidence: normalizeConfidence(concept.topicConfidence ?? concept.confidence),
    evidenceStrength: normalizeEnum(concept.evidenceStrength || concept.sourceQuality?.transcriptSupport, ["strong", "medium", "weak"], sourceEvidence.length > 1 ? "medium" : "weak"),
    enrichmentLevel: normalizeEnum(concept.enrichmentLevel, ["none", "low", "medium", "high"], concept.sourceQuality?.aiEnrichmentUsed ? "medium" : "high"),
    reviewPriority: normalizeEnum(concept.reviewPriority, ["low", "normal", "high"], "normal"),
    sourceEvidence,
    prerequisites: asArray(concept.prerequisites).map(normalizePrerequisite).filter(item => item.proposedKnowledgeId),
    relationshipSuggestions: asArray(concept.relationshipSuggestions || concept.suggestedRelationships)
      .map(item => normalizeRelationship(item, { conceptId, proposedKnowledgeId }))
      .filter(item => item.targetKnowledgeId),
    curriculumPlacementSuggestions: asArray(concept.curriculumPlacementSuggestions || concept.curriculumSuggestions)
      .map(item => normalizePlacement(item, { conceptId, proposedKnowledgeId }, defaults))
      .filter(item => item.sectionId || item.moduleId || item.proposedModuleTitle),
    mergeRecommendation: normalizeMergeRecommendation(concept.mergeRecommendation, { conceptId, proposedKnowledgeId }),
    authoringGuidance: normalizeAuthoringGuidance(concept.authoringGuidance, classification),
    reviewDecision: concept.reviewDecision || "undecided",
    reviewNotes: concept.reviewNotes || ""
  };

  normalized.quality = auditDiscoveryConcept(normalized);
  return normalized;
}

function auditDiscoveryConcept(concept) {
  const flags = [];

  if (!concept.sourceEvidence.length) flags.push({ code: "missing-source-evidence", message: "Concept has no source evidence showing why it was discovered." });
  if (concept.topicConfidence < 0.7) flags.push({ code: "low-topic-confidence", message: "Topic confidence is below 0.70." });
  if (!concept.proposedKnowledgeId.includes(".")) flags.push({ code: "unstable-id", message: "Proposed Knowledge ID does not look domain-scoped." });
  if (["teachable", "merge-existing", "needs-enrichment"].includes(concept.classification) && !concept.curriculumPlacementSuggestions.length) flags.push({ code: "missing-curriculum-placement", message: "Forward-moving concepts should propose a curriculum placement." });
  if (["teachable", "merge-existing", "needs-enrichment"].includes(concept.classification) && !concept.authoringGuidance.shouldAuthor) flags.push({ code: "authoring-guidance-disabled", message: "Forward-moving concept is not marked for authoring." });
  if (concept.classification === "mentioned-only" && concept.authoringGuidance.shouldAuthor) flags.push({ code: "mentioned-only-marked-for-authoring", message: "Mentioned-only concepts should not be sent to authoring without review." });
  if (concept.evidenceStrength === "weak" && concept.enrichmentLevel === "high") flags.push({ code: "weak-evidence-high-enrichment", message: "Concept depends heavily on enrichment and needs careful review." });

  let score = Math.round(concept.topicConfidence * 100);
  score -= flags.length * 10;
  score += Math.min(10, concept.sourceEvidence.length * 3);
  score += concept.curriculumPlacementSuggestions.length ? 8 : 0;
  score += concept.relationshipSuggestions.length ? 6 : 0;
  score += concept.prerequisites.length ? 4 : 0;
  score += concept.authoringGuidance.mustCover.length ? 6 : 0;

  if (!concept.sourceEvidence.length) score = Math.min(score, 60);
  if (concept.classification === "ignore") score = Math.min(score, 60);
  if (concept.classification === "mentioned-only") score = Math.min(score, 75);
  if (concept.evidenceStrength === "weak" && concept.enrichmentLevel === "high") score = Math.min(score, 78);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    band: score >= 85 ? "high" : score >= 60 ? "needs-review" : "low",
    flags
  };
}

function normalizeGap(gap, index) {
  return normalizeReviewRequired({
    gapId: gap?.gapId || `GAP-${String(index + 1).padStart(3, "0")}`,
    title: String(gap?.title || "Knowledge gap").trim(),
    description: String(gap?.description || gap?.reason || "").trim(),
    relatedConceptIds: asArray(gap?.relatedConceptIds || gap?.relatedKnowledgeIds).map(String),
    recommendation: gap?.recommendation || "Review this gap and decide whether to create, enrich, or link supporting curriculum content.",
    severity: normalizeEnum(gap?.severity, ["low", "medium", "high"], "medium"),
    evidenceIds: asArray(gap?.evidenceIds).map(String)
  });
}

function normalizeRejectedMention(item, index) {
  if (typeof item === "string") {
    return {
      id: `REJECT-${String(index + 1).padStart(3, "0")}`,
      title: item,
      classification: "mentioned-only",
      reason: "Mentioned by source but not selected for authoring.",
      basis: "source-supported",
      sourceEvidence: item
    };
  }

  return {
    id: item.id || `REJECT-${String(index + 1).padStart(3, "0")}`,
    title: String(item.title || "Rejected mention").trim(),
    classification: item.classification || "mentioned-only",
    reason: item.reason || "Not selected for authoring.",
    basis: normalizeBasis(item.basis, "source-supported"),
    sourceEvidence: item.sourceEvidence || item.transcriptEvidence || ""
  };
}

if (!inputFile) fail("Usage: node tools/ai/normalize-ai-import.mjs --file=data/ai-imports/responses/<response>.json");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`AI import response not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const sourceSchemaVersion = data.schemaVersion || "unknown";
const rawConcepts = data.conceptsDiscovered || data.concepts || data.candidates || data.objects || [];
const lessonId = String(data.lessonId || args.lesson || "00").padStart(2, "0");
const certificationId = data.certificationId || args.cert || args.certification || "a-plus-220-1202";
const lessonTitle = data.lessonTitle || args.title || `Lesson ${lessonId}`;

const discoveredConcepts = rawConcepts.map((concept, index) => normalizeDiscoveryConcept(concept, index, { certificationId }));
const conceptById = new Map(discoveredConcepts.map(concept => [concept.conceptId, concept]));
const conceptByKnowledgeId = new Map(discoveredConcepts.map(concept => [concept.proposedKnowledgeId, concept]));

const globalMergeRecommendations = [
  ...asArray(data.mergeRecommendations),
  ...discoveredConcepts.map(concept => concept.mergeRecommendation).filter(Boolean)
].map(item => normalizeMergeRecommendation(item, conceptById.get(item?.sourceConceptId) || conceptByKnowledgeId.get(item?.sourceKnowledgeId) || {})).filter(Boolean);

const globalRelationshipSuggestions = [
  ...asArray(data.relationshipSuggestions || data.relationships),
  ...discoveredConcepts.flatMap(concept => concept.relationshipSuggestions)
].map(item => normalizeRelationship(item)).filter(item => item.targetKnowledgeId);

const globalCurriculumPlacementSuggestions = [
  ...asArray(data.curriculumPlacementSuggestions || data.curriculumSuggestions),
  ...discoveredConcepts.flatMap(concept => concept.curriculumPlacementSuggestions)
].map(item => normalizePlacement(item, {}, { certificationId })).filter(item => item.sectionId || item.moduleId || item.proposedModuleTitle);

const knowledgeGaps = asArray(data.knowledgeGaps || data.gaps).map(normalizeGap);
const rejectedMentions = asArray(data.rejectedMentions || data.rejectedConcepts).map(normalizeRejectedMention);

const outDir = path.resolve(root, "data", "imports", "pending");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-transcript-intelligence.json`);

const output = {
  id: `TRANSCRIPT-INTELLIGENCE-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  importSource: "transcript-intelligence",
  schemaVersion: "pending-transcript-intelligence.v1",
  sourceSchemaVersion,
  certificationId,
  lessonId,
  lessonTitle,
  sourceTranscript: data.sourceTranscript || "",
  transcriptInputMode: data.transcriptInputMode || "unknown",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "pending-discovery-review",
  createdAt: new Date().toISOString(),
  analysisQuality: {
    isStarterAnalysis: data.analysisQuality?.isStarterAnalysis === true,
    fixedCandidateTargetUsed: data.analysisQuality?.fixedCandidateTargetUsed === true,
    conceptCountPolicy: data.analysisQuality?.conceptCountPolicy || "Return every concept above the minimum teaching threshold.",
    gapsIncluded: knowledgeGaps.length > 0 || data.analysisQuality?.gapsIncluded === true,
    mergeDetectionIncluded: globalMergeRecommendations.length > 0 || data.analysisQuality?.mergeDetectionIncluded === true,
    curriculumPlacementIncluded: globalCurriculumPlacementSuggestions.length > 0 || data.analysisQuality?.curriculumPlacementIncluded === true,
    relationshipDiscoveryIncluded: globalRelationshipSuggestions.length > 0 || data.analysisQuality?.relationshipDiscoveryIncluded === true,
    richnessNotes: data.analysisQuality?.richnessNotes || ""
  },
  metrics: {
    conceptsDiscovered: discoveredConcepts.length,
    teachable: discoveredConcepts.filter(concept => concept.classification === "teachable").length,
    mergeExisting: discoveredConcepts.filter(concept => concept.classification === "merge-existing").length,
    needsEnrichment: discoveredConcepts.filter(concept => concept.classification === "needs-enrichment").length,
    mentionedOnly: discoveredConcepts.filter(concept => concept.classification === "mentioned-only").length,
    ignored: discoveredConcepts.filter(concept => concept.classification === "ignore").length,
    highPriorityReview: discoveredConcepts.filter(concept => concept.reviewPriority === "high").length,
    weakEvidenceHighEnrichment: discoveredConcepts.filter(concept => concept.evidenceStrength === "weak" && concept.enrichmentLevel === "high").length,
    mergeRecommendations: globalMergeRecommendations.length,
    relationshipSuggestions: globalRelationshipSuggestions.length,
    curriculumPlacementSuggestions: globalCurriculumPlacementSuggestions.length,
    knowledgeGaps: knowledgeGaps.length,
    rejectedMentions: rejectedMentions.length,
    quality: discoveredConcepts.reduce((summary, concept) => {
      summary.total += 1;
      summary[concept.quality.band] = (summary[concept.quality.band] || 0) + 1;
      return summary;
    }, { total: 0, high: 0, "needs-review": 0, low: 0 })
  },
  notes: [
    "This file is a Transcript Intelligence discovery package, not a draft Knowledge Object package.",
    "Discovery review decides which concepts move to Knowledge Authoring.",
    "Curriculum placement and relationship suggestions are reviewable metadata until promoted through the proper workflow.",
    ...(data.importNotes || [])
  ],
  discoveredConcepts,
  mergeRecommendations: globalMergeRecommendations,
  relationshipSuggestions: globalRelationshipSuggestions,
  curriculumPlacementSuggestions: globalCurriculumPlacementSuggestions,
  knowledgeGaps,
  rejectedMentions
};

fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  conceptsDiscovered: output.metrics.conceptsDiscovered,
  teachable: output.metrics.teachable,
  mergeExisting: output.metrics.mergeExisting,
  needsEnrichment: output.metrics.needsEnrichment,
  mentionedOnly: output.metrics.mentionedOnly,
  knowledgeGaps: output.metrics.knowledgeGaps,
  mergeRecommendations: output.metrics.mergeRecommendations,
  relationshipSuggestions: output.metrics.relationshipSuggestions,
  curriculumPlacementSuggestions: output.metrics.curriculumPlacementSuggestions,
  rejectedMentions: output.metrics.rejectedMentions,
  transcriptInputMode: output.transcriptInputMode,
  next: [
    "Review the Transcript Intelligence package before sending concepts to Knowledge Authoring.",
    "Approved concepts should become inputs to a separate Knowledge Author stage."
  ]
}, null, 2));
