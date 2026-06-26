# IT Learning Platform

An AI-powered curriculum compiler that transforms instructional material into reusable Knowledge Objects, a Knowledge Graph, curriculum mappings, and learner-facing study experiences.

This project is not a quiz app. Quizzes, flashcards, PBQs, study paths, search, tutoring, recommendations, and analytics are downstream products generated from canonical Knowledge Objects.

## Core mission

```text
Instructional sources
    ↓
Transcripts / source text
    ↓
Evidence
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Authoring
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph + Curriculum
    ↓
Learning Engine
```

Knowledge Objects are the single source of truth. The curriculum controls teaching order. The graph controls conceptual relationships. The learning engine consumes those layers; it does not create disconnected content pools.

## Current architecture

The platform is split into two major layers:

```text
engine/   reusable, certification-neutral learning platform logic
content/  certification, objective, curriculum, relationship, and Knowledge Object data
```

The AI pipeline is deliberately staged:

1. **Transcript Intelligence** discovers teachable concepts, evidence, relationship candidates, curriculum placement suggestions, merge risks, and gaps.
2. **Discovery Review** decides which concepts should be authored, merged, rejected, deferred, or enriched.
3. **Knowledge Author** writes draft Knowledge Objects only for approved concepts.
4. **Normalization and promotion** convert reviewable AI output into canonical platform data.
5. **Validation** checks the knowledge store, indexes, relationships, curriculum references, and architecture consistency.
6. **Curriculum mapping** places promoted objects into modules so they appear in the learning experience.
7. **Graph visualization** renders relationships downstream of canonical Knowledge Objects and relationship files.

## Repository layout

```text
content/knowledge/                 Canonical Knowledge Objects
content/indexes/knowledge-index.json
content/relationships/*.graph.json  Knowledge Graph relationship data
content/curriculum/                 Curriculum sections and modules
content/objectives/                 Certification objectives
content/lessons/                    Lesson metadata

data/transcripts/                  Local/private raw and cleaned source text
data/ai-imports/prompts/           Generated prompts for manual AI use
data/ai-imports/responses/         AI JSON responses
data/imports/pending/              Normalized Transcript Intelligence packages
data/imports/manifests/            Discovery manifests
data/imports/reviewed/             Normalized Discovery Review packages
data/imports/authored/             Draft Knowledge Objects

engine/                            Reusable learning engine and UI modes
tools/                             Pipeline, validation, promotion, and staging tools
docs/                              Current architecture and workflow documentation
```

## Main lesson workflow

The preferred workflow uses the staging helper so prompts and responses are handled through one temporary folder.

```bash
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
```

Use the prompt in `ai-staging/`, save the AI JSON response back into `ai-staging/`, then run:

```bash
npm run ai:stage:complete
npm run ai:stage:build -- --lesson=03
```

Repeat until the lesson has no more queued prompts. The staging builder can bootstrap prerequisite prompts, run expansion, and queue the next available AI prompt.

## Important commands

```bash
npm run ai:lesson -- --lesson=03
npm run ai:expand -- --lesson=03 --promote=true
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
npm run ai:stage:complete
npm run curriculum:map-reviewed -- --lesson=03
npm run validate:all
```

See `docs/developer/commands.md` for the full command reference.

## Documentation map

Start here:

```text
docs/project-vision.md
docs/architecture/overview.md
docs/architecture/project-philosophy.md
docs/ai/automation.md
docs/ai/staging-workflow.md
docs/pipeline/lesson-processing.md
docs/developer/commands.md
docs/graph-visualizer.md
```

Architecture decisions live under:

```text
docs/architecture/architecture-decisions/
```

## Design principles

1. Knowledge Objects are canonical.
2. AI discovers before it authors.
3. Every AI output is reviewable.
4. Relationships are first-class graph data.
5. Curriculum mapping is separate from graph relationships.
6. Certification content belongs in `content/`, not `engine/`.
7. Validation is mandatory before trusting promoted content.
8. Public learner UI must stay content-read-only.
9. Downstream features consume Knowledge Objects instead of duplicating content.
10. Automation should remain deterministic and auditable.

## Public safety boundary

The deployed learner app may show reviewed content, search, graph exploration, curriculum paths, generated practice assessments, and local browser progress.

It must not expose raw source upload, transcript management, direct content modification, GitHub writes, private provenance records, or admin-only promotion controls.
