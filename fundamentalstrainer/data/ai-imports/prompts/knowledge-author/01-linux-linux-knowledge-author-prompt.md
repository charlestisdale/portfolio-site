# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-011
- proposedKnowledgeId: linux.linux
- title: Linux
- type: operating-system
- domains: linux, operating-systems
- priority: high
- recommendedDepth: deep
- reason: Major OS family with strong evidence and important exam relevance.

## Discovery Review Requirements
Must cover:
- Linux as an OS
- Open-source/community model
- Cost advantages
- Distribution model
- Hardware compatibility and support tradeoffs

Merge guidance to preserve:
- Merge linux.hardware-support into this object: Important guidance, but it should be integrated into Linux authoring as a tradeoff rather than split into a separate object now.

Relevant gap review:
- GAP-001: Create or link a brief kernel prerequisite before deep Linux/Chrome OS authoring. (Kernel terminology is needed to explain Linux and Chrome OS accurately.)

## Source Evidence From Transcript Intelligence
- EVID-022: "Linux is an operating system that is absolutely free." — Introduces Linux and cost characteristic.
- EVID-023: "open-source software that is created and maintained by thousands of individuals" — Introduces Linux open-source/community nature.
- EVID-024: "there are different distributions of Linux" — Introduces Linux distributions.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Linux is a type of operating system.

Relationships:
- part_of: opensource.open-source-software — Linux is described as open-source software.
- part_of: linux.distributions — Linux is distributed through different distributions.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: Linux is a major desktop/admin OS for Core 2.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "linux.linux",
  "slug": "linux",
  "title": "Linux",
  "aliases": [],
  "type": "operating-system",
  "status": "needs-review",
  "domains": ["linux","operating-systems"],
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
- Use the approved concept ID exactly: linux.linux
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
