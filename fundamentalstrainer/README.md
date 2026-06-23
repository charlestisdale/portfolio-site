# IT Learning Platform Starter

This project is organized as a reusable learning platform instead of a single quiz app.

## Core rule

The `engine/` folder must not contain certification-specific content. All certification-specific data belongs in `content/`.

Knowledge is the source of truth. Learn mode, search, assessments, flashcards, PBQs, analytics, and future AI tutoring should be generated from canonical knowledge objects instead of separate duplicate content sets.

## Current phase

The platform foundation is active: Knowledge Engine, Learn mode, Search mode, Dashboard, Jobs, local progress tracking, assessment generation, and assessment attempt history.

The public portfolio version must remain learner-only and content-read-only. Upload/import workflows belong in local development or a future authenticated admin backend, not in the public learner UI.

## Architecture

```text
engine/                  Reusable learning engine only
content/                 Certification/objective/knowledge data
data/transcripts/raw/    Local/private raw source files only
data/transcripts/cleaned Local/private cleaned source text only
data/imports/            Local/private ingestion and review records
tools/                   Schemas and ingestion utilities
docs/                    Architecture and safety documentation
```

## Public safety boundary

The deployed learner app should allow users to:

- learn from existing reviewed content
- search concepts
- generate practice assessments
- save local browser progress
- save local browser assessment history

The deployed learner app should not allow users to:

- upload files into the real knowledge base
- modify trusted content
- write directly to GitHub or content files
- access raw source material
- access private source provenance records
- trigger real merge/write jobs

See:

```text
docs/admin-upload-security.md
```

## Source provenance rule

Public-facing content should use generic wording such as:

- reviewed source material
- imported study material
- training source reference
- transcript reference

Avoid public labels that expose exact third-party source names, video titles, course names, providers, or raw transcript text unless the material is owned, licensed, or explicitly approved for public use.

Specific provenance can remain in private/admin-only records when needed for review and audit.

## Safe ingestion workflow

No source material should enter the trusted knowledge base directly.

```text
source material
→ cleaner
→ candidate extraction
→ duplicate detection
→ human review
→ import report
→ merge plan
→ dry run
→ controlled write or pull request
→ validation
```

The merge command should stay dry-run-first. Use real writes only after review and validation.

## Example local commands

Clean a local/private transcript:

```bash
node tools/ingestion/clean-srt.mjs \
  data/transcripts/raw/a-plus-220-1202/16-lesson-title.srt \
  data/transcripts/cleaned/a-plus-220-1202/16-lesson-title.txt
```

Create an import record:

```bash
node tools/ingestion/create-import-record.mjs a-plus-220-1202 16 "Lesson Title"
```

Review/import commands:

```bash
npm run ingest:extract -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
npm run ingest:duplicates -- --file=data/imports/pending/16-candidates.json
npm run ingest:report -- --file=data/imports/pending/16-candidates.json
npm run ingest:merge -- --file=data/imports/pending/16-candidates.json
```

Build the pending-import manifest for local review:

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

The review UI is for local/admin review. It should not become a public upload feature without the backend controls documented in `docs/admin-upload-security.md`.

## Important files

```text
tools/knowledge-object.schema.json
tools/import-record.schema.json
tools/ingestion-workflow.md
tools/ingestion/review-workflow.md
content/knowledge/_templates/knowledge-object.template.json
data/imports/a-plus-220-1202/import-record.template.json
content/indexes/knowledge-index.json
content/relationships/a-plus-220-1202.graph.json
docs/admin-upload-security.md
```

## Canonical knowledge object schema

The platform uses `tools/knowledge-object.schema.json` as the canonical shape for every concept. The template lives at:

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

Validate both knowledge content and architecture references:

```bash
npm run validate:all
```

The current sample objects are:

```text
content/knowledge/windows/task-manager.json
content/knowledge/commands/ipconfig.json
```

Important rule: do not write quiz questions directly during ingestion. Add facts, examples, common mistakes, scenarios, PBQ ideas, and relationships to the knowledge object. Assessment files should be generated later from those objects.

## Data architecture layer

The project includes canonical architecture documentation and schemas for the full content ecosystem.

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

## Knowledge Engine

The platform includes a certification-neutral internal Knowledge Engine under `engine/knowledge/`. UI code should use this API instead of loading raw knowledge JSON directly.

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
