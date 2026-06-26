# AI Automation

## Purpose

The AI automation tooling coordinates the lesson ingestion pipeline without giving AI direct write access to the trusted knowledge store.

The current workflow is manual-AI, deterministic-tooling:

```text
local tool generates prompt
    ↓
user sends prompt to AI
    ↓
user saves JSON response
    ↓
local tool normalizes / promotes / validates
    ↓
local tool generates next prompt
```

## Main commands

```bash
npm run ai:lesson -- --lesson=03
npm run ai:expand -- --lesson=03 --promote=true
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
```

## `ai:lesson`

Runs deterministic lesson prerequisites until it reaches the next AI boundary.

It can generate or normalize:

- Transcript Intelligence prompt
- Transcript Intelligence package
- Discovery Manifest
- Discovery Review prompt
- Discovery Review package
- first Knowledge Author prompt

It stops when a human/AI response is needed.

## `ai:expand`

Advances Knowledge Authoring after Discovery Review exists.

It can:

- normalize saved Knowledge Author responses
- dry-run authored drafts
- promote drafts when `--promote=true`
- generate the next Knowledge Author prompt
- report the next required action

## `ai:stage:*`

The staging helper removes folder-jumping from the manual AI process.

- `ai:stage:build` builds a queue for the next AI prompt.
- `ai:stage:next` copies the next prompt into `ai-staging/`.
- `ai:stage:complete` moves the AI JSON response to the correct destination.
- `ai:stage:status` shows the current queue and staging state.

## Why the AI is not fully autonomous

This project intentionally avoids giving AI direct control over canonical data.

AI produces structured suggestions and draft content. Local deterministic tools normalize, validate, and promote.

This keeps the pipeline reviewable, debuggable, and safe for a portfolio project.
