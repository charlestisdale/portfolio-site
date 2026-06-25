# IT Learning Platform Starter

This project is organized as a reusable learning platform instead of a single quiz app.

## Core rule

The `engine/` folder must not contain certification-specific content. All certification-specific data belongs in `content/`.

Knowledge is the source of truth. Learn mode, search, assessments, flashcards, PBQs, analytics, graph exploration, recommendations, and future AI tutoring should be generated from canonical knowledge objects instead of separate duplicate content sets.

## Current phase

The platform foundation is active: Knowledge Engine, Learn mode, Search mode, Dashboard, Jobs, local progress tracking, assessment generation, assessment attempt history, and an interactive Knowledge Graph explorer.

The ingestion direction is transcript-triggered AI enrichment. Transcripts identify what topics matter; AI expands those topics into learner-ready draft Knowledge Objects using general IT knowledge when the transcript is incomplete; human review promotes only accurate, useful, deduplicated knowledge into the canonical store.

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
- explore Knowledge Object relationships in Graph mode
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

The transcript is not the final knowledge source. It is the trigger that tells the system what knowledge to build.

```text
source material
→ cleaner
→ transcript-triggered topic discovery
→ AI enrichment into learner-ready draft Knowledge Objects
→ normalization and quality audit
→ duplicate detection
→ promotion review
→ import report
→ merge plan
→ dry run
→ controlled write or pull request
→ validation
→ canonical Knowledge Objects
```

Review means checking whether the enriched Knowledge Object is accurate, useful, deduplicated, and ready to become canonical. Do not approve raw transcript mentions as knowledge.

A weak sentence such as:

```text
Another popular file system you might run into is ext4.
```

is only transcript evidence that the topic appeared. It should either trigger a useful enriched `filesystems.ext4` draft or be rejected as `mentioned-only`. It should not become the learning summary.

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

Generate a transcript-triggered AI import prompt:

```bash
npm run ai:import:prompt -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
```

Save the AI response under:

```text
data/ai-imports/responses/
```

Normalize the AI response into pending review candidates:

```bash
npm run ai:import:normalize -- --file=data/ai-imports/responses/16-response.json
```

Review/import commands:

```bash
npm run ingest:duplicates -- --file=data/imports/pending/16-ai-candidates.json
npm run ingest:report -- --file=data/imports/pending/16-ai-candidates.json
npm run ingest:merge -- --file=data/imports/pending/16-ai-candidates.json
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
tools/ai/create-ai-import-prompt.mjs
tools/ai/normalize-ai-import.mjs
docs/transcript-triggered-enrichment.md
content/knowledge/_templates/knowledge-object.template.json
data/imports/a-plus-220-1202/import-record.template.json
content/indexes/knowledge-index.json
content/relationships/a-plus-220-1202.graph.json
docs/admin-upload-security.md
docs/graph-visualizer.md
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
docs/transcript-triggered-enrichment.md
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

## Interactive Knowledge Graph

Graph mode is a learner-facing explorer for canonical Knowledge Object relationships. It must stay downstream of Knowledge Objects and the Knowledge Engine; it should not define content itself.

Current graph files:

```text
engine/modes/graph-visualizer.js
engine/modes/graph-auto-center.js
graph-visualizer.css
```

Current graph controls include:

```text
Focused | Expanded | Reset nodes | Zoom in | Zoom out | Fit graph | Center | Open active in Learn | Expand graph
```

Important graph behavior:

- Clicking graph nodes stays in Graph mode.
- `Center` centers the active node and belongs in the main toolbar, not beside search.
- `Fit graph` fits all visible graph nodes in the current canvas.
- `Reset view` was intentionally removed.
- `Reset nodes` only clears saved manual node positions.
- Expanded graph mode is canvas-focused and exits with Escape.
- Open active in Learn should land at the top of Learn mode.
- The graph world is fixed at `1180 x 760`; do not stretch one graph layer without the others or relationship lines can drift.

See `docs/graph-visualizer.md` for the current graph handoff, known-good behavior, and future graph roadmap.
