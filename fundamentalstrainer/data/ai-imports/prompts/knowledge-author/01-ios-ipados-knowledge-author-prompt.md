# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-020
- proposedKnowledgeId: ios.ipados
- title: Apple iPadOS
- type: operating-system
- domains: mobile-operating-systems, apple
- priority: normal
- recommendedDepth: brief
- reason: iPadOS is distinct enough from iOS to author briefly, focused on tablet capabilities and not Sidecar as a standalone topic.

## Discovery Review Requirements
Must cover:
- iPadOS as Apple tablet OS
- Desktop Safari browser
- Second monitor/Sidecar mention
- Keyboard and multitasking support

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-041: "iPad OS includes a desktop browser, specifically Safari" — Introduces iPadOS capabilities.
- EVID-042: "support a second monitor... Sidecar... keyboard support, multitasking" — Shows iPadOS feature set tied to hardware support.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: iPadOS is an operating system for Apple tablets.

Relationships:
- contrasts_with: apple.ios — The source distinguishes iPadOS from iOS.
- related_to: apple.sidecar — Sidecar is named as an iPadOS feature.

Curriculum placement:
- a-plus-220-1202 → 1.0 → mobile-operating-systems: iPadOS belongs in mobile/tablet OS coverage.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "ios.ipados",
  "slug": "ipados",
  "title": "Apple iPadOS",
  "aliases": [],
  "type": "operating-system",
  "status": "needs-review",
  "domains": ["mobile-operating-systems","apple"],
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
- Use the approved concept ID exactly: ios.ipados
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
