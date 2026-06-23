# Transcript Import Pipeline

## Purpose

The import pipeline converts certification lesson transcripts into reviewable knowledge candidates.

It must never write directly into the approved knowledge base.

The platform's rule is:

```text
Transcript -> Import Report -> Review Queue -> Approved Knowledge Object
```

## Current Pipeline

Location:

```text
fundamentalstrainer/tools/import/
```

Modules:

```text
transcript-cleaner.js        Parses SRT and groups captions into readable segments.
concept-extractor.js         Extracts conservative candidate concepts and commands.
duplicate-detector.js        Compares candidates against existing knowledge objects.
relationship-suggester.js    Suggests graph relationships for review.
import-report.js             Builds a reviewable import report.
pipeline.js                  Orchestrates the full pipeline.
index.js                     Public exports.
```

## Import Flow

```text
.srt file
  -> cleanTranscript()
  -> extractCandidateConcepts()
  -> detectDuplicateCandidates()
  -> suggestRelationships()
  -> buildImportReport()
```

## Design Rules

1. The importer creates candidates, not final content.
2. Every candidate must keep transcript evidence.
3. Duplicate detection should warn, not merge automatically.
4. Relationship suggestions should be reviewable graph edges.
5. The pipeline must remain certification-neutral where possible.
6. Assessment generation should stay disabled until the knowledge base is stronger.

## Example Usage

```js
import { runTranscriptImportPipeline } from "./tools/import/index.js";

const report = runTranscriptImportPipeline({
  srtText,
  existingObjects: knowledge.all(),
  sourceFile: "16-Example Lesson.en.srt",
  lessonId: "16",
  lessonTitle: "Example Lesson",
  certificationId: "a-plus-220-1202",
  examCode: "220-1202",
  domainHints: ["windows"],
  idStyle: "dot"
});

console.log(report.summary);
```

## Report Output

The report includes:

- Source transcript metadata
- Candidate counts
- Duplicate review queues
- Relationship suggestions
- Full candidate objects with evidence

The review UI should use this report to let the reviewer:

- Approve
- Reject
- Merge
- Edit
- Export

## Current Limitation

The current extractor is intentionally conservative and rule-based. It finds obvious Windows tools and command-line utilities first. Later, this can be upgraded with a stronger concept extraction step while keeping the same report format.
