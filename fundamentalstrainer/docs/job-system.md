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
job-status.js             Shared job statuses and terminal-state helpers.
job-types.js              Platform job type constants.
job-record.js             Canonical job record model and state transitions.
job-registry.js           Registry for job handlers.
job-store.js              In-memory job persistence.
job-runner.js             In-memory queue and runner.
job-pipeline.js           Ordered pipeline helper.
platform-job-handlers.js  Registers handlers for import, merge, apply, and validation jobs.
index.js                  Public exports.
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

## Platform Job Handlers

The platform now has handler registration for core workflow jobs:

```text
IMPORT_TRANSCRIPT
  -> runTranscriptImportPipeline()

MERGE_PLAN_CREATE
  -> planReviewedImportMerge()

MERGE_PLAN_APPLY
  -> writeMergePlanFiles()

VALIDATION_RUN
  -> validation dependency, or placeholder result until validation is wired in
```

## Example Usage

```js
import {
  JobRunner,
  JobType,
  registerPlatformJobHandlers
} from "./engine/jobs/index.js";

const runner = new JobRunner();

registerPlatformJobHandlers(runner, {
  readText: async path => "...srt text...",
  readJson: async path => ({ /* json */ }),
  writeJson: async (path, data) => console.log(path, data),
  getExistingObjects: async () => [],
  getKnowledgeIndex: async () => ({ objects: [] }),
  getRelationshipGraph: async certificationId => ({
    schemaVersion: "1.0.0",
    certification: certificationId,
    relationships: []
  }),
  projectRoot: "."
});

const queued = runner.enqueue({
  type: JobType.IMPORT_TRANSCRIPT,
  title: "Import lesson 16 transcript",
  payload: {
    sourcePath: "transcripts/16-example.en.srt",
    outputPath: "content/imports/review-queue/16-example.json",
    lessonId: "16",
    lessonTitle: "Example Lesson",
    certificationId: "a-plus-220-1202",
    examCode: "220-1202",
    domainHints: ["windows"]
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
    { type: JobType.MERGE_PLAN_CREATE, title: "Create merge plan" },
    { type: JobType.MERGE_PLAN_APPLY, title: "Apply merge plan" },
    { type: JobType.VALIDATION_RUN, title: "Validate content" }
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
8. The job system should call the Knowledge Engine API and tool services; it should not replace them.

## Next Step

Add a Jobs/Activity panel to the UI so users can see:

- Queued jobs
- Running jobs
- Progress percentage
- Logs
- Results
- Failures
- Retry/cancel actions
