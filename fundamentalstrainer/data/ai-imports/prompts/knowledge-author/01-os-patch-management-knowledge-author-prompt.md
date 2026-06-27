# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-027
- proposedKnowledgeId: os.patch-management
- title: Operating System Updates and Security Patches
- type: concept
- domains: operating-systems, security, operations
- priority: high
- recommendedDepth: normal
- reason: Strong maintenance/security concept; author as OS patching while linking to general security patch management.

## Discovery Review Requirements
Must cover:
- Keep OS updated
- Updates support efficiency/stability
- Security patches reduce risk
- Applies across OS vendors

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-003: Enrich OS patch-management authoring with vulnerability, exploit, and unpatched-system risk context. (Patch management needs vulnerability/risk context to be educationally complete.)
- GAP-005: Keep current authoring generic; require fresh vendor-source enrichment for date-specific EOL content. (Version-specific lifecycle dates are volatile and require authoritative vendor sources.)

## Source Evidence From Transcript Intelligence
- EVID-031: "requirement to keep these OSS updated with the latest version of software" — Introduces update requirement across OSs.
- EVID-054: "ensures the operating system will run at peak efficiency... security patches are always updated" — Explains performance and security purpose of updates.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Patching applies to OSs.
- security.vulnerability: Security patches imply vulnerabilities, which are not explained in the transcript.

Relationships:
- related_to: security.patch-management — OS updates include security patches.
- related_to: os.end-of-life — EOL affects update and patch availability.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: OS updates are a lifecycle/maintenance function.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.patch-management",
  "slug": "patch-management",
  "title": "Operating System Updates and Security Patches",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","security","operations"],
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
- Use the approved concept ID exactly: os.patch-management
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
