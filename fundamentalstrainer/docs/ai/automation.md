# AI Automation

## Purpose

The AI automation tooling coordinates the lesson ingestion pipeline without giving AI direct write access to the trusted knowledge store.

The normal operating model is guided manual-AI with deterministic local tooling:

```text
local tool prepares or finds the lesson transcript
    ↓
local tool stages the next AI prompt into ai-staging/
    ↓
user sends prompt to AI
    ↓
user saves JSON response into ai-staging/
    ↓
user presses Enter
    ↓
local tool moves, normalizes, promotes, validates, and generates the next prompt
```

AI produces structured JSON. Local deterministic scripts decide where files go and whether content can become canonical.

## Primary command

Use this command for normal lesson processing:

```bash
npm run ai:guided -- --lesson04
```

Equivalent accepted forms:

```bash
npm run ai:guided -- --lesson=04
npm run ai:guided -- --lesson04
npm run ai:guided -- --04
```

The guided command is the front door for processing the remaining video set. It should be used instead of manually deciding whether to run `ai:lesson`, `ai:expand`, or `ai:stage:*`.

## What `ai:guided` does

`ai:guided` checks the lesson state and continues from the correct place.

It can:

- use an existing cleaned transcript
- clean a raw `.srt` transcript if the cleaned transcript is missing
- generate and stage a Transcript Intelligence prompt
- import the Transcript Intelligence JSON response
- normalize Transcript Intelligence into a pending package
- generate and stage a Discovery Review prompt
- import and normalize the Discovery Review JSON response
- generate and stage each Knowledge Author prompt
- import and normalize each Knowledge Author JSON response
- promote authored drafts through the safe authored-draft promotion path
- generate the next prompt until the lesson is complete
- optionally run curriculum mapping and validation at the end

It pauses only when an AI JSON response is required.

## Guided interaction loop

When the command pauses, it will show a prompt file under:

```text
ai-staging/
```

Use that prompt with AI, save the returned JSON into the same `ai-staging/` folder, then press Enter in the terminal.

The helper prefers the suggested filename, but it can identify the response by JSON content when the filename differs.

## Optional flags

```bash
npm run ai:guided -- --lesson04 --validate=true
```

Runs final validation when the lesson finishes.

```bash
npm run ai:guided -- --lesson04 --map=false
```

Skips automatic curriculum mapping at the end.

```bash
npm run ai:guided -- --lesson04 --file="path/to/transcript.srt"
```

Uses an explicit raw transcript file if the normal lesson-number lookup is not enough.

```bash
npm run ai:guided -- --lesson04 --force-clean=true
```

Re-cleans the transcript even if a cleaned transcript already exists.

## Lower-level commands

These commands still exist for troubleshooting and debugging individual stages:

```bash
npm run ai:lesson -- --lesson=04
npm run ai:expand -- --lesson=04 --promote=true
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
```

Do not use these as the normal 70-video workflow unless debugging a specific failure.

## Responsibility boundaries

`ai:guided` orchestrates the pipeline, but it does not give AI direct write access to canonical data.

AI writes nothing directly into the canonical knowledge store. AI responses are saved as JSON, then local deterministic tools normalize, audit, promote, and validate them.

This keeps the pipeline reviewable, debuggable, and safe for a portfolio project.
