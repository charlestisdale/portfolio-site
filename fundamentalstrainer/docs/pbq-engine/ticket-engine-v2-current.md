# Ticket Engine v2 Current Implementation

## Status

Ticket Engine v2 now exists as a standalone PBQ Engine prototype under:

```text
fundamentalstrainer/pbq-engine/
```

It remains separate from the regular Core 2 quiz trainer and the older PBQ Lab v1.

## Current Files

```text
fundamentalstrainer/pbq-engine/index.html
fundamentalstrainer/pbq-engine/styles.css
fundamentalstrainer/pbq-engine/app.js
fundamentalstrainer/pbq-engine/engine-registry.js
fundamentalstrainer/pbq-engine/engines/ticket-engine.js
fundamentalstrainer/pbq-engine/validators/ticket-validator.js
fundamentalstrainer/pbq-engine/schemas/ticket.schema.json
fundamentalstrainer/pbq-engine/data/core2/tickets.json
```

## Implemented Capabilities

The current ticket simulator supports:

- JSON-loaded ticket scenarios
- scenario selection
- restartable tickets
- ticket metadata pane
- required outcomes pane
- action grouping by action type
- stateful action execution
- action dependencies through `requires`
- state mutation through `sets`
- evidence revealed by actions
- action history
- learner notes
- penalties for unsafe, irrelevant, or overly invasive actions
- required-state grading
- final review screen
- author-facing scenario validation warnings
- engine registration through `engine-registry.js`
- formal ticket scenario schema through `schemas/ticket.schema.json`

## Engine Registry

The PBQ Engine now has a small registry layer:

```text
fundamentalstrainer/pbq-engine/engine-registry.js
```

The registry is responsible for mapping a scenario's `engine` value to the correct engine factory and validator.

Current registered engine:

```text
ticket
```

The loader in `app.js` should stay generic. It should not directly import individual engines such as `ticket-engine.js`. Instead, engines should be registered in `engine-registry.js`.

Current registry responsibilities:

- register available PBQ engines
- return registered engine IDs
- create the correct engine instance for a scenario
- route scenario validation to the correct engine-specific validator
- report unknown engine types as authoring warnings

This keeps the PBQ Engine moving toward the modular Phase 3 architecture without breaking the current Ticket Engine v2 prototype.

## Ticket Scenario Schema

The formal ticket scenario schema lives at:

```text
fundamentalstrainer/pbq-engine/schemas/ticket.schema.json
```

The schema is the authoring contract for Ticket Engine v2 content. It defines the expected structure for:

- scenario metadata
- `ticket` metadata
- `initialState`
- `actions`
- action `requires` maps
- action `sets` maps
- action evidence
- action penalties
- grading configuration
- required grading states

The schema is intentionally permissive with `additionalProperties: true` so the engine can evolve without breaking existing authored tickets. It still enforces the core fields needed for a working ticket scenario.

The runtime validator and the schema serve different purposes:

- `ticket.schema.json` defines the formal authoring contract.
- `ticket-validator.js` catches practical authoring mistakes in the browser, especially state-key mismatches that JSON Schema cannot easily validate by itself.

## Ticket Scenario Shape

Ticket scenarios are loaded from:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
```

Each ticket should use this general shape:

```json
{
  "id": "core2-ticket-example-001",
  "certification": "CompTIA A+",
  "exam": "Core 2",
  "objective": "3.0 Software Troubleshooting",
  "category": "ticket-simulator",
  "difficulty": "medium",
  "engine": "ticket",
  "title": "Troubleshoot an example issue",
  "ticket": {
    "number": "HD-2202-000",
    "priority": "Medium",
    "user": "Example User",
    "department": "Example Department",
    "device": "Windows 11 laptop",
    "description": "The user reports a realistic symptom."
  },
  "initialState": {
    "issueScoped": false,
    "rootCauseIdentified": false,
    "fixApplied": false,
    "verified": false,
    "documented": false
  },
  "actions": [],
  "grading": {
    "maxScore": 100,
    "passingScore": 75,
    "pointsPerMissingState": 15,
    "summary": "Explain the ideal troubleshooting path.",
    "requiredStates": [
      { "key": "issueScoped", "value": true, "label": "Scoped the issue" }
    ]
  }
}
```

## Action Model

Each action can:

- appear immediately or only after required state exists
- set one or more state flags
- reveal one or more evidence items
- add a penalty
- be marked as a good action
- be repeatable when needed

Example:

```json
{
  "id": "open-task-manager",
  "type": "inspect-tool",
  "label": "Open Task Manager and check resource usage",
  "requires": { "issueScoped": true },
  "result": "Task Manager shows Disk at 100%, CPU at 7%, and Memory at 43%.",
  "sets": { "resourceUsageChecked": true },
  "good": true,
  "evidence": {
    "id": "task-manager",
    "title": "Task Manager",
    "body": "Disk is saturated at 100%; CPU and memory are not the bottleneck."
  }
}
```

## Validation Rules

The runtime validator is intentionally lightweight. It complements the formal JSON Schema, but it is not a full JSON Schema validator.

It currently checks:

- scenario `id`
- scenario `title`
- `engine: "ticket"`
- ticket object and ticket description
- initial state object
- non-empty actions array
- action IDs
- duplicate action IDs
- action labels
- unknown state keys in `requires`
- unknown state keys in `sets`
- numeric penalty points
- grading object
- non-empty required states
- unknown required-state keys
- missing required-state values

Validation warnings are shown in the PBQ Engine UI and logged to the browser console. Warnings do not prevent valid scenarios from loading.

## Design Notes

The validator exists because the PBQ Engine is becoming data-driven. As more tickets are added, authoring mistakes should be caught close to the page instead of silently causing broken actions or impossible grading.

The engine registry exists because the PBQ Engine must support multiple simulation types over time. `app.js` should remain the generic application shell. Engine-specific behavior belongs in engine modules, validators, schemas, and scenario data.

The schema exists to make ticket authoring portable. A future build script, editor, CI check, or content pipeline can validate ticket JSON against the schema before content reaches the browser.

## Next Recommended Work

Good next steps:

1. Add a development validation script that checks `data/core2/tickets.json` against `schemas/ticket.schema.json`.
2. Add more Core 2 ticket scenarios only after the schema stabilizes.
3. Add a richer terminal-style action type for command-based troubleshooting inside tickets.
4. Add save/resume behavior for active ticket attempts using local storage.
5. Add the next engine by registering it in `engine-registry.js` instead of changing `app.js` directly.
