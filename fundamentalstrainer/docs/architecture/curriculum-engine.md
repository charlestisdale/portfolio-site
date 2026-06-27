# Curriculum Engine Architecture

## Purpose

The Curriculum Engine is the long-term replacement for treating curriculum as a simple list of mapped Knowledge Object IDs.

This project is a learning platform for multiple future tests, certifications, and curricula. A+ Core 2 is the current import target, but the architecture must also support later work such as Network+, Security+, CCNA, Linux+, cloud certifications, college courses, or custom internal training.

The Curriculum Engine exists so one canonical knowledge base can support many different learning paths without duplicating concepts.

## Core rule

```text
Duplicate expectations, not knowledge.
```

A concept such as DNS, VLANs, TCP, UEFI, TPM, NTFS, or OSPF should exist once as canonical knowledge if it represents the same underlying concept.

Different certifications should attach different expectations to that concept.

## Four data layers

```text
Knowledge Object        = what the concept is
Knowledge Graph         = how concepts relate
Curriculum Plan         = where and when concepts are taught
Curriculum Expectation  = how deeply a curriculum teaches/tests the concept
```

These layers are related, but they are not interchangeable.

## Example: VLANs

Canonical concept:

```text
content/knowledge/networking/vlan.json
```

The core Knowledge Object explains VLANs as a reusable networking concept.

Different curricula can then define different expectations:

```text
A+ Core 2
    recognize that VLANs logically segment networks
    explain basic purpose and use cases

Network+
    understand VLAN tagging, trunks, and segmentation
    interpret basic VLAN scenarios

CCNA
    configure VLANs
    configure access ports and 802.1Q trunks
    troubleshoot native VLAN and trunking issues

Security+
    apply VLANs as a segmentation and isolation control
```

Same Knowledge Object. Different expectations.

## Knowledge Objects must be fragmentable

For this to work in a live app without AI, Knowledge Objects should not be unstructured blobs.

They should contain tagged fragments that the Learning Engine can filter deterministically.

Examples:

```text
facts
examples
commands
warnings
misconceptions
scenarios
pbqSeeds
labSeeds
examTips
relationships
aliases
```

A curriculum expectation can include or exclude fragments by tags, depth, skill, or assessment type.

## Curriculum Expectations

A Curriculum Expectation defines what a specific curriculum requires for a specific Knowledge Object.

Long-term shape:

```json
{
  "schemaVersion": "1.0.0",
  "curriculumId": "ccna-200-301",
  "knowledgeId": "networking.vlan",
  "expectedDepth": "configure-and-troubleshoot",
  "objectiveIds": ["2.1", "2.2"],
  "includeTags": ["fundamental", "segmentation", "802.1q", "trunking", "native-vlan", "cli-configuration"],
  "excludeTags": [],
  "skills": [
    "Configure VLANs",
    "Configure access ports",
    "Configure 802.1Q trunks",
    "Troubleshoot native VLAN mismatch"
  ],
  "assessmentStyle": ["cli-configuration", "show-command-interpretation", "scenario-troubleshooting"]
}
```

A+ might reference the same Knowledge Object with a shallower expectation:

```json
{
  "schemaVersion": "1.0.0",
  "curriculumId": "a-plus-220-1202",
  "knowledgeId": "networking.vlan",
  "expectedDepth": "recognize-and-explain",
  "objectiveIds": [],
  "includeTags": ["fundamental", "segmentation"],
  "excludeTags": ["802.1q", "native-vlan", "cli-configuration"],
  "skills": [
    "Explain that VLANs logically separate network traffic",
    "Recognize that VLANs are commonly configured on managed switches"
  ],
  "assessmentStyle": ["multiple-choice", "basic-scenario-recognition"]
}
```

## Live app behavior

The public app should not need live AI to decide what is relevant.

At runtime, the app should use deterministic data:

```text
active curriculum
+ curriculum plan
+ curriculum expectation
+ canonical Knowledge Object
+ tagged fragments
+ graph context
+ learner progress
```

Then it renders the correct view.

For A+, the renderer may show only recognition-level facts and basic scenarios.

For CCNA, the renderer may include commands, labs, troubleshooting scenarios, PBQ seeds, and deeper graph context.

## Knowledge Resolver

The Knowledge Resolver is the missing structural component between Discovery Review and Knowledge Authoring.

It prevents the AI from authoring blindly.

Current problem:

```text
Transcript
    ↓
AI authors as if the system is empty
```

Long-term model:

```text
Transcript
    ↓
Concept Discovery
    ↓
Knowledge Resolver
    ↓
AI receives existing context
    ↓
Decision
```

The resolver searches existing platform data before authoring:

```text
canonical Knowledge Object IDs
aliases
keywords
tags
graph relationships
existing curriculum expectations
objective mappings
lesson mappings
```

It returns candidate matches to the AI and review process.

## Import decision outcomes

For every discovered concept, the system should produce one of these outcomes:

```text
new-object
expand-existing-object
expectation-only
relationship-only
duplicate-no-change
reject
defer
```

### new-object

Use only when no existing canonical concept covers the discovered concept.

### expand-existing-object

Use when the concept already exists but the source adds reusable knowledge that should become part of the canonical object.

### expectation-only

Use when the canonical object already contains the needed concept, but the current curriculum needs a new depth, skill list, objective mapping, or assessment style.

### relationship-only

Use when the source reveals a useful graph relationship but does not require new content.

### duplicate-no-change

Use when the source repeats known material and does not add meaningful curriculum or graph value.

### reject / defer

Use when the concept is out of scope, too weakly supported, unclear, or needs future enrichment.

## Curriculum Plan vs Curriculum Expectation

A Curriculum Plan answers:

```text
Where does this concept appear in the learning path?
When should it be taught?
What comes before and after it?
```

A Curriculum Expectation answers:

```text
What does this curriculum require the learner to do with this concept?
How deep should the explanation go?
Which fragments are relevant?
What assessment styles apply?
```

These must remain separate.

## Why this matters

Without this separation, the project will eventually create duplicate silos:

```text
a-plus.vlan
network-plus.vlan
ccna.vlan
security-plus.vlan
```

That would make the platform harder to maintain and would break the knowledge-first architecture.

With the Curriculum Engine model, the platform keeps one canonical concept:

```text
networking.vlan
```

Then it adds curriculum-specific expectations:

```text
a-plus-220-1202/networking.vlan
network-plus/networking.vlan
ccna-200-301/networking.vlan
security-plus/networking.vlan
```

## Implementation priority

Before importing the remaining large video set, the project should stabilize this structure.

A+ Core 2 remains the immediate study target, but the import pipeline should be shaped around the future multi-certification model before the content volume becomes difficult to restructure.

## Non-goals

The Curriculum Engine should not:

- create duplicate Knowledge Objects for each certification
- rely on live AI in the public app
- store generated quizzes, flashcards, PBQs, or labs as canonical truth
- use graph edges as a replacement for curriculum placement
- use curriculum placement as a replacement for concept relationships
- treat transcript lesson order as the final learning path

## Design principle

```text
The system remembers itself.
AI receives retrieved context.
Human review and deterministic tooling decide what becomes canonical.
```
