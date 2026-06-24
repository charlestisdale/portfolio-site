# AI-First Ingestion Architecture

This project is a knowledge-first learning platform, not a quiz app.

The ingestion pipeline exists to convert instructional sources into reviewable Knowledge Object candidates. Nothing produced by AI becomes canonical until human review approves it.

## Core Flow

```text
Raw instructional source
  ↓
Transcript import
  ↓
AI identifies concepts
  ↓
AI identifies relationships
  ↓
AI identifies evidence
  ↓
Candidate Knowledge Objects
  ↓
Quality and duplicate checks
  ↓
Human review
  ↓
Canonical Knowledge Objects
  ↓
Knowledge graph and learning engine
```

## Current Import Modes

### 1. Rule-based fallback import

This is the current safe path. It uses a controlled concept catalog and deterministic scripts.

```bash
npm run ingest:folder -- --cert=a-plus-220-1202
```

This runs:

```text
raw .srt
  ↓
clean-srt
  ↓
build-evidence
  ↓
extract-concepts
  ↓
detect-duplicates
  ↓
build-import-report
  ↓
normalize-folder-candidates
  ↓
build-review-manifest
```

The folder importer delegates each transcript to:

```text
tools/ingestion/import-transcript.mjs#importTranscript
```

That function is the single import entry point for one transcript.

### 2. AI-first candidate import

This is the next-generation path.

Generate a strict prompt from an imported or cleaned transcript:

```bash
npm run ai:import:prompt -- --lesson=01 --cert=a-plus-220-1202
```

The prompt is written to:

```text
data/ai-imports/prompts/
```

Paste the prompt into an AI tool and save the JSON response under:

```text
data/ai-imports/responses/
```

Normalize the AI response into the existing review queue:

```bash
npm run ai:import:normalize -- --file=data/ai-imports/responses/<response-file>.json
npm run review:manifest
```

The normalized output is written to:

```text
data/imports/pending/<lesson>-ai-candidates.json
```

The existing Import tab can then review the AI candidates.

## Why the AI Path Exists

The old extractor can only find concepts that already exist in the hardcoded concept catalog. That is useful for bootstrapping, but it is not scalable.

The AI-first path lets the platform ingest new domains without predefining every possible concept.

The AI is responsible for proposing:

- concepts
- evidence
- relationships
- facts
- examples
- exam tips
- common mistakes
- scenarios
- PBQ ideas

The review system is responsible for deciding what becomes permanent.

## Guardrails

AI output is never canonical by default.

AI-generated candidates must include evidence. Candidates without evidence are flagged by the normalizer.

The review UI remains the promotion boundary:

```text
AI candidate ≠ Knowledge Object
Approved reviewed candidate → Knowledge Object
```

## Intended Direction

The long-term importer should make AI-first import the default strategy and keep rule-based extraction as a validation or fallback mode.

Target future command:

```bash
npm run ingest:folder -- --cert=a-plus-220-1202 --strategy=ai
```

Until direct AI API execution is added, the AI path remains prompt-based and review-safe.
