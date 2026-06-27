# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/03-installing-operating-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/03-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-009
- proposedKnowledgeId: os-deployment.zero-touch-deployment
- title: Zero-touch deployment
- type: procedure
- domains: operating-systems, enterprise-it
- priority: normal
- recommendedDepth: normal
- reason: Zero-touch deployment is sufficiently described and valuable, but should be linked carefully to unattended installation rather than duplicated.

## Discovery Review Requirements
Must cover:
- automation goal
- little/no user prompts
- corporate configuration
- domain/email settings as examples
- relationship to unattended installation

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-009: "Generally, we would perform a zeroouch deployment... with little or no prompts" — Defines zero-touch deployment as highly automated installation and configuration.

## Suggested Relationships From Discovery
Prerequisites:
- None suggested.

Relationships:
- related_to: automation.unattended-installation — Zero-touch is a form of unattended or minimally attended deployment.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Zero-touch deployment is part of operating system installation foundations.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os-deployment.zero-touch-deployment",
  "slug": "zero-touch-deployment",
  "title": "Zero-touch deployment",
  "aliases": [],
  "type": "procedure",
  "status": "needs-review",
  "domains": ["operating-systems","enterprise-it"],
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
          "lessonId": "03",
          "title": "Installing Operating Systems",
          "order": 3
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
- Use the approved concept ID exactly: os-deployment.zero-touch-deployment
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
