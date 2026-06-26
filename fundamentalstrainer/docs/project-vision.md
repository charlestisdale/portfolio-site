# Project Vision

## Mission

This project is a knowledge-first IT learning platform.

It is not a quiz app.

The platform imports instructional content, discovers teachable concepts, turns approved concepts into reviewed canonical Knowledge Objects, organizes those objects through curriculum and graph relationships, and uses them to generate learner-facing experiences.

## North-star flow

```text
Video / source material
    ↓
Transcript / source text
    ↓
Least-destructive cleaning
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Author
    ↓
Draft Knowledge Objects
    ↓
Promotion + Validation
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph + Curriculum
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

Do not create separate disconnected pools of quiz questions, flashcards, PBQs, explanations, or study guides. Those should be generated from Knowledge Objects, relationship context, curriculum placement, and learner progress.

## Engine/content separation

The engine must stay reusable and certification-neutral.

Certification-specific material belongs under `content/`.

```text
engine/   = reusable learning platform logic
content/  = certification, objective, curriculum, relationship, and Knowledge Object data
```

## AI curriculum compiler philosophy

The AI pipeline is intentionally split into separate responsibilities.

```text
Transcript Intelligence = curriculum analyst
Discovery Review        = gatekeeper and curriculum reviewer
Knowledge Author        = draft knowledge writer
Human / tooling         = verifier, normalizer, promoter
Knowledge Object        = canonical learning product
Curriculum              = where the unit is taught
Knowledge Graph         = how the unit relates to other units
```

The transcript is evidence, not the final learning content. The first AI stage should not immediately write canonical objects. It should discover curriculum-relevant concepts, detect duplicate risks, identify gaps, and recommend relationships. Only reviewed concepts should move into Knowledge Authoring.

## Curriculum philosophy

Curriculum is separate from Knowledge Objects and the Knowledge Graph.

```text
Knowledge Object = what the learner needs to know
Knowledge Graph  = how concepts relate
Curriculum       = where and when concepts are taught
```

A single Knowledge Object can appear in multiple curricula without being duplicated.

## Graph philosophy

The graph is downstream of canonical knowledge.

It should visualize relationships from `content/relationships/*.graph.json` and Knowledge Object metadata. It should not define facts, create content, or become a hand-authored concept map separate from the pipeline.

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
3. Graph relationships are first-class data.
4. AI discovers before it authors.
5. Discovery review and knowledge authoring are separate responsibilities.
6. Human review and deterministic tooling promote canonical content.
7. Teach the concept, not the transcript.
8. Avoid duplicate content pools.
9. Keep the engine certification-agnostic.
10. Keep import/write workflows local or admin-only.
11. Build downstream learning features from canonical Knowledge Objects.
12. Validate before trusting promoted content.

## What future chats should preserve

Future development should continue this architecture instead of redesigning the project as a quiz application.

When adding new features, ask:

```text
Does this consume Knowledge Objects, graph relationships, curriculum, and learner progress,
or does it create another disconnected content pool?
```

If it creates another disconnected content pool, it is probably the wrong direction.
