# Architecture Overview

## What this project is

The IT Learning Platform is an AI curriculum compiler.

It imports instructional material, discovers curriculum-relevant concepts, converts reviewed concepts into canonical Knowledge Objects, links those objects into a graph, places them into curriculum modules, and generates learner-facing experiences from that canonical knowledge layer.

It is not a quiz app. Assessments are downstream products of the Knowledge Engine.

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
Knowledge Author
    ↓
Draft Knowledge Objects
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
Curriculum Mapping
    ↓
Learning Engine
        ├── Learn mode
        ├── Search
        ├── Graph explorer
        ├── Study paths
        ├── Flashcards
        ├── PBQs
        ├── Assessments
        ├── AI tutor
        ├── Recommendations
        └── Analytics
```

## Core layers

### Source and ingestion layer

Local/private source material enters through transcripts and cleaned source text. Source material is evidence, not canonical learning content.

### AI curriculum compiler layer

The AI pipeline has three responsibilities:

1. Transcript Intelligence discovers concepts, evidence, relationships, curriculum placement suggestions, gaps, and merge risks.
2. Discovery Review decides what should be authored, merged, rejected, deferred, or enriched.
3. Knowledge Author writes draft Knowledge Objects for approved concepts only.

### Canonical knowledge layer

Promoted Knowledge Objects live under `content/knowledge/`. They are the source of truth for learner-facing content.

### Relationship layer

Graph edges live under `content/relationships/`. The graph describes how concepts relate. It does not define curriculum placement.

### Curriculum layer

Curriculum files live under `content/curriculum/`. Curriculum decides where and when Knowledge Objects are taught.

### Learning engine layer

The reusable engine under `engine/` consumes canonical data and renders learner-facing modes. It must remain certification-neutral.

## Engine/content separation

```text
engine/   reusable platform logic
content/  trusted learning data and certification-specific mappings
```

The engine should not contain CompTIA-specific, certification-specific, or lesson-specific content.

## Data relationships

```text
Knowledge Object = concept meaning
Graph edge       = concept relationship
Curriculum ref   = teaching placement
Objective ref    = certification mapping
Lesson ref       = source lesson organization
```

These layers are related, but they are not interchangeable.

## Validation boundary

No AI output is trusted by default.

AI responses must be normalized, audited, promoted, and validated before the platform treats them as canonical data.

## Public app boundary

The public learner app is read-only. It may consume reviewed content, but it should not expose source upload, direct authoring, promotion, raw provenance, or GitHub write operations.
