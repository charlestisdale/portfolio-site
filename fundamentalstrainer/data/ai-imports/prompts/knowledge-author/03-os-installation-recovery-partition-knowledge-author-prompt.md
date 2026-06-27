# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/03-installing-operating-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/03-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-011
- proposedKnowledgeId: os-installation.recovery-partition
- title: Recovery partition
- type: concept
- domains: operating-systems, storage
- priority: normal
- recommendedDepth: brief
- reason: Recovery partitions are clearly defined, tied to hidden partitions, and useful for troubleshooting/reinstallation.

## Discovery Review Requirements
Must cover:
- hidden partition purpose
- contains recovery/install files
- troubleshooting use
- vendor recovery environments

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-011: "Most modern operating systems will also install a recovery partition. This is commonly installed as a hidden partition." — Defines recovery partition and its hidden nature.

## Suggested Relationships From Discovery
Prerequisites:
- None suggested.

Relationships:
- part_of: storage.disk-partition — A recovery partition is a logical partition on the storage drive.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Recovery partition is part of operating system installation foundations.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os-installation.recovery-partition",
  "slug": "recovery-partition",
  "title": "Recovery partition",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","storage"],
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
          "lessonId": "03",
          "title": "Installing Operating Systems",
          "order": 3
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
- Use the approved concept ID exactly: os-installation.recovery-partition
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
