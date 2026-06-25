# AI Authoring Philosophy

## Core principle

The AI is expected to act as a subject-matter expert, not a transcription engine.

The source transcript determines what topics should be considered. The AI determines what a learner should actually know about those topics. Human review verifies correctness, usefulness, deduplication, and curriculum placement before anything becomes canonical.

```text
Transcript = topic trigger
AI = draft knowledge author
Human = verifier and promoter
Knowledge Object = canonical learning unit
Curriculum = where the unit is taught
```

## Teach the concept, not the transcript

The platform should not preserve transcript wording as the learning product. It should use the transcript to identify important concepts and then produce dense, reusable learning content.

If a transcript says:

```text
Another popular file system you might run into is ext4.
```

that sentence is only evidence that `ext4` was mentioned. A useful candidate should teach the learner what ext4 is, where it is used, how it compares to other file systems, what exam scenarios may ask about it, and what mistakes learners commonly make.

If the AI cannot create useful learning content from a weak mention, the topic should be rejected as `mentioned-only` instead of promoted as a thin Knowledge Object.

## Knowledge density over transcript fidelity

The goal is not to mirror the transcript. The goal is to create Knowledge Objects dense enough to power:

- Learn mode
- flashcards
- PBQs
- practice assessments
- AI tutoring
- recommendations
- analytics
- graph exploration
- curriculum study paths

Transcript fidelity matters for evidence and audit. Knowledge density matters for learning.

## Separation of responsibilities

### Source evidence

Source evidence explains why a topic was triggered by the lesson.

It should answer:

```text
Why is this topic relevant to this import?
```

It does not need to prove every enriched fact.

### AI-enriched content

AI-enriched content explains what the learner should know.

It may include:

- definitions
- explanations
- facts
- comparisons
- examples
- scenarios
- exam tips
- common mistakes
- PBQ ideas
- troubleshooting guidance
- relationships to other concepts
- curriculum placement suggestions

AI-enriched content must be marked as requiring human review.

### Human review

Human review is promotion review.

The reviewer decides whether a candidate is accurate, useful, deduplicated, mapped correctly, and safe to promote into the canonical knowledge base.

The reviewer is not merely approving that a transcript sentence exists.

## Import quality expectations

A normal AI import should not produce a bare list of terms. It should produce rich candidates.

Important teachable candidates should usually include:

- a 2–3 sentence summary
- a 2–4 paragraph explanation
- 6 or more atomic facts when the concept is important
- at least one source evidence item
- relationships to other concepts
- curriculum placement suggestions
- examples or scenarios when helpful
- exam tips when exam-relevant
- common mistakes when learners may confuse the concept
- PBQ ideas when the topic can support practical application

Small concepts may have fewer fields, but they should still teach something useful.

## Curriculum suggestions

AI should propose where each teachable candidate belongs in the curriculum.

Curriculum suggestions are reviewable metadata, not canonical truth.

A curriculum suggestion should explain:

```text
This Knowledge Object belongs in this curriculum module because...
```

Curriculum placement must stay separate from graph relationships.

- Graph relationship: how concepts relate.
- Curriculum placement: where a concept is taught.

## Rejection is healthy

Not every mentioned topic should become a Knowledge Object.

Reject topics that are:

- mentioned only
- too vague
- duplicate
- out of scope
- not technical
- not useful for learning
- too uncertain to promote

A clean rejection is better than a weak object.

## What the AI must not do

The AI must not:

- summarize the transcript as the final content
- create one object per sentence
- generate placeholder candidates
- return starter imports
- return sample schemas
- return representative subsets when a full import was requested
- create zero-fact Knowledge Objects
- create quiz questions as the primary import product
- duplicate existing concepts unnecessarily
- hide uncertainty
- mix curriculum placement with graph edges

## What the AI must do

The AI should:

- use the transcript to discover topics
- use general IT knowledge to teach those topics deeply
- separate evidence from enrichment
- create reusable certification-agnostic Knowledge Objects
- include review-required markers
- include relationships
- include curriculum suggestions
- include assessment seeds instead of finished quizzes
- reject weak topics cleanly
- provide enough knowledge for the learner to understand the topic without needing the original transcript

## Permanent design statement

This project is a knowledge-first learning platform. AI authoring exists to create reviewable Knowledge Objects from instructional source material. The transcript starts the process, but the Knowledge Object is the learning product.
