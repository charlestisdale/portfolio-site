# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-013
- proposedKnowledgeId: security.tpm-2-0
- title: Trusted Platform Module 2.0
- type: security-control
- domains: security, hardware, windows
- priority: high
- recommendedDepth: normal
- reason: Strongly supported security/hardware concept with direct Windows 11, BitLocker, and Windows Hello relationships.

## Discovery Review Requirements
Must cover:
- TPM is hardware-backed cryptographic capability.
- TPM 2.0 or later is required for Windows 11 in this lesson context.
- TPM can support BitLocker and Windows Hello.
- TPM may need to be supported and enabled.

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-004: Author TPM at normal depth and link to BitLocker and Windows Hello without expanding those features here. (TPM purpose is only briefly introduced.)

## Source Evidence From Transcript Intelligence
- EVID-026: "One of the big requirements for Windows 11 is that you have a TPM, a trusted platform module." — Defines TPM as a major Windows 11 requirement.
- EVID-027: "This is usually hardware on the motherboard of this system" — Identifies TPM as motherboard-related hardware.
- EVID-028: "This is cryptographic hardware, and it's important to use this for Bit Locker, Windows Hello" — Explains TPM purpose and related Windows features.

## Suggested Relationships From Discovery
Prerequisites:
- security.cryptography-basics: TPM is cryptographic hardware, so basic cryptography context helps.

Relationships:
- part_of: windows.windows-11-requirements — TPM 2.0 is a Windows 11 requirement in the lesson.
- used_for: security.bitlocker — The source says TPM is important for BitLocker.
- used_for: identity.windows-hello — The source says TPM is important for Windows Hello.
- related_to: windows.tpm-msc — TPM.MSC is used to check TPM details.

Curriculum placement:
- a-plus-220-1202 → 2.0 → security-foundations: TPM is a hardware-backed security control used by Windows security features.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "security.tpm-2-0",
  "slug": "tpm-2-0",
  "title": "Trusted Platform Module 2.0",
  "aliases": [],
  "type": "security-control",
  "status": "needs-review",
  "domains": ["security","hardware","windows"],
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
- Use the approved concept ID exactly: security.tpm-2-0
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
