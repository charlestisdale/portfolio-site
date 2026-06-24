function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function statusMessage(state) {
  if (state.loading) return "Loading local import data…";
  if (state.error) return state.error;
  if (!state.manifest && !state.folderReport) return "No local import data found yet. Run npm run ingest:folder -- --cert=a-plus-220-1202, then npm run review:manifest.";
  return "Local import data loaded. Review generated candidates before merging into Knowledge Objects.";
}

function lessonTitleFor(importItem, folderReport) {
  const lesson = folderReport?.lessons?.find(item => item.lessonId === importItem.lessonId);
  return lesson?.title || importItem.title || importItem.id;
}

function lessonMetricsFor(importItem, folderReport) {
  const lesson = folderReport?.lessons?.find(item => item.lessonId === importItem.lessonId);
  return {
    evidenceRecords: lesson?.evidenceMetrics?.evidenceRecords || 0,
    evidenceCleanup: lesson?.evidenceMetrics?.recordsNeedingCleanup || 0,
    conceptGroups: lesson?.evidenceMetrics?.conceptGroups || 0,
    highConfidence: lesson?.candidateMetrics?.highConfidenceCandidates || 0,
    relationships: lesson?.candidateMetrics?.relationshipsSuggested || 0,
    candidates: importItem.candidateCount || lesson?.candidateMetrics?.candidates || 0
  };
}

function estimateReviewMinutes(metrics) {
  const minutes = Math.max(1, Math.ceil((metrics.candidates * 35 + metrics.evidenceRecords * 4 + metrics.evidenceCleanup * 6) / 60));
  return `${minutes} min`;
}

function renderImportRows(imports, folderReport) {
  if (!imports.length) {
    return `<p class="muted">No pending imports found.</p>`;
  }

  return `
    <div class="import-review-list">
      ${imports.map(importItem => {
        const metrics = lessonMetricsFor(importItem, folderReport);
        const title = lessonTitleFor(importItem, folderReport);
        const cleanupRate = metrics.evidenceRecords ? Math.round((metrics.evidenceCleanup / metrics.evidenceRecords) * 100) : 0;
        return `
          <article class="import-review-card">
            <div>
              <p class="eyebrow">Lesson ${escapeHtml(importItem.lessonId)}</p>
              <h3>${escapeHtml(title)}</h3>
              <p class="muted">${escapeHtml(importItem.id)} · ${escapeHtml(importItem.status || "pending-review")}</p>
            </div>
            <div class="import-metric-strip">
              <span><strong>${formatNumber(metrics.candidates)}</strong> candidates</span>
              <span><strong>${formatNumber(metrics.highConfidence)}</strong> high confidence</span>
              <span><strong>${formatNumber(metrics.evidenceRecords)}</strong> evidence</span>
              <span><strong>${formatNumber(metrics.conceptGroups)}</strong> groups</span>
              <span><strong>${cleanupRate}%</strong> cleanup</span>
              <span><strong>${escapeHtml(estimateReviewMinutes(metrics))}</strong> est.</span>
            </div>
            <div class="import-review-actions">
              <button type="button" data-import-open="${escapeHtml(importItem.path)}">Preview candidates</button>
              <code>${escapeHtml(importItem.path)}</code>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function renderCandidatePreview(preview) {
  if (!preview) {
    return `
      <section class="card import-preview-card">
        <h2>Candidate Preview</h2>
        <p class="muted">Select a lesson to preview its pending candidates.</p>
      </section>
    `;
  }

  if (preview.error) {
    return `
      <section class="card import-preview-card">
        <h2>Candidate Preview</h2>
        <p class="error-text">${escapeHtml(preview.error)}</p>
      </section>
    `;
  }

  const candidates = preview.candidates || [];
  return `
    <section class="card import-preview-card">
      <p class="eyebrow">${escapeHtml(preview.lessonId || "")}</p>
      <h2>${escapeHtml(preview.lessonTitle || preview.id || "Candidate Preview")}</h2>
      <p class="muted">${formatNumber(candidates.length)} candidate(s). This is read-only until review actions are added.</p>
      <div class="candidate-preview-list">
        ${candidates.slice(0, 12).map(candidate => `
          <article class="candidate-preview-item">
            <div>
              <h3>${escapeHtml(candidate.title)}</h3>
              <p><code>${escapeHtml(candidate.proposedKnowledgeId)}</code></p>
              <p class="muted">${escapeHtml(candidate.type)} · ${escapeHtml((candidate.domains || []).join(", "))}</p>
            </div>
            <p>${escapeHtml(candidate.summaryDraft || "No draft summary yet.")}</p>
            <div class="import-metric-strip compact">
              <span><strong>${formatNumber(candidate.factsDraft?.length || 0)}</strong> facts</span>
              <span><strong>${formatNumber(candidate.evidence?.length || 0)}</strong> evidence</span>
              <span><strong>${formatNumber(candidate.suggestedRelationships?.length || 0)}</strong> relationships</span>
              <span><strong>${escapeHtml(candidate.reviewDecision || "undecided")}</strong></span>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderImportCenterMode({ state, selectedPreview } = {}) {
  const imports = state?.manifest?.imports || [];
  const totals = state?.folderReport?.totals || {};
  const topImports = [...imports]
    .filter(item => item.candidateCount > 0)
    .sort((a, b) => (b.candidateCount || 0) - (a.candidateCount || 0));

  return `
    <section class="import-center-grid">
      <section class="card import-center-hero">
        <p class="eyebrow">Evidence-first ingestion</p>
        <h2>Import Center</h2>
        <p>${escapeHtml(statusMessage(state || {}))}</p>
        <div class="summary-grid import-summary-grid">
          <div><strong>${formatNumber(totals.rawFiles)}</strong><span>Raw Sources</span></div>
          <div><strong>${formatNumber(totals.evidenceRecords)}</strong><span>Evidence Records</span></div>
          <div><strong>${formatNumber(totals.candidates)}</strong><span>Candidates</span></div>
          <div><strong>${formatNumber(totals.failed)}</strong><span>Failures</span></div>
        </div>
      </section>

      <section class="card import-instructions-card">
        <h2>Local workflow</h2>
        <ol>
          <li>Put raw sources in <code>data/transcripts/raw/&lt;cert&gt;/</code>.</li>
          <li>Run <code>npm run ingest:folder -- --cert=a-plus-220-1202</code>.</li>
          <li>Run <code>npm run review:manifest</code>.</li>
          <li>Review candidates before merge.</li>
        </ol>
      </section>
    </section>

    <section class="import-center-layout">
      <section class="card">
        <div class="section-heading-row">
          <div>
            <p class="eyebrow">Review Queue</p>
            <h2>Pending Lessons</h2>
          </div>
          <span class="pill">${formatNumber(imports.length)} import(s)</span>
        </div>
        ${renderImportRows(topImports, state?.folderReport)}
      </section>
      ${renderCandidatePreview(selectedPreview)}
    </section>
  `;
}
