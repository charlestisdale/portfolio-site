# System Evolution

This document preserves the reasoning behind the current architecture without keeping obsolete designs as active guidance.

## Evolution path

```text
Quiz practice idea
    ↓
JSON quiz generator
    ↓
Knowledge Object builder
    ↓
Knowledge Engine
    ↓
AI curriculum compiler
    ↓
Knowledge-first learning platform
```

## Why the architecture changed

A quiz-first architecture would have solved only the assessment problem. It would not have created a reusable knowledge base for flashcards, PBQs, tutoring, graph exploration, recommendations, analytics, or future certifications.

The project shifted toward a knowledge-first architecture because all downstream learning features need the same source of truth.

## Key turning point

The project stopped expanding learner features when there were only a few Knowledge Objects. The priority shifted to building an ingestion pipeline capable of processing many lessons first.

That decision created the current compiler pipeline:

```text
Transcript
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Author
    ↓
Promotion
    ↓
Canonical Knowledge Objects
```

## Current state

The project should now be treated as a curriculum compiler and learning platform, not as a transcript expansion tool.

New work should preserve:

- Knowledge Objects as canonical learning units.
- Discovery before authoring.
- Human-reviewable AI stages.
- Deterministic local tooling.
- Graph and curriculum as separate downstream layers.
- Engine/content separation.
