export function normalizeCandidateSet(rawSet) {
  if (!rawSet || typeof rawSet !== "object") {
    throw new Error("Invalid candidate set.");
  }

  const candidates = (rawSet.candidates || []).map(normalizeCandidate);

  return {
    ...rawSet,
    id: rawSet.id || buildImportId(rawSet),
    label: rawSet.label || rawSet.source?.lessonTitle || rawSet.source?.sourceFile || rawSet.id || "Import Review",
    status: rawSet.status || "pending-review",
    candidates
  };
}

export function normalizeCandidate(candidate) {
  const duplicateMatches = candidate.duplicateReview?.matches || candidate.possibleDuplicates || [];
  const relationshipSuggestions = candidate.relationshipReview || candidate.suggestedRelationships || [];
  const transcriptEvidence = candidate.evidence || candidate.transcriptEvidence || [];
  const facts = candidate.factsDraft || (candidate.learning?.facts || []).map(fact => fact.text || fact).filter(Boolean);
  const tips = candidate.examTipsDraft || (candidate.assessmentSeeds?.examTips || []).map(tip => tip.text || tip).filter(Boolean);

  return {
    ...candidate,
    candidateId: candidate.candidateId || candidate.proposedKnowledgeId || candidate.id,
    proposedKnowledgeId: candidate.proposedKnowledgeId || candidate.id,
    category: candidate.category || candidate.type || "concept",
    confidence: normalizeConfidence(candidate),
    summaryDraft: candidate.summaryDraft || candidate.learning?.summary || "No summary draft yet.",
    factsDraft: facts,
    examTipsDraft: tips,
    possibleDuplicates: duplicateMatches.map(normalizeDuplicate),
    suggestedRelationships: relationshipSuggestions.map(normalizeRelationship),
    evidence: transcriptEvidence.map(normalizeEvidence),
    reviewDecision: candidate.reviewDecision || "undecided",
    reviewNotes: candidate.reviewNotes || ""
  };
}

function normalizeDuplicate(match) {
  return {
    knowledgeId: match.knowledgeId || match.id || match.targetId,
    title: match.title || match.targetTitle || "Untitled match",
    score: typeof match.score === "number" ? match.score : null,
    reason: (match.reasons || []).join(" ") || match.reason || match.notes || "Potential duplicate detected."
  };
}

function normalizeRelationship(relationship) {
  return {
    type: relationship.type || "related_to",
    target: relationship.target || relationship.targetId || relationship.targetTitle || "unknown-target",
    reason: relationship.reason || relationship.notes || relationship.method || "Suggested relationship needs review.",
    confidence: relationship.confidence || null,
    strength: relationship.strength || null,
    reviewStatus: relationship.reviewStatus || "needs-review"
  };
}

function normalizeEvidence(item, index) {
  return {
    line: item.line || index + 1,
    startTime: item.startTime || null,
    endTime: item.endTime || null,
    text: item.text || item.quote || ""
  };
}

function normalizeConfidence(candidate) {
  if (typeof candidate.confidence === "number") return candidate.confidence;
  const quality = candidate.quality?.confidence;
  if (quality === "high") return 0.85;
  if (quality === "medium") return 0.65;
  if (quality === "low") return 0.35;
  return 0;
}

function buildImportId(set) {
  const lesson = set.source?.lessonId || "unknown";
  const file = set.source?.sourceFile || "import";
  return `${lesson}-${file}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
