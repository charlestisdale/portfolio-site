# Project Philosophy

## Knowledge before assessment

The platform exists to help learners understand IT concepts, not just answer questions.

Assessments, flashcards, PBQs, and study guides should be generated from canonical Knowledge Objects instead of maintained as separate content pools.

## Discover before author

AI should not immediately turn transcript text into final learning content.

The pipeline first discovers what concepts exist, what evidence supports them, what should merge, what is missing, and where concepts belong in the curriculum. Only reviewed concepts move to Knowledge Authoring.

## One canonical source of truth

A Knowledge Object is the canonical learning unit.

A concept should be authored once and reused across curricula, lessons, objectives, study paths, graph exploration, and assessments.

## Human-reviewable AI

AI output is useful, but not trusted automatically.

Every AI stage produces structured artifacts that can be inspected, normalized, audited, and validated before promotion.

## Deterministic automation

Automation should advance the pipeline in predictable steps.

The platform should avoid hidden autonomous writes. Commands should produce clear files, clear next actions, and validation output.

## Certification-agnostic engine

The learning engine should not be hardcoded for one certification.

Certification-specific content belongs in `content/`. Reusable logic belongs in `engine/`.

## Relationships are first-class

The relationship graph is not decoration. It supports graph exploration, prerequisite paths, AI tutor context, recommendations, and analytics.

Relationships must remain separate from curriculum placement.

## Curriculum is a teaching layer

Curriculum controls teaching sequence and module placement.

A Knowledge Object can be reused in many curricula without being duplicated.

## Public app safety

The deployed learner UI should be content-read-only.

Source upload, prompt execution, promotion, GitHub writes, and provenance inspection belong in local tooling or a future authenticated admin backend.
