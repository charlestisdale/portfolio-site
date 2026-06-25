# Project Vision

## Mission

This project is a knowledge-first IT learning platform.

It is not a quiz app.

The platform imports instructional content, discovers teachable concepts, turns them into reviewed canonical Knowledge Objects, organizes them through curriculum, and uses those objects to generate learner-facing experiences.

## Long-term architecture

```text
Video / source material
    ↓
Transcript / source text
    ↓
AI topic discovery
    ↓
AI deep knowledge enrichment
    ↓
Pending Knowledge Object candidates
    ↓
Human review
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ↓
Learning Engine
        ├── Study Paths
        ├── Flashcards
        ├── PBQs
        ├── Assessments
        ├── AI Tutor
        ├── Recommendations
        └── Analytics
```

## Single source of truth

Knowledge Objects are the single source of truth for learning content.

Do not create separate disconnected pools of quiz questions, flashcards, PBQs, explanations, or study guides. Those should be generated from Knowledge Objects and curriculum context.

## Engine/content separation

The engine must stay reusable and certification-neutral.

Certification-specific material belongs under `content/`.

```text
engine/   = reusable learning platform logic
content/  = certification, objective, curriculum, relationship, and Knowledge Object data
```

## Transcript philosophy

The transcript is not the final learning content.

The transcript identifies topics worth considering. AI authoring creates the learner-ready draft. Human review promotes only accurate, useful, deduplicated knowledge.

```text
Transcript = topic trigger
AI = subject-matter author
Human = verifier
Knowledge Object = canonical learning product
```

## AI authoring philosophy

The AI is expected to use its broader IT knowledge.

It should not limit itself to repeating source wording. It should explain what learners need to know about each topic, including definitions, purpose, examples, comparisons, common mistakes, exam tips, scenarios, PBQ ideas, relationships, and curriculum placement suggestions.

AI-enriched content must be marked as review-required.

## Curriculum philosophy

Curriculum is separate from Knowledge Objects and the Knowledge Graph.

```text
Knowledge Object = what the learner needs to know
Knowledge Graph = how concepts relate
Curriculum = where and when concepts are taught
```

A single Knowledge Object can appear in multiple curricula without being duplicated.

## Public app boundary

The public portfolio app should be learner-facing and content-read-only.

It may show:

- reviewed learning content
- search
- graph exploration
- curriculum paths
- assessments generated from canonical content
- local browser progress

It should not expose:

- source upload
- raw transcript management
- import controls
- direct content modification
- GitHub writes
- admin-only provenance data

## Permanent design principles

1. Knowledge Objects first.
2. Curriculum controls teaching order.
3. AI authors reviewable knowledge, not transcript summaries.
4. Human review promotes canonical content.
5. Teach the concept, not the transcript.
6. Knowledge density over transcript fidelity.
7. Avoid duplicate content pools.
8. Keep the engine certification-agnostic.
9. Keep import/write workflows local or admin-only.
10. Build downstream learning features from canonical Knowledge Objects.

## What future chats should preserve

Future development should continue this architecture instead of redesigning the project as a quiz application.

When adding new features, ask:

```text
Does this consume Knowledge Objects and curriculum, or does it create another disconnected content pool?
```

If it creates another disconnected content pool, it is probably the wrong direction.
