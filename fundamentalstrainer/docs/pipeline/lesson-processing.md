# Lesson Processing Pipeline

## Lesson lifecycle

A lesson is complete only when every approved concept in its Discovery Review has either been promoted, merged, rejected, deferred, intentionally enriched later, resolved as expectation-only / relationship-only against existing canonical knowledge, or placed into an explicit review queue.

## Current implemented flow

The original authoring path still exists for new Knowledge Objects. Lessons 04 and 05 now prove the resolver-aware maintenance path for existing Knowledge Objects.

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
    │       ↓
    │   Pending: Curriculum Expectation Writer
    │
    ├── relationship-only
    │       ↓
    │   Pending: Relationship Queue
    │
    ├── duplicate-no-change
    │       ↓
    │   No canonical change
    │
    └── defer-human-review / reject
            ↓
        Pending: Deferred Review Queue
    ↓
Validation
    ↓
Curriculum mapping / expectation work
```

## Guided workflow status

`ai:guided` is the preferred operator workflow for normal lesson processing.

It now handles:

- transcript preparation
- Transcript Intelligence staging
- Discovery Review staging
- Discovery Review normalization
- resolver-aware routing
- Knowledge Author staging for new objects
- safe authored draft promotion
- Knowledge Maintainer staging for existing objects
- Knowledge Update validation
- Knowledge Update preview
- maintainer response normalization for common AI formatting errors

It does not yet handle:

- writing Curriculum Expectation files from `create-or-update-expectation` work items
- writing relationship review items from `relationship-only` work items
- producing a separate Deferred Review Queue for `defer-human-review` work items
- producing a final lesson completion report that distinguishes complete AI work from pending review work

When `ai:guided` ends with `manual-review-required` after `queued: 0`, that does not necessarily mean the lesson failed. It means the remaining work item types do not yet have deterministic tooling.

## Lesson 05 validation milestone

Lesson 05, `An Overview of Windows`, is the first lesson to exercise the resolver-aware import pipeline deeply enough to expose the missing Curriculum Engine stages.

Final Lesson 05 state after fixes:

```text
workItems: 28
knowledgeUpdates: 4
expectations: 12
newObjects: 0
deferred: 11
queued: 0
completedItemCount: 4
manualItemCount: 24
```

Interpretation:

- The AI prompt queue completed.
- Four existing canonical Knowledge Objects received Knowledge Maintainer updates.
- Twelve concepts were correctly routed as expectation-only instead of duplicate Knowledge Objects.
- Eleven concepts were deferred for human review because the resolver could not safely route them.
- One concept was rejected.
- Full validation passed after update validation and preview generation.

This is a successful import-engine integration test, not a final lesson-complete state. The missing next step is deterministic handling for expectations and deferred review.

## Import engine validation plan

Before importing the remaining large video set, finish the import engine and then re-import or revalidate Lessons 01-05 through the finalized workflow.

The validation set should prove that the engine can handle:

```text
new-object              → Knowledge Author
expand-existing-object  → Knowledge Maintainer
expectation-only        → Curriculum Expectation Writer
relationship-only       → Relationship Queue
duplicate-no-change     → No change / report only
reject                  → Rejected item report
defer                   → Deferred Review Queue
```

Only after that should broad import work resume.

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
relationship-only
duplicate-no-change
defer-human-review
reject
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
normalize common AI formatting issues
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

Maintainer update arrays must use object items, not strings:

```json
{
  "summaryUpdates": [
    {
      "text": "Summary update text.",
      "reason": "Why this update is needed."
    }
  ],
  "explanationUpdates": [
    {
      "text": "Explanation update text.",
      "reason": "Why this update is needed."
    }
  ]
}
```

The guided importer now normalizes common AI formatting mistakes such as string-based `summaryUpdates` or pipe-separated enum placeholders before running `validate:updates`. Validation remains the source of truth.

## Curriculum Expectation path

Expectation handling is the next missing implementation stage.

The resolver already emits work items like:

```text
05.expectation.windows.windows-11: create-or-update-expectation → windows.windows-11
```

These should become Curriculum Expectation files, not Knowledge Object updates. The expectation writer should consume the resolver work plan and produce reviewable expectation JSON for `content/expectations/`.

Expected future flow:

```text
Resolver Work Plan
    ↓
create-or-update-expectation
    ↓
Expectation Writer Prompt or deterministic expectation generator
    ↓
Curriculum Expectation JSON
    ↓
validate:expectations
    ↓
Expectation Preview / Review
```

## Deferred Review Queue

Deferred items should not make the lesson feel failed. They should be written to a review queue.

Expected future flow:

```text
Resolver Work Plan
    ↓
defer-human-review / reject
    ↓
Deferred Review Queue
    ↓
Human decision later
```

The queue should capture:

- lesson ID
- concept ID
- discovered title
- proposed knowledge ID
- resolver decision
- reason for deferral or rejection
- candidate matches if available
- recommended next human action

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

This command is intended for processing lessons through the current guided pipeline. It is currently stable through Knowledge Author and Knowledge Maintainer routing, but expectation and deferred review work remain pending.

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
- generate the next Knowledge Author or Knowledge Maintainer prompt
- normalize common maintainer response formatting problems
- repeat until AI-routable work is complete

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
repeat until queued AI work is complete
```

## AI stage boundaries

The current guided pipeline pauses when it needs one of these AI responses:

- Transcript Intelligence JSON
- Discovery Review JSON
- Knowledge Author JSON
- Knowledge Maintainer JSON
- Knowledge Update JSON
- Knowledge Update Package JSON

Expectation Writer and Relationship Queue responses are not implemented yet.

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

Future validation should also check expectation references, duplicate concept risks, review queue status, and whether generated learner-facing views are traceable back to canonical Knowledge Objects and expectations.
