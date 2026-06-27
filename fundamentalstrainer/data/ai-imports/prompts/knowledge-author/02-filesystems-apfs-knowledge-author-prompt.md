# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-010
- proposedKnowledgeId: filesystems.apfs
- title: APFS
- type: file-system
- domains: filesystems, macos, ios
- priority: high
- recommendedDepth: normal
- reason: Core Apple file-system concept with SSD, encryption, snapshots, and integrity features.

## Discovery Review Requirements
Must cover:
- Use the approved concept and source evidence to determine essential coverage.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-023: "Apple also has their own file system with the Apple file system or APFS." — Introduces APFS and full name.
- EVID-024: "This is also a file system available in your iOS and iPad OS devices." — Shows Apple ecosystem usage.
- EVID-025: "This file system was written to optimize data on SSDs or solidstate drives." — Gives purpose/optimization.
- EVID-026: "This builds in encryption, has the ability to quickly save and restore from a snapshot, and there is increased data integrity options within the APFS file system." — Lists notable APFS features.

## Suggested Relationships From Discovery
Prerequisites:
- operatingsystems.macos: APFS is associated with macOS.
- hardware.ssd: APFS is described as optimized for SSDs.

Relationships:
- used_for: hardware.ssd — APFS is optimized for SSD storage.
- used_for: filesystems.snapshots — APFS includes snapshot support according to the source.
- used_for: security.encryption — APFS includes encryption according to the source.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.apfs",
  "slug": "apfs",
  "title": "APFS",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems","macos","ios"],
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
- Use the approved concept ID exactly: filesystems.apfs
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
