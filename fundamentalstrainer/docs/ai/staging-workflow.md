# AI Staging Workflow

## Purpose

`ai-staging/` is a temporary workspace for manual AI prompting.

It prevents folder jumping while keeping the real repository structure organized.

## Flow

```text
build queue
    ↓
stage next prompt into ai-staging/
    ↓
use prompt with AI
    ↓
save JSON response into ai-staging/
    ↓
complete staging item
    ↓
response moves to correct pipeline folder
    ↓
run build again for the next prompt
```

## Commands

```bash
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
```

## Staging folder

The staging folder is created at the project root:

```text
fundamentalstrainer/ai-staging/
```

It is temporary. Prompts and responses should not live there permanently.

## Queue file

The queue lives at:

```text
data/ai-imports/staging-queue.json
```

The queue tells the helper:

- which prompt to stage
- where the AI response should be moved
- what kind of AI stage is being completed
- what filename is suggested

## Filename handling

The helper prefers the suggested filename, but it can also identify output by JSON content.

For Knowledge Author responses, it reads the JSON `id` and matches it to the expected Knowledge Object ID.

For Transcript Intelligence and Discovery Review responses, it matches `schemaVersion` and `lessonId`.

This means the response file can have a different filename as long as the JSON content is correct.

## Expected cycle

```bash
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
# use prompt, save JSON into ai-staging/
npm run ai:stage:complete
npm run ai:stage:build -- --lesson=03
```

If the next prompt has not been generated yet, `ai:stage:build` can run the deterministic expansion step first and then queue the new prompt.

## Safety rule

The staging helper only moves prompt and response files. It does not make AI content canonical. Promotion still happens through the normal normalization, audit, promotion, and validation tools.
