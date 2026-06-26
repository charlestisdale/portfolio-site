# ADR-003: Discovery Before Authoring

## Status

Accepted

## Context

Early pipeline ideas combined concept discovery and Knowledge Object writing into one AI step. That made it harder to detect duplicates, curriculum placement, merge candidates, weak mentions, and gaps before generating content.

## Decision

Discovery and authoring are separate AI stages.

Transcript Intelligence discovers concepts and curriculum signals. Discovery Review decides what should happen to each concept. Knowledge Author writes only approved draft Knowledge Objects.

## Consequences

- Weak mentions can be rejected without becoming Knowledge Objects.
- Duplicate concepts can be merged before authoring.
- Curriculum placement can be reviewed before content creation.
- Knowledge gaps can be flagged separately from authored content.
- The Knowledge Author prompt receives cleaner, intentional inputs.

## Guardrail

Do not collapse Transcript Intelligence, Discovery Review, and Knowledge Authoring back into a single AI output step.
