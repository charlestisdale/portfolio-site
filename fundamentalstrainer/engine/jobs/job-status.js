export const JobStatus = Object.freeze({
  QUEUED: "queued",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  CANCELED: "canceled",
  RETRYING: "retrying"
});

export const TerminalJobStatuses = Object.freeze([
  JobStatus.SUCCEEDED,
  JobStatus.FAILED,
  JobStatus.CANCELED
]);

export function isTerminalJobStatus(status) {
  return TerminalJobStatuses.includes(status);
}
