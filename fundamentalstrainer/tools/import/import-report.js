export function buildImportReport({ cleanedTranscript, candidates, existingObjects = [], options = {} }) {
  const likelyDuplicates = candidates.filter(candidate => candidate.duplicateReview?.status === "likely-duplicate");
  const possibleDuplicates = candidates.filter(candidate => candidate.duplicateReview?.status === "possible-duplicate");
  const cleanCandidates = candidates.filter(candidate => candidate.duplicateReview?.status === "no-match" || !candidate.duplicateReview);
  const relationshipSuggestions = candidates.flatMap(candidate => candidate.relationshipReview || []);

  return {
    schemaVersion: "1.0.0",
    reportType: "transcript-import-review",
    generatedAt: new Date().toISOString(),
    source: {
      sourceFile: cleanedTranscript.sourceFile,
      lessonId: cleanedTranscript.lessonId,
      lessonTitle: cleanedTranscript.lessonTitle,
      captionCount: cleanedTranscript.captionCount,
      malformedCaptionCount: cleanedTranscript.malformedCaptionCount,
      segmentCount: cleanedTranscript.segments.length
    },
    options,
    summary: {
      existingKnowledgeObjectsChecked: existingObjects.length,
      candidateCount: candidates.length,
      cleanCandidateCount: cleanCandidates.length,
      possibleDuplicateCount: possibleDuplicates.length,
      likelyDuplicateCount: likelyDuplicates.length,
      relationshipSuggestionCount: relationshipSuggestions.length,
      commandCandidateCount: candidates.filter(candidate => candidate.type === "command").length,
      toolCandidateCount: candidates.filter(candidate => candidate.type === "tool").length,
      conceptCandidateCount: candidates.filter(candidate => candidate.type === "concept").length
    },
    reviewQueues: {
      approveCandidates: cleanCandidates.map(toReviewSummary),
      mergeCandidates: [...likelyDuplicates, ...possibleDuplicates].map(toReviewSummary),
      relationshipSuggestions
    },
    candidates
  };
}

function toReviewSummary(candidate) {
  return {
    candidateId: candidate.candidateId,
    proposedKnowledgeId: candidate.proposedKnowledgeId,
    title: candidate.title,
    type: candidate.type,
    domains: candidate.domains,
    evidenceCount: candidate.evidence.length,
    duplicateStatus: candidate.duplicateReview?.status || "not-checked",
    topDuplicateMatch: candidate.duplicateReview?.matches?.[0] || null,
    relationshipSuggestionCount: candidate.relationshipReview?.length || 0,
    reviewStatus: "needs-review"
  };
}
