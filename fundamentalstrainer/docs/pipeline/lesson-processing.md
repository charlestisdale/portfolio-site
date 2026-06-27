# Lesson Processing Pipeline

## Lesson lifecycle

A lesson is complete only when every approved concept in its Discovery Review has either been promoted, merged, rejected, deferred, intentionally enriched later, or resolved as expectation-only / relationship-only against existing canonical knowledge.

## Current implemented flow

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
Knowledge Author prompt per approved concept
    ↓
Knowledge Author AI response
    ↓
Normalize authored draft
    ↓
Promotion
    ↓
Validation
    ↓
Curriculum mapping
```

## Long-term target flow

The current flow works for early import testing, but the long-term platform needs a resolver stage before authoring so the AI does not create duplicate concepts.

```text
Clean transcript
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Resolver
    ↓
Decision per concept
    ├── new-object
    ├── expand-existing-object
    ├── expectation-only
    ├── relationship-only
    ├── duplicate-no-change
    ├── reject
    └── defer
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Promotion + Validation
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ├── Curriculum Plan
    └── Curriculum Expectations
```

## Why the resolver matters

The AI does not know the current platform state unless the system gives it that context.

Before any Knowledge Author prompt is generated, the system should search existing knowledge using:

```text
canonical IDs
aliases
keywords
tags
graph relationships
existing curriculum expectations
objective mappings
lesson mappings
```

The AI should then receive relevant existing matches and decide whether the source material requires a new object, an expansion of an existing object, a curriculum expectation update, a relationship update, or no change.

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

This command is intended for processing lessons through the current implemented pipeline. The architecture is evolving toward the resolver and expectation model before scaling large imports.

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

The current pipeline pauses when it needs one of these AI responses:

- Transcript Intelligence JSON
- Discovery Review JSON
- Knowledge Author JSON

The user saves those responses into `ai-staging/`. The guided command moves them into the correct permanent location.

Long-term, the pipeline should also support resolver-aware prompts that include existing Knowledge Object, graph, and expectation context.

## Manual fallback commands

The lower-level commands are still available for troubleshooting:

```bash
npm run ai:lesson -- --lesson=04
npm run ai:expand -- --lesson=04 --promote=true
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
npm run ai:stage:complete
npm run curriculum:map-reviewed -- --lesson=04
npm run validate:all
```

Use these only when debugging a specific failure or inspecting an individual stage.

## Promotion rule

Do not use older unsafe bulk promotion paths for authored drafts unless intentionally testing legacy compiler behavior.

The normal safe promotion path is authored draft promotion:

```bash
npm run ai:knowledge:promote-authored -- --file="data/imports/authored/<draft>.draft.json"
```

In the preferred workflow, `ai:guided` calls the safe promotion path through `ai:expand -- --promote=true` at the correct time.

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

Run validation after promotion and mapping:

```bash
npm run validate:all
```

Warnings about missing/planned graph targets are acceptable during import. Validation errors must be fixed.

To have guided import run final validation automatically:

```bash
npm run ai:guided -- --lesson04 --validate=true
```

Future validation should also check expectation references, duplicate concept risks, and whether generated learner-facing views are traceable back to canonical Knowledge Objects and expectations.
