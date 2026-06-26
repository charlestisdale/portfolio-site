# Documentation Index

This documentation describes the current AI curriculum compiler architecture.

## Start here

- `project-vision.md` — project mission and permanent design principles.
- `architecture/overview.md` — current system architecture.
- `architecture/project-philosophy.md` — design philosophy and guardrails.
- `graph-visualizer.md` — graph architecture and UI behavior.

## AI pipeline

- `ai/automation.md` — lesson automation commands and responsibility boundaries.
- `ai/staging-workflow.md` — temporary `ai-staging/` prompt workflow.
- `transcript-intelligence.md` — Transcript Intelligence stage details.
- `ai-authoring-philosophy.md` — Knowledge Authoring philosophy.

## Pipeline operations

- `pipeline/lesson-processing.md` — end-to-end lesson processing flow.
- `developer/commands.md` — command reference.

## Architecture decisions

- `architecture/architecture-decisions/ADR-001-ai-curriculum-compiler.md`
- `architecture/architecture-decisions/ADR-002-canonical-knowledge-objects.md`
- `architecture/architecture-decisions/ADR-003-discovery-before-authoring.md`
- `architecture/architecture-decisions/ADR-004-deterministic-ai-pipeline.md`
- `architecture/architecture-decisions/ADR-005-engine-content-separation.md`

## Roadmap

- `roadmap/current.md` — completed, active, and near-term work.

## Notes for future chats

The current architecture is knowledge-first and compiler-style:

```text
Source material
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Author
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph + Curriculum
    ↓
Learning Engine
```

Do not treat this project as a quiz application, transcript summarizer, or one-step AI importer.
