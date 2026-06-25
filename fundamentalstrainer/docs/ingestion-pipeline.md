# Ingestion Pipeline

## Purpose

The ingestion pipeline converts instructional source material into reviewed canonical Knowledge Objects, but it does not do that in one AI jump.

It is not a transcript summarization pipeline. It is not a quiz generation pipeline. It is a curriculum-construction and knowledge-review pipeline.

The pipeline now separates two responsibilities:

```text
Transcript Intelligence = discover, classify, place, relate, merge, and gap-check concepts.
Knowledge Authoring = write draft Knowledge Objects only after a concept deserves authoring.
```

## Current pipeline

```text
Video / instructional source
    ↓
Transcript or source text
    ↓
Least-destructive cleaning
    ↓
Evidence Builder
    ↓
Evidence JSON
    ↓
Transcript Intelligence
    ↓
Concept Discovery
    ↓
Concept Classification
    ↓
Relationship Discovery
    ↓
Curriculum Placement
    ↓
Gap Analysis
    ↓
Merge Detection
    ↓
Discovery Review Queue
    ↓
Knowledge Author
    ↓
Draft Knowledge Object candidates
    ↓
Normalization and quality audit
    ↓
Duplicate detection
    ↓
Human promotion review
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

## Source role

The source transcript is evidence. It answers:

```text
What was mentioned, taught, implied, compared, demonstrated, or assumed in this lesson?
```

It does not automatically define a Knowledge Object.

A weak source mention can still trigger an important concept, but the first decision is curriculum analysis:

```text
Should this concept exist?
Should it merge with an existing concept?
Is it merely mentioned?
Does it belong somewhere else?
Does the lesson assume missing prerequisite knowledge?
```

## Stage 1 AI role: Transcript Intelligence

The first AI stage should act as a curriculum analyst.

It should:

- discover technical concepts from the source
- classify each concept as teachable, merge-existing, mentioned-only, ignore, or needs-enrichment
- identify concepts that deserve their own Knowledge Object
- identify concepts that should update or merge into existing Knowledge Objects
- identify prerequisite concepts
- suggest graph relationships without making them canonical
- suggest curriculum placement without making it canonical
- identify knowledge gaps and assumed background knowledge
- separate source evidence from AI inference and general IT knowledge
- provide review priority and confidence metadata

The first AI stage should not author full Knowledge Objects. It should produce a reviewable discovery package.

## Stage 2 AI role: Knowledge Author

The second AI stage writes draft Knowledge Objects after discovery review.

It should receive:

- selected concept candidate
- source evidence
- curriculum placement context
- nearby existing Knowledge Objects
- merge decision or new-object decision
- prerequisite and relationship context
- gap/enrichment notes

It may then create learner-ready draft content:

- summary
- explanation
- atomic facts
- examples
- scenarios
- exam tips
- common mistakes
- PBQ ideas
- suggested relationships
- curriculum suggestions
- review metadata

The authored draft is still not canonical. It must pass human review, duplicate detection, audit, and validation.

## Human review roles

Human review is split into two review moments.

### Discovery review

The reviewer verifies:

- whether the concept is real and useful
- whether the concept deserves its own object
- whether it should merge with an existing object
- whether it is only mentioned
- whether it belongs in this curriculum location
- whether prerequisites or gaps were missed
- whether relationship suggestions make sense

### Knowledge promotion review

The reviewer verifies:

- accuracy
- usefulness
- deduplication
- source relevance
- enrichment quality
- relationship quality
- curriculum placement
- readiness for canonical promotion

The reviewer is not approving raw transcript text. The reviewer is deciding whether a proposed discovery or authored knowledge change should move forward.

## Discovery quality expectations

A high-quality Transcript Intelligence package should usually include:

- stable proposed concept IDs
- concept titles and aliases
- classification
- teaching value
- topic confidence
- evidence strength
- enrichment need
- review priority
- source evidence
- prerequisite suggestions
- relationship suggestions
- curriculum placement suggestions
- merge recommendations
- knowledge gaps
- rejected mentions
- import notes

A discovery package should not be judged by how many concepts it returns. It should return every concept that exceeds the minimum teaching threshold and reject weak mentions cleanly.

## Evidence, enrichment, and truth basis

Every meaningful claim should carry a basis. Supported basis values:

```text
source-supported
ai-inference
general-it-knowledge
common-practice
exam-knowledge
```

Source evidence explains why a topic was triggered. It does not automatically prove every enriched or inferred fact.

Confidence should be split into more useful review signals:

```text
topicConfidence     How likely this is a real relevant concept.
evidenceStrength    How strongly the source supports the concept.
enrichmentLevel     How much outside knowledge is needed.
reviewPriority      How urgently or carefully a human should review it.
```

## Curriculum suggestions

Transcript Intelligence should include curriculum placement suggestions for teachable and merge-existing concepts.

A curriculum suggestion says where the concept should be taught. It is not a graph relationship and it is not canonical until reviewed.

Example:

```json
{
  "conceptId": "DISC-004",
  "proposedKnowledgeId": "filesystems.ext4",
  "curriculumId": "a-plus-220-1202",
  "sectionId": "1.0",
  "moduleId": "file-systems",
  "reason": "ext4 is a Linux file system and belongs in a file-system comparison module.",
  "basis": "general-it-knowledge",
  "topicConfidence": 0.92,
  "evidenceStrength": "weak",
  "reviewPriority": "normal",
  "requiresReview": true
}
```

## Knowledge gaps

Knowledge gaps are first-class output.

A gap describes important knowledge that the lesson assumes, skips, or only mentions weakly.

Example:

```json
{
  "gapId": "GAP-001",
  "title": "NTFS permissions are assumed but not explained",
  "description": "The lesson mentions NTFS but does not explain ACLs, inheritance, or permission troubleshooting.",
  "relatedConceptIds": ["filesystems.ntfs", "windows.ntfs-permissions"],
  "recommendation": "Create or link a follow-up lesson/object for NTFS permissions.",
  "severity": "medium",
  "basis": "ai-inference",
  "requiresReview": true
}
```

## Rejected concepts

Rejected concepts are useful. They keep the canonical store clean.

Use rejection for topics that are:

- mentioned only
- too vague
- duplicate
- out of scope
- not technical
- not useful enough to teach

A rejected mention should not enter the graph, curriculum, assessment pool, or canonical knowledge base.

## Local/admin boundary

Ingestion is a local or authenticated admin workflow.

The public learner app should not expose source upload, import, merge, or write controls. Public learners should only consume reviewed canonical content.

## Current command flow

Generate a Transcript Intelligence prompt:

```bash
npm run ai:import:prompt -- --lesson=01 --file="data/transcripts/cleaned/a-plus-220-1202/01-Operating Systems Overview.txt"
```

Save the AI JSON response under:

```text
data/ai-imports/responses/
```

Normalize the AI response:

```bash
npm run ai:import:normalize -- --file="data/ai-imports/responses/01-operating-systems-overview-transcript-intelligence.json"
```

The normalized Stage 1 package is written to:

```text
data/imports/pending/01-transcript-intelligence.json
```

After discovery review, send approved concepts to the Knowledge Author stage. Knowledge Author output should become draft Knowledge Object candidates and must still pass duplicate detection, review, audit, promotion, and validation.

Validate everything:

```bash
npm run validate:all
```

## Permanent design rule

Teach the concept, not the transcript.

The transcript proves a topic belongs in the analysis. Transcript Intelligence decides what should exist in the curriculum. Knowledge Authoring writes draft Knowledge Objects only after that decision is made.
