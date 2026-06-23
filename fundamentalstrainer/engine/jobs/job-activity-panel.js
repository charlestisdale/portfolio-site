import { JobStatus, JobTypeLabels, TerminalJobStatuses } from "./index.js";

const ACTIVE_STATUSES = new Set([JobStatus.QUEUED, JobStatus.RUNNING, JobStatus.RETRYING]);
const RETRYABLE_STATUSES = new Set([JobStatus.FAILED, JobStatus.CANCELED]);

export class JobActivityPanel {
  constructor({ root, runner, onSeedDemoJobs = null, refreshIntervalMs = 500 } = {}) {
    if (!root) throw new Error("JobActivityPanel requires a root element.");
    if (!runner) throw new Error("JobActivityPanel requires a JobRunner instance.");

    this.root = root;
    this.runner = runner;
    this.onSeedDemoJobs = onSeedDemoJobs;
    this.refreshIntervalMs = refreshIntervalMs;
    this.intervalId = null;
  }

  start() {
    this.render();
    this.root.addEventListener("click", this.handleClick);
    this.intervalId = window.setInterval(() => this.render(), this.refreshIntervalMs);
  }

  stop() {
    if (this.intervalId) window.clearInterval(this.intervalId);
    this.root.removeEventListener("click", this.handleClick);
  }

  handleClick = event => {
    const action = event.target.closest("button[data-job-action]");
    if (!action) return;

    const { jobAction, jobId } = action.dataset;

    if (jobAction === "seed") {
      this.onSeedDemoJobs?.();
      this.render();
      return;
    }

    if (!jobId) return;

    if (jobAction === "cancel") {
      this.runner.cancel(jobId);
      this.render();
      return;
    }

    if (jobAction === "retry") {
      this.runner.retry(jobId);
      this.render();
    }
  };

  render() {
    const jobs = this.runner.list();
    const activeJobs = jobs.filter(job => ACTIVE_STATUSES.has(job.status));
    const completedJobs = jobs.filter(job => TerminalJobStatuses.includes(job.status));
    const failedJobs = jobs.filter(job => job.status === JobStatus.FAILED);

    this.root.innerHTML = `
      <section class="job-panel card" aria-labelledby="jobs-title">
        <header class="job-panel__header">
          <div>
            <p class="eyebrow">Operations</p>
            <h2 id="jobs-title">Jobs Activity</h2>
            <p class="muted">Live view of queued, running, failed, canceled, and completed platform jobs.</p>
          </div>
          <div class="job-panel__actions">
            <button class="secondary-button" data-job-action="seed">Run demo jobs</button>
          </div>
        </header>

        <div class="job-summary-grid" aria-label="Job summary">
          ${renderSummaryCard("Active", activeJobs.length)}
          ${renderSummaryCard("Completed", completedJobs.filter(job => job.status === JobStatus.SUCCEEDED).length)}
          ${renderSummaryCard("Failed", failedJobs.length)}
          ${renderSummaryCard("Total", jobs.length)}
        </div>

        <div class="job-columns">
          <section>
            <h3>Queue and running jobs</h3>
            ${renderJobList(activeJobs, { empty: "No active jobs right now.", includeActions: true })}
          </section>

          <section>
            <h3>Completed history</h3>
            ${renderJobList(completedJobs, { empty: "No completed jobs yet.", includeActions: true, limit: 8 })}
          </section>
        </div>
      </section>
    `;
  }
}

function renderSummaryCard(label, value) {
  return `
    <article>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function renderJobList(jobs, { empty, includeActions = false, limit = null } = {}) {
  const visibleJobs = typeof limit === "number" ? jobs.slice(0, limit) : jobs;

  if (!visibleJobs.length) {
    return `<div class="empty-card compact-empty">${escapeHtml(empty)}</div>`;
  }

  return `
    <div class="job-list">
      ${visibleJobs.map(job => renderJobCard(job, { includeActions })).join("")}
    </div>
  `;
}

function renderJobCard(job, { includeActions }) {
  const progress = job.progress || { percent: 0, current: 0, total: 1, label: "Queued" };
  const logs = [...(job.logs || [])].slice(-4).reverse();
  const canCancel = job.status === JobStatus.QUEUED || job.status === JobStatus.RUNNING || job.status === JobStatus.RETRYING;
  const canRetry = RETRYABLE_STATUSES.has(job.status);

  return `
    <article class="job-card job-card--${escapeHtml(job.status)}">
      <header class="job-card__header">
        <div>
          <h4>${escapeHtml(job.title || JobTypeLabels[job.type] || job.type)}</h4>
          <p class="muted">${escapeHtml(JobTypeLabels[job.type] || job.type)} · ${formatDate(job.createdAt)}</p>
        </div>
        <span class="status-pill status-pill--${escapeHtml(job.status)}">${escapeHtml(job.status)}</span>
      </header>

      <div class="progress-row" aria-label="${escapeHtml(progress.percent)} percent complete">
        <div class="progress-track"><span style="width: ${clampPercent(progress.percent)}%"></span></div>
        <strong>${escapeHtml(progress.percent)}%</strong>
      </div>
      <p class="muted">${escapeHtml(progress.label)} · ${escapeHtml(progress.current)} / ${escapeHtml(progress.total)}</p>

      ${renderJobError(job)}
      ${renderLogs(logs)}
      ${includeActions ? renderActions(job.id, { canCancel, canRetry }) : ""}
    </article>
  `;
}

function renderJobError(job) {
  if (!job.error) return "";
  return `<p class="job-error">${escapeHtml(job.error.message || "Job failed.")}</p>`;
}

function renderLogs(logs) {
  if (!logs.length) return "";

  return `
    <details class="job-logs">
      <summary>Latest logs</summary>
      <ol>
        ${logs.map(log => `
          <li>
            <span class="log-level log-level--${escapeHtml(log.level)}">${escapeHtml(log.level)}</span>
            <span>${formatDate(log.timestamp)}</span>
            <p>${escapeHtml(log.message)}</p>
          </li>
        `).join("")}
      </ol>
    </details>
  `;
}

function renderActions(jobId, { canCancel, canRetry }) {
  if (!canCancel && !canRetry) return "";

  return `
    <div class="job-actions">
      ${canCancel ? `<button data-job-action="cancel" data-job-id="${escapeHtml(jobId)}">Cancel</button>` : ""}
      ${canRetry ? `<button data-job-action="retry" data-job-id="${escapeHtml(jobId)}">Retry</button>` : ""}
    </div>
  `;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function formatDate(value) {
  if (!value) return "Not started";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
