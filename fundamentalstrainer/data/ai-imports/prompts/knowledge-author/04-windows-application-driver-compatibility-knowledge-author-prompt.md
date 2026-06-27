# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-008
- proposedKnowledgeId: windows.application-driver-compatibility
- title: Application and Driver Compatibility
- type: concept
- domains: windows, software, hardware
- priority: normal
- recommendedDepth: normal
- reason: Worth authoring because incompatible apps and drivers are a practical upgrade risk; enrich with realistic troubleshooting context.

## Discovery Review Requirements
Must cover:
- Applications and device drivers may not support the newer OS.
- Check vendor/developer documentation before upgrading.
- Compatibility problems can block or complicate upgrades.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-017: "certain applications or certain device drivers will not be compatible in the newer version of the operating system" — Identifies compatibility risk when upgrading OS versions.
- EVID-018: "check the documentation from all of your app developers and check the details of all of your device drivers" — Provides planning guidance for verifying compatibility.

## Suggested Relationships From Discovery
Prerequisites:
- software.application: Learners should know what applications are before evaluating compatibility.
- hardware.device-driver: Driver compatibility depends on understanding the role of device drivers.

Relationships:
- depends_on: os.in-place-upgrade — Application and driver compatibility can determine whether an upgrade is safe.
- related_to: hardware.device-driver — The source specifically calls out device drivers as a compatibility concern.

Curriculum placement:
- a-plus-220-1202 → 3.0 → software-troubleshooting-foundations: Incompatible apps or drivers are common upgrade-related troubleshooting issues.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "windows.application-driver-compatibility",
  "slug": "application-driver-compatibility",
  "title": "Application and Driver Compatibility",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["windows","software","hardware"],
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
          "lessonId": "04",
          "title": "Upgrading Windows",
          "order": 4
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
- Use the approved concept ID exactly: windows.application-driver-compatibility
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
