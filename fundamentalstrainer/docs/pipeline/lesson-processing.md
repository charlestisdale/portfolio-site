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

## Preferred operating loop

```bash
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
```

Use the staged prompt with AI and save the JSON response into `ai-staging/`, then run:

```bash
npm run ai:stage:complete
npm run ai:stage:build -- --lesson=03
```

Repeat until no prompts remain.

## Manual fallback commands

```bash
npm run ai:lesson -- --lesson=03
npm run ai:expand -- --lesson=03 --promote=true
npm run curriculum:map-reviewed -- --lesson=03
npm run validate:all
```

## AI stage boundaries

The pipeline stops when it needs one of these AI responses:

- Transcript Intelligence JSON
- Discovery Review JSON
- Knowledge Author JSON

The user saves those responses under the expected `data/ai-imports/responses/` location, either manually or through the staging helper.

## Promotion rule

Do not use older unsafe bulk promotion paths for authored drafts unless intentionally testing legacy compiler behavior.

Use authored draft promotion:

```bash
npm run ai:knowledge:promote-authored -- --file="data/imports/authored/<draft>.draft.json"
```

or let `ai:expand -- --promote=true` call it.

## Curriculum mapping

After concepts are promoted, map reviewed knowledge into curriculum modules:

```bash
npm run curriculum:map-reviewed -- --lesson=03
```

The curriculum mapper should place promoted objects into modules based on reviewed curriculum decisions and safe fallback rules.

## Validation

Run validation after promotion and mapping:

```bash
npm run validate:all
```

Warnings about missing/planned graph targets are acceptable during import. Validation errors must be fixed.
