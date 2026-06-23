export function setDecision(candidateSet, candidateId, decision, notes = '') {
  const candidate = candidateSet.candidates.find(item => item.candidateId === candidateId);
  if (!candidate) return;
  candidate.reviewDecision = decision;
  candidate.reviewNotes = notes;
}

export function summarizeDecisions(candidateSet) {
  const counts = {
    total: candidateSet.candidates.length,
    undecided: 0,
    'create-new': 0,
    'merge-existing': 0,
    ignore: 0
  };

  candidateSet.candidates.forEach(candidate => {
    const key = candidate.reviewDecision || 'undecided';
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

export function buildApprovedReview(candidateSet) {
  return {
    ...candidateSet,
    status: 'approved',
    reviewedAt: new Date().toISOString(),
    candidates: candidateSet.candidates.filter(candidate => candidate.reviewDecision !== 'undecided')
  };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
