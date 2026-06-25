# Transcript-Triggered AI Enrichment

## Purpose

The import pipeline exists to turn instructional source material into canonical Knowledge Objects.

The transcript is not the final learning content. The transcript is the signal that tells the system which technical topics matter.

When a transcript mentions an important concept, tool, command, file system, protocol, symptom, procedure, or comparison, AI should build a complete learner-ready draft for that topic instead of repeating the transcript sentence.

## Core rule

```text
Transcript mentions a topic
    ↓
AI identifies the topic
    ↓
AI enriches the topic into useful learning content
    ↓
System normalizes and audits the draft
    ↓
Human review promotes accurate, useful, deduplicated knowledge
    ↓
Canonical Knowledge Object
```

Do not promote transcript wording as knowledge just because it appeared in the lesson.

## Example

Weak transcript wording:

```text
Another popular file system you might run into is ext4.
```

This is only a topic trigger. It proves that `ext4` appeared in the lesson, but it does not teach enough.

A useful AI-enriched draft should explain what a learner needs to know, such as:

- ext4 is a common Linux file system.
- ext4 supports journaling.
- ext4 is not the normal Windows system file system.
- ext4 should be contrasted with NTFS, FAT32/exFAT, and APFS where relevant.
- For certification study, ext4 is mainly recognized as a Linux-associated file system.

If AI cannot produce useful learner-ready content, the topic should be rejected as `mentioned-only`, not promoted as a weak Knowledge Object.

## Required separation

AI import output must separate:

1. `transcriptEvidence` — why this topic was triggered by the lesson.
2. `ai-enriched` content — useful learning facts, examples, comparisons, exam tips, common mistakes, scenarios, PBQ ideas, and relationships added from general IT knowledge.

Transcript evidence can support the topic trigger without supporting every enriched fact.

Enriched facts must be marked with:

```json
{
  "basis": "ai-enriched",
  "requiresReview": true
}
```

Transcript-supported facts should be marked with:

```json
{
  "basis": "transcript-supported",
  "requiresReview": true
}
```

`requiresReview` remains true because even transcript-supported and AI-enriched content must be checked before canonical promotion.

## Candidate classifications

Every discovered topic should be classified before review:

- `teachable` — useful enough to become or update a Knowledge Object.
- `merge-existing` — should update an existing object instead of creating a duplicate.
- `mentioned-only` — appeared in the transcript but is not useful enough for import.
- `ignore` — not technical, not relevant, or not worth tracking.
- `needs-enrichment` — relevant topic, but the AI draft is incomplete or uncertain.

Human review should focus on `teachable`, `merge-existing`, and `needs-enrichment` items. `mentioned-only` and `ignore` should not pollute the graph or knowledge base.

## Minimum knowledge threshold

A candidate must teach something useful before it can be promoted. It should include at least two of:

- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept

Thin candidates should be flagged by normalization and quality audit.

## Review meaning

Human review is promotion review.

The reviewer is not approving whether a transcript sentence exists. The reviewer is approving whether the proposed Knowledge Object change is:

- accurate
- useful for learners
- deduplicated against existing objects
- mapped correctly to objectives/lessons
- safe to use as canonical content
- connected to the graph with meaningful relationships

## What not to do

Do not:

- create one object for every transcript sentence
- create Knowledge Objects from weak mentions without enrichment
- use transcript wording as the final explanation when it does not teach enough
- create placeholder objects just because another object references them
- generate finished quiz questions during ingestion
- expose transcript import/upload in the public learner UI

## What to do

Do:

- use transcripts to discover relevant topics
- enrich important topics into learner-ready draft Knowledge Objects
- mark enriched facts as review-required
- reject mentioned-only concepts cleanly
- deduplicate before promotion
- keep graph relationships downstream of reviewed Knowledge Objects
- keep import/write workflows local or admin-only

## Relationship to the rest of the platform

Knowledge Objects remain the single source of truth. Learn mode, search, graph exploration, assessment seeds, flashcards, PBQs, AI tutor context, recommendations, and analytics should consume canonical Knowledge Objects.

Transcript-triggered enrichment is only the intake method. It must not bypass review, validation, duplicate detection, or controlled promotion.
