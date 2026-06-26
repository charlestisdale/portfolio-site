# ADR-002: Canonical Knowledge Objects

## Status

Accepted

## Context

A learning platform can easily drift into many disconnected content stores: quiz questions, flashcards, PBQs, summaries, study guides, graph nodes, and tutor notes.

That makes maintenance difficult and causes duplicate or conflicting content.

## Decision

Knowledge Objects are the canonical source of truth for learning content.

Every learner-facing feature should consume Knowledge Objects and supporting layers such as graph relationships, curriculum placement, objectives, and progress.

## Consequences

- Concepts are authored once and reused.
- Assessments are generated from knowledge instead of hand-maintained separately.
- Graph nodes represent real canonical objects or planned/missing references.
- Curriculum modules reference Knowledge Object IDs.
- Duplicate concepts should be merged or linked instead of recreated.

## Guardrail

Do not add a new feature by creating a separate permanent content pool unless it is explicitly derived from or linked back to Knowledge Objects.
