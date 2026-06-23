import { loadPendingManifest, loadCandidateSet } from './candidate-loader.js';
import { renderDuplicateList, escapeHtml } from './duplicate-view.js';
import { buildApprovedReview, downloadJson, setDecision, summarizeDecisions } from './approval-actions.js';

const importSelect = document.querySelector('#importSelect');
const decisionFilter = document.querySelector('#decisionFilter');
const exportBtn = document.querySelector('#exportBtn');
const summary = document.querySelector('#summary');
const candidateList = document.querySelector('#candidateList');

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

  importSelect.addEventListener('change', event => selectImport(event.target.value));
  decisionFilter.addEventListener('change', render);
  exportBtn.addEventListener('click', exportReview);
}

function renderImportOptions() {
  importSelect.innerHTML = manifestItems.map(item => `
    <option value="${escapeHtml(item.path)}">${escapeHtml(item.label || item.id)}</option>
  `).join('');
}

async function selectImport(path) {
  activeSet = await loadCandidateSet(path);
  render();
}

function render() {
  if (!activeSet) return;
  renderSummary();
  renderCandidates();
}

function renderSummary() {
  const counts = summarizeDecisions(activeSet);
  summary.innerHTML = `
    <article><span>Total</span><strong>${counts.total}</strong></article>
    <article><span>Undecided</span><strong>${counts.undecided}</strong></article>
    <article><span>Create</span><strong>${counts['create-new']}</strong></article>
    <article><span>Merge</span><strong>${counts['merge-existing']}</strong></article>
    <article><span>Ignore</span><strong>${counts.ignore}</strong></article>
  `;
}

function renderCandidates() {
  const filter = decisionFilter.value;
  const candidates = activeSet.candidates.filter(candidate => filter === 'all' || candidate.reviewDecision === filter);

  candidateList.innerHTML = candidates.map(candidate => renderCandidate(candidate)).join('') || '<article class="empty-card"><p>No candidates match this filter.</p></article>';

  candidateList.querySelectorAll('[data-decision]').forEach(input => {
    input.addEventListener('change', event => {
      const card = event.target.closest('[data-candidate-id]');
      const notes = card.querySelector('[data-notes]').value;
      setDecision(activeSet, card.dataset.candidateId, event.target.value, notes);
      render();
    });
  });

  candidateList.querySelectorAll('[data-notes]').forEach(input => {
    input.addEventListener('input', event => {
      const card = event.target.closest('[data-candidate-id]');
      const candidate = activeSet.candidates.find(item => item.candidateId === card.dataset.candidateId);
      if (candidate) candidate.reviewNotes = event.target.value;
    });
  });
}

function renderCandidate(candidate) {
  const facts = candidate.factsDraft || [];
  const tips = candidate.examTipsDraft || [];
  const evidence = candidate.evidence || [];
  const relationships = candidate.suggestedRelationships || [];

  return `
    <article class="candidate-card" data-candidate-id="${escapeHtml(candidate.candidateId)}">
      <header>
        <div>
          <p class="eyebrow">${escapeHtml(candidate.category)} • confidence ${Math.round((candidate.confidence || 0) * 100)}%</p>
          <h2>${escapeHtml(candidate.title)}</h2>
          <code>${escapeHtml(candidate.proposedKnowledgeId)}</code>
        </div>
        <fieldset class="decision-box">
          ${decisionOption(candidate, 'undecided', 'Undecided')}
          ${decisionOption(candidate, 'create-new', 'Create New')}
          ${decisionOption(candidate, 'merge-existing', 'Merge')}
          ${decisionOption(candidate, 'ignore', 'Ignore')}
        </fieldset>
      </header>

      <p>${escapeHtml(candidate.summaryDraft || 'No summary draft yet.')}</p>

      <details open>
        <summary>Facts</summary>
        ${facts.length ? `<ul>${facts.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">No facts drafted.</p>'}
      </details>

      <details>
        <summary>Exam tips</summary>
        ${tips.length ? `<ul>${tips.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : '<p class="muted">No exam tips drafted.</p>'}
      </details>

      <details>
        <summary>Possible duplicates</summary>
        ${renderDuplicateList(candidate)}
      </details>

      <details>
        <summary>Relationship suggestions</summary>
        ${relationships.length ? `<ul>${relationships.map(item => `<li><strong>${escapeHtml(item.type)}</strong> → <code>${escapeHtml(item.target)}</code> ${item.reason ? `— ${escapeHtml(item.reason)}` : ''}</li>`).join('')}</ul>` : '<p class="muted">No relationship suggestions.</p>'}
      </details>

      <details>
        <summary>Transcript evidence</summary>
        ${evidence.length ? `<ol>${evidence.map(item => `<li value="${Number(item.line) || 1}">${escapeHtml(item.text)}</li>`).join('')}</ol>` : '<p class="muted">No transcript evidence.</p>'}
      </details>

      <label class="notes-label">Review notes
        <textarea data-notes rows="3" placeholder="Why create, merge, or ignore this candidate?">${escapeHtml(candidate.reviewNotes || '')}</textarea>
      </label>
    </article>
  `;
}

function decisionOption(candidate, value, label) {
  const checked = (candidate.reviewDecision || 'undecided') === value ? 'checked' : '';
  return `<label><input data-decision type="radio" name="decision-${escapeHtml(candidate.candidateId)}" value="${value}" ${checked}> ${label}</label>`;
}

function exportReview() {
  if (!activeSet) return;
  const approved = buildApprovedReview(activeSet);
  const filename = `${activeSet.id.toLowerCase()}-reviewed.json`;
  downloadJson(filename, approved);
}
