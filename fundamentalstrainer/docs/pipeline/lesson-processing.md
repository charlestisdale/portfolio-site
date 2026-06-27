# Lesson Processing Pipeline

## Lesson lifecycle

A lesson is complete only when every approved concept in its Discovery Review has either been promoted, merged, rejected, deferred, intentionally enriched later, or resolved as expectation-only / relationship-only against existing canonical knowledge.

## Current implemented flow

The original authoring path still exists for new Knowledge Objects, but Lesson 04 now proves the resolver-aware maintenance path for existing Knowledge Objects.

```text
Clean transcript
    ↓
Transcript Intelligence prompt
    ↓
Transcript Intelligence AI response
    ↓
Normalize to pending package
    ↓
Discovery Manifest
    ↓
Discovery Review prompt
    ↓
Discovery Review AI response
    ↓
Normalize reviewed package
    ↓
Knowledge Resolver
    ↓
Resolver Summary
    ↓
Resolver Work Plan
    ↓
Decision per work item
    ├── create-new-object
    │       ↓
    │   Knowledge Author prompt
    │       ↓
    │   Knowledge Author response
    │       ↓
    │   Normalize authored draft
    │       ↓
    │   Safe promotion
    │
    ├── create-knowledge-update
    │       ↓
    │   Knowledge Maintainer prompt
    │       ↓
    │   Knowledge Update JSON
    │       ↓
    │   Validate Update
    │       ↓
    │   Preview Update
    │       ↓
    │   Apply Update with explicit approval
    │
    ├── create-update-package
    │       ↓
    │   Knowledge Maintainer prompt
    │       ↓
    │   Knowledge Update Package JSON
    │       ↓
    │   Validate Update
    │       ↓
    │   Preview Update
    │       ↓
    │   Apply Update with explicit approval
    │
    ├── create-or-update-expectation
    ├── relationship-only
    ├── duplicate-no-change
    └── defer-human-review
        ↓
Validation
    ↓
Curriculum mapping / expectation work
```

## Guided workflow status

`ai:guided` remains the preferred operator workflow for normal lesson processing, but the resolver and maintainer path is still manual until more lessons are tested.

The current safe sequence for maintenance testing is:

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

## Resolver command

Manual resolver testing is available with:

```bash
npm run ai:resolver -- --lesson=04
```

The command reads reviewed discovery files and writes resolver result files to `data/imports/resolver/`.

Resolver result decisions include:

```text
new-object
expand-existing-object
expectation-only
relationship-only
duplicate-no-change
reject
defer
```

## Work plan command

The work plan converts individual resolver results into next-action work items:

```bash
npm run ai:resolver:plan -- --lesson=04
```

Work item actions include:

```text
create-new-object
create-knowledge-update
create-update-package
create-or-update-expectation
defer-human-review
```

Single-fragment expansions become `create-knowledge-update`. Multi-fragment clusters targeting the same Knowledge Object become `create-update-package`.

## Knowledge Maintainer path

The maintainer path is used when the resolver determines that source material expands an existing canonical Knowledge Object.

```text
Work Plan Item
    ↓
Knowledge Maintainer Prompt
    ↓
AI returns structured Knowledge Update / Package
    ↓
validate:updates
    ↓
knowledge:update:preview
    ↓
Human review
    ↓
knowledge:update:apply -- --approve=true
    ↓
validate:all
```

The AI does not directly modify canonical knowledge. It returns structured proposed changes only.

## Why the resolver matters

The AI does not know the current platform state unless the system gives it that context.

Before any Knowledge Author or Knowledge Maintainer prompt is generated, the system should search existing knowledge using canonical IDs, aliases, keywords, tags, graph relationships, existing curriculum expectations, objective mappings, and lesson mappings.

The resolver determines whether source material requires a new object, an expansion of an existing object, a curriculum expectation update, a relationship update, or no change.

## Preferred operating command

Use the guided importer for normal processing:

```bash
npm run ai:guided -- --lesson04
```

Accepted forms:

```bash
npm run ai:guided -- --lesson=04
npm run ai:guided -- --lesson04
npm run ai:guided -- --04
```

