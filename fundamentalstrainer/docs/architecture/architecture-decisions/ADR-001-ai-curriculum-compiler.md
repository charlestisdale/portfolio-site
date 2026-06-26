# ADR-001: AI Curriculum Compiler

## Status

Accepted

## Context

The project began as a way to turn study material into quiz data, but that design would have created disconnected content pools and duplicated learning material.

The project now needs to import instructional material at scale and turn it into reusable learning knowledge.

## Decision

The platform is an AI curriculum compiler.

It compiles instructional sources into reviewed Knowledge Objects, graph relationships, curriculum mappings, and learning experiences.

## Consequences

- The transcript is evidence, not final content.
- AI performs discovery before authoring.
- Knowledge Objects are canonical.
- Assessments, flashcards, PBQs, tutoring, recommendations, and analytics consume canonical data.
- The platform can support multiple certifications without duplicating the same concept for each certification.

## Guardrail

Do not redesign the project as a quiz application or a transcript summarizer.
