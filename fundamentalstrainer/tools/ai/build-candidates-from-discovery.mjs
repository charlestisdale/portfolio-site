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
  return Array.isArray(value) ? value : value ? [value] : [];
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function importanceForEvidence(type) {
  if (type === "definition" || type === "requirement") return "high";
  if (type === "warning" || type === "comparison") return "medium";
  return "medium";
}

function factFromEvidence(evidence) {
  return {
    text: evidence.quote,
    importance: importanceForEvidence(evidence.type),
    tags: [evidence.type].filter(Boolean)
  };
}

function buildEvidenceMap(discovery) {
  return new Map((discovery.evidence || []).map(item => [item.evidenceId, item]));
}

function buildConceptMap(discovery) {
  return new Map((discovery.concepts || []).map(item => [item.discoveryId, item]));
}

function relationshipsForConcept(discovery, concept, conceptMap) {
  return asArray(discovery.relationships)
    .filter(item => item.sourceDiscoveryId === concept.discoveryId)
    .map(item => {
      const target = conceptMap.get(item.targetDiscoveryId);
      return {
        id: target?.proposedKnowledgeId || item.targetDiscoveryId,
        type: item.type || "related_to",
        reason: item.reason || "Relationship identified during discovery.",
        evidence: item.evidenceIds?.join(", ") || ""
      };
    })
    .filter(item => item.id && item.id !== concept.proposedKnowledgeId);
}

function definitionsForConcept(discovery, concept) {
  return asArray(discovery.definitions)
    .filter(item => item.conceptDiscoveryId === concept.discoveryId || item.discoveryId === concept.discoveryId)
    .map(item => item.text)
    .filter(Boolean);
}

function examplesForConcept(discovery, concept) {
  return asArray(discovery.examples)
    .filter(item => item.conceptDiscoveryId === concept.discoveryId || item.discoveryId === concept.discoveryId)
    .map(item => ({
      text: item.text || item.example || "",
      context: item.context || "Transcript-supported example.",
      tags: concept.domains || []
    }))
    .filter(item => item.text);
}

function candidateQuality(candidate) {
  const flags = [];
  if (!candidate.evidence.length) flags.push({ code: "missing-evidence", message: "Candidate has no discovery evidence." });
  if (!candidate.factsDraft.length) flags.push({ code: "missing-facts", message: "Candidate has no fact drafts." });
  if (candidate.confidence < 0.7) flags.push({ code: "low-confidence", message: "Discovery confidence is below 0.70." });

  let score = Math.round(candidate.confidence * 100);
  score += Math.min(10, candidate.evidence.length * 2);
  score += Math.min(8, candidate.factsDraft.length * 2);
  score -= flags.length * 12;
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    band: score >= 80 ? "high" : score >= 55 ? "needs-edit" : "low",
    flags
  };
}

function candidateFromConcept(discovery, concept, index, evidenceMap, conceptMap) {
  const linkedEvidence = asArray(concept.evidenceIds)
    .map(id => evidenceMap.get(id))
    .filter(Boolean);
  const definitionFacts = definitionsForConcept(discovery, concept).map(text => ({
    text,
    importance: "high",
    tags: concept.domains || []
  }));
  const evidenceFacts = linkedEvidence.map(factFromEvidence).filter(item => item.text);
  const factsDraft = [...definitionFacts, ...evidenceFacts]
    .filter((fact, factIndex, facts) => facts.findIndex(other => other.text === fact.text) === factIndex)
    .slice(0, 8);
  const summary = definitionFacts[0]?.text || linkedEvidence[0]?.quote || `${concept.name} was discovered from the lesson transcript and needs review.`;

  const candidate = {
    candidateId: `DISC-CAND-${String(index + 1).padStart(3, "0")}`,
    title: concept.name,
    slug: slugify(concept.name),
    proposedKnowledgeId: concept.proposedKnowledgeId,
    type: concept.type || "concept",
    category: concept.domains?.[0] || "general",
    domains: concept.domains || ["general"],
    aliases: concept.aliases || [],
    confidence: concept.confidence ?? 0.7,
    summaryDraft: summary,
    explanationDraft: summary,
    factsDraft,
    examplesDraft: examplesForConcept(discovery, concept),
    examTipsDraft: [],
    commonMistakesDraft: [],
    scenariosDraft: [],
    pbqIdeasDraft: [],
    evidence: linkedEvidence.map(item => ({
      evidenceId: item.evidenceId,
      quote: item.quote,
      text: item.quote,
      evidenceType: item.type,
      reason: item.notes || "Discovery evidence linked to this concept."
    })),
    possibleDuplicates: [],
    suggestedRelationships: relationshipsForConcept(discovery, concept, conceptMap),
    reviewDecision: "undecided",
    reviewNotes: concept.notes || "Built from reviewed Discovery Package."
  };

  candidate.quality = candidateQuality(candidate);
  return candidate;
}

if (!inputFile) fail("Usage: node tools/ai/build-candidates-from-discovery.mjs --file=data/ai-discovery/packages/<package>.json");
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Discovery Package not found: ${inputFile}`);

const discovery = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const lessonId = String(discovery.lessonId || args.lesson || "00").padStart(2, "0");
const certificationId = discovery.certificationId || args.cert || args.certification || "a-plus-220-1202";
const evidenceMap = buildEvidenceMap(discovery);
const conceptMap = buildConceptMap(discovery);
const candidates = asArray(discovery.concepts).map((concept, index) => candidateFromConcept(discovery, concept, index, evidenceMap, conceptMap));

const output = {
  id: `DISCOVERY-CANDIDATES-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  importSource: "discovery-package-builder",
  schemaVersion: "pending-candidates.v1",
  sourceDiscoveryPackage: toProjectPath(sourcePath, root),
  certificationId,
  lessonId,
  lessonTitle: discovery.lessonTitle || `Lesson ${lessonId}`,
  sourceTranscript: discovery.sourceTranscript || "",
  status: "pending-review",
  createdAt: new Date().toISOString(),
  metrics: {
    candidates: candidates.length,
    highConfidenceCandidates: candidates.filter(candidate => candidate.confidence >= 0.85).length,
    candidatesWithFactDrafts: candidates.filter(candidate => candidate.factsDraft.length).length,
    relationshipsSuggested: candidates.reduce((sum, candidate) => sum + candidate.suggestedRelationships.length, 0),
    sourceEvidenceRecords: discovery.evidence?.length || 0,
    sourceRelationships: discovery.relationships?.length || 0,
    sourceWarnings: discovery.audit?.warnings?.length || 0
  },
  notes: [
    "Candidates were built from a Discovery Package, not directly from a transcript.",
    "Discovery captures evidence and relationships. Review still controls promotion to canonical Knowledge Objects."
  ],
  candidates
};

const outDir = path.resolve(root, "data", "imports", "pending");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-discovery-candidates.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  candidates: candidates.length,
  highConfidenceCandidates: output.metrics.highConfidenceCandidates,
  relationshipsSuggested: output.metrics.relationshipsSuggested,
  next: [
    "Run npm run review:manifest to show these candidates in the Import tab.",
    "Review before approving or merging into canonical Knowledge Objects."
  ]
}, null, 2));
