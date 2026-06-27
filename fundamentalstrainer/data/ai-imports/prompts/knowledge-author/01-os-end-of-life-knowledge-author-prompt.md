# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-026
- proposedKnowledgeId: os.end-of-life
- title: Operating System End of Life
- type: concept
- domains: operating-systems, operations, security
- priority: high
- recommendedDepth: normal
- reason: OS lifecycle is strongly supported and important for security and administration.

## Discovery Review Requirements
Must cover:
- Meaning of end of life
- Vendor differences
- Why administrators must track EOL
- Security/support implications

Merge guidance to preserve:
- Merge operational.os-deployment-support into this object: The source evidence mostly points back to lifecycle/EOL support concerns; preserve as authoring guidance under EOL rather than a standalone object.

Relevant gap review:
- GAP-005: Keep current authoring generic; require fresh vendor-source enrichment for date-specific EOL content. (Version-specific lifecycle dates are volatile and require authoritative vendor sources.)

## Source Evidence From Transcript Intelligence
- EVID-052: "end of life is something we should always be aware of when using an operating system" — Introduces EOL as an OS lifecycle concern.
- EVID-053: "different companies will set different standards for end of life" — Explains vendor-specific EOL differences.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: EOL is a lifecycle state for OS products.
- security.patch-management: Unsupported OSs affect patch availability.

Relationships:
- related_to: os.patch-management — EOL affects update and support expectations.
- part_of: operational.vendor-support-lifecycle — EOL is part of deployment and support requirements.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: EOL belongs in OS maintenance and lifecycle.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.end-of-life",
  "slug": "end-of-life",
  "title": "Operating System End of Life",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","operations","security"],
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
- Use the approved concept ID exactly: os.end-of-life
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
