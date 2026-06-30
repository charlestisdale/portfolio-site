# PBQ Engine Current Implementation

## Status

PBQ Engine v2 now exists as a standalone simulation prototype under:

```text
fundamentalstrainer/pbq-engine/
```

It remains separate from the regular Core 2 quiz trainer and the older PBQ Lab v1.

Current implemented engines:

```text
ticket
terminal
```

## Current Files

```text
fundamentalstrainer/pbq-engine/index.html
fundamentalstrainer/pbq-engine/styles.css
fundamentalstrainer/pbq-engine/app.js
fundamentalstrainer/pbq-engine/engine-registry.js
fundamentalstrainer/pbq-engine/components/documentation-component.js
fundamentalstrainer/pbq-engine/engines/ticket-engine.js
fundamentalstrainer/pbq-engine/engines/terminal-engine.js
fundamentalstrainer/pbq-engine/validators/ticket-validator.js
fundamentalstrainer/pbq-engine/validators/terminal-validator.js
fundamentalstrainer/pbq-engine/schemas/ticket.schema.json
fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/terminal.json
```

## Implemented Capabilities

The PBQ Engine currently supports:

- JSON-loaded scenarios from multiple data files
- scenario selection across registered engines
- restartable scenarios
- required outcomes pane
- learner notes
- formal ticket documentation component
- stateful scenario execution
- evidence collection
- action/command history
- penalties for unsafe, irrelevant, overly invasive, or wrong-root-cause choices
- required-state grading
- final review screen
- author-facing scenario validation warnings
- engine registration through `engine-registry.js`
- formal ticket scenario schema through `schemas/ticket.schema.json`
- development ticket data validation through `tools/validate-ticket-data.mjs`

## Engine Registry

The PBQ Engine has a registry layer:

```text
fundamentalstrainer/pbq-engine/engine-registry.js
```

The registry maps a scenario's `engine` value to the correct engine factory and validator.

Current registered engines:

```text
ticket
terminal
```

The loader in `app.js` should stay generic. It should not directly import individual engines such as `ticket-engine.js` or `terminal-engine.js`. Engines should be registered in `engine-registry.js`.

Current registry responsibilities:

- register available PBQ engines
- return registered engine IDs
- create the correct engine instance for a scenario
- route scenario validation to the correct engine-specific validator
- report unknown engine types as authoring warnings

This keeps the PBQ Engine moving toward the modular Phase 3 architecture.

## Shared Documentation Component

The PBQ Engine now includes a reusable documentation component:

```text
fundamentalstrainer/pbq-engine/components/documentation-component.js
```

This component is separate from learner scratch notes. It represents the formal ticket documentation a technician would save before closing the ticket.

Current documentation fields:

- Problem / Symptom
- Root Cause
- Resolution
- Verification

A documentation save counts as complete only when all four fields contain text. When saved, the component returns a documentation state object to the active engine. Engines can then set their own scenario state, usually:

```json
{ "documented": true }
```

The saved documentation is also shown in the final review screen.

This component is shared by both the Ticket Engine and the Terminal Engine. Future engines should reuse it instead of creating engine-specific documentation forms.

## Data Sources

The app currently loads scenarios from:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/terminal.json
```

`app.js` combines those arrays, filters by registered engines, validates the loaded scenarios, and then renders the selected scenario through the correct engine.

## Ticket Engine

The Ticket Engine is a stateful help desk simulator. It supports:

- ticket metadata
- available technician actions
- action grouping by action type
- action dependencies through `requires`
- state mutation through `sets`
- evidence revealed by actions
- action history
- shared documentation component
- required-state grading
- final review

Ticket scenarios are loaded from:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
```

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
- `tools/validate-ticket-data.mjs` provides a dependency-free development check before committing ticket content.

## Development Validation Command

Run the ticket data validation script from the repository root:

```bash
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
```

If already inside `fundamentalstrainer/`, run:

```bash
node pbq-engine/tools/validate-ticket-data.mjs
```

The script checks:

- valid JSON parsing
- expected ticket schema structure
- ticket scenario shape
- required scenario fields
- ticket metadata
- initial state values
- action IDs and duplicate IDs
- action `requires` and `sets` references against `initialState`
- penalty categories and point values
- grading score values
- required state references against `initialState`

The script exits with a non-zero status when validation fails, so it can later be used by CI or a pre-commit workflow.

## Terminal Engine Prototype

The Terminal Engine is the first non-ticket engine. It simulates command-line troubleshooting tasks inside the same PBQ shell.

Current Terminal Engine file:

```text
fundamentalstrainer/pbq-engine/engines/terminal-engine.js
```

Current Terminal Engine data file:

```text
fundamentalstrainer/pbq-engine/data/core2/terminal.json
```

Current Terminal Engine validator:

```text
fundamentalstrainer/pbq-engine/validators/terminal-validator.js
```

The first terminal scenario is:

```text
core2-terminal-dns-troubleshooting-001
```

It practices Windows DNS troubleshooting using commands such as:

```text
ipconfig /all
ping 8.8.8.8
nslookup example.com
ipconfig /flushdns
```

The final documentation requirement is completed through the shared documentation component, not through a fake terminal command.

Terminal scenarios currently support:

- prompt rendering
- command input
- command aliases
- command output
- command prerequisites through `requires`
- state mutation through `sets`
- evidence collection
- command history
- shared documentation component
- penalties
- required-state grading
- final review

## Terminal Scenario Shape

A terminal scenario should use this general shape:

```json
{
  "id": "core2-terminal-example-001",
  "engine": "terminal",
  "title": "Troubleshoot an example issue from Command Prompt",
  "description": "Use simulated commands to identify and verify the issue.",
  "terminal": {
    "environment": "Windows Command Prompt",
    "prompt": "C:\\Users\\Student>",
    "welcome": "Type a command to begin.",
    "unknownCommandOutput": "This command is not recognized in this simulation."
  },
  "initialState": {
    "evidenceCollected": false,
    "issueIdentified": false,
    "fixVerified": false,
    "documented": false
  },
  "commands": [
    {
      "command": "ipconfig /all",
      "aliases": ["ipconfig"],
      "output": "Simulated command output.",
      "summary": "Short history-pane summary.",
      "sets": { "evidenceCollected": true },
      "good": true
    }
  ],
  "grading": {
    "maxScore": 100,
    "passingScore": 75,
    "pointsPerMissingState": 15,
    "requiredStates": [
      { "key": "evidenceCollected", "value": true, "label": "Collected evidence" },
      { "key": "documented", "value": true, "label": "Saved ticket documentation" }
    ]
  }
}
```

## Design Notes

The PBQ Engine is now a multi-engine shell. `app.js` should remain generic and only coordinate loading, validation, scenario selection, and engine startup.

Shared learner workflow components belong in:

```text
fundamentalstrainer/pbq-engine/components/
```

Engine-specific behavior belongs in:

```text
fundamentalstrainer/pbq-engine/engines/
```

Engine-specific validators belong in:

```text
fundamentalstrainer/pbq-engine/validators/
```

Engine-specific schemas should eventually live in:

```text
fundamentalstrainer/pbq-engine/schemas/
```

The Terminal Engine is intentionally a prototype. It is enough to prove the interaction model, but it does not yet have a formal JSON Schema or development validation script.

## Next Recommended Work

Good next steps:

1. Test the shared documentation component in both Ticket and Terminal scenarios.
2. Add minimum keyword checks for documentation quality.
3. Add a formal `terminal.schema.json` file.
4. Add a development validation script for terminal scenarios or generalize the existing script into a multi-engine validator.
5. Add save/resume behavior for active PBQ attempts using local storage.
