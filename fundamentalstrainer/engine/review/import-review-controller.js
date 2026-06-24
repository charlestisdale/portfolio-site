import {
  collectCandidateEdits,
  exportApprovedObjects,
  recordCandidateReview,
  resetCandidateReview
} from "./candidate-review-store.js";

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function setCardStatus(card, record) {
  const status = card.querySelector("[data-review-status]");
  if (!status) return;
  if (!record) {
    status.textContent = "undecided";
    status.dataset.reviewStatus = "undecided";
    return;
  }

  status.textContent = record.decision;
  status.dataset.reviewStatus = record.decision;
}

function candidateCache() {
  return window.__importReviewCandidateCache || {};
}

document.addEventListener("click", event => {
  const exportButton = event.target.closest("button[data-review-export]");
  if (exportButton) {
    const objects = exportApprovedObjects();
    downloadJson("approved-knowledge-objects.json", {
      generatedBy: "browser-import-review-ui",
      generatedAt: new Date().toISOString(),
      objects
    });
    return;
  }

  const actionButton = event.target.closest("button[data-review-action]");
  if (!actionButton) return;

  const card = actionButton.closest("[data-review-candidate]");
  if (!card) return;

  const key = card.dataset.reviewCandidate;
  const cached = candidateCache()[key];
  if (!cached) {
    setCardStatus(card, { decision: "missing candidate cache" });
    return;
  }

  const action = actionButton.dataset.reviewAction;

  if (action === "reset") {
    resetCandidateReview(key);
    setCardStatus(card, null);
    return;
  }

  const edits = collectCandidateEdits(card);
  const decision = action === "approve" ? "approved" : action === "reject" ? "rejected" : action === "merge" ? "merge" : "edited";
  const record = recordCandidateReview({
    key,
    decision,
    candidate: cached.candidate,
    preview: cached.preview,
    edits
  });

  setCardStatus(card, record);
});
