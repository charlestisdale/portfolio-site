# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-001
- proposedKnowledgeId: filesystems.file-system
- title: File System
- type: file-system
- domains: filesystems, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Central concept; strong evidence and direct curriculum fit.

## Discovery Review Requirements
Must cover:
- Use the approved concept and source evidence to determine essential coverage.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-001: "That formatting determines what file system you will use for that specific partition." — The lesson defines the file system as the formatting choice for a partition.
- EVID-002: "This file system is important because this is the structure that will be used for all data that is read and written by this operating system." — Shows purpose and OS relationship.

## Suggested Relationships From Discovery
Prerequisites:
- storage.partitions: Partitions are formatted with a file system before use.
- operatingsystems.operating-system-basics: The lesson compares file systems by OS support.

Relationships:
- depends_on: storage.partitions — A file system is applied to a partition before data storage.
- related_to: operatingsystems.operating-system-basics — Different operating systems commonly use different file systems.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: This is the central concept of the File Systems lesson.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.file-system",
  "slug": "file-system",
  "title": "File System",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems","operating-systems"],
  "difficulty": "foundational | intermediate | advanced",
  "importance": "low | medium | high | exam-critical",
  "certificationMappings": [
    {
      "certification": "a-plus-220-1202",
      "examCode": "220-1202",
      "objectives": [
        {
          "id": "1.0",
          "name": "Operating Systems",
          "weight": null,
          "subtopics": []
        }
      ],
      "lessons": [
        {
          "lessonId": "02",
          "title": "File Systems",
          "order": 2
        }
      ]
    }
  ],
  "learning": {
    "summary": "2-3 sentence learner-ready summary.",
    "explanation": "2-4 paragraph explanation. Teach the concept clearly without copying the transcript.",
    "facts": [
      {
        "text": "Atomic fact that can generate questions or flashcards.",
        "importance": "low | medium | high | exam-critical",
        "tags": []
      }
    ],
    "commands": [],
    "examples": [
      {
        "text": "Concrete example or use case.",
        "context": "",
        "tags": []
      }
    ],
    "tables": [],
    "media": [],
    "notes": []
  },
  "assessmentSeeds": {
    "examTips": [],
    "commonMistakes": [],
    "scenarios": [],
    "pbqIdeas": [],
    "questionTargets": []
  },
  "relationships": {
    "prerequisites": [],
    "parents": [],
    "children": [],
    "related": [],
    "contrastsWith": [],
    "replacedBy": []
  },
  "sources": {
    "references": []
  },
  "quality": {
    "createdAt": "2026-06-25",
    "updatedAt": "2026-06-25",
    "lastReviewedAt": null,
    "reviewedBy": null,
    "confidence": "low | medium | high",
    "needsHumanReview": true,
    "reviewNotes": []
  }
}

## Authoring Rules
- Use the approved concept ID exactly: filesystems.file-system
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
