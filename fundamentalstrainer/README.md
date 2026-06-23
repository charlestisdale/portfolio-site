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

## Canonical knowledge object schema

The platform now uses `tools/knowledge-object.schema.json` as the canonical shape for every concept. The template lives at:

```text
content/knowledge/_templates/knowledge-object.template.json
```

Field rules are documented in:

```text
tools/knowledge-object-field-guide.md
```

Validate all knowledge objects with:

```bash
npm run validate:knowledge
```

The current sample objects are:

```text
content/knowledge/windows/task-manager.json
content/knowledge/commands/ipconfig.json
```

Important rule: do not write quiz questions directly during transcript ingestion. Add facts, examples, common mistakes, scenarios, PBQ ideas, and relationships to the knowledge object. Assessment files should be generated later from those objects.

## Data architecture layer

The project now includes canonical architecture documentation and schemas for the full content ecosystem, not only knowledge objects.

```text
docs/data-architecture.md
docs/id-conventions.md
docs/relationship-types.md
```

Additional schemas:

```text
tools/schemas/certification.schema.json
tools/schemas/objective.schema.json
tools/schemas/lesson.schema.json
tools/schemas/relationship.schema.json
tools/schemas/assessment.schema.json
tools/schemas/media.schema.json
tools/schemas/progress.schema.json
tools/schemas/search-index.schema.json
```

Validate both knowledge content and architecture references:

```bash
npm run validate:all
```

## ID rule summary

Knowledge objects use reusable concept IDs like:

```text
commands.ipconfig
windows.task-manager
networking.dns
```

Certification mapping belongs inside manifests and knowledge objects. Do not create certification-specific duplicates like `a-plus-220-1202.commands.ipconfig` unless the concept truly only exists in that certification.

Relationships are graph edges:

```text
rel.commands.ipconfig.uses.networking.dhcp
```

This supports future concept maps, prerequisite paths, AI tutor context, analytics, and assessment generation.


## Transcript Ingestion Review System

The platform now uses a safe import pipeline:

```text
raw transcript
→ cleaned transcript
→ candidate concepts
→ duplicate detection
→ human review
→ import report
→ approved draft knowledge objects
```

Useful commands:

```bash
npm run ingest:extract -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
npm run ingest:duplicates -- --file=data/imports/pending/16-candidates.json
npm run ingest:report -- --file=data/imports/pending/16-candidates.json
npm run ingest:merge -- --file=data/imports/pending/16-candidates.json
```

The merge command is a dry run by default. Use `--dry-run=false` only after every candidate has been reviewed.

See `tools/ingestion/review-workflow.md`.

## Ingestion Review UI

A browser-based review interface is available at:

```text
review.html
```

Build the pending-import manifest first:

```bash
npm run review:manifest
```

Then serve the folder locally:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000/review.html
```

The review UI lets you approve, reject, or merge transcript-derived candidate concepts before they are allowed into the trusted knowledge base.

## Knowledge Engine

The platform now includes a certification-neutral internal Knowledge Engine under `engine/knowledge/`. UI code should use this API instead of loading raw knowledge JSON directly.

Important calls:

```js
knowledge.get(id)
knowledge.search(query)
knowledge.related(id)
knowledge.objective(objectiveId)
knowledge.lesson(lessonId)
knowledge.certification(certId)
knowledge.commands()
knowledge.scenarios()
knowledge.examTips()
knowledge.pbqIdeas()
knowledge.statistics()
knowledge.graph()
```

See `docs/knowledge-engine.md` for usage and design rules.
