# ADR-005: Engine and Content Separation

## Status

Accepted

## Context

The platform should support more than one certification and should not require rewriting engine logic for every content set.

## Decision

The reusable learning engine belongs in `engine/`.

Certification-specific content, objectives, lessons, curriculum mappings, relationships, and Knowledge Objects belong in `content/`.

## Consequences

- The engine can be reused across A+, Network+, Security+, Linux+, CCNA, and future content.
- Certification-specific data can evolve without changing core platform logic.
- The Knowledge Engine API becomes the boundary between UI and trusted content.
- Curriculum files can be added for new certifications without duplicating engine behavior.

## Guardrail

Do not hardcode certification-specific facts, objective IDs, lesson content, or Knowledge Object data inside `engine/`.
