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

function normalizeBasis(value, fallback = "ai-enriched") {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (["transcript-supported", "ai-enriched"].includes(normalized)) return normalized;
  return fallback;
}

function normalizeDraftItem(item, candidate, defaults = {}) {
  if (typeof item === "string") {
    return {
      text: item,
      importance: defaults.importance || (candidate.confidence >= 0.85 ? "high" : "medium"),
      basis: defaults.basis || "ai-enriched",
      requiresReview: true,
      evidenceIds: [],
      tags: candidate.domains || []
    };
  }

  return {
    ...item,
    text: String(item?.text || item?.situation || item?.task || "").trim(),
    importance: item?.importance || defaults.importance || (candidate.confidence >= 0.85 ? "high" : "medium"),
    basis: normalizeBasis(item?.basis, defaults.basis || "ai-enriched"),
    requiresReview: item?.requiresReview !== false,
    evidenceIds: asArray(item?.evidenceIds).map(String),
    tags: Array.isArray(item?.tags) ? item.tags : candidate.domains || []
  };
}

function normalizeEvidence(evidence, index) {
  if (typeof evidence === "string") {
    return {
      evidenceId: `AI-EVID-${String(index + 1).padStart(3, "0")}`,
      text: evidence,
      quote: evidence,
      reason: "AI-selected source evidence.",
      evidenceType: "mention",
      supports: "topic-trigger"
    };
  }

  const quote = String(evidence?.quote || evidence?.text || evidence?.excerpt || "").trim();
  return {
    evidenceId: evidence?.evidenceId || `AI-EVID-${String(index + 1).padStart(3, "0")}`,
    text: quote,
    quote,
    reason: evidence?.reason || "AI-selected source evidence.",
    evidenceType: evidence?.evidenceType || "mention",
    supports: evidence?.supports || "topic-trigger"
  };
}

function normalizeRelationship(relationship) {
  return {
    id: relationship?.id || relationship?.target || relationship?.targetId || "",
    type: relationship?.type || "related_to",
    reason: relationship?.reason || relationship?.evidence || "AI-suggested relationship.",
    evidence: relationship?.evidence || relationship?.reason || "",
    basis: normalizeBasis(relationship?.basis, relationship?.evidence ? "transcript-supported" : "ai-enriched"),
    requiresReview: relationship?.requiresReview !== false,
    evidenceIds: asArray(relationship?.evidenceIds).map(String)
  };
}

function normalizeCurriculumSuggestion(suggestion, candidate = {}, defaults = {}) {
  const knowledgeId = suggestion?.knowledgeId || candidate.proposedKnowledgeId || candidate.id || "";
  return {
    knowledgeId,
    curriculumId: String(suggestion?.curriculumId || defaults.certificationId || "a-plus-220-1202"),
    sectionId: String(suggestion?.sectionId || "").trim(),
    moduleId: String(suggestion?.moduleId || "").trim(),
    proposedModuleTitle: suggestion?.proposedModuleTitle || "",
    reason: suggestion?.reason || "AI-suggested curriculum placement.",
    basis: normalizeBasis(suggestion?.basis, "ai-enriched"),
    confidence: normalizeConfidence(suggestion?.confidence ?? candidate.confidence ?? 0.7),
    requiresReview: suggestion?.requiresReview !== false,
    evidenceIds: asArray(suggestion?.evidenceIds).map(String)
  };
}

function normalizeSourceQuality(candidate, normalized) {
  const sourceQuality = candidate.sourceQuality || {};
  const transcriptSupport = ["strong", "medium", "weak"].includes(sourceQuality.transcriptSupport)
    ? sourceQuality.transcriptSupport
    : normalized.transcriptEvidence.length > 1 ? "medium" : "weak";
  const enrichedItems = [
    ...normalized.factsDraft,
    ...normalized.examplesDraft,
    ...normalized.examTipsDraft,
    ...normalized.commonMistakesDraft,
    ...normalized.scenariosDraft,
    ...normalized.pbqIdeasDraft,
    ...normalized.suggestedRelationships,
    ...normalized.curriculumSuggestions
  ].filter(item => item.basis === "ai-enriched");
  const richnessLevel = calculateRichnessLevel(normalized);

  return {
    transcriptSupport,
    aiEnrichmentUsed: enrichedItems.length > 0,
    enrichmentReason: sourceQuality.enrichmentReason || (enrichedItems.length ? "Source text triggered the topic, and AI expanded it into learner-ready content." : "No enrichment reason provided."),
    minimumKnowledgeThresholdMet: hasMinimumKnowledge(normalized),
    richnessLevel
  };
}

