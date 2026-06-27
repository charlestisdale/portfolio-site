# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-013
- proposedKnowledgeId: linux.distributions
- title: Linux Distributions
- type: concept
- domains: linux, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Distribution selection is a distinct Linux concept with strong source support.

## Discovery Review Requirements
Must cover:
- What a distribution is
- Task-specific vs general-purpose distributions
- Choosing a distribution based on needs
- Support and compatibility implications

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-024: "there are different distributions of Linux" — Introduces distributions as a key Linux distinction.
- EVID-026: "focused on performing a set of very specific tasks... designed for general use" — Shows distributions differ by purpose.
- EVID-027: "install the Linux distribution that fit best with your needs" — Gives selection purpose.

## Suggested Relationships From Discovery
Prerequisites:
- linux.linux: Distributions are a Linux-specific concept.

Relationships:
- part_of: linux.linux — Distributions are variants/packages of Linux-based OSs.
- related_to: hardware.device-drivers — Different distributions may vary in hardware support.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: Linux distributions are essential to desktop OS selection.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "linux.distributions",
  "slug": "distributions",
  "title": "Linux Distributions",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["linux","operating-systems"],
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
- Use the approved concept ID exactly: linux.distributions
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
