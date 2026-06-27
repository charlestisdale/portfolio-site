# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-009
- proposedKnowledgeId: hardware.device-drivers
- title: Device Drivers
- type: concept
- domains: hardware, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Drivers are foundational to OS-hardware interaction and have strong evidence.

## Discovery Review Requirements
Must cover:
- Driver software purpose
- Manufacturer responsibility
- Compatibility and long-term support challenges

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-004: Link to later troubleshooting lessons covering install, update, rollback, and compatibility checks. (Driver troubleshooting is important but procedural evidence is not present in this overview lesson.)

## Source Evidence From Transcript Intelligence
- EVID-017: "hardware manufacturer to write driver software that will work properly with this operating system" — Defines responsibility and OS relationship for drivers.
- EVID-018: "challenges when you're trying to integrate new hardware into your system" — Connects drivers to hardware integration issues.

## Suggested Relationships From Discovery
Prerequisites:
- hardware.hardware-component: Drivers connect hardware to the OS.
- os.operating-system: Drivers work with the operating system.

Relationships:
- depends_on: os.operating-system — Drivers allow the OS to work with hardware.
- used_for: hardware.hardware-component — Drivers support hardware integration.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Drivers are foundational for OS-to-hardware interaction.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "hardware.device-drivers",
  "slug": "device-drivers",
  "title": "Device Drivers",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["hardware","operating-systems"],
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
- Use the approved concept ID exactly: hardware.device-drivers
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
