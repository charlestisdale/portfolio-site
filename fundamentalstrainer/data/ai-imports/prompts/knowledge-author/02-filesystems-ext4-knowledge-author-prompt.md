# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-008
- proposedKnowledgeId: filesystems.ext4
- title: ext4
- type: file-system
- domains: filesystems, linux, android
- priority: normal
- recommendedDepth: normal
- reason: Valid Linux/Android file-system concept; needs moderate enrichment.

## Discovery Review Requirements
Must cover:
- Use the approved concept and source evidence to determine essential coverage.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-017: "Another popular file system you might run into is ext4." — Introduces ext4 as a relevant file system.
- EVID-018: "This is the fourth version or fourth iteration of the extended file system that you would commonly find in things like Linux or Android." — Defines ext4 by lineage and OS usage.

## Suggested Relationships From Discovery
Prerequisites:
- filesystems.file-system: ext4 is a file-system example.
- operatingsystems.linux: ext4 is associated with Linux and Android.

Relationships:
- used_for: operatingsystems.linux — The source says ext4 is commonly found in Linux.
- used_for: operatingsystems.android — The source says Android commonly uses ext4.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.ext4",
  "slug": "ext4",
  "title": "ext4",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems","linux","android"],
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
- Use the approved concept ID exactly: filesystems.ext4
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
