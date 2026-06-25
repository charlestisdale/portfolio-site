# Ingestion Pipeline

## Purpose

The ingestion pipeline converts instructional source material into reviewed canonical Knowledge Objects.

It is not a transcript summarization pipeline. It is not a quiz generation pipeline. It is a knowledge authoring and review pipeline.

## Current pipeline

```text
Video / instructional source
    ↓
Transcript or source text
    ↓
AI topic discovery
    ↓
AI deep knowledge enrichment
    ↓
Pending Knowledge Object candidates
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

The source transcript is a topic trigger. It answers:

```text
What concepts appeared in this lesson?
```

It does not limit what the learner should know.

A weak source mention can still trigger a rich Knowledge Object if the concept is important. The source evidence proves that the topic appeared; the AI-enriched content teaches the topic.

## AI role

The AI should act as an IT subject-matter expert.

It should:

- discover technical concepts from the source
- decide whether each topic is teachable, merge-existing, mentioned-only, ignore, or needs-enrichment
- enrich useful topics with general IT knowledge
- separate transcript-supported evidence from AI-enriched content
- create reusable Knowledge Object candidates
- suggest graph relationships
- suggest curriculum placement
- include assessment seeds such as scenarios, exam tips, common mistakes, and PBQ ideas

The AI should not merely restate the transcript.

## Human review role

Human review is promotion review.

The reviewer verifies:

- accuracy
- usefulness
- deduplication
- source relevance
- enrichment quality
- relationship quality
- curriculum placement
- readiness for canonical promotion

The reviewer is not approving raw transcript text. The reviewer is deciding whether the proposed Knowledge Object change should become trusted platform content.

## Candidate quality expectations

A high-quality candidate should usually include:

- stable reusable ID
- title
- aliases when useful
- type
- domains
- summary
- explanation
- facts
- evidence
- examples
- scenarios
- exam tips
- common mistakes
- PBQ ideas
- suggested relationships
- curriculum suggestions
- confidence
- source quality metadata
- review status

Important concepts should be dense enough to teach the learner without requiring the original transcript.

## Evidence and enrichment

Every candidate should preserve source evidence that explains why the topic was triggered.

Enriched facts should be marked:

```json
{
  "basis": "ai-enriched",
  "requiresReview": true
}
```

Transcript-supported facts should be marked:

```json
{
  "basis": "transcript-supported",
  "requiresReview": true
}
```

Both still require review before promotion.

## Curriculum suggestions

AI imports should include `curriculumSuggestions` for teachable candidates.

A curriculum suggestion says where the Knowledge Object should be taught. It is not a graph relationship and it is not canonical until reviewed.

Example:

```json
{
  "knowledgeId": "filesystems.ext4",
  "curriculumId": "a-plus-220-1202",
  "sectionId": "1.0",
  "moduleId": "file-systems",
  "reason": "ext4 is a Linux file system and belongs in the file systems module.",
  "basis": "ai-enriched",
  "confidence": 0.86,
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

Generate a deep AI import prompt:

```bash
npm run ai:import:prompt -- --lesson=01 --file="data/transcripts/cleaned/a-plus-220-1202/01-Operating Systems Overview.txt"
```

Save the AI JSON response under:

```text
data/ai-imports/responses/
```

Normalize the AI response:

```bash
npm run ai:import:normalize -- --file="data/ai-imports/responses/01-operating-systems-overview-ai-import.json"
```

Run duplicate detection:

```bash
npm run ingest:duplicates -- --file="data/imports/pending/01-ai-candidates.json"
```

Build review manifest:

```bash
npm run review:manifest
```

After browser review, audit the exported approved file:

```bash
npm run knowledge:audit-export -- --file="approved-knowledge-objects.json"
```

Promote safely:

```bash
npm run knowledge:promote -- --file="approved-knowledge-objects.json"
```

Validate everything:

```bash
npm run validate:all
```

## Permanent design rule

Teach the concept, not the transcript.

The transcript proves a topic belongs in the import. The Knowledge Object teaches what the learner needs to know.
