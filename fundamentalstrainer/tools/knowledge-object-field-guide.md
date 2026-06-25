# Knowledge Object Field Guide

This project is knowledge-first. A knowledge object is the single authoritative record for one concept. Quizzes, flashcards, PBQs, exam simulations, search results, study guides, and analytics should be generated from these records.

Transcripts and AI import responses are not canonical knowledge. They are intake artifacts. A transcript may trigger a topic, and AI may enrich that topic into a draft, but the Knowledge Object only becomes trusted after human review, deduplication, objective mapping, and validation.

## Stable ID rules

Use stable IDs because progress tracking, relationships, assessments, and citations will depend on them.

Format:

```text
domain.slug
```

Examples:

```text
commands.ipconfig
windows.task-manager
networking.dhcp
security.windows-firewall
filesystems.ext4
```

Do not rename IDs casually. If a concept is replaced, keep the old object and use `status: "deprecated"` plus `relationships.replacedBy`.

## Status rules

- `stub`: created but barely filled in.
- `draft`: usable, but not fully reviewed.
- `needs-review`: possible conflict, duplicate, outdated info, AI-enriched fact review, or uncertain objective mapping.
- `reviewed`: checked for accuracy, deduplication, objective mapping, and relationship quality.
- `deprecated`: kept for history or redirects.

## What belongs in each section

### Metadata
Identity and routing information only: ID, slug, title, aliases, type, domains, status, difficulty, and importance.

### Certification mappings
Where the concept appears. A concept can map to multiple certifications and multiple objectives.

### Learning
The teaching content. Keep facts atomic because each fact may later become a flashcard, question, or review point.

Learning content should teach the concept. Do not use weak transcript wording as the final explanation. If the transcript only mentions a topic, AI should enrich it into useful learner-ready content or the candidate should be rejected as `mentioned-only`.

### Assessment seeds
Not finished questions. These are controlled prompts that the assessment generator can later use to create questions without duplicating content.

### Relationships
The graph. Use this to connect commands, tools, protocols, symptoms, operating systems, file systems, and troubleshooting flows.

Do not create graph edges only because a term was mentioned. Relationship suggestions from AI enrichment must be reviewed before promotion.

### Sources
Evidence. Transcript references come first as topic triggers, but they may not support every enriched fact. Official docs and exam objectives can also be added later.

Separate source meaning:

- transcript evidence: why the topic appeared in the lesson
- transcript-supported fact: fact directly supported by the transcript
- AI-enriched fact: useful learning content added from general IT knowledge and requiring review

### Quality
Review metadata. Never mark objects reviewed until the concept has been checked against duplicates, objective mapping, AI-enriched facts, and relationship quality.

## Deduplication rules

Before creating a new object, search by:

1. Exact title
2. Alias
3. Command name
4. Acronym
5. Related concept
6. Lesson overlap
7. Proposed AI-enriched candidate ID

Example: do not create separate records for `Task Manager`, `Windows Task Manager`, and `taskmgr.exe`. Use one object with aliases.

Do not create placeholder objects only because another candidate references them. A referenced concept must still meet the minimum knowledge threshold or be rejected as `mentioned-only` / `needs-enrichment`.

## Minimum knowledge threshold

A candidate must teach something useful before promotion. It should include at least two of:

- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept

Example: `Another popular file system you might run into is ext4.` is a transcript trigger, not a Knowledge Object summary. A valid `filesystems.ext4` draft should teach what ext4 is, where it is used, how it compares to other file systems, and why the learner should recognize it.

## Assessment generation rule

Do not manually write the same question in multiple files. Generate questions from:

- `learning.facts`
- `learning.commands`
- `assessmentSeeds.examTips`
- `assessmentSeeds.commonMistakes`
- `assessmentSeeds.scenarios`
- `assessmentSeeds.pbqIdeas`
- `relationships`

If an assessment item cannot trace back to a reviewed Knowledge Object, it should not be treated as platform content.
