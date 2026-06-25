const STORAGE_PREFIX = "fundamentals-trainer.review-state.";

export function setDecision(candidateSet, candidateId, decision, notes = "") {
  const candidate = candidateSet.candidates.find(item => item.candidateId === candidateId);
  if (!candidate) return;
  candidate.reviewDecision = normalizeDecision(decision);
  candidate.reviewNotes = notes;
  persistReviewState(candidateSet);
}

export function setMergeTarget(candidateSet, candidateId, mergeTarget = "") {
  const candidate = candidateSet.candidates.find(item => item.candidateId === candidateId);
  if (!candidate) return;
  candidate.mergeTarget = sanitizeMergeTarget(mergeTarget, candidate);
  persistReviewState(candidateSet);
}

export function setReviewNotes(candidateSet, candidateId, notes = "") {
  const candidate = candidateSet.candidates.find(item => item.candidateId === candidateId);
  if (!candidate) return;
  candidate.reviewNotes = notes;
  persistReviewState(candidateSet);
}

export function applyStoredReviewState(candidateSet) {
  const saved = readReviewState(candidateSet);
  if (!saved?.candidates) return candidateSet;

  for (const candidate of candidateSet.candidates) {
    const savedCandidate = saved.candidates[candidate.candidateId];
    if (!savedCandidate) continue;
    candidate.reviewDecision = normalizeDecision(savedCandidate.reviewDecision || candidate.reviewDecision);
    candidate.reviewNotes = savedCandidate.reviewNotes ?? candidate.reviewNotes ?? "";
    candidate.mergeTarget = sanitizeMergeTarget(savedCandidate.mergeTarget ?? candidate.mergeTarget ?? "", candidate);
  }

  return candidateSet;
}

export function persistReviewState(candidateSet) {
  if (!candidateSet?.id) return;

  const state = {
    id: candidateSet.id,
    savedAt: new Date().toISOString(),
    candidates: Object.fromEntries(candidateSet.candidates.map(candidate => [
      candidate.candidateId,
      {
        reviewDecision: normalizeDecision(candidate.reviewDecision),
        reviewNotes: candidate.reviewNotes || "",
        mergeTarget: sanitizeMergeTarget(candidate.mergeTarget || "", candidate)
      }
    ]))
  };

  localStorage.setItem(storageKey(candidateSet), JSON.stringify(state));
}

export function clearStoredReviewState(candidateSet) {
  if (!candidateSet?.id) return;
  localStorage.removeItem(storageKey(candidateSet));
}

export function summarizeDecisions(candidateSet) {
  const counts = {
    total: candidateSet.candidates.length,
    undecided: 0,
    "create-new": 0,
    "merge-existing": 0,
    ignore: 0
  };

  candidateSet.candidates.forEach(candidate => {
    const key = normalizeDecision(candidate.reviewDecision || "undecided");
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

export function buildReviewBackup(candidateSet) {
  return {
    ...candidateSet,
    backupOnly: true,
    backupReason: "Static review UI cannot write to disk. Canonical review state should be saved in-place to the original pending candidate file by the local review command or a future admin backend.",
    backedUpAt: new Date().toISOString()
  };
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function readReviewState(candidateSet) {
  try {
    const raw = localStorage.getItem(storageKey(candidateSet));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storageKey(candidateSet) {
  return `${STORAGE_PREFIX}${candidateSet.id}`;
}

function normalizeDecision(value) {
  const normalized = String(value || "undecided").trim().toLowerCase();
  if (["reject", "rejected", "ignored"].includes(normalized)) return "ignore";
  if (["approve", "approved", "create", "create-new"].includes(normalized)) return "create-new";
  if (["merge", "merge-existing"].includes(normalized)) return "merge-existing";
  if (["undecided", "ignore"].includes(normalized)) return normalized;
  return "undecided";
}

function sanitizeMergeTarget(value, candidate) {
  const target = String(value || "").trim();
  if (!target) return "";
  if (target === candidate.proposedKnowledgeId) return "";
  if (target === "windows.task-manager" && candidate.proposedKnowledgeId !== "windows.task-manager") return "";
  return target;
}