function hasMinimumKnowledge(candidate) {
  let score = 0;
  if (candidate.summaryDraft && candidate.summaryDraft.length >= 80) score += 1;
  if (candidate.explanationDraft && candidate.explanationDraft.length >= 160) score += 1;
  if (candidate.factsDraft.length >= 2) score += 1;
  if (candidate.examplesDraft.length) score += 1;
  if (candidate.examTipsDraft.length) score += 1;
  if (candidate.commonMistakesDraft.length) score += 1;
  if (candidate.scenariosDraft.length || candidate.pbqIdeasDraft.length) score += 1;
  if (candidate.suggestedRelationships.length) score += 1;
  if (candidate.curriculumSuggestions.length) score += 1;
  return score >= 2;
}

function calculateRichnessLevel(candidate) {
  if (!candidate.factsDraft.length) return "incomplete";
  if (candidate.factsDraft.length >= 6 && candidate.explanationDraft.length >= 260 && candidate.suggestedRelationships.length >= 2 && candidate.curriculumSuggestions.length >= 1) {
    if (candidate.examTipsDraft.length || candidate.commonMistakesDraft.length || candidate.examplesDraft.length || candidate.scenariosDraft.length || candidate.pbqIdeasDraft.length) {
      return "rich";
    }
  }
  if (candidate.factsDraft.length >= 4 && candidate.explanationDraft.length >= 160 && candidate.curriculumSuggestions.length >= 1) return "acceptable";
  return "thin";
}

function normalizeCandidate(candidate, index, globalRelationships = [], globalCurriculumSuggestions = [], defaults = {}) {
  const domains = Array.isArray(candidate.domains) && candidate.domains.length ? candidate.domains.map(String) : ["general"];
  const confidence = normalizeConfidence(candidate.confidence);
  const proposedKnowledgeId = normalizeId(candidate.proposedKnowledgeId || candidate.id, candidate.title, domains);
  const ownRelationships = Array.isArray(candidate.suggestedRelationships) ? candidate.suggestedRelationships : [];
  const matchingGlobalRelationships = globalRelationships
    .filter(item => item.source === proposedKnowledgeId)
    .map(item => ({ id: item.target, type: item.type, reason: item.reason, evidence: item.evidence, basis: item.basis, requiresReview: item.requiresReview, evidenceIds: item.evidenceIds }));
  const ownCurriculumSuggestions = asArray(candidate.curriculumSuggestions);
  const matchingGlobalCurriculumSuggestions = globalCurriculumSuggestions.filter(item => item.knowledgeId === proposedKnowledgeId);

  const transcriptEvidence = asArray(candidate.transcriptEvidence || candidate.evidence).map(normalizeEvidence).filter(item => item.text);
  const classification = candidate.classification || candidate.importClassification || "teachable";
  const enrichment = candidate.enrichment || {};

  const normalized = {
    candidateId: candidate.candidateId || `AI-CAND-${String(index + 1).padStart(3, "0")}`,
    title: String(candidate.title || proposedKnowledgeId).trim(),
    slug: slugify(candidate.slug || candidate.title || proposedKnowledgeId.split(".").at(-1)),
    proposedKnowledgeId,
    type: candidate.type || "concept",
    category: domains[0],
    domains,
    aliases: Array.isArray(candidate.aliases) ? candidate.aliases : [],
    classification,
    confidence,
    difficulty: candidate.difficulty || "foundational",
    importance: candidate.importance || "medium",
    summaryDraft: String(candidate.summaryDraft || candidate.summary || enrichment.summary || "").trim(),
    explanationDraft: String(candidate.explanationDraft || candidate.explanation || enrichment.explanation || candidate.summaryDraft || "").trim(),
    transcriptEvidence,
    evidence: transcriptEvidence,
    factsDraft: asArray(candidate.factsDraft || candidate.facts || enrichment.facts).map(fact => normalizeDraftItem(fact, { confidence, domains })).filter(fact => fact.text),
    examplesDraft: asArray(candidate.examplesDraft || candidate.examples || enrichment.examples).map(item => normalizeDraftItem(item, { confidence, domains })).filter(item => item.text),
    examTipsDraft: asArray(candidate.examTipsDraft || enrichment.examTips).map(item => normalizeDraftItem(item, { confidence, domains }, { importance: "exam-critical" })).filter(item => item.text),
    commonMistakesDraft: asArray(candidate.commonMistakesDraft || enrichment.commonMistakes).map(item => normalizeDraftItem(item, { confidence, domains })).filter(item => item.text),
    scenariosDraft: asArray(candidate.scenariosDraft || enrichment.scenarios).map(item => normalizeDraftItem(item, { confidence, domains })).filter(item => item.text),
    pbqIdeasDraft: asArray(candidate.pbqIdeasDraft || enrichment.pbqIdeas).map(item => normalizeDraftItem(item, { confidence, domains })).filter(item => item.text),
    possibleDuplicates: [],
    suggestedRelationships: [...ownRelationships, ...matchingGlobalRelationships]
      .map(normalizeRelationship)
      .filter(item => item.id && item.id !== proposedKnowledgeId),
    curriculumSuggestions: [...ownCurriculumSuggestions, ...matchingGlobalCurriculumSuggestions]
      .map(item => normalizeCurriculumSuggestion(item, { ...candidate, proposedKnowledgeId, confidence }, defaults))
      .filter(item => item.sectionId || item.moduleId || item.proposedModuleTitle),
    reviewDecision: candidate.reviewDecision || "undecided",
    reviewNotes: candidate.reviewNotes || ""
  };

  if (!normalized.summaryDraft) {
    normalized.summaryDraft = `${normalized.title} was identified by AI from the source text and needs human review before becoming a Knowledge Object.`;
  }

  if (!normalized.explanationDraft) normalized.explanationDraft = normalized.summaryDraft;
  normalized.sourceQuality = normalizeSourceQuality(candidate, normalized);

  return normalized;
}

