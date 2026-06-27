# ADR-007: Deterministic Knowledge Maintenance

## Status

Accepted

## Context

The platform imports instructional content and converts it into canonical Knowledge Objects. As the knowledge base grows, new source material often does not require a new Knowledge Object. It may instead enrich an existing object, add a curriculum-specific expectation, reveal a relationship, or repeat already-known material.

Allowing AI to directly rewrite canonical Knowledge Objects would create several risks:

- duplicate concepts
- over-broad rewrites
- loss of stable object IDs
- curriculum-specific language leaking into reusable canonical knowledge
- unreviewable changes to the knowledge graph
- no audit trail for how canonical knowledge changed

The project needs a controlled maintenance path for existing Knowledge Objects.

## Decision

Canonical Knowledge Objects must not be modified directly by AI.

AI may propose structured Knowledge Updates or Knowledge Update Packages, but deterministic tooling must validate, preview, back up, and apply those changes only after explicit human approval.

The maintenance pipeline is:

```text
Discovery Review
    ↓
Knowledge Resolver
    ↓
Resolver Work Plan
    ↓
Knowledge Maintainer Prompt
    ↓
Knowledge Update / Knowledge Update Package
    ↓
validate:updates
    ↓
knowledge:update:preview
    ↓
Human review
    ↓
knowledge:update:apply -- --approve=true
    ↓
validate:all
```

## Responsibilities

### Knowledge Resolver

Determines whether discovered content should create new knowledge, expand existing knowledge, create/update curriculum expectations, add relationships, be rejected, or be deferred.

### Resolver Work Plan

Groups resolver results into actionable work items.

Examples:

```text
create-new-object
create-knowledge-update
create-update-package
create-or-update-expectation
relationship-only
duplicate-no-change
defer-human-review
```

### Knowledge Maintainer

Receives a specific work item and the target canonical Knowledge Object. It returns a structured update only. It does not return a full replacement object.

### Update Validator

Checks the maintainer output before it can affect canonical knowledge.

### Preview Engine

Loads the update and the target object, simulates the merge in memory, and writes human-reviewable JSON and Markdown preview reports.

### Apply Engine

Writes only after explicit approval:

```bash
npm run knowledge:update:apply -- --file="data/ai-imports/responses/knowledge-maintainer/<update>.json" --approve=true
```

The apply command must:

1. validate the update
2. create a timestamped backup
3. apply additive changes only
4. update quality metadata
5. validate canonical knowledge
6. write an apply report

## Consequences

Positive consequences:

- Canonical Knowledge Objects remain protected.
- AI work becomes narrower and more reliable.
- Every canonical update has a reviewable preview.
- Every applied update has a backup and apply report.
- Duplicate canonical concepts are less likely.
- The system can scale across multiple certifications without creating isolated content silos.

Tradeoffs:

- The workflow has more steps than direct AI rewriting.
- Human review remains required before canonical updates.
- The system needs more deterministic tooling for expectations and relationship-only work items.

## Non-goals

This decision does not make the public app depend on live AI.

This decision does not treat generated quizzes, flashcards, PBQs, or labs as canonical truth.

This decision does not remove the need for Knowledge Authoring when a genuinely new canonical concept is discovered.

## Guiding principle

```text
AI proposes.
Deterministic tooling verifies.
Humans approve.
Canonical knowledge changes only through controlled merge paths.
```
