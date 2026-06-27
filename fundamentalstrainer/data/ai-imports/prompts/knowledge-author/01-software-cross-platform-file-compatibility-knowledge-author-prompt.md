# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/01-operating-systems-overview-discovery-review.json
- transcriptIntelligence: data/imports/pending/01-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-028
- proposedKnowledgeId: software.cross-platform-file-compatibility
- title: Cross-Platform Data and File Format Compatibility
- type: concept
- domains: software, operating-systems
- priority: high
- recommendedDepth: normal
- reason: Strongly supported and important distinction from executable compatibility.

## Discovery Review Requirements
Must cover:
- Documents/media can move across OSs
- Standard file formats
- Distinguish file compatibility from executable compatibility

Merge guidance to preserve:
- No merge guidance targets this object.

Relevant gap review:
- No specific gap review targets this object.

## Source Evidence From Transcript Intelligence
- EVID-055: "create documents, spreadsheets, media, and other types of data and use those also in other operating systems" — Introduces cross-platform data compatibility.
- EVID-056: "standard file format that they can move between different operating systems" — Explains file format portability.

## Suggested Relationships From Discovery
Prerequisites:
- os.operating-system: The concept compares data portability across OSs.
- os.file-management: Data/files are managed by OSs and applications.

Relationships:
- contrasts_with: software.application-os-compatibility — File/data compatibility can exist even when executables are OS-specific.
- related_to: software.web-application — Web apps provide another cross-platform compatibility path.

Curriculum placement:
- a-plus-220-1202 → 1.0 → operating-system-foundations: Cross-platform compatibility is a foundation concept in OS comparison.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "software.cross-platform-file-compatibility",
  "slug": "cross-platform-file-compatibility",
  "title": "Cross-Platform Data and File Format Compatibility",
  "aliases": [],
  "type": "concept",
  "status": "needs-review",
  "domains": ["software","operating-systems"],
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
- Use the approved concept ID exactly: software.cross-platform-file-compatibility
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
