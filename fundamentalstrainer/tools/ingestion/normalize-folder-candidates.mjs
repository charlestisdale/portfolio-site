#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizeCandidateDraft } from "./normalizers/candidate-draft-normalizer.mjs";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const root = process.cwd();
const pendingDir = path.resolve(root, args.pending || "data/imports/pending");

function toProjectPath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function originalFactText(fact) {
  return typeof fact === "string" ? fact : fact?.text;
}

function normalizeFile(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const candidates = data.candidates || [];
  let factsBefore = 0;
  let factsAfter = 0;

  const updatedCandidates = candidates.map(candidate => {
    const originalFacts = (candidate.factsDraft || []).map(originalFactText).filter(Boolean);
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
    return {
      ...candidate,
      summaryDraft: draft.summaryDraft,
      explanationDraft: draft.explanationDraft,
      factsDraft: draft.factsDraft,
      suggestedRelationships: draft.suggestedRelationships
    };
  });

  const output = {
    ...data,
    candidates: updatedCandidates,
    metrics: {
      ...(data.metrics || {}),
      candidatesWithFactDrafts: updatedCandidates.filter(candidate => candidate.factsDraft?.length).length,
      relationshipsSuggested: updatedCandidates.reduce((sum, candidate) => sum + (candidate.suggestedRelationships?.length || 0), 0)
    },
    normalization: {
      normalizedAt: new Date().toISOString(),
      normalizedCandidates: updatedCandidates.length,
      factsBefore,
      factsAfter
    }
  };

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
  return output.normalization;
}

if (!fs.existsSync(pendingDir)) {
  console.error(`Pending import folder not found: ${toProjectPath(pendingDir)}`);
  process.exit(1);
}

const files = fs.readdirSync(pendingDir, { withFileTypes: true })
  .filter(entry => entry.isFile())
  .map(entry => entry.name)
  .filter(name => name.endsWith("-candidates.json"))
  .filter(name => name !== "manifest.json")
  .map(name => path.join(pendingDir, name))
  .sort();

const summary = {
  pendingDir: toProjectPath(pendingDir),
  files: files.length,
  normalized: 0,
  failed: 0,
  results: []
};

for (const file of files) {
  try {
    const normalization = normalizeFile(file);
    summary.normalized += 1;
    summary.results.push({ file: toProjectPath(file), ok: true, normalization });
  } catch (error) {
    summary.failed += 1;
    summary.results.push({ file: toProjectPath(file), ok: false, error: error.message });
  }
}

console.log(JSON.stringify(summary, null, 2));
if (summary.failed) process.exit(1);
