# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-010
- proposedKnowledgeId: os.desktop-user-interface
- title: Desktop User Interface Common Elements
- type: concept
- domains: operating-systems
- priority: normal
- recommendedDepth: brief
- reason: The comparison is teachable and useful for OS orientation, but should remain a brief cross-platform UI pattern object.

## Discovery Review Requirements
Must cover:
- Desktop workspace
- Taskbar/dock/panels
- Icons/status/search similarities across OSs

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-019: "there are consistencies that you will begin to see across these different OSS" — Introduces shared desktop UI patterns.
- EVID-020: "bar at the bottom... status information... recycle bin... icons" — Provides Windows UI examples.
- EVID-021: "similar to a Windows or a Linux desktop... workspace... bar at the bottom... icons and buttons" — Compares macOS desktop elements with other OSs.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Desktop UI is an interaction layer provided by OS environments.

Relationships:
- related_to: windows.microsoft-windows — Windows desktop examples illustrate common UI patterns.
- related_to: macos.apple-macos — macOS desktop examples illustrate common UI patterns.
- related_to: linux.linux — Linux desktop examples illustrate common UI patterns.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: Desktop UI patterns belong with desktop OS comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.desktop-user-interface",
  "slug": "desktop-user-interface",
  "title": "Desktop User Interface Common Elements",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems"],
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
          "lessonId": "01",
          "title": "Operating Systems Overview",
          "order": 1
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
- Use the approved concept ID exactly: os.desktop-user-interface
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
