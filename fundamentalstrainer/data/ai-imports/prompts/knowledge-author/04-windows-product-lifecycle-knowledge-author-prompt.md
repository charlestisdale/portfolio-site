# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-009
- proposedKnowledgeId: windows.product-lifecycle
- title: Windows Product Lifecycle
- type: concept
- domains: windows, os-maintenance
- priority: normal
- recommendedDepth: normal
- reason: Lifecycle calendars and support retirement are central to upgrade planning; current dates must be verified during authoring.

## Discovery Review Requirements
Must cover:
- Lifecycle calendars show support and retirement dates.
- Lifecycle status affects upgrade planning.
- Quality and feature updates are tied to lifecycle support.
- Verify current Microsoft lifecycle details before publishing.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-005: Verify Microsoft lifecycle terminology and dates during authoring; avoid hardcoding transcript-only support windows. (Lifecycle timing and support status change over time.)

## Source Evidence From Transcript Intelligence
- EVID-019: "Most operating system manufacturers will give you a life cycle calendar." — Introduces lifecycle calendars as planning tools.
- EVID-020: "This will tell you when this operating system is in support and when this operating system will be retired from support." — Explains the lifecycle calendar's purpose.
- EVID-021: "Microsoft refers to this as the modern life cycle policy." — Names the Microsoft-specific lifecycle policy context.

## Suggested Relationships From Discovery
Prerequisites:
- os.patch-management: Lifecycle status determines whether updates and support continue.

Relationships:
- related_to: os.end-of-life — Lifecycle calendars identify retirement from support/end-of-life timing.
- related_to: os.patch-management — The source connects lifecycle with quality updates, security updates, and bug fixes.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: Lifecycle planning determines when operating systems should be upgraded or retired.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "windows.product-lifecycle",
  "slug": "product-lifecycle",
  "title": "Windows Product Lifecycle",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["windows","os-maintenance"],
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
- Use the approved concept ID exactly: windows.product-lifecycle
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
