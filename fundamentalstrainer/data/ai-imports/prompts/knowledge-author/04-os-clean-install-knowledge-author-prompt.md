# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-003
- proposedKnowledgeId: os.clean-install
- title: Clean Install
- type: concept
- domains: operating-systems, windows
- priority: high
- recommendedDepth: normal
- reason: Strongly supported, core lesson concept with clear consequences, procedure distinction, and backup/partition risk.

## Discovery Review Requirements
Must cover:
- Removes existing OS files, applications, user data, and settings.
- Usually starts by booting from installation media.
- Requires backup and drive/partition review before proceeding.
- Use when a fresh system state is desired.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-001: Link to an existing installation media concept/procedure or create one if absent. (The lesson depends on installation media without teaching it.)

## Source Evidence From Transcript Intelligence
- EVID-005: "Installing means you're effectively starting over completely fresh." — Introduces clean installation as a fresh-start installation method.
- EVID-006: "This is compared to a clean install which wipes everything on that system." — Shows the major consequence of a clean install.
- EVID-007: "You would normally begin a clean install from the boot process of your computer by booting from the installation media." — Provides a procedure-level distinction from in-place upgrades.

## Suggested Relationships From Discovery
Prerequisites:
- storage.partition-formatting: Clean installs commonly involve partition deletion and formatting decisions.
- storage.backup: Clean installs erase user data, so backup knowledge is critical before proceeding.

Relationships:
- contrasts_with: os.in-place-upgrade — Clean install removes existing content while in-place upgrade preserves it.
- used_for: boot.installation-media — The source says clean installs normally begin by booting from installation media.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: Clean installation is a core Windows deployment and maintenance decision.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.clean-install",
  "slug": "clean-install",
  "title": "Clean Install",
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
- Use the approved concept ID exactly: os.clean-install
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
