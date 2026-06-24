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

function updateVisibleCandidateCount(card) {
  const reviewPanel = card.closest(".import-preview-card");
  const countTarget = reviewPanel?.querySelector("[data-visible-candidate-count]");
  if (!countTarget) return;

  const visibleCards = reviewPanel.querySelectorAll("[data-review-candidate]:not([hidden])").length;
  countTarget.textContent = String(visibleCards.toLocaleString());
}

function hideReviewedCard(card) {
  card.classList.add("candidate-review-item--closing");
  window.setTimeout(() => {
    card.hidden = true;
    updateVisibleCandidateCount(card);
  }, 180);
}

function setCardStatus(card, record, message = "") {
  const decision = record?.decision || "undecided";
  const status = card.querySelector("[data-review-status]");
  if (status) {
    status.textContent = decision;
    status.dataset.reviewStatus = decision;
  }

  card.dataset.reviewDecision = decision;

  let feedback = card.querySelector("[data-review-feedback]");
  if (!feedback) {
    feedback = document.createElement("p");
    feedback.className = "review-feedback";
    feedback.dataset.reviewFeedback = "";
    const actions = card.querySelector(".candidate-review-actions");
    actions?.insertAdjacentElement("beforebegin", feedback);
  }

  feedback.textContent = message || `Saved as ${decision}.`;
  feedback.hidden = false;
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
    exportButton.textContent = `Exported ${objects.length} approved object(s)`;
    window.setTimeout(() => {
      exportButton.textContent = "Export approved JSON";
    }, 2200);
    return;
  }

  const actionButton = event.target.closest("button[data-review-action]");
  if (!actionButton) return;

  const card = actionButton.closest("[data-review-candidate]");
  if (!card) return;

  const key = card.dataset.reviewCandidate;
  const cached = candidateCache()[key];
  if (!cached) {
    setCardStatus(card, { decision: "error" }, "Could not find this candidate in the review cache. Reopen the lesson preview and try again.");
    return;
  }

  const action = actionButton.dataset.reviewAction;

  if (action === "reset") {
    resetCandidateReview(key);
    setCardStatus(card, { decision: "undecided" }, "Review decision reset.");
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

  const messages = {
    approved: "Approved locally. This candidate will be included when you export approved JSON.",
    rejected: "Rejected locally. This candidate will not be exported as a Knowledge Object.",
    merge: "Marked for merge locally. Use the merge target field to point at the existing Knowledge Object.",
    edited: "Edits saved locally in this browser."
  };

  setCardStatus(card, record, messages[decision]);

  if (decision === "approved" || decision === "rejected") {
    hideReviewedCard(card);
  }
});
