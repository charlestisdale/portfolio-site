# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-012
- proposedKnowledgeId: opensource.open-source-software
- title: Open-Source Software
- type: concept
- domains: software, operating-systems
- priority: normal
- recommendedDepth: brief
- reason: Open source is explicitly contrasted with closed source and supports multiple OS concepts.

## Discovery Review Requirements
Must cover:
- Source code availability
- Community maintenance
- Contrast with closed source

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-002: Create a short supporting concept or embed the definition in open/closed-source authoring. (Source code access is required to understand open-source versus closed-source models.)

## Source Evidence From Transcript Intelligence
- EVID-023: "open-source software that is created and maintained by thousands of individuals" — Defines Linux as open-source and community maintained.
- EVID-025: "Unlike Linux, which is an open-source operating system, all of the Apple operating systems are closed source." — Contrasts open source with closed source.

## Suggested Relationships From Discovery
Prerequisites:
- software.source-code: Open source requires understanding source code access, which is implied later by closed-source iOS.

Relationships:
- related_to: linux.linux — Linux is an example of open-source software.
- contrasts_with: software.closed-source-software — The transcript contrasts Linux open source with Apple closed source OSs.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Open source affects OS support, compatibility, and development model.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "opensource.open-source-software",
  "slug": "open-source-software",
  "title": "Open-Source Software",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["software","operating-systems"],
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
- Use the approved concept ID exactly: opensource.open-source-software
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
