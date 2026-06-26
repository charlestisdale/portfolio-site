# ADR-004: Deterministic AI Pipeline

## Status

Accepted

## Context

Fully autonomous AI workflows are attractive, but they are difficult to audit and unsafe for trusted learning content. This project needs repeatable local tooling and clear review checkpoints.

## Decision

AI produces structured artifacts. Deterministic tools normalize, audit, promote, map, and validate those artifacts.

The system uses manual AI prompting with local staging and deterministic scripts instead of giving AI direct write access to canonical content.

## Consequences

- Every AI response is saved as a file.
- Every stage has a visible input and output.
- Tooling can be rerun and debugged.
- Validation remains the trust boundary.
- The pipeline works without requiring paid API automation.

## Guardrail

AI should not directly modify `content/knowledge`, `content/relationships`, or `content/curriculum` without going through normalization, promotion, and validation tooling.
