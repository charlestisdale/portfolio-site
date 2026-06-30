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
fundamentalstrainer/pbq-engine/engines/ticket-engine.js
fundamentalstrainer/pbq-engine/validators/ticket-validator.js
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

The new validator is intentionally lightweight. It is not a full JSON Schema replacement yet.

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

This is a bridge toward the documented Phase 3 goal of formal schema validation. Future work may replace or supplement this lightweight validator with JSON Schema files under:

```text
fundamentalstrainer/pbq-engine/schemas/
```

## Next Recommended Work

Good next steps:

1. Add an engine registry so `app.js` does not import only the ticket engine directly.
2. Add a formal ticket JSON schema alongside the lightweight runtime validator.
3. Add more Core 2 ticket scenarios only after the schema stabilizes.
4. Add a richer terminal-style action type for command-based troubleshooting inside tickets.
5. Add save/resume behavior for active ticket attempts using local storage.
