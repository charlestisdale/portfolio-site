function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function renderStatePills(requiredStates = [], flags = {}) {
  return `
    <div class="state-pill-row">
      ${requiredStates.map(item => {
        const complete = flags[item.key] === item.value;
        return `<span class="state-pill ${complete ? "complete" : "missing"}">${escapeHtml(item.label || item.key)}</span>`;
      }).join("")}
    </div>
  `;
}

function renderDocumentation(documentation = {}) {
  const values = documentation.values || documentation;

  if (!values || !Object.keys(values).length) {
    return "<p>No documentation saved.</p>";
  }

  return `
    <dl class="documentation-review">
      <dt>Problem</dt><dd>${escapeHtml(values.problem || "Missing")}</dd>
      <dt>Root Cause</dt><dd>${escapeHtml(values.rootCause || "Missing")}</dd>
      <dt>Resolution</dt><dd>${escapeHtml(values.resolution || "Missing")}</dd>
      <dt>Verification</dt><dd>${escapeHtml(values.verification || "Missing")}</dd>
    </dl>
  `;
}

export function renderPbqReview({ scenario = {}, state = {}, gradeResult = {}, activityLabel = "Actions Taken" } = {}) {
  const requiredStates = scenario.grading?.requiredStates || [];
  const flags = state.flags || {};
  const history = state.history || [];
  const penalties = gradeResult.penalties || state.penalties || [];

  return `
    <h2>Final Review</h2>
    <div class="review-score">${gradeResult.score}% ${gradeResult.passed ? "Pass" : "Needs Work"}</div>
    <p>${escapeHtml(gradeResult.summary || scenario.grading?.summary || scenario.note || "Review your work.")}</p>
    <h3>Required Outcomes</h3>
    ${renderStatePills(requiredStates, flags)}
    <div class="review-grid" style="margin-top:1rem;">
      <div class="review-item ${gradeResult.missing?.length ? "missing" : "complete"}">
        <strong>Missing Outcomes</strong>
        ${gradeResult.missing?.length ? `<ul>${gradeResult.missing.map(item => `<li>${escapeHtml(item.label || item.key)}</li>`).join("")}</ul>` : "<p>All required outcomes were completed.</p>"}
      </div>
      <div class="review-item ${penalties.length ? "penalty" : "complete"}">
        <strong>Penalties</strong>
        ${penalties.length ? `<ul>${penalties.map(item => `<li>${escapeHtml(item.reason)} (-${item.points})</li>`).join("")}</ul>` : "<p>No unsafe or unnecessary actions were taken.</p>"}
      </div>
      <div class="review-item">
        <strong>${escapeHtml(activityLabel)}</strong>
        <p>${history.length}</p>
      </div>
      <div class="review-item">
        <strong>Learner Notes</strong>
        <p>${escapeHtml(state.learnerNotes || "No notes entered.")}</p>
      </div>
      <div class="review-item wide-review-item">
        <strong>Saved Documentation</strong>
        ${renderDocumentation(state.documentation)}
      </div>
    </div>
  `;
}
