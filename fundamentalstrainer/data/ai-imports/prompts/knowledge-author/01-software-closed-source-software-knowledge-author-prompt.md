# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-022
- proposedKnowledgeId: software.closed-source-software
- title: Closed-Source Software
- type: concept
- domains: software, operating-systems
- priority: normal
- recommendedDepth: brief
- reason: A small support concept is justified because the source directly contrasts closed source with open source.

## Discovery Review Requirements
Must cover:
- No public access to source code
- Contrast with open source
- Apple OSs as examples in this lesson

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-002: Create a short supporting concept or embed the definition in open/closed-source authoring. (Source code access is required to understand open-source versus closed-source models.)

## Source Evidence From Transcript Intelligence
- EVID-025: "all of the Apple operating systems are closed source. You do not have access to the source code of iOS." — Defines closed-source concept through Apple OS example.

## Suggested Relationships From Discovery
Prerequisites:
- software.source-code: Closed source depends on understanding source code access.

Relationships:
- contrasts_with: opensource.open-source-software — The source contrasts Apple closed-source OSs with Linux open source.
- related_to: apple.ios — iOS is presented as closed source.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Open vs closed source affects OS comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "software.closed-source-software",
  "slug": "closed-source-software",
  "title": "Closed-Source Software",
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
- Use the approved concept ID exactly: software.closed-source-software
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
