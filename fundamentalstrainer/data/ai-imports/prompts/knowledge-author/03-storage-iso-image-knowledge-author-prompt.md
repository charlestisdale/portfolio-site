# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/03-installing-operating-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/03-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-003
- proposedKnowledgeId: storage.iso-image
- title: ISO image
- type: file-system
- domains: storage, operating-systems, virtualization
- priority: normal
- recommendedDepth: brief
- reason: ISO images are clearly defined as disc images and connected to bootable installation and virtualization use.

## Discovery Review Requirements
Must cover:
- ISO as disc image
- bootable installation media use
- virtualization use
- mounting ISO files

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-003: "This ISO image contains everything that would normally be found on that optical disc." — Defines ISO as an optical-disc image used for installation.

## Suggested Relationships From Discovery
Prerequisites:
- None suggested.

Relationships:
- used_for: virtualization.virtual-machine-installation-media — The transcript says ISO booting is common in virtualization software.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: ISO image is part of operating system installation foundations.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "storage.iso-image",
  "slug": "iso-image",
  "title": "ISO image",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["storage","operating-systems","virtualization"],
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
- Use the approved concept ID exactly: storage.iso-image
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
