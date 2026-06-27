# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/02-file-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/02-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-007
- proposedKnowledgeId: filesystems.exfat
- title: exFAT
- type: file-system
- domains: filesystems
- priority: high
- recommendedDepth: normal
- reason: Strong removable-storage and cross-platform concept.

## Discovery Review Requirements
Must cover:
- Use the approved concept and source evidence to determine essential coverage.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-014: "This stands for extended file allocation table. And this was created by Microsoft specifically for flash drive storage." — Defines exFAT and primary use case.
- EVID-015: "XFAT allows you to have files much larger than 4 GB, exceeding the maximum in FAT32." — Shows contrast with FAT32.
- EVID-016: "You can save something on your flash drive on Windows and then take it to your Linux or Mac OS system." — Shows cross-platform removable-storage scenario.

## Suggested Relationships From Discovery
Prerequisites:
- filesystems.fat32: exFAT is introduced by comparison to FAT32.
- hardware.usb-flash-drive: The lesson uses flash drives as the scenario for exFAT.

Relationships:
- contrasts_with: filesystems.fat32 — exFAT supports files larger than FAT32’s 4 GB limit.
- used_for: filesystems.cross-platform-compatibility — The source presents exFAT as useful across Windows, Linux, and macOS.

Curriculum placement:
- a-plus-220-1202 → 1.0 → file-systems: Belongs in the file-systems module because it is directly taught as part of the lesson’s file-system comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "filesystems.exfat",
  "slug": "exfat",
  "title": "exFAT",
  "aliases": [],
  "type": "file-system",
  "status": "needs-review",
  "domains": ["filesystems"],
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
- Use the approved concept ID exactly: filesystems.exfat
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
