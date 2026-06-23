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
          <p class="eyebrow">Study Path</p>
          <h2>${escapeHtml(path.title)}</h2>
          <p class="muted">Follow lessons in order while tracking mapped knowledge objects.</p>
        </div>
        <div class="study-path-summary-grid">
          <article><strong>${escapeHtml(path.summary.steps)}</strong><span>Steps</span></article>
          <article><strong>${escapeHtml(path.summary.knowledgeObjects)}</strong><span>Concepts</span></article>
          <article><strong>${escapeHtml(path.summary.percentStarted)}%</strong><span>Started</span></article>
          <article><strong>${escapeHtml(path.summary.percentMastered)}%</strong><span>Mastered</span></article>
        </div>
      </header>

      <div class="study-path-step-list">
        ${path.steps.map(renderStep).join("")}
      </div>
    </section>
  `;
}

function renderStep(step) {
  return `
    <article class="study-path-step">
      <header>
        <div>
          <span class="pill">${escapeHtml(step.type)}</span>
          <h3>${step.order ? `${escapeHtml(step.order)}. ` : ""}${escapeHtml(step.title)}</h3>
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

function renderKnowledgeList(knowledge) {
  if (!knowledge.length) return `<p class="muted">No mapped knowledge objects yet.</p>`;

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
