export function renderDashboardMode({ certificationState, stats, activeConcept, jobs = [], progressSummary = null, activeProgress = null, assessmentSummary = null } = {}) {
  const certification = certificationState?.certification;
  const knowledge = certificationState?.knowledge || [];
  const lessons = certificationState?.lessons || [];
  const objectives = certificationState?.objectives || [];
  const draftCount = knowledge.filter(item => item.status === "draft").length;
  const needsReviewCount = knowledge.filter(item => item.quality?.needsHumanReview).length;
  const domains = stats?.domains || [];
  const activeJobs = jobs.filter(job => ["queued", "running", "retrying"].includes(job.status));
  const failedJobs = jobs.filter(job => job.status === "failed");
  const progress = progressSummary || {
    notStarted: knowledge.length,
    learning: 0,
    reviewed: 0,
    mastered: 0,
    percentStarted: 0,
    percentMastered: 0
  };
  const attempts = assessmentSummary || {
    totalAttempts: 0,
    latest: null,
    best: null,
    averagePercent: 0
  };

  return `
    <section class="dashboard-mode card">
      <header class="dashboard-hero">
        <div>
          <p class="eyebrow">Dashboard</p>
          <h2>${escapeHtml(certification?.name || "Learning Platform")}</h2>
          <p class="dashboard-summary">${escapeHtml(certification?.notes || "Knowledge-driven learning workspace.")}</p>
        </div>
        <div class="dashboard-actions">
          <button type="button" data-mode-jump="learn">Continue Learning</button>
          <button type="button" data-mode-jump="search">Search Concepts</button>
          <button type="button" data-mode-jump="assessment">Practice</button>
          <button type="button" data-mode-jump="jobs">View Jobs</button>
        </div>
      </header>

      <section class="dashboard-stat-grid" aria-label="Platform summary">
        ${renderStat("Concepts", stats?.knowledgeObjects ?? knowledge.length)}
        ${renderStat("Lessons", stats?.lessons ?? lessons.length)}
        ${renderStat("Objectives", stats?.objectives ?? objectives.length)}
        ${renderStat("Started", `${progress.percentStarted}%`)}
        ${renderStat("Mastered", `${progress.percentMastered}%`)}
        ${renderStat("Best Practice", attempts.best ? `${attempts.best.score.percent}%` : "—")}
      </section>

      <section class="dashboard-grid">
        <article class="dashboard-card">
          <h3>Continue Learning</h3>
          ${activeConcept ? `
            <p class="muted">Current concept · ${escapeHtml(formatLabel(activeProgress?.status || "not-started"))}</p>
            <button class="dashboard-concept-link" type="button" data-id="${escapeHtml(activeConcept.id)}">
              <strong>${escapeHtml(activeConcept.title)}</strong>
              <span>${escapeHtml(activeConcept.learning?.summary || activeConcept.id)}</span>
            </button>
          ` : `<p class="muted">No concept selected yet.</p>`}
        </article>

        <article class="dashboard-card">
          <h3>Learning Progress</h3>
          <ul class="dashboard-list">
            <li><strong>${escapeHtml(progress.learning)}</strong><span>currently learning</span></li>
            <li><strong>${escapeHtml(progress.reviewed)}</strong><span>reviewed concepts</span></li>
            <li><strong>${escapeHtml(progress.mastered)}</strong><span>mastered concepts</span></li>
            <li><strong>${escapeHtml(progress.notStarted)}</strong><span>not started</span></li>
          </ul>
        </article>

        <article class="dashboard-card">
          <h3>Assessment Performance</h3>
          <ul class="dashboard-list">
            <li><strong>${escapeHtml(attempts.totalAttempts)}</strong><span>saved attempts</span></li>
            <li><strong>${attempts.latest ? `${escapeHtml(attempts.latest.score.percent)}%` : "—"}</strong><span>latest score</span></li>
            <li><strong>${attempts.best ? `${escapeHtml(attempts.best.score.percent)}%` : "—"}</strong><span>best score</span></li>
            <li><strong>${attempts.totalAttempts ? `${escapeHtml(attempts.averagePercent)}%` : "—"}</strong><span>average score</span></li>
          </ul>
        </article>

        <article class="dashboard-card">
          <h3>Content Health</h3>
          <ul class="dashboard-list">
            <li><strong>${escapeHtml(draftCount)}</strong><span>draft knowledge objects</span></li>
            <li><strong>${escapeHtml(needsReviewCount)}</strong><span>objects needing review</span></li>
            <li><strong>${escapeHtml(stats?.missingRelationshipTargets?.length || 0)}</strong><span>missing relationship targets</span></li>
          </ul>
        </article>

        <article class="dashboard-card">
          <h3>Domains</h3>
          ${domains.length ? `
            <div class="dashboard-tags">
              ${domains.map(domain => `<button type="button" data-dashboard-domain="${escapeHtml(domain)}">${escapeHtml(formatLabel(domain))}</button>`).join("")}
            </div>
          ` : `<p class="muted">No domains loaded yet.</p>`}
        </article>

        <article class="dashboard-card">
          <h3>Operations</h3>
          <ul class="dashboard-list">
            <li><strong>${escapeHtml(activeJobs.length)}</strong><span>active jobs</span></li>
            <li><strong>${escapeHtml(failedJobs.length)}</strong><span>failed jobs</span></li>
            <li><strong>${escapeHtml(jobs.length)}</strong><span>total job records</span></li>
          </ul>
        </article>
      </section>
    </section>
  `;
}

function renderStat(label, value) {
  return `
    <article>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
