# Knowledge Object Field Guide

This project is knowledge-first. A knowledge object is the single authoritative record for one concept. Quizzes, flashcards, PBQs, exam simulations, search results, study guides, and analytics should be generated from these records.

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
```

Do not rename IDs casually. If a concept is replaced, keep the old object and use `status: "deprecated"` plus `relationships.replacedBy`.

## Status rules

- `stub`: created but barely filled in.
- `draft`: usable, but not fully reviewed.
- `needs-review`: possible conflict, duplicate, outdated info, or uncertain objective mapping.
- `reviewed`: checked for accuracy, deduplication, and objective mapping.
- `deprecated`: kept for history or redirects.

## What belongs in each section

### Metadata
Identity and routing information only: ID, slug, title, aliases, type, domains, status, difficulty, and importance.

### Certification mappings
Where the concept appears. A concept can map to multiple certifications and multiple objectives.

### Learning
The teaching content. Keep facts atomic because each fact may later become a flashcard, question, or review point.

### Assessment seeds
Not finished questions. These are controlled prompts that the assessment generator can later use to create questions without duplicating content.

### Relationships
The graph. Use this to connect commands, tools, protocols, symptoms, operating systems, and troubleshooting flows.

### Sources
Evidence. Transcript references come first, but official docs and exam objectives can also be added later.

### Quality
Review metadata. Never mark objects reviewed until the concept has been checked against duplicates and objective mapping.

## Deduplication rules

Before creating a new object, search by:

1. Exact title
2. Alias
3. Command name
4. Acronym
5. Related concept
6. Lesson overlap

Example: do not create separate records for `Task Manager`, `Windows Task Manager`, and `taskmgr.exe`. Use one object with aliases.

## Assessment generation rule

Do not manually write the same question in multiple files. Generate questions from:

- `learning.facts`
- `learning.commands`
- `assessmentSeeds.examTips`
- `assessmentSeeds.commonMistakes`
- `assessmentSeeds.scenarios`
- `assessmentSeeds.pbqIdeas`
- `relationships`
