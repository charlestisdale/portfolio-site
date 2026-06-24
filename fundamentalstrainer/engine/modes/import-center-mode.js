import {
  candidateReviewKey,
  getReviewRecord,
  reviewSummary,
  serializeRelationships
} from "../review/candidate-review-store.js";

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
  if (!imports.length) return `<p class="muted">No pending imports found.</p>`;

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

function renderFactsValue(candidate) {
  return (candidate.factsDraft || [])
    .map(fact => typeof fact === "string" ? fact : fact.text)
    .filter(Boolean)
    .join("\n");
}

function renderEvidence(candidate) {
  const evidence = candidate.evidence || [];
  if (!evidence.length) return `<p class="muted">No evidence linked yet.</p>`;

  return `
    <details class="candidate-evidence-detail">
      <summary>Evidence (${formatNumber(evidence.length)})</summary>
      <ol class="candidate-evidence-list">
        ${evidence.slice(0, 8).map(item => {
          const text = typeof item === "string" ? item : item.quote || item.text || item.excerpt || item.id || JSON.stringify(item);
          return `<li>${escapeHtml(text)}</li>`;
        }).join("")}
      </ol>
    </details>
  `;
}

function qualityRank(candidate) {
  const band = candidate.quality?.band || "unknown";
  if (band === "high") return 0;
  if (band === "needs-edit") return 1;
  if (band === "low") return 2;
  return 3;
}

function renderQualityAudit(candidate) {
  const quality = candidate.quality;
  if (!quality) return `<span class="quality-pill quality-pill--unknown">No quality audit</span>`;
  const label = quality.band === "high" ? "High quality" : quality.band === "needs-edit" ? "Needs edit" : quality.band === "low" ? "Low quality" : "Unknown quality";
  const flags = quality.flags || [];

  return `
    <div class="quality-audit" data-quality-band="${escapeHtml(quality.band)}">
      <span class="quality-pill quality-pill--${escapeHtml(quality.band)}">${escapeHtml(label)} · ${formatNumber(quality.score)}%</span>
      ${flags.length ? `
        <details class="quality-flags">
          <summary>${formatNumber(flags.length)} warning(s)</summary>
          <ul>
            ${flags.map(flag => `<li><strong>${escapeHtml(flag.code)}</strong>: ${escapeHtml(flag.message)}</li>`).join("")}
          </ul>
        </details>
      ` : `<span class="muted">No warnings detected.</span>`}
    </div>
  `;
}

function qualitySummary(candidates) {
  return candidates.reduce((summary, candidate) => {
    const band = candidate.quality?.band || "unknown";
    summary[band] = (summary[band] || 0) + 1;
    return summary;
  }, { high: 0, "needs-edit": 0, low: 0, unknown: 0 });
}

function primeCandidateCache(preview, candidates) {
  if (typeof window === "undefined") return;
  window.__importReviewCandidateCache = {};
  for (const candidate of candidates) {
    const key = candidateReviewKey(preview, candidate);
    window.__importReviewCandidateCache[key] = { preview, candidate };
  }
}

