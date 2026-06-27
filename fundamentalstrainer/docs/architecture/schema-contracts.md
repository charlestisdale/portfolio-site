# Schema Contracts

## Purpose

This document defines the first structural contracts for the Curriculum Engine redesign.

These are design contracts, not full validators yet. They describe the JSON shapes the implementation should move toward before the remaining large import set is processed.

## Contract overview

```text
Knowledge Object fragments  = reusable tagged learning pieces inside a canonical concept
Curriculum Plan             = course/certification teaching order
Curriculum Expectation      = course/certification depth for a Knowledge Object
Resolver Result             = existing-knowledge match report before authoring
Knowledge Update Package    = proposed change to an existing Knowledge Object
```

## 1. Knowledge Object fragments

Knowledge Objects must remain canonical and reusable, but their internal content should be filterable by curriculum expectations.

Current Knowledge Objects already contain arrays such as:

```text
learning.facts
learning.examples
learning.commands
assessmentSeeds.examTips
assessmentSeeds.commonMistakes
assessmentSeeds.scenarios
assessmentSeeds.pbqIdeas
```

The long-term structure should make every reusable piece identifiable and taggable.

### Fragment fields

```json
{
  "id": "vlan.8021q-tagging",
  "kind": "fact",
  "text": "802.1Q adds a VLAN tag to Ethernet frames carried across trunk links.",
  "importance": "high",
  "depth": "intermediate",
  "tags": ["802.1q", "trunking", "switching"],
  "skills": ["explain-8021q-tagging"],
  "appliesTo": [],
  "sourceRefs": []
}
```

### Fragment principles

- Fragments are not certification-specific by default.
- Tags must describe meaning, skill, depth, or scenario type.
- Curriculum Expectations decide which fragments are included for a curriculum.
- Do not create separate Knowledge Objects just to hide advanced fragments from an easier exam.

## 2. Curriculum Plan

A Curriculum Plan defines where and when concepts are taught.

Current location:

```text
content/curriculum/<curriculum-id>/curriculum.json
```

A curriculum module should define:

```json
{
  "id": "switching-fundamentals",
  "title": "Switching Fundamentals",
  "description": "Layer 2 switching concepts and operational behavior.",
  "order": 2,
  "objectiveIds": ["2.0"],
  "outcomes": [
    "Explain how switches forward frames.",
    "Describe VLAN segmentation at a high level."
  ],
  "knowledge": [],
  "autoMap": {
    "domains": ["networking", "switching"],
    "idPrefixes": ["networking.switching", "networking.vlan"],
    "titleIncludes": ["switch", "switching", "vlan"]
  }
}
```

### Curriculum Plan principles

- It controls order and placement.
- It should not redefine concept meaning.
- It should not contain generated quiz/PBQ/lab content.
- A Knowledge Object can appear in multiple curricula.

## 3. Curriculum Expectation

A Curriculum Expectation defines what a curriculum requires for a Knowledge Object.

Expected location:

```text
content/expectations/<curriculum-id>/<knowledge-id>.expectation.json
```

Example:

```json
{
  "schemaVersion": "1.0.0",
  "id": "ccna-200-301.networking.vlan",
  "curriculumId": "ccna-200-301",
  "knowledgeId": "networking.vlan",
  "status": "draft",
  "expectedDepth": "configure-and-troubleshoot",
  "objectiveIds": ["2.1", "2.2"],
  "moduleIds": ["switching-fundamentals"],
  "includeTags": ["fundamental", "segmentation", "802.1q", "trunking", "native-vlan", "cli-configuration"],
  "excludeTags": [],
  "requiredSkills": [
    {
      "id": "configure-access-vlan",
      "description": "Configure an access port in the correct VLAN.",
      "depth": "configure"
    }
  ],
  "assessmentStyles": ["cli-configuration", "show-command-interpretation", "scenario-troubleshooting"],
  "labRequired": true,
  "pbqRelevance": "high",
  "notes": [],
  "quality": {
    "createdAt": "2026-06-27",
    "updatedAt": "2026-06-27",
    "needsHumanReview": true
  }
}
```

### Curriculum Expectation principles

- It is allowed to be certification/course-specific.
- It should reference one canonical Knowledge Object.
- It selects depth, skills, tags, and assessment style.
- It should not duplicate the full explanation from the Knowledge Object.

## 4. Resolver Result

A Resolver Result is produced before authoring.

Expected location for normalized resolver outputs:

```text
data/imports/resolver/<lesson-or-source>-resolver-result.json
```

Example:

```json
{
  "schemaVersion": "1.0.0",
  "sourceLessonId": "04",
  "curriculumId": "a-plus-220-1202",
  "conceptId": "DISC-004",
  "discoveredTitle": "Secure Boot",
  "proposedKnowledgeId": "security.secure-boot",
  "decision": "expectation-only",
  "confidence": "high",
  "candidateMatches": [
    {
      "knowledgeId": "security.secure-boot",
      "title": "Secure Boot",
      "matchScore": 96,
      "matchReasons": ["exact-title", "alias", "shared-tags"]
    }
  ],
  "recommendedActions": [
    {
      "type": "create-expectation",
      "knowledgeId": "security.secure-boot",
      "curriculumId": "a-plus-220-1202"
    }
  ],
  "humanReviewRequired": true
}
```

### Resolver principles

- The resolver does not author final content.
- It retrieves candidate context and recommends a decision path.
- It helps the AI avoid treating every source as an empty system.

## 5. Knowledge Update Package

A Knowledge Update Package proposes changes to an existing Knowledge Object.

Expected location:

```text
data/imports/updates/<knowledge-id>.update.json
```

Example:

```json
{
  "schemaVersion": "1.0.0",
  "updateType": "expand-existing-object",
  "targetKnowledgeId": "networking.vlan",
  "sourceLessonId": "ccna-lesson-12",
  "proposedFragments": [
    {
      "id": "vlan.native-vlan",
      "kind": "fact",
      "text": "The native VLAN carries untagged traffic on an 802.1Q trunk.",
      "importance": "high",
      "depth": "intermediate",
      "tags": ["native-vlan", "trunking", "802.1q", "ccna-relevant"]
    }
  ],
  "proposedRelationships": [],
  "proposedExpectationRefs": [],
  "mergeNotes": [
    "Adds CCNA-depth native VLAN detail without creating a new VLAN Knowledge Object."
  ],
  "quality": {
    "needsHumanReview": true
  }
}
```

### Knowledge Update principles

- Use when source material deepens an existing canonical concept.
- Do not overwrite canonical knowledge automatically.
- Human review and validation are required before promotion.

## Decision vocabulary

Allowed resolver decisions:

```text
new-object
expand-existing-object
expectation-only
relationship-only
duplicate-no-change
reject
defer
```

Allowed expectation depth examples:

```text
recognize
recognize-and-explain
explain-and-apply
analyze-and-troubleshoot
configure
configure-and-troubleshoot
teach-or-design
```

These values may become stricter once validators are implemented.