function qualityBand(score) {
  if (score >= 85) return "high";
  if (score >= 60) return "needs-edit";
  return "low";
}

function auditAiCandidate(candidate) {
  const flags = [];
  const textVolume = `${candidate.summaryDraft} ${candidate.explanationDraft}`.trim().length;
  const enrichedFacts = candidate.factsDraft.filter(fact => fact.basis === "ai-enriched").length;
  const richFields = [
    candidate.examplesDraft.length,
    candidate.examTipsDraft.length,
    candidate.commonMistakesDraft.length,
    candidate.scenariosDraft.length,
    candidate.pbqIdeasDraft.length,
    candidate.suggestedRelationships.length,
    candidate.curriculumSuggestions.length
  ].filter(Boolean).length;

  if (!candidate.transcriptEvidence.length) flags.push({ code: "missing-source-trigger", message: "AI candidate has no source evidence showing why the topic was triggered." });
  if (!candidate.factsDraft.length) flags.push({ code: "missing-facts", message: "AI candidate has no fact drafts." });
  if (candidate.factsDraft.length > 0 && candidate.factsDraft.length < 4) flags.push({ code: "too-few-facts", message: "Rich candidates should usually include at least 4 atomic facts." });
  if (candidate.factsDraft.length >= 4 && candidate.factsDraft.length < 6 && candidate.importance !== "low") flags.push({ code: "could-use-more-facts", message: "Important concepts should usually include 6+ atomic facts." });
  if (candidate.confidence < 0.7) flags.push({ code: "low-confidence", message: "AI confidence is below 0.70." });
  if (!candidate.proposedKnowledgeId.includes(".")) flags.push({ code: "unstable-id", message: "Knowledge ID does not look domain-scoped." });
  if (!candidate.sourceQuality.aiEnrichmentUsed && candidate.sourceQuality.transcriptSupport === "weak") flags.push({ code: "weak-source-only", message: "Weak source mention was not enriched into useful learning content." });
  if (!candidate.sourceQuality.minimumKnowledgeThresholdMet) flags.push({ code: "minimum-knowledge-threshold", message: "Candidate does not meet the minimum threshold for useful learner knowledge." });
  if (textVolume < 260 && enrichedFacts < 4) flags.push({ code: "thin-learning-content", message: "Candidate may be repeating the source instead of teaching the concept deeply." });
  if (richFields < 3) flags.push({ code: "missing-rich-review-fields", message: "Candidate is missing supporting review fields such as relationships, curriculum placement, exam tips, examples, mistakes, scenarios, or PBQ ideas." });
  if (["teachable", "merge-existing", "needs-enrichment"].includes(candidate.classification) && !candidate.curriculumSuggestions.length) flags.push({ code: "missing-curriculum-suggestion", message: "Teachable candidates should propose at least one curriculum placement." });

  let score = Math.round(candidate.confidence * 100);
  score -= flags.length * 10;
  score += Math.min(10, candidate.transcriptEvidence.length * 2);
  score += Math.min(20, candidate.factsDraft.length * 3);
  score += Math.min(15, richFields * 3);
  score += candidate.sourceQuality.aiEnrichmentUsed ? 8 : 0;
  score += candidate.sourceQuality.minimumKnowledgeThresholdMet ? 8 : 0;
  score += candidate.curriculumSuggestions.length ? 6 : 0;

  if (!candidate.factsDraft.length) score = Math.min(score, 45);
  if (candidate.factsDraft.length > 0 && candidate.factsDraft.length < 4) score = Math.min(score, 65);
  if (candidate.sourceQuality.richnessLevel === "thin") score = Math.min(score, 70);
  if (candidate.sourceQuality.richnessLevel === "incomplete") score = Math.min(score, 50);
  if (!candidate.curriculumSuggestions.length && ["teachable", "merge-existing", "needs-enrichment"].includes(candidate.classification)) score = Math.min(score, 75);
  if (richFields < 3) score = Math.min(score, 78);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    band: qualityBand(score),
    flags
  };
}

