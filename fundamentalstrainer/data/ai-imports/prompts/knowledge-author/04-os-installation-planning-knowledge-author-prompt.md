# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: data/imports/reviewed/04-upgrading-windows-discovery-review.json
- transcriptIntelligence: data/imports/pending/04-transcript-intelligence.json

## Approved Concept
- conceptId: DISC-018
- proposedKnowledgeId: os.installation-planning
- title: Installation Planning Questions
- type: troubleshooting-step
- domains: operating-systems, operational-procedures
- priority: normal
- recommendedDepth: brief
- reason: Good checklist-style procedure concept that consolidates target drive, partition plan, license keys, backup, and compatibility checks.

## Discovery Review Requirements
Must cover:
- Confirm target drive.
- Plan partition configuration.
- Have license keys available.
- Check data, partitions, backups, requirements, apps, and drivers before proceeding.

Merge guidance to preserve:
- Merge os.user-preferences-preservation into this object: Too thin for standalone authoring; preserve as a checklist note under installation planning and backup scope.

Relevant gap review:
- GAP-002: Enrich backup and installation planning with backup scope, verification, user profile data, and preference capture. (Backup is emphasized but scope and verification are not explained.)

## Source Evidence From Transcript Intelligence
- EVID-038: "you need to know what drive you're going to install this operating system on" — Identifies drive selection as a pre-install planning question.
- EVID-039: "what type of configuration you're going to use for the partitions" — Identifies partition configuration as a planning question.
- EVID-040: "you might also want to have any necessary license keys available" — Identifies licensing information as a preparation item.

## Suggested Relationships From Discovery
Prerequisites:
- storage.partition-formatting: Partition configuration is part of the planning checklist.
- software.licensing: License keys are mentioned as installation information to prepare.

Relationships:
- used_for: os.clean-install — Drive, partition, and licensing decisions are needed before installation.
- used_for: os.in-place-upgrade — Upgrade preparation also requires requirements and compatibility planning.

Curriculum placement:
- a-plus-220-1202 → 4.0 → operational-procedures-foundations: This is a checklist-style procedure for reducing risk before OS installation or upgrade.

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "os.installation-planning",
  "slug": "installation-planning",
  "title": "Installation Planning Questions",
  "aliases": [],
  "type": "troubleshooting-step",
  "status": "needs-review",
  "domains": ["operating-systems","operational-procedures"],
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
          "lessonId": "04",
          "title": "Upgrading Windows",
          "order": 4
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
- Use the approved concept ID exactly: os.installation-planning
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
