# Project Vision

## Mission

This project is a knowledge-first IT learning platform.

It is not a quiz app.

The platform imports instructional content, discovers teachable concepts, turns approved concepts into reviewed canonical Knowledge Objects, organizes those objects through graph relationships, curriculum plans, and curriculum expectations, and uses those layers to generate learner-facing experiences.

The mission has not changed: this is a learning platform for future tests and curricula. The current work is refining the structure so the platform can support A+ Core 2 now and other certifications later without duplicating knowledge.

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
Knowledge Resolver
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Draft Knowledge Objects or knowledge updates
    ↓
Promotion + Validation
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
        ├── Curriculum Plans
        └── Curriculum Expectations
    ↓
Learning Engine
        ├── Study Paths
        ├── Flashcards
        ├── PBQs
        ├── Assessments
        ├── Labs
        ├── AI Tutor
        ├── Recommendations
        └── Analytics
```

## Single source of truth

Knowledge Objects are the single source of truth for concept meaning.

Do not create separate disconnected pools of quiz questions, flashcards, PBQs, explanations, study guides, or certification-specific duplicate Knowledge Objects. Those should be generated from canonical Knowledge Objects, graph relationships, curriculum plans, curriculum expectations, and learner progress.

## Engine/content separation

The engine must stay reusable and certification-neutral.

Certification-specific material belongs under `content/`.

```text
engine/   = reusable learning platform logic
content/  = trusted learning data, certification metadata, curriculum plans, expectations, relationships, and Knowledge Objects
```

## AI curriculum compiler philosophy

The AI pipeline is intentionally split into separate responsibilities.

```text
Transcript Intelligence = curriculum analyst
Discovery Review        = gatekeeper and curriculum reviewer
Knowledge Resolver      = existing-knowledge retrieval and duplicate/merge context
Knowledge Author        = draft knowledge writer
Knowledge Maintainer    = existing knowledge expansion writer
Human / tooling         = verifier, normalizer, promoter
Knowledge Object        = canonical concept product
Knowledge Graph         = how concepts relate
Curriculum Plan         = where and when concepts are taught
Curriculum Expectation  = what depth and skills a curriculum requires
Learning Engine         = learner-facing generated experiences
```

The transcript is evidence, not the final learning content. The first AI stage should not immediately write canonical objects. It should discover curriculum-relevant concepts, detect duplicate risks, identify gaps, and recommend relationships.

Before authoring, the system must search the existing knowledge base. AI should not be expected to remember the platform. The platform should provide relevant existing Knowledge Objects, aliases, graph relationships, and curriculum expectations to the AI so it can decide whether to create, expand, map, or defer.

## Curriculum philosophy

Curriculum is separate from Knowledge Objects and the Knowledge Graph.

```text
Knowledge Object        = what the learner needs to know
Knowledge Graph         = how concepts relate
Curriculum Plan         = where and when concepts are taught
Curriculum Expectation  = how deeply a curriculum teaches or tests a concept
```

A single Knowledge Object can appear in multiple curricula without being duplicated.

Example:

```text
networking.vlan
    A+ Core 2     = recognize and explain basic segmentation
    Network+      = understand VLANs, tagging, trunks, and segmentation use cases
    CCNA          = configure, verify, and troubleshoot VLANs and trunks
    Security+     = apply VLANs as a segmentation and isolation control
```

The Knowledge Object remains one concept. The curriculum expectations differ.

## Knowledge reuse principle

Do not create `a-plus.vlan`, `network-plus.vlan`, and `ccna.vlan` as separate canonical objects if they describe the same underlying concept.

Create or maintain one canonical object such as `networking.vlan`, then attach certification- or course-specific expectations that define:

- expected depth
- included and excluded fragments
- required skills
- assessment style
- objective alignment
- lab or PBQ expectations

Duplicate expectations are allowed. Duplicate concepts are not.

## Graph philosophy

The graph is downstream of canonical knowledge.

It should visualize relationships from `content/relationships/*.graph.json` and Knowledge Object metadata. It should not define facts, create content, or become a hand-authored concept map separate from the pipeline.

Graph relationships are generally certification-agnostic. A concept can be used in different certifications, but its core relationships should not change simply because the active curriculum changes.

## Public app boundary

The public portfolio app should be learner-facing and content-read-only.

It may show:

- reviewed learning content
- search
- graph exploration
- curriculum paths
- assessments generated from canonical content and expectations
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
2. Avoid duplicate concept objects across certifications.
3. Curriculum controls teaching order.
4. Curriculum Expectations control exam/course depth.
5. Graph relationships are first-class data.
6. AI discovers before it authors.
7. The system resolves existing knowledge before authoring new knowledge.
8. Discovery review and knowledge authoring are separate responsibilities.
9. Human review and deterministic tooling promote canonical content.
10. Teach the concept, not the transcript.
11. Avoid duplicate content pools.
12. Keep the engine certification-agnostic.
13. Keep import/write workflows local or admin-only.
14. Build downstream learning features from canonical Knowledge Objects and expectations.
15. Validate before trusting promoted content.

## What future chats should preserve

Future development should continue this architecture instead of redesigning the project as a quiz application or a certification-specific content silo.

When adding new features, ask:

```text
Does this consume Knowledge Objects, graph relationships, curriculum plans, expectations, and learner progress,
or does it create another disconnected content pool?
```

If it creates another disconnected content pool, it is probably the wrong direction.
