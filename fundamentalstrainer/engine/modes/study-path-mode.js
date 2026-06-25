export function renderStudyPathMode({ path = null } = {}) {
  if (!path) {
    return `
      <section class="study-path-mode card">
        <p class="muted">No study path available yet.</p>
      </section>
    `;
  }

  return `
    <section class="study-path-mode card">
      <header class="study-path-hero">
        <div>
          <p class="eyebrow">${escapeHtml(path.source === "curriculum" ? "Curriculum Study Path" : "Study Path")}</p>
          <h2>${escapeHtml(path.title)}</h2>
          <p class="muted">Follow curriculum modules while tracking mapped Knowledge Objects.</p>
        </div>
        <div class="study-path-summary-grid">
          <article><strong>${escapeHtml(path.summary.steps)}</strong><span>Modules</span></article>
          <article><strong>${escapeHtml(path.summary.knowledgeObjects)}</strong><span>Concepts</span></article>
          <article><strong>${escapeHtml(path.summary.percentStarted)}%</strong><span>Started</span></article>
          <article><strong>${escapeHtml(path.summary.percentMastered)}%</strong><span>Mastered</span></article>
        </div>
      </header>

      <div class="study-path-step-list">
        ${groupStepsBySection(path.steps).map(renderSection).join("")}
      </div>
    </section>
  `;
}

function groupStepsBySection(steps = []) {
  const groups = [];
  const byId = new Map();

  for (const step of steps) {
    const sectionId = step.sectionId || step.id;
    const sectionTitle = step.sectionTitle || (step.id === "unmapped-knowledge" ? "Needs Curriculum Mapping" : "Study Path");
    if (!byId.has(sectionId)) {
      const group = { id: sectionId, title: sectionTitle, steps: [] };
      byId.set(sectionId, group);
      groups.push(group);
    }
    byId.get(sectionId).steps.push(step);
  }

  return groups;
}

function renderSection(section) {
  return `
    <section class="study-path-section">
      <header class="study-path-section-header">
        <p class="eyebrow">Section ${escapeHtml(section.id)}</p>
        <h3>${escapeHtml(section.title)}</h3>
      </header>
      ${section.steps.map(renderStep).join("")}
    </section>
  `;
}

function renderStep(step) {
  return `
    <article class="study-path-step">
      <header>
        <div>
          <span class="pill">${escapeHtml(step.type)}</span>
          <h4>${step.order ? `${escapeHtml(step.order)}. ` : ""}${escapeHtml(step.title)}</h4>
          ${step.description ? `<p class="muted">${escapeHtml(step.description)}</p>` : ""}
          ${renderOutcomes(step.outcomes || [])}
          <p class="muted">${escapeHtml(step.progress.total)} concept${step.progress.total === 1 ? "" : "s"} · ${escapeHtml(step.progress.percentMastered)}% mastered</p>
        </div>
        <div class="study-path-progress-mini">
          <strong>${escapeHtml(step.progress.percentStarted)}%</strong>
          <span>started</span>
        </div>
      </header>
      ${renderKnowledgeList(step.knowledge)}
    </article>
  `;
}

function renderOutcomes(outcomes) {
  if (!outcomes.length) return "";
  return `
    <details class="study-path-outcomes">
      <summary>${escapeHtml(outcomes.length)} outcome${outcomes.length === 1 ? "" : "s"}</summary>
      <ul>${outcomes.map(outcome => `<li>${escapeHtml(outcome)}</li>`).join("")}</ul>
    </details>
  `;
}

function renderKnowledgeList(knowledge) {
  if (!knowledge.length) return `<p class="muted">No mapped Knowledge Objects yet.</p>`;

  return `
    <div class="study-path-knowledge-list">
      ${knowledge.map(item => `
        <button type="button" class="study-path-knowledge-card" data-id="${escapeHtml(item.id)}">
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.status)}</span>
          <small>${escapeHtml([item.type, item.difficulty, item.importance].filter(Boolean).join(" · "))}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