if (!inputFile) fail("Usage: node tools/ai/normalize-ai-import.mjs --file=data/ai-imports/responses/<response>.json");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`AI import response not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const concepts = data.concepts || data.candidates || data.objects || [];
const globalRelationships = Array.isArray(data.relationships) ? data.relationships : [];
const globalCurriculumSuggestions = Array.isArray(data.curriculumSuggestions) ? data.curriculumSuggestions : [];
const lessonId = String(data.lessonId || args.lesson || "00").padStart(2, "0");
const certificationId = data.certificationId || args.cert || args.certification || "a-plus-220-1202";
const lessonTitle = data.lessonTitle || args.title || `Lesson ${lessonId}`;

const candidates = concepts.map((candidate, index) => normalizeCandidate(candidate, index, globalRelationships, globalCurriculumSuggestions, { certificationId }));
for (const candidate of candidates) candidate.quality = auditAiCandidate(candidate);

const output = {
  id: `AI-IMPORT-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  importSource: "ai-transcript-triggered-enrichment",
  schemaVersion: "pending-candidates.v4",
  sourceSchemaVersion: data.schemaVersion || "unknown",
  certificationId,
  lessonId,
  lessonTitle,
  sourceTranscript: data.sourceTranscript || "",
  transcriptInputMode: data.transcriptInputMode || "unknown",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "pending-review",
  createdAt: new Date().toISOString(),
  metrics: {
    transcriptParagraphs: data.metrics?.transcriptParagraphs || null,
    transcriptSentences: data.metrics?.transcriptSentences || null,
    candidates: candidates.length,
    richCandidates: candidates.filter(candidate => candidate.sourceQuality.richnessLevel === "rich").length,
    acceptableCandidates: candidates.filter(candidate => candidate.sourceQuality.richnessLevel === "acceptable").length,
    thinCandidates: candidates.filter(candidate => candidate.sourceQuality.richnessLevel === "thin").length,
    incompleteCandidates: candidates.filter(candidate => candidate.sourceQuality.richnessLevel === "incomplete").length,
    highConfidenceCandidates: candidates.filter(candidate => candidate.confidence >= 0.85).length,
    candidatesWithFactDrafts: candidates.filter(candidate => candidate.factsDraft.length).length,
    enrichedCandidates: candidates.filter(candidate => candidate.sourceQuality.aiEnrichmentUsed).length,
    transcriptOnlyCandidates: candidates.filter(candidate => !candidate.sourceQuality.aiEnrichmentUsed).length,
    relationshipsSuggested: candidates.reduce((sum, candidate) => sum + candidate.suggestedRelationships.length, 0),
    curriculumSuggestions: candidates.reduce((sum, candidate) => sum + candidate.curriculumSuggestions.length, 0),
    candidatesWithCurriculumSuggestions: candidates.filter(candidate => candidate.curriculumSuggestions.length).length,
    rejectedConcepts: (data.rejectedConcepts || []).length,
    quality: candidates.reduce((summary, candidate) => {
      summary.total += 1;
      summary[candidate.quality.band] = (summary[candidate.quality.band] || 0) + 1;
      return summary;
    }, { total: 0, high: 0, "needs-edit": 0, low: 0, unknown: 0 })
  },
  notes: [
    "Candidates were generated by transcript-triggered AI enrichment, not transcript-only extraction.",
    "Source evidence shows why the topic was triggered; enriched facts still require human review before canonical promotion.",
    "Quality scoring penalizes starter imports, missing facts, thin explanations, missing curriculum placement, and missing rich review fields.",
    ...(data.importNotes || [])
  ],
  rejectedConcepts: data.rejectedConcepts || [],
  candidates
};

const outDir = path.resolve(root, "data", "imports", "pending");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-ai-candidates.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  candidates: candidates.length,
  richCandidates: output.metrics.richCandidates,
  acceptableCandidates: output.metrics.acceptableCandidates,
  thinCandidates: output.metrics.thinCandidates,
  incompleteCandidates: output.metrics.incompleteCandidates,
  relationshipsSuggested: output.metrics.relationshipsSuggested,
  curriculumSuggestions: output.metrics.curriculumSuggestions,
  candidatesWithCurriculumSuggestions: output.metrics.candidatesWithCurriculumSuggestions,
  rejectedConcepts: output.metrics.rejectedConcepts,
  transcriptInputMode: output.transcriptInputMode,
  next: [
    "Run npm run review:manifest to show this AI import in the Import tab.",
    "Review enriched AI candidates and curriculum suggestions before approving or merging."
  ]
}, null, 2));
