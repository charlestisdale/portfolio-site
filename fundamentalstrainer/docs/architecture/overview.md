# Architecture Overview

## What this project is

The IT Learning Platform is an AI-assisted curriculum compiler and learning engine.

It imports instructional material, discovers curriculum-relevant concepts, resolves those concepts against the existing knowledge base, converts reviewed concepts into canonical Knowledge Objects or updates to existing Knowledge Objects, links those objects into a graph, plans curriculum-specific learning paths, defines curriculum-specific expectations, and generates learner-facing experiences from that canonical knowledge layer.

It is not a quiz app. Assessments are downstream products of the Learning Engine.

## System flow

```text
Instructional source
    ↓
Transcript / source text
    ↓
Cleaning
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Resolver
    ↓
Decision
    ├── New Knowledge Object
    ├── Expand Existing Knowledge Object
    ├── Add Curriculum Expectation Only
    ├── Add Relationship Only
    └── Reject / Defer
    ↓
Knowledge Author / Knowledge Maintainer
    ↓
Draft Knowledge Object or update package
    ↓
Normalization
    ↓
Promotion
    ↓
Validation
    ↓
Canonical Knowledge Objects
    ↓
Knowledge Graph
    ↓
Curriculum Engine
    ├── Curriculum Plan
    └── Curriculum Expectations
    ↓
Learning Engine
        ├── Learn mode
        ├── Search
        ├── Graph explorer
        ├── Study paths
        ├── Flashcards
        ├── PBQs
        ├── Labs
        ├── Assessments
        ├── AI tutor
        ├── Recommendations
        └── Analytics
```

## Core layers

### Source and ingestion layer

Local/private source material enters through transcripts and cleaned source text. Source material is evidence, not canonical learning content.

### AI curriculum compiler layer

The AI pipeline has these responsibilities:

1. Transcript Intelligence discovers concepts, evidence, relationships, possible curriculum relevance, gaps, and merge risks.
2. Discovery Review decides what should be authored, merged, rejected, deferred, or enriched.
3. Knowledge Resolver searches existing canonical knowledge before any new authoring happens.
4. Knowledge Author writes draft Knowledge Objects for truly new approved concepts.
5. Knowledge Maintainer proposes updates to existing objects when new source material deepens or clarifies an existing concept.

The AI is not expected to remember the platform. The platform must retrieve the relevant existing Knowledge Objects, aliases, relationships, and expectations and supply that context to the AI at the correct stage.

### Canonical knowledge layer

Promoted Knowledge Objects live under `content/knowledge/`. They are the source of truth for concept meaning.

A canonical Knowledge Object should represent a reusable concept, not a certification-specific copy of that concept.

For example, `networking.vlan` should be a reusable concept. A+, Network+, CCNA, and Security+ expectations should attach to it rather than creating separate VLAN objects for each certification.

### Relationship layer

Graph edges live under `content/relationships/`. The graph describes how concepts relate. It does not define curriculum placement or expected mastery depth.

### Curriculum Engine layer

Curriculum is no longer treated as only a static mapping list. The long-term architecture treats curriculum as a first-class engine with two outputs:

```text
Curriculum Plan         = where and when concepts are taught
Curriculum Expectations = what depth, skills, and assessment styles are required
```

Curriculum files live under `content/curriculum/`.

Curriculum expectation files should live under a dedicated content area such as `content/expectations/` when implemented.

### Learning engine layer

The reusable engine under `engine/` consumes canonical data, graph relationships, curriculum plans, expectations, and learner progress. It must remain certification-neutral.

## Engine/content separation

```text
engine/   reusable platform logic
content/  trusted learning data and certification/course-specific plans and expectations
```

The engine should not contain CompTIA-specific, Cisco-specific, certification-specific, lesson-specific, or transcript-specific content.

## Data relationships

```text
Knowledge Object        = concept meaning
Knowledge fragment      = tagged fact/example/command/scenario inside a concept
Graph edge              = concept relationship
Curriculum Plan         = teaching placement and order
Curriculum Expectation  = curriculum-specific depth and required skills
Objective ref           = certification objective mapping
Lesson ref              = source lesson organization
```

These layers are related, but they are not interchangeable.

## Multi-certification model

A concept should exist once when it represents the same underlying knowledge.

```text
Canonical Knowledge Object:
    networking.vlan

Curriculum Expectations:
    a-plus-220-1202/networking.vlan
    network-plus/networking.vlan
    ccna-200-301/networking.vlan
    security-plus/networking.vlan
```

The public app does not need live AI to determine relevance. It should deterministically combine:

```text
active curriculum
+ curriculum expectation
+ canonical Knowledge Object
+ tagged fragments
+ graph context
+ learner progress
```

Then it renders the appropriate learner-facing view.

## Import decision model

When a discovered concept is reviewed, the system should classify it as one of these outcomes:

```text
new-object
expand-existing-object
expectation-only
relationship-only
duplicate-no-change
reject
defer
```

This prevents the project from creating certification-specific duplicates while still allowing a later certification to deepen an existing concept.

## Validation boundary

No AI output is trusted by default.

AI responses must be normalized, audited, promoted, and validated before the platform treats them as canonical data.

Validation should eventually check that:

- Knowledge Objects do not duplicate existing canonical concepts.
- Curriculum expectations reference existing Knowledge Objects.
- Curriculum plans reference valid modules and expectations.
- Generated learner-facing views are derived from canonical knowledge and expectations.

## Public app boundary

The public learner app is read-only. It may consume reviewed content, graph relationships, curriculum plans, expectations, and progress. It should not expose source upload, direct authoring, promotion, raw provenance, or GitHub write operations.
