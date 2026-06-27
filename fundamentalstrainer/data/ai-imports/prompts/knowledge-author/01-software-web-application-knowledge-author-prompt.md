# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-018
- proposedKnowledgeId: software.web-application
- title: Cloud-Based and Browser-Based Applications
- type: concept
- domains: software, cloud, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Strong cross-platform concept that explains why browser apps behave differently from OS-specific executables.

## Discovery Review Requirements
Must cover:
- Browser-based applications
- Cloud connectivity requirement
- Cross-platform browser access
- Offline limitation

Merge guidance to preserve:
- Merge networking.network-connectivity into this object: The requirement is taught only in the context of cloud/browser apps, so preserve it inside the web-application object.

Relevant gap review:
- GAP-006: Author the core rule now and add links/placeholders for compatibility layers, virtualization, containers, and web apps. (The core compatibility rule is supported, while exceptions should be linked later.)

## Source Evidence From Transcript Intelligence
- EVID-037: "applications that you will use in Chrome OS are inside of that browser" — Introduces browser-based applications.
- EVID-038: "connection to the cloud to be able to run these cloud-based applications" — Connects web/cloud apps to network requirements.
- EVID-039: "many applications have become web-based... run them in any browser regardless of the operating system" — Shows cross-OS benefit of web apps.

## Suggested Relationships From Discovery
Prerequisites:
- networking.network-connectivity: Cloud apps require connectivity in the source.
- software.browser: Browser-based apps require understanding what a browser does.

Relationships:
- depends_on: networking.network-connectivity — Cloud/browser apps can depend on network connectivity.
- contrasts_with: software.application-os-compatibility — Web apps reduce OS-specific executable compatibility issues.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Web apps are used to explain cross-platform compatibility.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "software.web-application",
  "slug": "web-application",
  "title": "Cloud-Based and Browser-Based Applications",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["software","cloud","operating-systems"],
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
- Use the approved concept ID exactly: software.web-application
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
