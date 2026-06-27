# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-007
- proposedKnowledgeId: windows.microsoft-windows
- title: Microsoft Windows
- type: operating-system
- domains: windows, operating-systems
- priority: high
- recommendedDepth: deep
- reason: Major OS family with strong evidence and high downstream value for Core 2.

## Discovery Review Requirements
Must cover:
- Windows as a major desktop/server OS
- Windows 10, Windows 11, Windows Server
- Industry support and software ecosystem
- Security and driver tradeoffs

Merge guidance to preserve:
- Merge windows.security-exposure into this object: This is a useful caution but too narrow for a standalone object; include as a security tradeoff section under Windows.

Relevant gap review:
- GAP-004: Link to later troubleshooting lessons covering install, update, rollback, and compatibility checks. (Driver troubleshooting is important but procedural evidence is not present in this overview lesson.)

## Source Evidence From Transcript Intelligence
- EVID-013: "One of the most popular operating systems in the world is Microsoft Windows." — Identifies Windows as a major OS family.
- EVID-014: "Windows 10, Windows 11, Windows Server" — Gives examples of Windows versions/editions.
- EVID-015: "very large industry support" — Supports Windows ecosystem and support advantages.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: Windows is an example of an operating system.

Relationships:
- part_of: os.operating-system — Windows is a desktop/server OS family.
- related_to: security.malware-targeting — Popularity makes Windows a larger target for attackers.

Curriculum placement:
- a-plus-220-1202 → 1.0 → desktop-operating-systems: Windows is a primary desktop OS covered by A+ Core 2.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "windows.microsoft-windows",
  "slug": "microsoft-windows",
  "title": "Microsoft Windows",
  "aliases": [],
  "type": "operating-system",
  "status": "needs-review",
  "domains": ["windows","operating-systems"],
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
- Use the approved concept ID exactly: windows.microsoft-windows
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
