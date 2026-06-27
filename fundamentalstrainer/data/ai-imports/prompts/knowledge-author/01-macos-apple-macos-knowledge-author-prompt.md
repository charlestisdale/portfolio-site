# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-015
- proposedKnowledgeId: macos.apple-macos
- title: Apple macOS
- type: operating-system
- domains: macos, operating-systems
- priority: high
- recommendedDepth: deep
- reason: Major desktop OS with strong evidence and clear comparison points.

## Discovery Review Requirements
Must cover:
- macOS as Apple desktop OS
- Apple hardware exclusivity
- Usability/UI reputation
- Hardware/software integration
- Cost and support tradeoffs

Merge guidance to preserve:
- Merge apple.hardware-os-integration into this object: This is best preserved as a macOS section because it explains macOS compatibility and tradeoffs.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-030: "Apple's Mac OS... runs on Apple hardware exclusively" — Introduces macOS and hardware exclusivity.
- EVID-032: "well known for its user interface and overall usability" — Supports macOS usability reputation.
- EVID-033: "Apple manufactures the hardware and then writes the operating system for that same hardware" — Explains integration and compatibility.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: macOS is an operating system.

Relationships:
- depends_on: hardware.apple-hardware — macOS is described as running only on Apple hardware.
- related_to: software.closed-source-software — Apple OSs are later described as closed source.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: macOS is a major desktop OS in the lesson.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "macos.apple-macos",
  "slug": "apple-macos",
  "title": "Apple macOS",
  "aliases": [],
  "type": "operating-system",
  "status": "needs-review",
  "domains": ["macos","operating-systems"],
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
- Use the approved concept ID exactly: macos.apple-macos
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
