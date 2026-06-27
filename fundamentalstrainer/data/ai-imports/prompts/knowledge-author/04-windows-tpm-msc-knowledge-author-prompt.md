# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-014
- proposedKnowledgeId: windows.tpm-msc
- title: TPM Management Console Snap-in
- type: command
- domains: windows, security
- priority: normal
- recommendedDepth: brief
- reason: Useful Windows command/tool object for checking TPM details; should link to TPM without duplicating the full TPM explanation.

## Discovery Review Requirements
Must cover:
- tpm.msc opens TPM management details.
- It is an MMC snap-in.
- Use it to verify TPM status/version/readiness.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-029: "you can run the TPM. MSC. This is the Microsoft snap-in for the Microsoft management console" — Identifies TPM.MSC as a Windows management console snap-in.
- EVID-030: "gives you all of the details about the TPM that's in your system" — Explains the purpose of the command/tool.

## Suggested Relationships From Discovery
Prerequisites:
- security.tpm-2-0: The tool is used to inspect TPM status and details.
- windows.microsoft-management-console: TPM.MSC is described as an MMC snap-in.

Relationships:
- used_for: security.tpm-2-0 — TPM.MSC checks the TPM present in the system.
- used_for: windows.windows-11-requirements — TPM status matters for Windows 11 upgrade readiness.

Curriculum placement:
- a-plus-220-1202 → 2.0 → security-foundations: The tool verifies a hardware-backed security feature required by Windows 11.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "windows.tpm-msc",
  "slug": "tpm-msc",
  "title": "TPM Management Console Snap-in",
  "aliases": [],
  "type": "command",
  "status": "needs-review",
  "domains": ["windows","security"],
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
- Use the approved concept ID exactly: windows.tpm-msc
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
