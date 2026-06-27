# Documentation Index

This documentation describes the current AI curriculum compiler architecture for the IT Learning Platform.

## Start here

- `project-vision.md` — project mission and permanent design principles.
- `architecture/overview.md` — current system architecture.
- `architecture/curriculum-engine.md` — curriculum, expectation, resolver, and maintenance architecture.
- `architecture/schema-contracts.md` — first schema contracts for fragments, expectations, resolver results, and update packages.
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

## Data templates

- `content/knowledge/_templates/knowledge-object.template.json` — current canonical Knowledge Object template.
- `content/knowledge/_templates/knowledge-object-fragmented.template.json` — future fragment-aware Knowledge Object template.
- `content/curriculum/_templates/curriculum-plan.template.json` — Curriculum Plan template.
- `content/expectations/_templates/curriculum-expectation.template.json` — Curriculum Expectation template.
- `data/imports/resolver/_templates/resolver-result.template.json` — Knowledge Resolver output template.
- `data/imports/updates/_templates/knowledge-update.template.json` — Knowledge Maintainer update package template.

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

## Knowledge maintenance workflow

The resolver and maintainer workflow is currently manual, deterministic, and review-first. It is not yet inserted into `ai:guided`.

```text
Discovery Review
    ↓
Knowledge Resolver
    ↓
Resolver Summary
    ↓
Resolver Work Plan
    ↓
Knowledge Maintainer Prompt
    ↓
Knowledge Update Package
    ↓
Validate Update
    ↓
Preview Update
    ↓
Apply Update with explicit approval
    ↓
Validate Canonical Knowledge
```

Useful commands:

```bash
npm run ai:resolver -- --lesson=04
npm run ai:resolver:summary -- --lesson=04
npm run ai:resolver:plan -- --lesson=04
npm run ai:maintainer:prompt -- --file="data/imports/reports/04-resolver-work-plan.json" --workItem="04.package.os.patch-management"
npm run validate:updates
npm run knowledge:update:preview -- --file="data/ai-imports/responses/knowledge-maintainer/04-04-package-os-patch-management-knowledge-update-package.json"
npm run knowledge:update:apply -- --file="data/ai-imports/responses/knowledge-maintainer/04-04-package-os-patch-management-knowledge-update-package.json" --approve=true
npm run validate:all
```

Core rule: AI may propose structured updates, but deterministic tooling validates, previews, backs up, and applies those updates only after explicit human approval.

## Architecture decisions

- `architecture/architecture-decisions/ADR-001-ai-curriculum-compiler.md`
- `architecture/architecture-decisions/ADR-002-canonical-knowledge-objects.md`
- `architecture/architecture-decisions/ADR-003-discovery-before-authoring.md`
- `architecture/architecture-decisions/ADR-004-deterministic-ai-pipeline.md`
- `architecture/architecture-decisions/ADR-005-engine-content-separation.md`
- `architecture/architecture-decisions/ADR-006-curriculum-engine-and-expectations.md`
- `architecture/architecture-decisions/ADR-007-deterministic-knowledge-maintenance.md`

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
Resolver Work Plan
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Knowledge Update Preview / Apply when needed
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

The long-term goal is a reusable learning platform where one canonical knowledge base can support multiple certifications and curricula. A concept such as DNS, VLANs, TCP, UEFI, TPM, or OSPF should exist once as canonical knowledge, then appear in different curricula with different expectations, depth, skills, and assessment styles.
