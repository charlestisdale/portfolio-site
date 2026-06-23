# Job System Foundation

## Purpose

The job system provides a reusable way to run longer platform operations without hard-coding one-off script flows.

This is important because the platform will eventually need to process large batches:

- Transcript imports
- Review package generation
- Merge plan creation
- Filesystem writes
- Validation
- Search index rebuilds
- Knowledge graph rebuilds
- Assessment generation

Instead of each feature inventing its own workflow, everything can be represented as a job.

## Location

```text
fundamentalstrainer/engine/jobs/
```

Modules:

```text
job-status.js      Shared job statuses and terminal-state helpers.
job-types.js       Platform job type constants.
job-record.js      Canonical job record model and state transitions.
job-registry.js    Registry for job handlers.
job-store.js       In-memory job persistence.
job-runner.js      In-memory queue and runner.
job-pipeline.js    Ordered pipeline helper.
index.js           Public exports.
```

## Job Record Shape

A job includes:

```text
id
type
title
status
payload
metadata
progress
attempts
result
error
logs
createdAt
updatedAt
startedAt
finishedAt
```

Statuses:

```text
queued
running
succeeded
failed
canceled
retrying
```

## Example Usage

```js
import { JobRunner, JobType } from "./engine/jobs/index.js";

const runner = new JobRunner();

runner.register(JobType.IMPORT_TRANSCRIPT, async (payload, job) => {
  job.progress({ current: 1, total: 3, label: "Cleaning transcript" });
  job.log("info", "Transcript cleaned.");

  job.progress({ current: 2, total: 3, label: "Extracting concepts" });
  job.log("info", "Concept candidates extracted.");

  job.progress({ current: 3, total: 3, label: "Generating import report" });
  return { reportPath: payload.outputPath };
});

const queued = runner.enqueue({
  type: JobType.IMPORT_TRANSCRIPT,
  title: "Import lesson 16 transcript",
  payload: {
    sourceFile: "16-Example.en.srt",
    outputPath: "content/imports/review-queue/16-example.json"
  },
  maxAttempts: 2
});

console.log(queued.id);
```

## Pipeline Example

```js
import { createJobPipeline, enqueuePipeline, JobType } from "./engine/jobs/index.js";

const pipeline = createJobPipeline({
  id: "pipeline.a-plus-1202.lesson-16",
  title: "Import A+ Core 2 lesson 16",
  steps: [
    { type: JobType.IMPORT_TRANSCRIPT, title: "Import transcript" },
    { type: JobType.REVIEW_PACKAGE_CREATE, title: "Create review package" },
    { type: JobType.VALIDATION_RUN, title: "Validate import report" }
  ]
});

const jobs = enqueuePipeline(runner, pipeline);
```

## Current Scope

The first version is intentionally in-memory.

That means it is safe for the current static/local workflow and does not require a database, server, or queue service.

Later, the same job model can be backed by:

- IndexedDB
- SQLite
- PostgreSQL
- A backend API
- A cloud queue

## Design Rules

1. Every long-running operation should become a job.
2. Jobs should expose progress, logs, results, and errors.
3. Job handlers should be registered by type.
4. The runner should not know certification-specific details.
5. Failed jobs should support retry metadata.
6. Job records should be serializable JSON.
7. The in-memory runner is a foundation, not a final backend.

## Next Step

Wire existing import and merge tools into job handlers:

```text
IMPORT_TRANSCRIPT
  -> runTranscriptImportPipeline()

MERGE_PLAN_CREATE
  -> planReviewedImportMerge()

MERGE_PLAN_APPLY
  -> writeMergePlanFiles()

VALIDATION_RUN
  -> validation system
```

After that, the UI can show a Jobs/Activity panel with progress, status, and logs.
