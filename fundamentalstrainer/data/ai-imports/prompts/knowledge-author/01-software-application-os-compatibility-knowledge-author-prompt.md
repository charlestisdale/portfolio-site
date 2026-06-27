# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-002
- proposedKnowledgeId: software.application-os-compatibility
- title: Application OS Compatibility
- type: concept
- domains: operating-systems, software
- priority: high
- recommendedDepth: normal
- reason: Strongly supported distinction between OS-specific executables and application portability.

## Discovery Review Requirements
Must cover:
- Applications must be written for the OS
- Executable portability limits
- Difference between app compatibility and file/data compatibility

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- GAP-006: Author the core rule now and add links/placeholders for compatibility layers, virtualization, containers, and web apps. (The core compatibility rule is supported, while exceptions should be linked later.)

## Source Evidence From Transcript Intelligence
- EVID-004: "that application was specifically written to run in that OS" — Directly supports application-to-OS compatibility.
- EVID-005: "you cannot do in these operating systems is take the executable from Windows and try to run that executable in Linux" — Provides a contrast/example for incompatible executables.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Learners must understand the OS as an application platform first.

Relationships:
- depends_on: os.operating-system — Application compatibility depends on the OS platform.
- related_to: software.executable — Executable files are presented as OS-specific application artifacts.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Compatibility is a common cross-OS foundation topic.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "software.application-os-compatibility",
  "slug": "application-os-compatibility",
  "title": "Application OS Compatibility",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","software"],
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
- Use the approved concept ID exactly: software.application-os-compatibility
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
