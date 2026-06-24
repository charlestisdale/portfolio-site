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

function normalizeFact(fact, candidate) {
  if (typeof fact === "string") {
    return {
      text: fact,
      importance: candidate.confidence >= 0.85 ? "high" : "medium",
      tags: candidate.domains || []
    };
  }

  return {
    text: String(fact?.text || "").trim(),
    importance: fact?.importance || (candidate.confidence >= 0.85 ? "high" : "medium"),
    tags: Array.isArray(fact?.tags) ? fact.tags : candidate.domains || []
  };
}

function normalizeEvidence(evidence, index) {
  if (typeof evidence === "string") {
    return {
      evidenceId: `AI-EVID-${String(index + 1).padStart(3, "0")}`,
      text: evidence,
      quote: evidence,
      reason: "AI-selected transcript evidence.",
      evidenceType: "mention"
    };
  }

  const quote = String(evidence?.quote || evidence?.text || evidence?.excerpt || "").trim();
  return {
    evidenceId: evidence?.evidenceId || `AI-EVID-${String(index + 1).padStart(3, "0")}`,
    text: quote,
    quote,
    reason: evidence?.reason || "AI-selected transcript evidence.",
    evidenceType: evidence?.evidenceType || "mention"
  };
}

function normalizeRelationship(relationship) {
  return {
    id: relationship?.id || relationship?.target || relationship?.targetId || "",
    type: relationship?.type || "related_to",
    reason: relationship?.reason || relationship?.evidence || "AI-suggested relationship.",
    evidence: relationship?.evidence || relationship?.reason || ""
  };
}

function normalizeCandidate(candidate, index, globalRelationships = []) {
  const domains = Array.isArray(candidate.domains) && candidate.domains.length ? candidate.domains.map(String) : ["general"];
  const confidence = normalizeConfidence(candidate.confidence);
  const proposedKnowledgeId = normalizeId(candidate.proposedKnowledgeId || candidate.id, candidate.title, domains);
  const ownRelationships = Array.isArray(candidate.suggestedRelationships) ? candidate.suggestedRelationships : [];
  const matchingGlobalRelationships = globalRelationships
    .filter(item => item.source === proposedKnowledgeId)
    .map(item => ({ id: item.target, type: item.type, reason: item.reason, evidence: item.evidence }));

  const normalized = {
    candidateId: candidate.candidateId || `AI-CAND-${String(index + 1).padStart(3, "0")}`,
    title: String(candidate.title || proposedKnowledgeId).trim(),
    slug: slugify(candidate.slug || candidate.title || proposedKnowledgeId.split(".").at(-1)),
    proposedKnowledgeId,
    type: candidate.type || "concept",
    category: domains[0],
    domains,
    aliases: Array.isArray(candidate.aliases) ? candidate.aliases : [],
    confidence,
    summaryDraft: String(candidate.summaryDraft || candidate.summary || "").trim(),
    explanationDraft: String(candidate.explanationDraft || candidate.explanation || candidate.summaryDraft || "").trim(),
    factsDraft: (candidate.factsDraft || candidate.facts || []).map(fact => normalizeFact(fact, { confidence, domains })).filter(fact => fact.text),
    examplesDraft: Array.isArray(candidate.examplesDraft) ? candidate.examplesDraft : Array.isArray(candidate.examples) ? candidate.examples : [],
    examTipsDraft: Array.isArray(candidate.examTipsDraft) ? candidate.examTipsDraft : [],
    commonMistakesDraft: Array.isArray(candidate.commonMistakesDraft) ? candidate.commonMistakesDraft : [],
    scenariosDraft: Array.isArray(candidate.scenariosDraft) ? candidate.scenariosDraft : [],
    pbqIdeasDraft: Array.isArray(candidate.pbqIdeasDraft) ? candidate.pbqIdeasDraft : [],
    evidence: (candidate.evidence || []).map(normalizeEvidence).filter(item => item.text),
    possibleDuplicates: [],
    suggestedRelationships: [...ownRelationships, ...matchingGlobalRelationships]
      .map(normalizeRelationship)
      .filter(item => item.id && item.id !== proposedKnowledgeId),
    reviewDecision: candidate.reviewDecision || "undecided",
    reviewNotes: candidate.reviewNotes || ""
  };

  if (!normalized.summaryDraft) {
    normalized.summaryDraft = `${normalized.title} was identified by AI from the lesson transcript and needs human review before becoming a Knowledge Object.`;
  }

  if (!normalized.explanationDraft) normalized.explanationDraft = normalized.summaryDraft;

  return normalized;
}

