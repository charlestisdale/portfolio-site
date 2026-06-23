# IT Learning Platform Starter

This project is organized as a reusable learning platform instead of a single quiz app.

## Core rule
The `engine/` folder must not contain certification-specific content. All certification-specific data belongs in `content/`.

## Current phase
Knowledge ingestion only. Do not generate quiz questions yet.

## Architecture

```text
engine/                  Reusable learning engine only
content/                 Certification/objective/knowledge data
data/transcripts/raw/    Original transcript files
data/transcripts/cleaned Cleaned transcript text
data/imports/            Per-lesson ingestion records
tools/                   Schemas and ingestion utilities
```

## Transcript workflow
1. Add raw `.srt` files to `data/transcripts/raw/<certification>/`.
2. Clean transcripts into `data/transcripts/cleaned/<certification>/`.
3. Create an import record in `data/imports/<certification>/`.
4. Extract or merge concepts into `content/knowledge/`.
5. Review knowledge objects for duplicates and relationships.
6. Generate assessments later from knowledge objects.

## Example commands

Clean a transcript:

```bash
node tools/ingestion/clean-srt.mjs \
  data/transcripts/raw/a-plus-220-1202/16-lesson-title.srt \
  data/transcripts/cleaned/a-plus-220-1202/16-lesson-title.txt
```

Create an import record:

```bash
node tools/ingestion/create-import-record.mjs a-plus-220-1202 16 "Lesson Title"
```

## Important files
- `tools/knowledge-object.schema.json`
- `tools/import-record.schema.json`
- `tools/ingestion-workflow.md`
- `content/knowledge/_templates/knowledge-object.template.json`
- `data/imports/a-plus-220-1202/import-record.template.json`
- `content/indexes/knowledge-index.json`
- `content/relationships/a-plus-220-1202.graph.json`