function renderCandidateCard(preview, candidate) {
  const key = candidateReviewKey(preview, candidate);
  const record = getReviewRecord(key);
  const summaryValue = record?.edits?.summary || candidate.summaryDraft || "";
  const factsValue = record?.edits?.facts?.join("\n") || renderFactsValue(candidate);
  const relationshipValue = record?.edits?.relationships?.map(item => `${item.id} | ${item.type || "related"} | ${item.reason || ""}`).join("\n") || serializeRelationships(candidate);
  const titleValue = record?.edits?.title || candidate.title || "";
  const notesValue = record?.edits?.notes || "";
  const mergeTargetValue = record?.mergeTarget || record?.edits?.mergeTarget || "";

  return `
    <article class="candidate-preview-item candidate-review-item" data-review-candidate="${escapeHtml(key)}" data-quality-band="${escapeHtml(candidate.quality?.band || "unknown")}">
      <div class="candidate-review-header">
        <div>
          <h3>${escapeHtml(candidate.title)}</h3>
          <p><code>${escapeHtml(candidate.proposedKnowledgeId)}</code></p>
          <p class="muted">${escapeHtml(candidate.type)} · ${escapeHtml((candidate.domains || []).join(", "))}</p>
        </div>
        <span class="pill review-status-pill" data-review-status="${escapeHtml(record?.decision || "undecided")}">${escapeHtml(record?.decision || candidate.reviewDecision || "undecided")}</span>
      </div>

      ${renderQualityAudit(candidate)}

      <label class="review-field">
        <span>Title</span>
        <input data-review-field="title" value="${escapeHtml(titleValue)}" />
      </label>

      <label class="review-field">
        <span>Summary</span>
        <textarea data-review-field="summary" rows="4">${escapeHtml(summaryValue)}</textarea>
      </label>

      <label class="review-field">
        <span>Facts <small class="muted">one per line</small></span>
        <textarea data-review-field="facts" rows="5">${escapeHtml(factsValue)}</textarea>
      </label>

      <label class="review-field">
        <span>Relationships <small class="muted">knowledge-id | type | reason</small></span>
        <textarea data-review-field="relationships" rows="4">${escapeHtml(relationshipValue)}</textarea>
      </label>

      <label class="review-field">
        <span>Merge target <small class="muted">use when this candidate duplicates an existing object</small></span>
        <input data-review-field="mergeTarget" value="${escapeHtml(mergeTargetValue)}" placeholder="windows.task-manager" />
      </label>

      <label class="review-field">
        <span>Reviewer notes</span>
        <textarea data-review-field="notes" rows="3">${escapeHtml(notesValue)}</textarea>
      </label>

      ${renderEvidence(candidate)}

      <div class="import-metric-strip compact">
        <span><strong>${formatNumber(candidate.factsDraft?.length || 0)}</strong> facts</span>
        <span><strong>${formatNumber(candidate.evidence?.length || 0)}</strong> evidence</span>
        <span><strong>${formatNumber(candidate.suggestedRelationships?.length || 0)}</strong> relationships</span>
      </div>

      <div class="candidate-review-actions">
        <button type="button" data-review-action="save">Save edits</button>
        <button type="button" data-review-action="approve">Approve</button>
        <button type="button" data-review-action="merge">Merge</button>
        <button type="button" data-review-action="reject">Reject</button>
        <button type="button" data-review-action="reset">Reset</button>
      </div>
    </article>
  `;
}

function renderCandidatePreview(preview) {
  if (!preview) {
    return `
      <section class="card import-preview-card">
        <h2>Candidate Review</h2>
        <p class="muted">Select a lesson to preview and review its pending candidates.</p>
      </section>
    `;
  }

  if (preview.error) {
    return `
      <section class="card import-preview-card">
        <h2>Candidate Review</h2>
        <p class="error-text">${escapeHtml(preview.error)}</p>
      </section>
    `;
  }

  const candidates = [...(preview.candidates || [])].sort((a, b) => qualityRank(a) - qualityRank(b) || (b.confidence || 0) - (a.confidence || 0));
  const quality = qualitySummary(candidates);
  primeCandidateCache(preview, candidates);

  return `
    <section class="card import-preview-card">
      <div class="section-heading-row">
        <div>
          <p class="eyebrow">${escapeHtml(preview.lessonId || "")}</p>
          <h2>${escapeHtml(preview.lessonTitle || preview.id || "Candidate Review")}</h2>
          <p class="muted"><span data-visible-candidate-count>${formatNumber(candidates.length)}</span> visible of ${formatNumber(candidates.length)} candidate(s). Review decisions are saved locally in your browser until exported.</p>
          <div class="import-metric-strip compact quality-summary-strip">
            <span><strong>${formatNumber(quality.high)}</strong> high quality</span>
            <span><strong>${formatNumber(quality["needs-edit"])}</strong> needs edit</span>
            <span><strong>${formatNumber(quality.low)}</strong> low quality</span>
            <span><strong>${formatNumber(quality.unknown)}</strong> unaudited</span>
          </div>
        </div>
        <button class="review-export-button" type="button" data-review-export>Export approved JSON</button>
      </div>
      <div class="candidate-preview-list">
        ${candidates.slice(0, 12).map(candidate => renderCandidateCard(preview, candidate)).join("")}
      </div>
    </section>
  `;
}

export function renderImportCenterMode({ state, selectedPreview } = {}) {
  const imports = state?.manifest?.imports || [];
  const totals = state?.folderReport?.totals || {};
  const reviewed = reviewSummary();
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
          <li>Run <code>npm run ingest:postprocess</code>.</li>
          <li>Review candidates in this tab.</li>
          <li>Export approved Knowledge Objects for merge.</li>
        </ol>
        <div class="import-metric-strip compact">
          <span><strong>${formatNumber(reviewed.approved)}</strong> approved</span>
          <span><strong>${formatNumber(reviewed.rejected)}</strong> rejected</span>
          <span><strong>${formatNumber(reviewed.merge)}</strong> merge</span>
          <span><strong>${formatNumber(reviewed.edited)}</strong> edited</span>
        </div>
      </section>
    </section>

    <section class="import-center-layout">
      <section class="card import-queue-card">
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