function qualityBand(score) {
  if (score >= 80) return "high";
  if (score >= 55) return "needs-edit";
  return "low";
}

function auditAiCandidate(candidate) {
  const flags = [];
  if (!candidate.evidence.length) flags.push({ code: "missing-evidence", message: "AI candidate has no linked transcript evidence." });
  if (!candidate.factsDraft.length) flags.push({ code: "missing-facts", message: "AI candidate has no fact drafts." });
  if (candidate.confidence < 0.7) flags.push({ code: "low-confidence", message: "AI confidence is below 0.70." });
  if (!candidate.proposedKnowledgeId.includes(".")) flags.push({ code: "unstable-id", message: "Knowledge ID does not look domain-scoped." });

  let score = Math.round(candidate.confidence * 100);
  score -= flags.length * 12;
  score += Math.min(10, candidate.evidence.length * 2);
  score += Math.min(8, candidate.factsDraft.length * 2);
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
const lessonId = String(data.lessonId || args.lesson || "00").padStart(2, "0");
const certificationId = data.certificationId || args.cert || args.certification || "a-plus-220-1202";
const lessonTitle = data.lessonTitle || args.title || `Lesson ${lessonId}`;

const candidates = concepts.map((candidate, index) => normalizeCandidate(candidate, index, globalRelationships));
for (const candidate of candidates) candidate.quality = auditAiCandidate(candidate);

const output = {
  id: `AI-IMPORT-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  importSource: "ai-transcript-import",
  schemaVersion: "pending-candidates.v1",
  sourceSchemaVersion: data.schemaVersion || "unknown",
  certificationId,
  lessonId,
  lessonTitle,
  sourceTranscript: data.sourceTranscript || "",
  sourceAiResponse: toProjectPath(sourcePath, root),
  status: "pending-review",
  createdAt: new Date().toISOString(),
  metrics: {
    transcriptParagraphs: data.metrics?.transcriptParagraphs || null,
    transcriptSentences: data.metrics?.transcriptSentences || null,
    candidates: candidates.length,
    highConfidenceCandidates: candidates.filter(candidate => candidate.confidence >= 0.85).length,
    candidatesWithFactDrafts: candidates.filter(candidate => candidate.factsDraft.length).length,
    relationshipsSuggested: candidates.reduce((sum, candidate) => sum + candidate.suggestedRelationships.length, 0),
    rejectedConcepts: (data.rejectedConcepts || []).length,
    quality: candidates.reduce((summary, candidate) => {
      summary.total += 1;
      summary[candidate.quality.band] = (summary[candidate.quality.band] || 0) + 1;
      return summary;
    }, { total: 0, high: 0, "needs-edit": 0, low: 0, unknown: 0 })
  },
  notes: [
    "Candidates were generated by AI from the transcript rather than from the controlled concept catalog.",
    "Every candidate still requires human review before becoming canonical knowledge.",
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
  highConfidenceCandidates: output.metrics.highConfidenceCandidates,
  relationshipsSuggested: output.metrics.relationshipsSuggested,
  rejectedConcepts: output.metrics.rejectedConcepts,
  next: [
    "Run npm run review:manifest to show this AI import in the Import tab.",
    "Review AI candidates before approving or merging."
  ]
}, null, 2));
