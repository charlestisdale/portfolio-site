# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/03-installing-operating-systems-discovery-review.json
- transcriptIntelligence: data/imports/pending/03-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-002
- proposedKnowledgeId: networking.pxe-boot
- title: PXE network boot
- type: protocol
- domains: networking, operating-systems
- priority: normal
- recommendedDepth: normal
- reason: PXE is defined and tied directly to network-based OS installation; it deserves authoring with light enrichment for DHCP/TFTP dependencies.

## Discovery Review Requirements
Must cover:
- PXE purpose
- firmware support requirement
- PXE server role
- network boot use cases
- A+ appropriate DHCP/TFTP relationship

Merge guidance to preserve:
- Merge os-installation.remote-network-installation into this object: This is better handled as part of network-based OS installation/PXE coverage unless the curriculum later needs a separate share-based install concept.

Relevant gap review:
- GAP-001: Create or link a boot process/boot order prerequisite concept. (The installation lesson assumes boot process and firmware boot-order basics.)
- GAP-002: Enrich PXE authoring with basic dependency notes. (PXE needs A+ appropriate DHCP/TFTP/service dependency context.)

## Source Evidence From Transcript Intelligence
- EVID-002: "This is a network boot that's commonly referred to as Pixie or PXE. This stands for preboot execution environment." — Defines PXE and connects it to network boot installation.

## Suggested Relationships From Discovery
Prerequisites:
- networking.local-area-network: PXE discovers boot services across the local network.

Relationships:
- used_for: os-installation.remote-network-installation — PXE is used to boot an installer from the network.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: PXE network boot is part of operating system installation foundations.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "networking.pxe-boot",
  "slug": "pxe-boot",
  "title": "PXE network boot",
  "aliases": [],
  "type": "protocol",
  "status": "needs-review",
  "domains": ["networking","operating-systems"],
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
- Use the approved concept ID exactly: networking.pxe-boot
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
