# AI Staging Workflow

## Purpose

`ai-staging/` is a temporary workspace for manual AI prompting.

It prevents folder jumping while keeping the real repository structure organized.

The normal way to use staging is through the guided command:

```bash
npm run ai:guided -- --lesson04
```

The lower-level `ai:stage:*` commands are retained for troubleshooting.

## Normal guided flow

```text
run ai:guided for a lesson
    ↓
guided tool stages the next prompt into ai-staging/
    ↓
use prompt with AI
    ↓
save JSON response into ai-staging/
    ↓
press Enter
    ↓
guided tool moves response to the correct pipeline folder
    ↓
guided tool normalizes / promotes / generates the next prompt
    ↓
repeat until the lesson is complete
```

## Staging folder

The staging folder is created at the project root:

```text
fundamentalstrainer/ai-staging/
```

It is temporary. Prompts and responses should not live there permanently.

At each AI boundary, `ai:guided` clears and repopulates this folder with the one prompt that needs AI attention.

## What the user does

When `ai:guided` pauses:

1. Open the staged `.md` prompt in `ai-staging/`.
2. Paste or upload that prompt into ChatGPT or the chosen AI author/reviewer.
3. Save the returned JSON response into `ai-staging/`.
4. Press Enter in the terminal.

The helper moves the response to the correct permanent folder.

## Filename handling

The helper suggests a filename, but it can also identify output by JSON content.

For Knowledge Author responses, it reads the JSON `id` and matches it to the expected Knowledge Object ID.

For Transcript Intelligence and Discovery Review responses, it matches `schemaVersion` and `lessonId`.

This means the response file can have a different filename as long as the JSON content is correct.

## Queue file

The staging queue lives at:

```text
data/ai-imports/staging-queue.json
```

The queue tells the helper:

- which prompt to stage
- where the AI response should be moved
- what kind of AI stage is being completed
- what filename is suggested

Most users should not edit this file manually.

## Manual staging commands

These are debugging tools, not the preferred daily workflow:

```bash
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
npm run ai:stage:interactive
```

Manual cycle:

```bash
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
# use prompt, save JSON into ai-staging/
npm run ai:stage:complete
```

After completing a manual stage, another deterministic command may still be needed, such as `ai:lesson` or `ai:expand`. The guided command handles that automatically.

## Safety rule

The staging helper only moves prompt and response files. It does not give AI direct write access to canonical data.

Promotion still happens through the normal normalization, audit, promotion, and validation tools. In the preferred workflow, `ai:guided` calls those tools at the correct time.
