# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-021
- proposedKnowledgeId: apple.ios
- title: Apple iOS
- type: operating-system
- domains: mobile-operating-systems, apple
- priority: high
- recommendedDepth: normal
- reason: Major mobile OS with strong evidence and clear relationship to Apple hardware and closed-source model.

## Discovery Review Requirements
Must cover:
- iOS as iPhone OS
- Closed-source model
- Apple hardware exclusivity
- Relationship to iPadOS

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-043: "operating system that runs on Apple's iPhones... Apple iOS" — Defines iOS as iPhone OS.
- EVID-025: "all of the Apple operating systems are closed source" — Identifies Apple mobile OS source model.
- EVID-044: "iOS is an operating system that will only run on Apple hardware" — Identifies hardware exclusivity.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: iOS is an operating system.
- software.closed-source-software: Closed source is referenced as a key property.

Relationships:
- related_to: software.closed-source-software — iOS is described as closed source.
- depends_on: hardware.apple-hardware — iOS is described as running only on Apple hardware.
- related_to: ios.ipados — iOS and iPadOS are related but distinct Apple OSs.

Curriculum placement:
- a-plus-220-1202 → 1.0 → mobile-operating-systems: iOS is a major mobile OS.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "apple.ios",
  "slug": "ios",
  "title": "Apple iOS",
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
- Use the approved concept ID exactly: apple.ios
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
