# Transcript-Triggered Analysis and Enrichment

## Purpose

The import pipeline exists to turn instructional source material into canonical Knowledge Objects, but source material should first be analyzed before anything is authored.

The transcript or source document is not the final learning content. The source is evidence that tells the system which technical topics matter, which topics are assumed, which topics are incomplete, and which topics may belong elsewhere in the curriculum.

When a source mentions an important concept, tool, command, file system, protocol, symptom, procedure, or comparison, AI should first decide what curriculum action is appropriate:

```text
create new concept candidate
merge with existing concept
mark mentioned-only
reject as out-of-scope
flag as knowledge gap
send to Knowledge Author for later drafting
```

## Current philosophy

Teach the concept, not the transcript.

The AI should use the transcript to discover what topics matter, but the first output is no longer a full Knowledge Object draft. The first output is a Transcript Intelligence package. Human review or system review then decides which concepts deserve authoring.

```text
Transcript = topic evidence
Transcript Intelligence = curriculum analysis
Knowledge Author = draft knowledge writing
Human = verifier
Knowledge Object = canonical learning unit
Curriculum = where the unit is taught
```

## Source handling rule

AI should see the least-destructive usable source text available.

For `.srt` files, lossless cleaning may remove only:

- cue numbers
- timestamps
- caption markup

Lossless cleaning must not remove repeated words, repeated phrases, overlapping cues, adjacent context, examples, comparisons, or topic details. Caption repetition is better than missing context because the AI can ignore noise, but it cannot recover deleted information.

If the user provides an already-clean transcript or document, use that as the source text directly. Do not create extra transcript copies just to satisfy the pipeline.

## Core rule

```text
Source mentions or teaches a topic
    ↓
AI identifies the topic
    ↓
AI classifies the topic
    ↓
AI identifies curriculum placement, relationships, prerequisites, merges, and gaps
    ↓
AI returns a Transcript Intelligence package
    ↓
Review selects concepts for authoring
    ↓
Knowledge Author writes draft Knowledge Objects
    ↓
Human review promotes accurate, useful, deduplicated knowledge
    ↓
Canonical Knowledge Object
```

Do not promote source wording as knowledge just because it appeared in the lesson.

## Discovery rule

The AI import should be rich enough to support review, but it should not force a fixed number of Knowledge Object candidates.

Return every concept that exceeds the minimum teaching threshold. Do not create concepts merely to satisfy a target count.

A normal Transcript Intelligence package should include:

- discovered concepts
- source evidence
- concept classification
- topic confidence
- evidence strength
- teaching value
- enrichment level
- review priority
- prerequisite suggestions
- relationship suggestions
- curriculum placement suggestions
- merge recommendations
- rejected mentions
- knowledge gaps
- import notes

A package with only a bare list of terms is incomplete. A package that turns every sentence into a concept is noisy. A package that hides gaps, duplicates, or weak evidence is incomplete.

## Example

Weak transcript wording:

```text
Another popular file system you might run into is ext4.
```

This is only evidence that `ext4` appeared in the lesson. A strong Transcript Intelligence result would not immediately write a Knowledge Object. It would decide something like:

```json
{
  "title": "ext4",
  "proposedKnowledgeId": "filesystems.ext4",
  "classification": "teachable",
  "teachingValue": "medium",
  "topicConfidence": 0.92,
  "evidenceStrength": "weak",
  "enrichmentLevel": "high",
  "reviewPriority": "normal",
  "curriculumPlacement": {
    "curriculumId": "a-plus-220-1202",
    "sectionId": "1.0",
    "moduleId": "file-systems"
  },
  "analysisNotes": [
    "The source only mentions ext4, so authoring will require general IT knowledge.",
    "This should be contrasted with NTFS, FAT32, exFAT, APFS, and other Linux file systems."
  ]
}
```

The Knowledge Author stage may later create the full `filesystems.ext4` draft if review agrees the concept belongs.

## Required separation

Stage 1 AI output must separate:

1. `sourceEvidence` — why this topic was triggered by the source.
2. `analysis` — classification, teaching value, curriculum location, relationships, prerequisites, gaps, and merge recommendations.
3. `authoringGuidance` — what a later Knowledge Author should cover if this concept is approved.

