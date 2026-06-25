# AI Authoring Philosophy

## Core principle

The AI pipeline has two separate responsibilities:

```text
Transcript Intelligence = curriculum analysis.
Knowledge Authoring = draft knowledge writing.
```

The source transcript determines what topics should be considered. Transcript Intelligence determines what should exist, merge, move, wait for enrichment, or be rejected. Knowledge Authoring determines what the draft Knowledge Object should say after a concept has been selected for authoring.

Human review verifies correctness, usefulness, deduplication, curriculum placement, and promotion readiness before anything becomes canonical.

```text
Transcript = evidence
Transcript Intelligence AI = analyst
Knowledge Author AI = writer
Human = verifier and promoter
Knowledge Object = canonical learning unit
Curriculum = where the unit is taught
```

## Teach the concept, not the transcript

The platform should not preserve transcript wording as the learning product. It should use the transcript to identify important concepts and then build reusable learning content only after discovery review.

If a transcript says:

```text
Another popular file system you might run into is ext4.
```

that sentence is only evidence that `ext4` was mentioned. Transcript Intelligence should decide whether `ext4` is teachable, mentioned-only, a merge candidate, or a gap requiring enrichment. If approved, the Knowledge Author can later explain what ext4 is, where it is used, how it compares to other file systems, what exam scenarios may ask about it, and what mistakes learners commonly make.

If the system cannot justify useful learning content from a weak mention, the topic should be rejected as `mentioned-only` instead of promoted as a thin Knowledge Object.

## Knowledge density over transcript fidelity

The goal is not to mirror the transcript. The goal is to create canonical Knowledge Objects dense enough to power Learn mode, flashcards, PBQs, practice assessments, AI tutoring, recommendations, analytics, graph exploration, and curriculum study paths.

Transcript fidelity matters for evidence and audit. Knowledge density matters for learning.

## Separation of responsibilities

### Source evidence

Source evidence explains why a topic was triggered by the lesson.

It should answer:

```text
Why is this topic relevant to this import?
```

It does not need to prove every enriched fact.

### Transcript Intelligence

Transcript Intelligence explains what the curriculum should do with the topic.

It may include:

- discovered concepts
- classifications
- teaching value
- evidence strength
- enrichment need
- review priority
- merge recommendations
- prerequisite suggestions
- relationship suggestions
- curriculum placement suggestions
- knowledge gaps
- authoring guidance
- rejected mentions

Transcript Intelligence should decide what deserves authoring instead of writing the full Knowledge Object itself.

### Knowledge Author

Knowledge Authoring explains what the learner should know after a concept is approved for drafting.

It may include definitions, explanations, atomic facts, comparisons, examples, scenarios, exam tips, common mistakes, PBQ ideas, troubleshooting guidance, relationships to other concepts, and curriculum notes.

AI-authored content remains review-required.

### Human review

Human review is promotion review.

The reviewer decides whether a discovery candidate or authored candidate is accurate, useful, deduplicated, mapped correctly, and safe to promote into the canonical knowledge base.

The reviewer is not merely approving that a transcript sentence exists.

## Import quality expectations

A normal Stage 1 AI import should produce a reviewable Transcript Intelligence package, not a bare list of terms.

Important discovered concepts should usually include:

- proposed reusable concept ID
- title and aliases
- classification
- domain/type
- teaching value
- topic confidence
- evidence strength
- enrichment level
- review priority
- source evidence
- prerequisite suggestions
- relationship suggestions
- curriculum placement suggestions
- merge recommendations when relevant
- authoring guidance when relevant

The AI should not chase a fixed quantity target. It should return every concept that exceeds the minimum teaching threshold and explicitly reject weak mentions.

A normal Stage 2 Knowledge Author output should produce rich draft Knowledge Objects for approved concepts only.

Important authored candidates should usually include:

- a 2–3 sentence summary
- a 2–4 paragraph explanation
- atomic facts
- at least one source evidence item
- relationships to other concepts
- curriculum placement suggestions
- examples or scenarios when helpful
- exam tips when exam-relevant
- common mistakes when learners may confuse the concept
- PBQ ideas when the topic can support practical application

Small concepts may have fewer fields, but they should still teach something useful.

## Curriculum suggestions

AI should propose where each teachable or merge-existing discovery candidate belongs in the curriculum.

Curriculum suggestions are reviewable metadata, not canonical truth.

A curriculum suggestion should explain:

```text
This concept belongs in this curriculum module because...
```

Curriculum placement must stay separate from graph relationships.

- Graph relationship: how concepts relate.
- Curriculum placement: where a concept is taught.

## Rejection is healthy

Not every mentioned topic should become a Knowledge Object.

Reject topics that are mentioned only, too vague, duplicate, out of scope, not technical, not useful for learning, or too uncertain to promote.

A clean rejection is better than a weak object.

## Guardrails

The AI should avoid:

- summarizing the transcript as the final content
- creating one object per sentence
- generating placeholder candidates
- returning starter imports or sample schemas
- returning representative subsets when a full analysis was requested
- creating zero-fact Knowledge Objects
- creating finished assessment items as the primary import product
- duplicating existing concepts unnecessarily
- hiding uncertainty
- mixing curriculum placement with graph edges
- forcing a fixed 25–40 candidate target
- authoring Knowledge Objects during the Transcript Intelligence stage

## Required behavior

The AI should:

- use the transcript to discover topics
- classify every discovered topic
- identify merges, gaps, prerequisites, relationships, and curriculum placement
- separate source evidence from AI inference and general IT knowledge
- create reusable certification-agnostic concept IDs
- include review-required markers
- reject weak topics cleanly
- provide enough analysis for a reviewer to decide what deserves authoring
- create learner-ready draft Knowledge Objects only in the Knowledge Author stage

## Permanent design statement

This project is a knowledge-first learning platform. Transcript Intelligence exists to discover and organize teachable concepts from instructional source material. Knowledge Authoring exists to create reviewable Knowledge Objects from approved concepts. The transcript starts the process, but the canonical Knowledge Object is the reviewed learning product.
