import { JobStatus, isTerminalJobStatus } from "./job-status.js";
import {
  addJobLog,
  canRetryJob,
  createJobRecord,
  markJobCanceled,
  markJobFailed,
  markJobRetrying,
  markJobRunning,
  markJobSucceeded,
  updateJobProgress
} from "./job-record.js";
import { InMemoryJobStore } from "./job-store.js";
import { JobRegistry } from "./job-registry.js";

export class JobCanceledError extends Error {
  constructor(message = "Job canceled by user.") {
    super(message);
    this.name = "JobCanceledError";
  }
}

export class JobRunner {
  constructor({ registry = new JobRegistry(), store = new InMemoryJobStore(), concurrency = 1 } = {}) {
    this.registry = registry;
    this.store = store;
    this.concurrency = Math.max(1, concurrency);
    this.queue = [];
    this.running = new Set();
    this.cancellationRequests = new Map();
  }

  register(type, handler, options = {}) {
    this.registry.register(type, handler, options);
    return this;
  }

  enqueue({ type, title, payload = {}, metadata = {}, maxAttempts = null }) {
    const handlerEntry = this.registry.get(type);
    const job = createJobRecord({
      type,
      title,
      payload,
      metadata,
      maxAttempts: maxAttempts || handlerEntry.defaultMaxAttempts || 1
    });

    this.store.save(job);
    this.queue.push(job.id);
    this.tick();
    return this.store.get(job.id);
  }

  async tick() {
    while (this.running.size < this.concurrency && this.queue.length) {
      const jobId = this.queue.shift();
      const job = this.store.get(jobId);
      if (!job || isTerminalJobStatus(job.status)) continue;
      this.run(jobId);
    }
  }

  async run(jobId) {
    this.running.add(jobId);
    this.cancellationRequests.delete(jobId);

    try {
      let job = this.store.update(jobId, markJobRunning);
      const handlerEntry = this.registry.get(job.type);
      const context = this.createContext(job.id);
      const result = await handlerEntry.handler(job.payload, context, job);

      if (this.isCancellationRequested(job.id)) {
        this.store.update(job.id, current => markJobCanceled(current, this.getCancellationReason(job.id)));
      } else {
        this.store.update(job.id, current => markJobSucceeded(current, result));
      }
    } catch (error) {
      const current = this.store.get(jobId);

      if (error instanceof JobCanceledError || this.isCancellationRequested(jobId)) {
        if (current) this.store.update(jobId, job => markJobCanceled(job, error.message || this.getCancellationReason(jobId)));
      } else if (current && canRetryJob(current)) {
        this.store.update(jobId, job => markJobRetrying(job, error));
        this.store.update(jobId, job => {
          job.status = JobStatus.QUEUED;
          return job;
        });
        this.queue.push(jobId);
      } else if (current) {
        this.store.update(jobId, job => markJobFailed(job, error));
      }
    } finally {
      this.running.delete(jobId);
      this.cancellationRequests.delete(jobId);
      this.tick();
    }
  }

  cancel(jobId, reason = "Job canceled by user.") {
    const job = this.store.get(jobId);
    if (!job) return null;

    this.queue = this.queue.filter(id => id !== jobId);
    if (this.running.has(jobId)) {
      this.cancellationRequests.set(jobId, reason);
      this.store.update(jobId, current => {
        addJobLog(current, "warn", "Cancel requested. The running job will stop at the next safe checkpoint.");
        return current;
      });
      return this.store.get(jobId);
    }

    return this.store.update(jobId, current => markJobCanceled(current, reason));
  }

  retry(jobId, reason = "Manual retry requested.") {
    const job = this.store.get(jobId);
    if (!job) return null;
    if (!isTerminalJobStatus(job.status)) return job;

    const retryableStatus = job.status === JobStatus.FAILED || job.status === JobStatus.CANCELED;
    if (!retryableStatus) return job;

    const updated = this.store.update(jobId, current => {
      current.status = JobStatus.QUEUED;
      current.error = null;
      current.finishedAt = null;
      current.progress = {
        current: 0,
        total: current.progress?.total || 1,
        percent: 0,
        label: "Queued for retry"
      };

      if (current.attempts.current >= current.attempts.max) {
        current.attempts.max = current.attempts.current + 1;
      }

      addJobLog(current, "info", reason);
      return current;
    });

    this.cancellationRequests.delete(jobId);
    this.queue.push(jobId);
    this.tick();
    return updated;
  }

  get(id) {
    return this.store.get(id);
  }

  list(filters = {}) {
    return this.store.list(filters);
  }

  isCancellationRequested(jobId) {
    return this.cancellationRequests.has(jobId);
  }

  getCancellationReason(jobId) {
    return this.cancellationRequests.get(jobId) || "Job canceled by user.";
  }

  createContext(jobId) {
    return {
      getJob: () => this.store.get(jobId),
      progress: progress => this.store.update(jobId, job => updateJobProgress(job, progress)),
      log: (level, message, data = null) => this.store.update(jobId, job => addJobLog(job, level, message, data)),
      isCanceled: () => this.isCancellationRequested(jobId),
      throwIfCanceled: () => {
        if (this.isCancellationRequested(jobId)) {
          throw new JobCanceledError(this.getCancellationReason(jobId));
        }
      }
    };
  }
}
