# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-007
- proposedKnowledgeId: windows.pc-health-check
- title: Windows PC Health Check
- type: tool
- domains: windows, operating-systems, hardware
- priority: normal
- recommendedDepth: brief
- reason: Specific Windows readiness tool is supported by the manifest and useful as a linked tool object, but should remain brief.

## Discovery Review Requirements
Must cover:
- PC Health Check checks Windows 11 readiness.
- It reports which requirements pass or fail.
- It can identify missing or disabled Secure Boot or TPM 2.0.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-003: Send Windows 11 requirements to enrichment before Knowledge Authoring. (Exact Windows 11 requirements must be verified against Microsoft before authoring.)

## Source Evidence From Transcript Intelligence
- EVID-015: "For Windows 11, Microsoft refers to this application as the PC health check for Windows 11." — Names the tool used for Windows 11 upgrade readiness.
- EVID-016: "PC health check tells us this PC doesn't currently meet the Windows 11 system requirements." — Shows how the tool reports pass/fail readiness information.

## Suggested Relationships From Discovery
Prerequisites:
- os.hardware-compatibility-check: PC Health Check is an example of a hardware compatibility check.

Relationships:
- used_for: windows.windows-11-requirements — The tool evaluates whether a PC meets Windows 11 system requirements.
- related_to: security.tpm-2-0 — The example output flags TPM 2.0 as a Windows 11 requirement.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: This is a Windows-specific readiness tool used during Windows upgrade planning.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "windows.pc-health-check",
  "slug": "pc-health-check",
  "title": "Windows PC Health Check",
  "aliases": [],
  "type": "tool",
  "status": "needs-review",
  "domains": ["windows","operating-systems","hardware"],
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
- Use the approved concept ID exactly: windows.pc-health-check
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
