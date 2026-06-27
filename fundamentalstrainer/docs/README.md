# Documentation Index

This documentation describes the current AI curriculum compiler architecture for the IT Learning Platform.

## Start here

- `project-vision.md` — project mission and permanent design principles.
- `architecture/overview.md` — current system architecture.
- `architecture/curriculum-engine.md` — long-term curriculum, expectation, and resolver architecture.
- `architecture/project-philosophy.md` — design philosophy and guardrails.
- `graph-visualizer.md` — graph architecture and UI behavior.

## AI pipeline

- `ai/automation.md` — primary guided import workflow and automation boundaries.
- `ai/staging-workflow.md` — temporary `ai-staging/` prompt workflow used by guided import.
- `transcript-intelligence.md` — Transcript Intelligence stage details.
- `ai-authoring-philosophy.md` — Knowledge Authoring philosophy.

## Pipeline operations

- `pipeline/lesson-processing.md` — end-to-end lesson processing flow.
- `developer/commands.md` — command reference.

## Normal import command

Use this as the normal one-command lesson workflow:

```bash
npm run ai:guided -- --lesson04
```

The command accepts these forms:

```bash
npm run ai:guided -- --lesson=04
npm run ai:guided -- --lesson04
npm run ai:guided -- --04
```

It uses `ai-staging/` as the temporary prompt/response folder and pauses only when an AI JSON response is needed.

## Architecture decisions

- `architecture/architecture-decisions/ADR-001-ai-curriculum-compiler.md`
- `architecture/architecture-decisions/ADR-002-canonical-knowledge-objects.md`
- `architecture/architecture-decisions/ADR-003-discovery-before-authoring.md`
- `architecture/architecture-decisions/ADR-004-deterministic-ai-pipeline.md`
- `architecture/architecture-decisions/ADR-005-engine-content-separation.md`
- `architecture/architecture-decisions/ADR-006-curriculum-engine-and-expectations.md`

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
Knowledge Resolver
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ├── Curriculum Plans
    └── Curriculum Expectations
    ↓
Learning Engine
```

Do not treat this project as a quiz application, transcript summarizer, one-step AI importer, or certification-specific content silo.

The long-term goal is a reusable learning platform where one canonical knowledge base can support multiple certifications and curricula. A concept such as DNS, VLANs, TCP, UEFI, TPM, or OSPF should exist once as canonical knowledge, then appear in different curricula with different expectations, depth, skills, and assessment styles.