This command is intended for processing lessons through the current guided pipeline. The resolver and maintainer path is manual until the output is stable across more lessons.

## What the guided command handles

`ai:guided` continues from the current lesson state.

It will:

- use the existing cleaned transcript when present
- clean the raw `.srt` transcript only if the cleaned transcript is missing
- generate the next required AI prompt
- place that prompt in `ai-staging/`
- pause for the AI JSON response
- move the saved JSON response to the correct pipeline folder
- normalize deterministic outputs
- promote safe authored drafts
- generate the next Knowledge Author prompt
- repeat until the lesson is complete

## Operator loop

```text
run npm run ai:guided -- --lesson04
    ↓
when it pauses, open the prompt in ai-staging/
    ↓
send the prompt to AI
    ↓
save the returned JSON into ai-staging/
    ↓
press Enter
    ↓
repeat until complete
```

## AI stage boundaries

The current guided pipeline pauses when it needs one of these AI responses:

- Transcript Intelligence JSON
- Discovery Review JSON
- Knowledge Author JSON

The manual resolver-aware path can also produce:

- Knowledge Maintainer JSON
- Knowledge Update JSON
- Knowledge Update Package JSON

The user saves those responses into the appropriate response folder. The guided command will later be extended to stage and route maintainer prompts automatically.

## Manual fallback commands

The lower-level commands are still available for troubleshooting:

```bash
npm run ai:lesson -- --lesson=04
npm run ai:expand -- --lesson=04 --promote=true
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:resolver -- --lesson=04
npm run ai:resolver:summary -- --lesson=04
npm run ai:resolver:plan -- --lesson=04
npm run ai:maintainer:prompt -- --file="data/imports/reports/04-resolver-work-plan.json" --workItem="04.package.os.patch-management"
npm run validate:updates
npm run knowledge:update:preview -- --file="data/ai-imports/responses/knowledge-maintainer/04-04-package-os-patch-management-knowledge-update-package.json"
npm run knowledge:update:apply -- --file="data/ai-imports/responses/knowledge-maintainer/04-04-package-os-patch-management-knowledge-update-package.json" --approve=true
npm run curriculum:map-reviewed -- --lesson=04
npm run validate:all
```

Use these only when debugging a specific failure or inspecting an individual stage.

## Promotion and apply rules

Do not use older unsafe bulk promotion paths for authored drafts unless intentionally testing legacy compiler behavior.

The normal safe promotion path for new authored drafts is:

```bash
npm run ai:knowledge:promote-authored -- --file="data/imports/authored/<draft>.draft.json"
```

The normal safe apply path for existing Knowledge Object updates is:

```bash
npm run knowledge:update:apply -- --file="data/ai-imports/responses/knowledge-maintainer/<update>.json" --approve=true
```

The apply command refuses to write canonical knowledge unless `--approve=true` is present. It validates the update, creates a backup, applies additive changes only, validates canonical knowledge, and writes an apply report.

## Curriculum mapping and Curriculum Engine direction

The current implemented command maps reviewed knowledge into curriculum modules:

```bash
npm run curriculum:map-reviewed -- --lesson=04
```

The guided command runs curriculum mapping automatically when lesson authoring is complete unless disabled with:

```bash
npm run ai:guided -- --lesson04 --map=false
```

Long-term, this should evolve from simple mapping into the Curriculum Engine:

```text
Curriculum Plan         = where and when concepts are taught
Curriculum Expectation  = what depth, skills, tags, and assessment styles apply
```

Curriculum mapping becomes one capability of the Curriculum Engine rather than the whole feature.

## Validation

Run validation after promotion, update apply, and mapping:

```bash
npm run validate:all
```

`validate:all` currently runs:

```text
validate:knowledge
validate:expectations
validate:resolver
validate:updates
validate:architecture
```

Warnings about missing/planned graph targets are acceptable during import. Validation errors must be fixed.

To have guided import run final validation automatically:

```bash
npm run ai:guided -- --lesson04 --validate=true
```

Future validation should also check expectation references, duplicate concept risks, and whether generated learner-facing views are traceable back to canonical Knowledge Objects and expectations.
