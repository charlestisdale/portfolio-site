# Curriculum Engine

## Purpose

The Curriculum Engine organizes canonical Knowledge Objects into teachable learning paths without duplicating the knowledge itself.

Knowledge Objects answer:

```text
What does the learner need to know?
```

Curriculum answers:

```text
Where, when, and why should this Knowledge Object be taught?
```

This layer sits between the Knowledge Graph and learner-facing features such as Study Path, assessments, flashcards, PBQs, recommendations, analytics, and AI tutoring.

## Core rule

Knowledge Objects remain the single source of truth. Curriculum files may reference Knowledge Object IDs, but they must not copy explanations, facts, exam tips, PBQ content, scenarios, or common mistakes.

```text
Sources / transcripts
  -> Transcript Intelligence
  -> discovery review
  -> Knowledge Authoring
  -> reviewed canonical Knowledge Objects
  -> Knowledge Graph
  -> Curriculum mappings
  -> Study Path / assessments / PBQs / tutoring / analytics
```

Curriculum is not a replacement for Knowledge Objects. It is an ordering and placement layer.

## Why this layer exists

A Knowledge Object can be reused across multiple certifications, courses, or study tracks.

Example:

```text
filesystems.ext4
```

The same object could appear in:

```text
CompTIA A+ Core 2 -> Operating Systems -> File Systems
Linux+ -> Storage -> Linux File Systems
Security+ -> Hardening -> Linux Permissions and Storage
```

The object stays singular. The curriculum decides where it is taught.

## Data model

```text
Curriculum
  -> Section
    -> Module
      -> Knowledge References
      -> Auto-map Rules
      -> Outcomes
```

### Curriculum

A curriculum is one learning track, usually tied to a certification or course.

```json
{
  "schemaVersion": "1.0.0",
  "id": "a-plus-220-1202",
  "title": "CompTIA A+ Core 2",
  "type": "certification",
  "certificationId": "a-plus-220-1202",
  "sections": []
}
```

### Section

A section is a major objective/domain grouping.

```json
{
  "id": "1.0",
  "title": "Operating Systems",
  "order": 1,
  "objectiveIds": ["1.0"],
  "modules": []
}
```

### Module

A module is a teachable grouping inside a section.

```json
{
  "id": "operating-system-foundations",
  "title": "Operating System Foundations",
  "order": 1,
  "outcomes": [
    "Explain the role of an operating system.",
    "Identify common desktop and mobile operating systems."
  ],
  "knowledge": [
    "operating-system.core",
    "windows.os",
    "linux.os"
  ],
  "autoMap": {
    "domains": ["operating-systems"],
    "types": ["operating-system"]
  }
}
```

## Explicit knowledge references

The `knowledge` array is the safest mapping method. It directly references canonical Knowledge Object IDs.

Use explicit references when:

- the object has been reviewed
- order matters
- the module needs an exact concept list
- the concept appears in multiple possible modules
- auto-map may place the concept too broadly

## Auto-map rules

Auto-map rules are a transitional tool. They prevent every new object from falling into `Unmapped Knowledge` before exact curriculum placement is reviewed.

Supported rules:

```json
{
  "domains": ["operating-systems"],
  "types": ["operating-system", "file-system"],
  "idPrefixes": ["windows.", "linux.", "macos.", "filesystems."],
  "titleIncludes": ["operating system", "file system"]
}
```

Auto-map should be used carefully. It is useful during ingestion and early development, but reviewed curriculum should gradually move important objects into explicit `knowledge` arrays.

## AI curriculum suggestions

Transcript Intelligence may return curriculum placement suggestions for teachable and merge-existing concepts.

Example:

```json
{
  "conceptId": "DISC-004",
  "proposedKnowledgeId": "filesystems.ext4",
  "curriculumId": "a-plus-220-1202",
  "sectionId": "1.0",
  "moduleId": "file-systems",
  "reason": "ext4 is a Linux file system and belongs with OS file system comparisons.",
  "basis": "general-it-knowledge",
  "topicConfidence": 0.86,
  "evidenceStrength": "weak",
  "requiresReview": true
}
```

These suggestions are reviewable metadata. They do not automatically become canonical curriculum. Human review decides whether a suggestion should become an explicit curriculum reference, a new module, or be ignored.

## Review meaning

Curriculum review is different from Knowledge Object review and different from discovery review.

Discovery review asks:

```text
Should this concept exist, merge, move, wait for enrichment, or be rejected?
```

Knowledge review asks:

```text
Is this authored concept accurate and useful?
```

Curriculum review asks:

```text
Is this the right place and order to teach this concept?
```

A concept may be accurate but still mapped to the wrong module.

## Study Path behavior

Study Path should render curriculum structure first:

```text
Curriculum title
  -> Section
    -> Module
      -> Knowledge Objects
```

Only objects not matched by explicit references or auto-map rules should appear in an `Unmapped Knowledge` section.

As curriculum coverage improves, `Unmapped Knowledge` should shrink toward zero.

## Relationship to the Knowledge Graph

Curriculum placement is not a graph relationship.

Graph relationships answer:

```text
How do concepts relate?
```

Curriculum answers:

```text
Where should this be taught?
```

Do not mix these responsibilities. A Knowledge Object may be graph-related to one concept but taught in a different curriculum module.

## Relationship to AI stages

Transcript Intelligence should propose curriculum placement because it has source context and can identify what the lesson was trying to teach.

Knowledge Authoring may preserve or refine reviewed placement context, but it should not be the first stage deciding whether a concept belongs in the curriculum.

However:

- AI suggestions require review.
- Bad fits should not be forced.
- A proposed new module is allowed when no existing module fits.
- Curriculum review should happen separately from knowledge accuracy review.

## What not to do

Do not:

- duplicate Knowledge Object explanations inside curriculum files
- use transcript lesson order as the permanent curriculum model
- create certification-specific duplicate Knowledge Objects just to place content in a path
- hide unmapped knowledge silently
- mix graph relationships with curriculum placement
- automatically treat AI curriculum suggestions as canonical

## What to do

Do:

- keep Knowledge Objects reusable and certification-agnostic
- use curriculum files to define teachable order
- allow one Knowledge Object to appear in multiple curricula
- track learning outcomes at module level
- use auto-map as a temporary safety net
- review curriculum placement separately from knowledge accuracy
- move reviewed AI placement suggestions into explicit curriculum references over time
