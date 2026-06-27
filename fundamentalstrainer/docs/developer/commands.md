# Developer Command Reference

## Normal AI import workflow

Use this command for normal lesson processing:

```bash
npm run ai:guided -- --lesson04
```

Equivalent forms:

```bash
npm run ai:guided -- --lesson=04
npm run ai:guided -- --lesson04
npm run ai:guided -- --04
```

This is the preferred one-command workflow for processing the remaining video set.

It prepares or finds the transcript, stages AI prompts into `ai-staging/`, waits for the AI JSON response, imports the response, normalizes/promotes deterministic outputs, and continues until the lesson is complete.

Optional flags:

```bash
npm run ai:guided -- --lesson04 --validate=true
npm run ai:guided -- --lesson04 --map=false
npm run ai:guided -- --lesson04 --file="path/to/transcript.srt"
npm run ai:guided -- --lesson04 --force-clean=true
```

## Validation

```bash
npm run validate:knowledge
npm run validate:expectations
npm run validate:resolver
npm run validate:architecture
npm run validate:all
```

- `validate:knowledge` checks canonical Knowledge Objects.
- `validate:expectations` checks Curriculum Expectation files.
- `validate:resolver` checks Knowledge Resolver result files.
- `validate:architecture` checks objectives, lessons, curriculum, graph relationships, and architecture references.
- `validate:all` runs all validators.

Warnings about missing/planned graph targets are acceptable during active import. Validation errors must be fixed.

## AI lesson automation internals

```bash
npm run ai:lesson -- --lesson=04
npm run ai:expand -- --lesson=04 --promote=true
npm run ai:status -- --lesson=04
```

- `ai:lesson` advances deterministic lesson prerequisites until the next AI boundary.
- `ai:expand` processes Knowledge Author responses, promotes drafts when requested, and generates the next authoring prompt.
- `ai:status` prints pipeline status for a lesson.

These are internal/fallback commands for debugging. Normal processing should use `ai:guided`.

## AI staging workflow internals

```bash
npm run ai:stage:build -- --lesson=04
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
npm run ai:stage:interactive
```

- `ai:stage:build` creates a staging queue for the next AI prompt.
- `ai:stage:next` copies the prompt into `ai-staging/`.
- `ai:stage:complete` moves the AI response to the correct destination.
- `ai:stage:status` shows queue and staging state.
- `ai:stage:interactive` stages and waits for Enter before completing one queued item.

These remove folder-jumping, but they do not run the full deterministic pipeline by themselves. `ai:guided` wraps them and runs the correct next deterministic command automatically.

## AI stage-specific commands

```bash
npm run ai:import:prompt -- --lesson=04 --file="data/transcripts/cleaned/a-plus-220-1202/04-Upgrading Windows.txt"
npm run ai:import:normalize -- --file="data/ai-imports/responses/04-transcript-intelligence.json"
npm run ai:discovery:manifest -- --file="data/imports/pending/04-transcript-intelligence.json"
npm run ai:discovery:review-prompt -- --file="data/imports/manifests/04-upgrading-windows-discovery-manifest.md"
npm run ai:discovery:review-normalize -- --file="data/ai-imports/responses/04-discovery-review.json"
npm run ai:resolver -- --lesson=04
npm run ai:knowledge:author-prompt -- --file="data/imports/reviewed/04-upgrading-windows-discovery-review.json" --intelligence="data/imports/pending/04-transcript-intelligence.json" --concept=DISC-002
npm run ai:knowledge:author-normalize -- --file="data/ai-imports/responses/knowledge-author/example.knowledge-object.json"
npm run ai:knowledge:promote-authored -- --file="data/imports/authored/example-knowledge-object.draft.json"
```

These are useful for debugging individual pipeline stages.

## Knowledge Resolver

```bash
npm run ai:resolver -- --lesson=04
npm run ai:resolver -- --lesson=04 --dry-run=true
npm run ai:resolver -- --lesson=04 --minimum-score=20 --strong-score=85
```

The resolver reads normalized Discovery Review output from `data/imports/reviewed/`, searches canonical Knowledge Objects, graph relationship hints, and existing Curriculum Expectations, then writes one resolver result per discovered concept into `data/imports/resolver/`.

The first implementation is deterministic. It does not author final content and does not change the guided import flow yet.

## Curriculum mapping

```bash
npm run curriculum:map-reviewed -- --lesson=04
```

Maps promoted objects from a normalized Discovery Review into curriculum modules.

The guided command runs this automatically at lesson completion unless `--map=false` is passed.

## Knowledge store utilities

```bash
npm run knowledge:reset
npm run knowledge:audit-export -- --file="approved-knowledge-objects.json"
npm run knowledge:promote -- --file="approved-knowledge-objects.json"
npm run knowledge:promote:unsafe -- --file="approved-knowledge-objects.json"
```

Prefer authored draft promotion for the current AI pipeline. Older promotion paths are retained for legacy or deliberate test workflows.

## Ingestion utilities

```bash
npm run clean:srt
npm run ingest:transcript
npm run ingest:folder
npm run ingest:evidence
npm run ingest:duplicates
npm run ingest:report
```

These support lower-level transcript and evidence workflows.

The AI curriculum compiler path should generally use:

```bash
npm run ai:guided -- --lesson04
```

## Graph utility

```bash
npm run graph:retag
```

Retags or cleans relationship data when graph relationship type normalization is needed.
