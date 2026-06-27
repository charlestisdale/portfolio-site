# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-004
- proposedKnowledgeId: filesystems.ntfs
- title: NTFS
- type: file-system
- domains: filesystems, windows
- priority: high
- recommendedDepth: normal
- reason: Core Windows file-system concept with features and contrasts.

## Discovery Review Requirements
Must cover:
- Use the approved concept and source evidence to determine essential coverage.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-007: "If you're using Windows, then the file system that you're probably using is the NTFS or NT file system." — Identifies NTFS as a common Windows file system.
- EVID-008: "There were a number of new features added within TFS, including things like compression, file encryption. You have quotas, and other management features built into the file system itself." — Lists feature areas that justify teaching value.

## Suggested Relationships From Discovery
Prerequisites:
- filesystems.file-system: NTFS is an example of a file system.
- operatingsystems.windows: NTFS is primarily associated with Windows systems.

Relationships:
- contrasts_with: filesystems.fat32 — NTFS is described as an upgrade to FAT32.
- used_for: filesystems.file-encryption — The lesson names file encryption as an NTFS feature.
- used_for: filesystems.disk-quotas — The lesson names quotas as an NTFS management feature.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.ntfs",
  "slug": "ntfs",
  "title": "NTFS",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems","windows"],
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
- Use the approved concept ID exactly: filesystems.ntfs
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
