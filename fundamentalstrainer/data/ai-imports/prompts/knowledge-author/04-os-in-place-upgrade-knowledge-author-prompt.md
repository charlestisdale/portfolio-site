# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-002
- proposedKnowledgeId: os.in-place-upgrade
- title: In-Place Upgrade
- type: concept
- domains: operating-systems, windows
- priority: high
- recommendedDepth: normal
- reason: Strongly supported, core lesson concept that contrasts directly with clean install and belongs in OS maintenance planning.

## Discovery Review Requirements
Must cover:
- Preserves applications, documents, settings, user accounts, and existing OS context.
- Usually launched from inside the existing operating system.
- Best when data, applications, or specialized configurations should remain in place.
- Still requires backup and compatibility planning.

Merge guidance to preserve:
- Merge os.upgrade into this object: The manifest treats general upgrade as a broad lead-in to in-place upgrade. Preserve the comparison and preservation guidance, but avoid a separate duplicate Knowledge Object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-003: "An in place upgrade will upgrade the existing operating system, but keep everything in place on your system." — Directly defines the concept.
- EVID-004: "It's common to start an in place upgrade by launching the installation process from inside of the existing OS." — Adds procedure-level evidence for how an in-place upgrade commonly begins.

## Suggested Relationships From Discovery
Prerequisites:
- os.clean-install: Learners compare in-place upgrades against clean installs to choose the right method.
- storage.backup: Even preservation-style upgrades should be preceded by backup planning.

Relationships:
- contrasts_with: os.clean-install — The source explicitly compares in-place upgrade and clean install.
- depends_on: windows.pc-health-check — Compatibility checking should occur before upgrading Windows.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: This is a core OS maintenance procedure for moving to a newer Windows version while preserving data.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.in-place-upgrade",
  "slug": "in-place-upgrade",
  "title": "In-Place Upgrade",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","windows"],
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
- Use the approved concept ID exactly: os.in-place-upgrade
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
