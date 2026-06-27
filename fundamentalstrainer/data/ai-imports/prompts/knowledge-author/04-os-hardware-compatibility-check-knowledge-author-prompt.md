# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-006
- proposedKnowledgeId: os.hardware-compatibility-check
- title: OS Hardware Compatibility Check
- type: troubleshooting-step
- domains: operating-systems, hardware, windows
- priority: high
- recommendedDepth: normal
- reason: Clear pre-upgrade planning concept with strong source support and broad relevance across OS installation and upgrade decisions.

## Discovery Review Requirements
Must cover:
- Check memory, drive space, processor support, and feature support.
- Use vendor documentation and compatibility tools.
- Run checks before upgrade or installation.
- Incompatibility may require upgrades or replacement.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-013: "check the requirements for that OS. Check to see that your system has enough memory, has enough spare drive space" — Identifies the compatibility checks that should occur before upgrade or install.
- EVID-014: "Microsoft includes a nice hardware compatibility check that you can run" — Shows that vendor tools can validate readiness for Windows upgrades.

## Suggested Relationships From Discovery
Prerequisites:
- hardware.system-requirements: Compatibility checks compare a device against operating system requirements.

Relationships:
- used_for: windows.pc-health-check — PC Health Check is the Windows 11 compatibility tool discussed in the source.
- depends_on: os.in-place-upgrade — Upgrade decisions depend on whether the hardware can run the target OS.

Curriculum placement:
- a-plus-220-1202 → 1.0 → os-maintenance-and-lifecycle: Hardware compatibility checks are a planning requirement before OS upgrade.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.hardware-compatibility-check",
  "slug": "hardware-compatibility-check",
  "title": "OS Hardware Compatibility Check",
  "aliases": [],
  "type": "troubleshooting-step",
  "status": "needs-review",
  "domains": ["operating-systems","hardware","windows"],
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
- Use the approved concept ID exactly: os.hardware-compatibility-check
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
