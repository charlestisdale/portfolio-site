# IT Learning Platform Starter

This project is organized as a reusable learning platform instead of a single quiz app.

## Core rule

The `engine/` folder must not contain certification-specific content. All certification-specific data belongs in `content/`.

Knowledge is the source of truth. Learn mode, search, assessments, flashcards, PBQs, analytics, graph exploration, recommendations, and future AI tutoring should be generated from canonical knowledge objects instead of separate duplicate content sets.

Curriculum controls teaching order. Study paths should be generated from curriculum mappings, not raw transcript lesson order and not ad-hoc `Unmapped Knowledge` buckets.

## Current phase

The platform foundation is active: Knowledge Engine, Learn mode, Search mode, Dashboard, Jobs, local progress tracking, assessment generation, assessment attempt history, and an interactive Knowledge Graph explorer.

The ingestion direction is transcript-triggered AI deep enrichment. Transcripts identify what topics matter; AI acts as a subject-matter author and expands those topics into learner-ready draft Knowledge Objects using broader IT knowledge; human review promotes only accurate, useful, deduplicated knowledge into the canonical store.

The Curriculum Engine foundation is active. Curriculum files reference reviewed Knowledge Objects and organize them into certification sections/modules with outcomes and temporary auto-map rules. Knowledge Objects remain reusable and certification-agnostic. AI imports now include reviewable `curriculumSuggestions` so new objects can propose where they belong in the Path system.

The public portfolio version must remain learner-only and content-read-only. Upload/import workflows belong in local development or a future authenticated admin backend, not in the public learner UI.

## Permanent design statement

Teach the concept, not the transcript.

The transcript is evidence that a topic appeared in a lesson. The Knowledge Object is the learning product. AI is expected to use its broader IT knowledge to create dense, useful, reviewable learning content, not just repeat source wording.

```text
Transcript = topic trigger
AI = subject-matter author
Human = verifier and promoter
Knowledge Object = canonical learning unit
Curriculum = where the unit is taught
```

## Architecture

```text
Video / instructional source
    ↓
Transcript / source text
    ↓
AI topic discovery
    ↓
AI deep knowledge enrichment
    ↓
Pending Knowledge Object candidates
    ↓
Normalization and quality audit
    ↓
Duplicate detection
    ↓
Human promotion review
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ↓
Learning Engine
        ├── Study Paths
        ├── Flashcards
        ├── PBQs
        ├── Assessments
        ├── AI Tutor
        ├── Recommendations
        └── Analytics
```

```text
engine/                  Reusable learning engine only
content/                 Certification/objective/knowledge/curriculum data
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
- follow curriculum-based study paths
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
→ least-destructive cleaner
→ transcript-triggered topic discovery
→ AI deep enrichment into learner-ready draft Knowledge Objects
→ normalization and quality audit
→ duplicate detection
→ promotion review
→ safe approved export audit
→ controlled promotion
→ validation
→ canonical Knowledge Objects
→ graph relationships
→ curriculum mapping
```

Review means checking whether the enriched Knowledge Object is accurate, useful, deduplicated, and ready to become canonical. Do not approve raw transcript mentions as knowledge.

A weak sentence such as:

```text
Another popular file system you might run into is ext4.
```

is only transcript evidence that the topic appeared. It should either trigger a useful enriched `filesystems.ext4` draft or be rejected as `mentioned-only`. It should not become the learning summary.

The promotion command should stay audit-first and safe. Use unsafe promotion only for deliberate testing.

## AI authoring rule

AI import is expected to produce deep, reviewable learning candidates. Important candidates should include:

- summaries
- multi-paragraph explanations
- atomic facts
- examples
- scenarios
- exam tips
- common mistakes
- PBQ ideas
- suggested graph relationships
- curriculum suggestions
- source evidence
- confidence and review metadata

The AI should use general IT knowledge aggressively and carefully. Source evidence proves why the topic was triggered; enriched facts still require human review.

See:

```text
docs/ai-authoring-philosophy.md
docs/transcript-triggered-enrichment.md
docs/ingestion-pipeline.md
```

## Curriculum rule

Curriculum is a separate layer from Knowledge Objects and the Knowledge Graph.

```text
Knowledge Object = what the learner needs to know
Knowledge Graph = how concepts relate
Curriculum = where and when concepts are taught
```

Curriculum files live under:

```text
content/curriculum/
```

The current starter curriculum is:

```text
content/curriculum/a-plus-220-1202/curriculum.json
```

The design document is:

```text
docs/curriculum-engine.md
```

The schema is:

```text
tools/schemas/curriculum.schema.json
```

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
npm run ai:import:prompt -- --lesson=16 --file="data/transcripts/cleaned/a-plus-220-1202/16-example.txt"
```

Save the AI response under:

```text
data/ai-imports/responses/
```

Normalize the AI response into pending review candidates:

```bash
npm run ai:import:normalize -- --file="data/ai-imports/responses/16-response.json"
```

Review/import commands:

```bash
npm run ingest:duplicates -- --file="data/imports/pending/16-ai-candidates.json"
npm run review:manifest
```

After browser review, audit the exported approved Knowledge Objects:

```bash
npm run knowledge:audit-export -- --file="approved-knowledge-objects.json"
```

Promote safely:

```bash
npm run knowledge:promote -- --file="approved-knowledge-objects.json"
```

Validate everything:

```bash
npm run validate:all
```

Serve locally:

```bash
npx serve .
```

## Important files

```text
docs/project-vision.md
docs/ai-authoring-philosophy.md
docs/ingestion-pipeline.md
docs/transcript-triggered-enrichment.md
docs/curriculum-engine.md
tools/knowledge-object.schema.json
tools/import-record.schema.json
tools/schemas/curriculum.schema.json
tools/ingestion-workflow.md
tools/ingestion/review-workflow.md
tools/ingestion/review-candidates.mjs
tools/ai/create-ai-import-prompt.mjs
tools/ai/normalize-ai-import.mjs
content/curriculum/a-plus-220-1202/curriculum.json
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

Important rule: do not write quiz questions directly during ingestion. Add facts, examples, common mistakes, scenarios, PBQ ideas, and relationships to the knowledge object. Assessment files should be generated later from those objects.

## Data architecture layer

The project includes canonical architecture documentation and schemas for the full content ecosystem.

```text
docs/project-vision.md
docs/data-architecture.md
docs/id-conventions.md
docs/relationship-types.md
docs/transcript-triggered-enrichment.md
docs/curriculum-engine.md
docs/ai-authoring-philosophy.md
docs/ingestion-pipeline.md
```

Additional schemas:

```text
tools/schemas/certification.schema.json
tools/schemas/objective.schema.json
tools/schemas/lesson.schema.json
tools/schemas/curriculum.schema.json
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

Curriculum mapping is not the same as a graph edge. Curriculum says where a concept is taught; graph edges say how concepts relate.

## Knowledge Engine

The platform includes a certification-neutral internal Knowledge Engine under `engine/knowledge/`. UI code should use this API instead of loading raw knowledge JSON directly.

Important calls:

```js
knowledge.get(id)
knowledge.search(query)
knowledge.related(id)
knowledge.objective(objectiveId)
knowledge.lesson(lessonId)
knowledge.curriculum(curriculumId)
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
