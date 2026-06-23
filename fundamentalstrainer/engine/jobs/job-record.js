import { JobStatus } from "./job-status.js";

export function createJobRecord({
  type,
  title,
  payload = {},
  metadata = {},
  maxAttempts = 1,
  id = createJobId(type)
}) {
  if (!type) throw new Error("Job type is required.");

  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0.0",
    id,
    type,
    title: title || type,
    status: JobStatus.QUEUED,
    payload,
    metadata,
    progress: {
      current: 0,
      total: 1,
      percent: 0,
      label: "Queued"
    },
    attempts: {
      current: 0,
      max: maxAttempts
    },
    result: null,
    error: null,
    logs: [createJobLog("info", "Job queued.")],
    createdAt: now,
    updatedAt: now,
    startedAt: null,
    finishedAt: null
  };
}

export function createJobLog(level, message, data = null) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    data
  };
}

export function updateJobProgress(job, progress = {}) {
  const total = Number(progress.total ?? job.progress.total ?? 1) || 1;
  const current = Math.min(Number(progress.current ?? job.progress.current ?? 0) || 0, total);
  const percent = Math.round((current / total) * 100);

  job.progress = {
    current,
    total,
    percent,
    label: progress.label ?? job.progress.label ?? "Working"
  };
  touch(job);
  return job;
}

export function addJobLog(job, level, message, data = null) {
  job.logs.push(createJobLog(level, message, data));
  touch(job);
  return job;
}

export function markJobRunning(job) {
  job.status = JobStatus.RUNNING;
  job.attempts.current += 1;
  job.startedAt = job.startedAt || new Date().toISOString();
  addJobLog(job, "info", `Job started. Attempt ${job.attempts.current} of ${job.attempts.max}.`);
  return job;
}

export function markJobSucceeded(job, result = null) {
  job.status = JobStatus.SUCCEEDED;
  job.result = result;
  job.error = null;
  updateJobProgress(job, { current: job.progress.total, total: job.progress.total, label: "Complete" });
  job.finishedAt = new Date().toISOString();
  addJobLog(job, "info", "Job succeeded.");
  return job;
}

export function markJobFailed(job, error) {
  job.status = JobStatus.FAILED;
  job.error = serializeError(error);
  job.finishedAt = new Date().toISOString();
  addJobLog(job, "error", "Job failed.", job.error);
  return job;
}

export function markJobCanceled(job, reason = "Canceled") {
  job.status = JobStatus.CANCELED;
  job.finishedAt = new Date().toISOString();
  addJobLog(job, "warn", reason);
  return job;
}

export function markJobRetrying(job, error) {
  job.status = JobStatus.RETRYING;
  job.error = serializeError(error);
  addJobLog(job, "warn", "Job will retry.", job.error);
  return job;
}

export function canRetryJob(job) {
  return job.attempts.current < job.attempts.max;
}

function createJobId(type) {
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8);
  return `job.${type}.${stamp}.${random}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function touch(job) {
  job.updatedAt = new Date().toISOString();
}

function serializeError(error) {
  if (!error) return null;
  return {
    name: error.name || "Error",
    message: error.message || String(error),
    stack: error.stack || null
  };
}
