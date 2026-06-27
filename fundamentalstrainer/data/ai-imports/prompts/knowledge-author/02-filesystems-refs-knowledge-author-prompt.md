# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-005
- proposedKnowledgeId: filesystems.refs
- title: ReFS
- type: file-system
- domains: filesystems, windows, server
- priority: high
- recommendedDepth: normal
- reason: Valid Windows/server file-system concept; author with verification of current support limits.

## Discovery Review Requirements
Must cover:
- Verify exact ReFS desktop/server support during authoring.
- Preserve source correction that RFS/RIFFS refers to ReFS.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-009: "Microsoft is working on the next generation of file systems with the resilient file system or REFS." — Introduces ReFS and full name.
- EVID-010: "There is an emphasis in resiliency. This operating system is able to repair itself and it's constantly checking itself for integrity." — Provides key purpose/features.
- EVID-011: "There's also some RAID type functionality built into RIFFS so that you can build out redundant file systems with redundant storage." — Relates ReFS to redundancy/storage resiliency.

## Suggested Relationships From Discovery
Prerequisites:
- filesystems.ntfs: ReFS is introduced as an upgrade path from NTFS.
- storage.raid: The lesson compares ReFS redundancy to RAID-type functionality.

Relationships:
- contrasts_with: filesystems.ntfs — ReFS is described as an upgrade to NTFS.
- related_to: storage.raid — The source mentions RAID-type redundancy in ReFS.
- used_for: storage.data-integrity — ReFS is presented around integrity checking and resiliency.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.refs",
  "slug": "refs",
  "title": "ReFS",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems","windows","server"],
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
- Use the approved concept ID exactly: filesystems.refs
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
