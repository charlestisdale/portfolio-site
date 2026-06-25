import { loadPendingManifest, loadCandidateSet } from "./candidate-loader.js";
import { renderDuplicateList, renderRelationshipList, renderEvidenceList, escapeHtml } from "./duplicate-view.js";
import {
  applyStoredReviewState,
  buildReviewBackup,
  downloadJson,
  setDecision,
  setMergeTarget,
  setReviewNotes,
  summarizeDecisions
} from "./approval-actions.js";

const importSelect = document.querySelector("#importSelect");
const decisionFilter = document.querySelector("#decisionFilter");
const exportBtn = document.querySelector("#exportBtn");
const summary = document.querySelector("#summary");
const candidateList = document.querySelector("#candidateList");

let manifestItems = [];
let activeSet = null;

init().catch(error => {
  candidateList.innerHTML = `<article class="error-card"><h2>Review UI could not load</h2><p>${escapeHtml(error.message)}</p></article>`;
});

async function init() {
  manifestItems = await loadPendingManifest();
  renderImportOptions();

  if (!manifestItems.length) {
    candidateList.innerHTML = '<article class="empty-card"><h2>No pending imports</h2><p>Run the ingestion pipeline to create candidate files in data/imports/pending/.</p></article>';
    return;
  }

  await selectImport(manifestItems[0].path);

  importSelect.addEventListener("change", event => selectImport(event.target.value));
  decisionFilter.addEventListener("change", render);
  exportBtn.addEventListener("click", exportBackup);
}

function renderImportOptions() {
  importSelect.innerHTML = manifestItems.map(item => `
    <option value="${escapeHtml(item.path)}">${escapeHtml(item.label || item.id)}</option>
  `).join("");
}

async function selectImport(path) {
  activeSet = applyStoredReviewState(await loadCandidateSet(path));
  render();
}

function render() {
  if (!activeSet) return;
  renderSummary();
  renderCandidates();
}

function renderSummary() {
  const counts = summarizeDecisions(activeSet);
  const source = activeSet.source || {};

  summary.innerHTML = `
    <article><span>Total</span><strong>${counts.total}</strong></article>
    <article><span>Undecided</span><strong>${counts.undecided}</strong></article>
    <article><span>Create</span><strong>${counts["create-new"]}</strong></article>
    <article><span>Merge</span><strong>${counts["merge-existing"]}</strong></article>
    <article><span>Ignore</span><strong>${counts.ignore}</strong></article>
    ${source.lessonId || source.lessonTitle ? `<article><span>Lesson</span><strong>${escapeHtml(source.lessonId || "")}</strong><small>${escapeHtml(source.lessonTitle || "")}</small></article>` : ""}
  `;
}

function renderCandidates() {
  const filter = decisionFilter.value;
  const candidates = activeSet.candidates.filter(candidate => filter === "all" || candidate.reviewDecision === filter);

  candidateList.innerHTML = candidates.map(candidate => renderCandidate(candidate)).join("") || '<article class="empty-card"><p>No candidates match this filter.</p></article>';

  candidateList.querySelectorAll("[data-decision]").forEach(input => {
    input.addEventListener("change", event => {
      const card = event.target.closest("[data-candidate-id]");
      const notes = card.querySelector("[data-notes]").value;
      const mergeTarget = card.querySelector("[data-merge-target]")?.value || "";
      setMergeTarget(activeSet, card.dataset.candidateId, mergeTarget);
      setDecision(activeSet, card.dataset.candidateId, event.target.value, notes);
      render();
    });
  });

  candidateList.querySelectorAll("[data-notes]").forEach(input => {
    input.addEventListener("input", event => {
      const card = event.target.closest("[data-candidate-id]");
      setReviewNotes(activeSet, card.dataset.candidateId, event.target.value);
    });
  });

  candidateList.querySelectorAll("[data-merge-target]").forEach(input => {
    input.addEventListener("input", event => {
      const card = event.target.closest("[data-candidate-id]");
      setMergeTarget(activeSet, card.dataset.candidateId, event.target.value);
    });
  });
}

function renderDraftItem(item) {
  if (typeof item === "string") return `<li>${escapeHtml(item)}</li>`;
  const basis = item.basis ? ` <span class="pill">${escapeHtml(item.basis)}</span>` : "";
  return `<li>${escapeHtml(item.text || item.situation || item.task || "")}${basis}</li>`;
}

function renderCandidate(candidate) {
  const facts = candidate.factsDraft || [];
  const tips = candidate.examTipsDraft || [];
  const duplicateStatus = candidate.duplicateReview?.status || (candidate.possibleDuplicates?.length ? "possible-duplicate" : "no-match");
  const quality = candidate.quality?.band ? ` • quality ${candidate.quality.band}` : "";

  return `
    <article class="candidate-card" data-candidate-id="${escapeHtml(candidate.candidateId)}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(candidate.category)} • confidence ${Math.round((candidate.confidence || 0) * 100)}% • ${escapeHtml(duplicateStatus)}${escapeHtml(quality)}</p>
          <h2>${escapeHtml(candidate.title)}</h2>
          <code>${escapeHtml(candidate.proposedKnowledgeId)}</code>
          ${(candidate.domains || []).length ? `<p>${candidate.domains.map(domain => `<span class="pill">${escapeHtml(domain)}</span>`).join(" ")}</p>` : ""}
        </div>
        <fieldset class="decision-box">
          ${decisionOption(candidate, "undecided", "Undecided")}
          ${decisionOption(candidate, "create-new", "Create New")}
          ${decisionOption(candidate, "merge-existing", "Merge")}
          ${decisionOption(candidate, "ignore", "Reject")}
        </fieldset>
      </header>

      <p>${escapeHtml(candidate.summaryDraft || "No summary draft yet.")}</p>

      <label class="notes-label">Merge target
        <input data-merge-target type="text" placeholder="Only set when merging into an existing Knowledge Object" value="${escapeHtml(candidate.mergeTarget || "")}">
      </label>

      <details open>
        <summary>Facts</summary>
        ${facts.length ? `<ul>${facts.map(renderDraftItem).join("")}</ul>` : '<p class="muted">No facts drafted.</p>'}
      </details>

      <details>
        <summary>Exam tips</summary>
        ${tips.length ? `<ul>${tips.map(renderDraftItem).join("")}</ul>` : '<p class="muted">No exam tips drafted.</p>'}
      </details>

      <details>
        <summary>Possible duplicates</summary>
        ${renderDuplicateList(candidate)}
      </details>

      <details>
        <summary>Relationship suggestions</summary>
        ${renderRelationshipList(candidate)}
      </details>

      <details>
        <summary>Source evidence</summary>
        ${renderEvidenceList(candidate)}
      </details>

      <label class="notes-label">Review notes
        <textarea data-notes rows="3" placeholder="Why create, merge, or reject this candidate?">${escapeHtml(candidate.reviewNotes || "")}</textarea>
      </label>
    </article>
  `;
}

function decisionOption(candidate, value, label) {
  const checked = (candidate.reviewDecision || "undecided") === value ? "checked" : "";
  return `<label><input data-decision type="radio" name="decision-${escapeHtml(candidate.candidateId)}" value="${value}" ${checked}> ${label}</label>`;
}

function exportBackup() {
  if (!activeSet) return;
  const backup = buildReviewBackup(activeSet);
  const filename = `${activeSet.id.toLowerCase()}-review-backup.json`;
  downloadJson(filename, backup);
}