Stage 1 should not produce final learner explanations, full fact lists, flashcards, or quiz questions.

Stage 2 Knowledge Author output may produce learner-ready content, but it must preserve basis metadata and review requirements.

## Truth basis labels

Every meaningful analysis item should include one of these basis labels:

- `source-supported` — directly supported by source evidence.
- `ai-inference` — inferred from the source and curriculum context.
- `general-it-knowledge` — added from stable general IT knowledge.
- `common-practice` — based on common industry practice.
- `exam-knowledge` — based on certification/exam framing.

Do not collapse these into one generic confidence score.

## Candidate classifications

Every discovered topic should be classified before review:

- `teachable` — useful enough to become or update a Knowledge Object.
- `merge-existing` — should update an existing object instead of creating a duplicate.
- `mentioned-only` — appeared in the source but is not useful enough for import.
- `ignore` — not technical, not relevant, or not worth tracking.
- `needs-enrichment` — relevant topic, but authoring should wait for more evidence or external enrichment.

Human review should focus on `teachable`, `merge-existing`, and `needs-enrichment` items. `mentioned-only` and `ignore` should not pollute the graph, curriculum, or knowledge base.

## Curriculum suggestions

Transcript Intelligence should include curriculum suggestions for teachable and merge-existing candidates.

A curriculum suggestion says where the concept should be taught. It is not a graph relationship and it is not canonical until reviewed.

Example:

```json
{
  "proposedKnowledgeId": "filesystems.ext4",
  "curriculumId": "a-plus-220-1202",
  "sectionId": "1.0",
  "moduleId": "file-systems",
  "reason": "ext4 is a Linux file system and belongs with OS file system comparisons.",
  "basis": "general-it-knowledge",
  "topicConfidence": 0.92,
  "evidenceStrength": "weak",
  "requiresReview": true
}
```

Curriculum placement answers:

```text
Where should this be taught?
```

Graph relationships answer:

```text
How does this concept relate to other concepts?
```

Do not mix these responsibilities.

## Minimum teaching threshold

A concept should move forward only when it supports at least two of these:

- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept
- curriculum relevance
- prerequisite value
- troubleshooting value

Thin mentions should be flagged, not inflated into fake Knowledge Objects.

## Review meaning

Human review of Transcript Intelligence asks:

- Is this a real concept?
- Should it be taught?
- Should it merge?
- Is it in the right curriculum location?
- Is the source evidence strong enough?
- Does it require enrichment?
- Are there missing prerequisites or gaps?

Human review of Knowledge Object drafts asks:

- Is the authored content accurate?
- Is it useful for learners?
- Is it deduplicated against existing objects?
- Is it safe to promote into canonical content?
- Is it connected to the graph with meaningful relationships?

## What not to do

Do not:

- create one object for every transcript sentence
- return a starter import, outline, representative subset, or bare schema
- create Knowledge Objects from weak mentions before discovery review
- use transcript wording as the final explanation when it does not teach enough
- run aggressive text cleanup before AI sees the source
- create placeholder objects just because another object references them
- generate finished quiz questions during ingestion
- expose transcript import/upload in the public learner UI
- skip curriculum analysis for teachable candidates
- force a 25–40 object target

## What to do

Do:

- use the least-destructive usable source text
- use transcripts and documents to discover relevant topics
- classify every discovered topic
- identify merges, prerequisites, relationships, curriculum placement, and gaps
- mark truth basis clearly
- reject mentioned-only concepts cleanly
- deduplicate before authoring and before promotion
- keep graph relationships downstream of reviewed Knowledge Objects
- keep curriculum placement separate from graph relationships
- keep import/write workflows local or admin-only

## Relationship to the rest of the platform

Knowledge Objects remain the single source of truth. Learn mode, search, graph exploration, curriculum study paths, assessment seeds, flashcards, PBQs, AI tutor context, recommendations, and analytics should consume canonical Knowledge Objects.

Transcript-triggered analysis is only the intake method. It must not bypass review, validation, duplicate detection, curriculum review, authoring review, or controlled promotion.
