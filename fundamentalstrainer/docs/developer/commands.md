# Developer Command Reference

## Validation

```bash
npm run validate:knowledge
npm run validate:architecture
npm run validate:all
```

- `validate:knowledge` checks canonical Knowledge Objects.
- `validate:architecture` checks objectives, lessons, curriculum, graph relationships, and architecture references.
- `validate:all` runs both.

## AI lesson automation

```bash
npm run ai:lesson -- --lesson=03
npm run ai:expand -- --lesson=03 --promote=true
npm run ai:status -- --lesson=03
```

- `ai:lesson` advances deterministic lesson prerequisites until the next AI boundary.
- `ai:expand` processes Knowledge Author responses, promotes drafts when requested, and generates the next authoring prompt.
- `ai:status` prints pipeline status for a lesson.

## AI staging workflow

```bash
npm run ai:stage:build -- --lesson=03
npm run ai:stage:next
npm run ai:stage:complete
npm run ai:stage:status
npm run ai:stage:interactive
```

- `ai:stage:build` creates a staging queue for the next AI prompt.
- `ai:stage:next` copies the prompt into `ai-staging/`.
- `ai:stage:complete` moves the AI response to the correct destination.
- `ai:stage:status` shows queue and staging state.
- `ai:stage:interactive` stages and waits for Enter before completing.

## AI stage-specific commands

```bash
npm run ai:import:prompt -- --lesson=03 --file="data/transcripts/cleaned/a-plus-220-1202/03-example.txt"
npm run ai:import:normalize -- --file="data/ai-imports/responses/03-transcript-intelligence.json"
npm run ai:discovery:manifest -- --file="data/imports/pending/03-transcript-intelligence.json"
npm run ai:discovery:review-prompt -- --file="data/imports/manifests/03-example-discovery-manifest.md"
npm run ai:discovery:review-normalize -- --file="data/ai-imports/responses/03-discovery-review.json"
npm run ai:knowledge:author-prompt -- --file="data/imports/reviewed/03-example-discovery-review.json" --intelligence="data/imports/pending/03-transcript-intelligence.json" --concept=DISC-001
npm run ai:knowledge:author-normalize -- --file="data/ai-imports/responses/knowledge-author/example.knowledge-object.json"
npm run ai:knowledge:promote-authored -- --file="data/imports/authored/example-knowledge-object.draft.json"
```

These are useful for debugging individual pipeline stages.

## Curriculum mapping

```bash
npm run curriculum:map-reviewed -- --lesson=03
```

Maps promoted objects from a normalized Discovery Review into curriculum modules.

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

These support lower-level transcript and evidence workflows. The AI curriculum compiler path should generally use `ai:lesson`, `ai:expand`, and `ai:stage:*`.

## Graph utility

```bash
npm run graph:retag
```

Retags or cleans relationship data when graph relationship type normalization is needed.
