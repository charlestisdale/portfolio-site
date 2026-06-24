#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizeCandidateDraft } from "./normalizers/candidate-draft-normalizer.mjs";
import { auditCandidateQuality, summarizeCandidateQuality } from "./normalizers/candidate-quality-auditor.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const inputFile = args.file;

if (!inputFile) {
  console.error("Usage: node tools/ingestion/normalize-candidate-drafts.mjs --file=data/imports/pending/01-candidates.json");
  process.exit(1);
}

const root = process.cwd();
const filePath = path.resolve(root, inputFile);

if (!fs.existsSync(filePath)) {
  console.error(`Candidate file not found: ${inputFile}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const candidates = data.candidates || [];
let normalized = 0;
let factsBefore = 0;
let factsAfter = 0;

const updatedCandidates = candidates.map(candidate => {
  const originalFacts = (candidate.factsDraft || [])
    .map(fact => typeof fact === "string" ? fact : fact.text)
    .filter(Boolean);
  factsBefore += originalFacts.length;

  const draft = normalizeCandidateDraft({
    item: {
      title: candidate.title,
      proposedKnowledgeId: candidate.proposedKnowledgeId,
      type: candidate.type,
      domains: candidate.domains || [],
      confidence: candidate.confidence || 0,
      evidence: candidate.evidence || []
    },
    factTexts: originalFacts,
    relationships: candidate.suggestedRelationships || []
  });

  factsAfter += draft.factsDraft.length;
  normalized += 1;

  const updatedCandidate = {
    ...candidate,
    summaryDraft: draft.summaryDraft,
    explanationDraft: draft.explanationDraft,
    factsDraft: draft.factsDraft,
    suggestedRelationships: draft.suggestedRelationships
  };

  return {
    ...updatedCandidate,
    quality: auditCandidateQuality(updatedCandidate)
  };
});

const qualitySummary = summarizeCandidateQuality(updatedCandidates);
const output = {
  ...data,
  candidates: updatedCandidates,
  metrics: {
    ...(data.metrics || {}),
    candidatesWithFactDrafts: updatedCandidates.filter(candidate => candidate.factsDraft?.length).length,
    relationshipsSuggested: updatedCandidates.reduce((sum, candidate) => sum + (candidate.suggestedRelationships?.length || 0), 0),
    quality: qualitySummary
  },
  normalization: {
    normalizedAt: new Date().toISOString(),
    normalizedCandidates: normalized,
    factsBefore,
    factsAfter,
    quality: qualitySummary
  }
};

fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ file: inputFile, normalized, factsBefore, factsAfter, quality: qualitySummary }, null, 2));
