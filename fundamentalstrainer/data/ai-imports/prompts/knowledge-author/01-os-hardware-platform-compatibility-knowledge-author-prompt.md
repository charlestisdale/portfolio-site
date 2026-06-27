# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-029
- proposedKnowledgeId: os.hardware-platform-compatibility
- title: Hardware Platform Differences Across Operating Systems
- type: concept
- domains: operating-systems, hardware
- priority: normal
- recommendedDepth: brief
- reason: Useful comparison concept spanning macOS, Android, Windows, and Linux, but should remain brief to avoid duplicating OS-family objects.

## Discovery Review Requirements
Must cover:
- OSs vary by hardware support
- Vendor control affects compatibility
- Examples: macOS vs Android/Windows/Linux

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-057: "different operating systems run on different hardware and the operating systems are written by different organizations" — Introduces OS/hardware/vendor differences.
- EVID-034: "not able to run Mac OS on other non-Apple hardware devices" — Gives a specific example of hardware platform limitation.
- EVID-049: "Android is supported by many different manufacturers" — Gives a contrasting multi-manufacturer example.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Hardware platform compatibility is an OS selection topic.
- hardware.computing-device: Learners need basic hardware platform awareness.

Relationships:
- related_to: macos.apple-macos — macOS is presented as Apple-hardware-specific.
- contrasts_with: android.google-android — Android is presented as multi-manufacturer.
- related_to: hardware.device-drivers — Drivers also affect OS/hardware support.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: OS selection depends partly on supported hardware platforms.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.hardware-platform-compatibility",
  "slug": "hardware-platform-compatibility",
  "title": "Hardware Platform Differences Across Operating Systems",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["operating-systems","hardware"],
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
- Use the approved concept ID exactly: os.hardware-platform-compatibility
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
