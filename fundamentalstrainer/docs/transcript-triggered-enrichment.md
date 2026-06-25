# Transcript-Triggered AI Enrichment

## Purpose

The import pipeline exists to turn instructional source material into canonical Knowledge Objects.

The transcript or source document is not the final learning content. The source is the signal that tells the system which technical topics matter.

When a source mentions an important concept, tool, command, file system, protocol, symptom, procedure, or comparison, AI should build a complete learner-ready draft for that topic instead of repeating the source sentence.

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
Source mentions a topic
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

Do not promote source wording as knowledge just because it appeared in the lesson.

## Rich import rule

The AI import should be rich enough to review and promote. It should not be a starter import, outline, representative subset, or bare list of concepts.

For a normal lesson, target **25–40 Knowledge Object candidates**. Fewer candidates are acceptable only when the source genuinely contains fewer useful concepts, and the response must explain that limitation in `importNotes`.

Each teachable or merge-existing candidate should usually include:

- 2–3 sentence `summaryDraft`
- 1–3 short paragraph `explanationDraft`
- at least 4 atomic `factsDraft` items
- at least 1 `transcriptEvidence` item, preferably 2–4 when supported
- at least 2 useful relationships when applicable
- exam tips when the concept is exam-relevant
- common mistakes when learners commonly confuse the concept
- examples or scenarios when they help teach the concept
- PBQ ideas when the concept supports hands-on, matching, ordering, configuration, troubleshooting, or identification tasks
- confidence, difficulty, importance, evidence IDs, and review flags

A candidate with zero facts is incomplete. A candidate with only a one-sentence summary and no facts is incomplete. A candidate that simply repeats the source is incomplete.

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

1. `transcriptEvidence` — why this topic was triggered by the source.
2. `ai-enriched` content — useful learning facts, examples, comparisons, exam tips, common mistakes, scenarios, PBQ ideas, and relationships added from general IT knowledge.

Transcript/source evidence can support the topic trigger without supporting every enriched fact.

Enriched facts must be marked with:

```json
{
  "basis": "ai-enriched",
  "requiresReview": true
}
```

Transcript/source-supported facts should be marked with:

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
- `mentioned-only` — appeared in the source but is not useful enough for import.
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
- return a starter import, outline, representative subset, or bare schema
- create Knowledge Objects from weak mentions without enrichment
- use transcript wording as the final explanation when it does not teach enough
- run aggressive text cleanup before AI sees the source
- create placeholder objects just because another object references them
- mark zero-fact candidates as high quality
- generate finished quiz questions during ingestion
- expose transcript import/upload in the public learner UI

## What to do

Do:

- use the least-destructive usable source text
- use transcripts and documents to discover relevant topics
- enrich important topics into learner-ready draft Knowledge Objects
- include facts, evidence, relationships, exam tips, common mistakes, scenarios, and PBQ ideas where appropriate
- mark enriched facts as review-required
- reject mentioned-only concepts cleanly
- deduplicate before promotion
- keep graph relationships downstream of reviewed Knowledge Objects
- keep import/write workflows local or admin-only

## Relationship to the rest of the platform

Knowledge Objects remain the single source of truth. Learn mode, search, graph exploration, assessment seeds, flashcards, PBQs, AI tutor context, recommendations, and analytics should consume canonical Knowledge Objects.

Transcript-triggered enrichment is only the intake method. It must not bypass review, validation, duplicate detection, or controlled promotion.
