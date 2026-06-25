# IT Learning Platform Data Architecture

The platform is knowledge-first. The engine loads generic entities and never contains certification-specific facts.

Knowledge Objects are the canonical source of truth. Transcripts, AI responses, import records, review packages, search indexes, and generated assessments are upstream or downstream artifacts; they are not the trusted knowledge base by themselves.

## Core entity types

1. **Certification** — Exam or learning track, such as `a-plus-220-1202`, `network-plus`, or `ccna`.
2. **Objective** — Official exam domain/objective/subobjective structure for a certification.
3. **Lesson** — Source-learning unit, such as one video transcript or other instructional source.
4. **Knowledge Object** — One canonical concept, command, tool, protocol, procedure, file system, or troubleshooting pattern.
5. **Relationship** — A typed graph edge between two knowledge objects or between a knowledge object and an objective/lesson.
6. **Assessment Item** — Generated or reviewed quiz, flashcard, PBQ, matching, ordering, or exam question sourced from knowledge objects.
7. **Media Asset** — Screenshot, diagram, icon, simulated output, or PBQ asset.
8. **Progress Record** — User mastery state for a concept/objective/certification.
9. **Search Index Entry** — Flattened searchable record generated from canonical content.
10. **Import Record** — Transcript ingestion audit trail.
11. **AI Import Candidate** — Review-only draft produced by transcript-triggered enrichment. It may contain AI-enriched facts, but it is not canonical until reviewed and promoted.

## Source of truth rules

- Knowledge objects are the source of truth for facts.
- Transcripts trigger topic discovery; they are not the complete learning source.
- AI import candidates may enrich transcript-triggered topics with general IT knowledge, but enriched facts must be marked for review.
- A weak transcript mention must not become canonical knowledge unless it is enriched into useful learner content and reviewed.
- Assessments are generated from knowledge objects and must point back to source concept IDs.
- Relationships should be stored as graph edges, not only as embedded arrays.
- Search indexes are generated artifacts, not hand-authored content.
- Progress records belong in `data/progress/`, not inside content files.
- Certification-specific mappings belong in content, never in engine code.

## Entity dependency flow

```text
Certification
  -> Objectives
  -> Lessons
  -> Transcript-triggered AI import candidates
  -> Human promotion review
  -> Knowledge Objects
  -> Relationship Graph
  -> Search Index
  -> Assessment Seeds
  -> Generated Assessments
  -> User Progress / Analytics
```

## Directory ownership

```text
engine/                 Generic application behavior only
content/certifications/ Certification manifests
content/objectives/     Objective trees
content/lessons/        Lesson/source-video manifests
content/knowledge/      Canonical knowledge objects
content/relationships/  Typed relationship graph edges
content/assessments/    Generated/reviewed assessments
content/media/          Media assets and metadata
content/indexes/        Generated search/lookup indexes
data/transcripts/       Raw and cleaned transcript inputs
data/ai-imports/        AI prompts and raw AI import responses
data/imports/           Import audit records and review candidates
data/progress/          User/local progress records
tools/                  Schemas, validators, ingestion utilities
```

## Relationship model

Relationships are explicit edges:

```json
{
  "id": "rel.commands.ipconfig.uses.networking.dhcp",
  "sourceId": "commands.ipconfig",
  "targetId": "networking.dhcp",
  "type": "uses",
  "strength": "strong",
  "direction": "outbound",
  "evidence": ["lesson:11"],
  "notes": "ipconfig can release and renew DHCP leases."
}
```

This makes the graph usable for prerequisites, study paths, concept maps, search expansion, analytics, AI tutor context, and PBQ generation.

Do not create graph edges from weak transcript mentions alone. AI-enriched relationship suggestions must be reviewed before becoming canonical relationship edges.

## Assessment generation rule

Assessment items should have `generation.sourceKnowledgeIds` and `generation.sourceSeedIds`. If a question cannot trace back to a reviewed Knowledge Object, it should not be treated as platform content.
