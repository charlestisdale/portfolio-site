# Lesson Processing Pipeline

## Lesson lifecycle

A lesson is complete only when every approved concept in its Discovery Review has either been promoted, merged, rejected, deferred, or intentionally enriched later.

## Current flow

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

This command is intended for processing the remaining video set. It should be the only command the operator needs to remember during normal import work.

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

The pipeline pauses when it needs one of these AI responses:

- Transcript Intelligence JSON
- Discovery Review JSON
- Knowledge Author JSON

The user saves those responses into `ai-staging/`. The guided command moves them into the correct permanent location.

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

## Curriculum mapping

After concepts are promoted, map reviewed knowledge into curriculum modules:

```bash
npm run curriculum:map-reviewed -- --lesson=04
```

The guided command runs curriculum mapping automatically when lesson authoring is complete unless disabled with:

```bash
npm run ai:guided -- --lesson04 --map=false
```

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
