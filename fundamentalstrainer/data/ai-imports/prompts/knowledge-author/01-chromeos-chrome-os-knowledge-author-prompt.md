# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-017
- proposedKnowledgeId: chromeos.chrome-os
- title: Chrome OS
- type: operating-system
- domains: chromeos, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Chrome OS is a distinct OS family in the overview and has strong evidence.

## Discovery Review Requirements
Must cover:
- Google-created OS
- Linux kernel basis
- Browser-centered application model
- Low overhead design
- Cloud/network dependency

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-001: Create or link a brief kernel prerequisite before deep Linux/Chrome OS authoring. (Kernel terminology is needed to explain Linux and Chrome OS accurately.)

## Source Evidence From Transcript Intelligence
- EVID-035: "Chrome OS was created by Google and although it's based on the Linux kernel" — Introduces Chrome OS origin and Linux kernel basis.
- EVID-036: "most of the operating system revolve around the browser itself" — Defines browser-centered design.
- EVID-037: "applications... inside of that browser" — Explains how applications are commonly used.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Chrome OS is an operating system.
- linux.linux-kernel: The source says Chrome OS is based on the Linux kernel but does not define kernel.

Relationships:
- depends_on: linux.linux-kernel — Chrome OS is described as based on the Linux kernel.
- used_for: software.web-application — Chrome OS is presented as centered on browser-based applications.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: Chrome OS is a desktop/laptop OS covered in the overview.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "chromeos.chrome-os",
  "slug": "chrome-os",
  "title": "Chrome OS",
  "aliases": [],
  "type": "operating-system",
  "status": "needs-review",
  "domains": ["chromeos","operating-systems"],
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
- Use the approved concept ID exactly: chromeos.chrome-os
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
