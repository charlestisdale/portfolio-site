# PBQ Engine Current Implementation

## Status

PBQ Engine v2 exists as a standalone simulation prototype under:

```text
fundamentalstrainer/pbq-engine/
```

It remains separate from the regular Core 2 quiz trainer and the older PBQ Lab v1.

Current implemented engines:

```text
ticket
terminal
```

The current page still uses the Phase 1 engine registry, but Phase 2 runtime foundation files exist beside it as a non-breaking migration path.

## Current Development Focus

Temporary priority: **CompTIA A+ Core 2 exam readiness**.

Until the exam is complete, development should prioritize:

- new Core 2 PBQ scenarios
- high-yield command practice
- ticket troubleshooting workflows
- malware, security, backup, and operational procedure scenarios
- validation tooling
- bug fixes
- study workflow improvements

Major runtime refactors, new engine types, and larger architecture changes should be deferred unless they directly improve Core 2 study effectiveness.

## Current PBQ Inventory

Current Core 2 PBQ count loaded by the browser runtime:

```text
Ticket PBQs:   13
Terminal PBQs: 8
Total PBQs:    21
```

Current ticket PBQ coverage:

1. Slow Windows PC
2. Browser hijacker / malware removal flow
3. Domain password reset
4. Printer spooler troubleshooting
5. Secure website certificate warning
6. BitLocker recovery
7. Black screen after Windows update
8. Mobile email sync after password change
9. Shared folder permissions
10. Backup restore after accidental deletion
11. VPN cannot connect / MFA registration issue
12. Social engineering / vishing incident report
13. Failed Windows Update with low disk space

Current terminal PBQ coverage:

1. DNS name resolution troubleshooting with `ipconfig`, `ping`, `nslookup`, and `ipconfig /flushdns`
2. Windows system file corruption repair with `sfc`, `DISM`, and `shutdown`
3. Group Policy update and verification with `gpupdate` and `gpresult`
4. Suspicious listening process investigation with `netstat`, `tasklist`, and `taskkill`
5. Windows startup repair with `bootrec`
6. File-system repair with `chkdsk`
7. Mapped drive troubleshooting with `net use`
8. Linux permissions with `ls`, `chown`, and `chmod`

## Validation Status

Run the original and sprint data files before committing further PBQ content changes.

From the repository root:

```bash
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
node fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs --data=fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
node fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs
node fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs --data=fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
```

If already inside `fundamentalstrainer/`:

```bash
node pbq-engine/tools/validate-ticket-data.mjs
node pbq-engine/tools/validate-ticket-data.mjs --data=pbq-engine/data/core2/tickets-sprint.json
node pbq-engine/tools/validate-terminal-data.mjs
node pbq-engine/tools/validate-terminal-data.mjs --data=pbq-engine/data/core2/terminal-sprint.json
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
fundamentalstrainer/pbq-engine/runtime/event-bus.js
fundamentalstrainer/pbq-engine/runtime/state-manager.js
fundamentalstrainer/pbq-engine/runtime/component-manager.js
fundamentalstrainer/pbq-engine/runtime/runtime.js
fundamentalstrainer/pbq-engine/grading/grader.js
fundamentalstrainer/pbq-engine/grading/review-renderer.js
fundamentalstrainer/pbq-engine/validators/ticket-validator.js
fundamentalstrainer/pbq-engine/validators/terminal-validator.js
fundamentalstrainer/pbq-engine/schemas/ticket.schema.json
fundamentalstrainer/pbq-engine/tools/validate-ticket-data.mjs
fundamentalstrainer/pbq-engine/tools/validate-terminal-data.mjs
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
fundamentalstrainer/pbq-engine/data/core2/terminal.json
fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
fundamentalstrainer/docs/pbq-engine/phase-2-runtime-architecture.md
fundamentalstrainer/docs/pbq-engine/core-2-two-week-pbq-sprint.md
```

## Implemented Capabilities

The PBQ Engine currently supports:

- JSON-loaded scenarios from multiple data files
- random practice mode across registered engines
- random practice filtering by engine type: All, Ticket only, Terminal only
- current scenario restart
- current scenario grading
- learner notes
- formal ticket documentation component
- documentation saved events through `PBQ_EVENTS.DOCUMENTATION_SAVED`
- stateful scenario execution
- evidence collection
- action/command history
- penalties for unsafe, insecure, irrelevant, overly invasive, premature escalation, missed verification, missed documentation, or wrong-root-cause choices
- shared required-state grading through `grading/grader.js`
- shared final review rendering through `grading/review-renderer.js`
- author-facing scenario validation warnings
- engine registration through `engine-registry.js`
- formal ticket scenario schema through `schemas/ticket.schema.json`
- development ticket data validation through `tools/validate-ticket-data.mjs`
- development terminal data validation through `tools/validate-terminal-data.mjs`
- Phase 2 runtime skeleton files for future migration

## Random Practice Mode

The PBQ page no longer uses a scenario dropdown as the primary learner workflow.

Current learner-facing flow:

```text
Load PBQ page
  ↓
Random PBQ is selected automatically
  ↓
Learner may filter random practice by All, Ticket only, or Terminal only
  ↓
Learner works the scenario
  ↓
Learner may restart current PBQ, grade current PBQ, or load a new random PBQ from the active filter
```

Current controls:

- `Practice Mode`: filters the random scenario pool. Supported values are All PBQs, Ticket PBQs only, and Terminal PBQs only.
- `New Random PBQ`: selects a random scenario from the active filtered scenario pool. When more than one scenario exists, it avoids immediately repeating the currently loaded scenario.
- `Restart Current PBQ`: restarts the currently loaded scenario without selecting a new one.
- `Grade Scenario`: grades the currently loaded scenario and opens final review.

The page still displays the current PBQ title and engine type so the learner knows what was loaded, but the learner no longer browses PBQs from a dropdown.

## Phase 2 Runtime Foundation

The Phase 2 runtime architecture is documented at:

```text
fundamentalstrainer/docs/pbq-engine/phase-2-runtime-architecture.md
```

The first non-breaking runtime files exist:

```text
fundamentalstrainer/pbq-engine/runtime/event-bus.js
fundamentalstrainer/pbq-engine/runtime/state-manager.js
fundamentalstrainer/pbq-engine/runtime/component-manager.js
fundamentalstrainer/pbq-engine/runtime/runtime.js
```

These files are intentionally not the primary execution path yet. They are the foundation for moving from separate engines toward one runtime that manages reusable components.

## Event Bus Migration Status

The first live event-bus migration is complete for documentation saves.

Current flow:

```text
Documentation Component
  emits PBQ_EVENTS.DOCUMENTATION_SAVED

Ticket / Terminal Engine
  subscribes to DOCUMENTATION_SAVED
  updates state.documentation
  updates state.flags.documented
  refreshes progress / required outcomes
```

## Shared Grading And Review

Shared grading files exist:

```text
fundamentalstrainer/pbq-engine/grading/grader.js
fundamentalstrainer/pbq-engine/grading/review-renderer.js
```

Current behavior:

- Ticket Engine uses the shared required-state grader.
- Terminal Engine uses the shared required-state grader.
- Ticket Engine uses the shared final review renderer.
- Terminal Engine uses the shared final review renderer.

## Engine Registry

The PBQ Engine still has a Phase 1 registry layer:

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

## Shared Documentation Component

The PBQ Engine includes a reusable documentation component:

```text
fundamentalstrainer/pbq-engine/components/documentation-component.js
```

This component is separate from learner scratch notes. It represents the formal ticket documentation a technician would save before closing the ticket.

Current documentation fields:

- Problem / Symptom
- Root Cause
- Resolution
- Verification

A documentation save counts as complete only when all four fields contain text. When saved, the component emits:

```text
PBQ_EVENTS.DOCUMENTATION_SAVED
```

The active engine subscribes to this event and updates its scenario state, usually:

```json
{ "documented": true }
```

The saved documentation is also shown in the final review screen.

## Data Sources

The app currently loads scenarios from:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
fundamentalstrainer/pbq-engine/data/core2/terminal.json
fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
```

`app.js` combines those arrays, filters by registered engines, validates the loaded scenarios through the registry, optionally filters by the selected practice mode, and then randomly renders one selected scenario through the correct engine.

The sprint data files are separate from the original baseline files so exam-focused content can be added quickly without destabilizing the original validated set.

## Ticket Engine

The Ticket Engine is now an investigation-style help desk simulator rather than a linear click-through checklist.

The Ticket Engine supports:

- ticket metadata
- a full visible pool of available technician actions
- action grouping by action type
- action dependencies through `requires`
- premature-action handling when a learner tries an action before evidence or state supports it
- state mutation through `sets`
- evidence revealed by actions
- action history
- penalties for unsafe, irrelevant, overly invasive, wrong-root-cause, or premature actions
- shared documentation component
- documentation saved event handling
- hidden exact outcome checklist during the attempt
- progress summary without revealing required-state labels
- shared required-state grading
- shared final review rendering

Current learner-facing behavior:

```text
Ticket metadata
  ↓
Full action pool
  ↓
Learner chooses investigative actions
  ↓
Evidence appears
  ↓
Learner chooses remediation / verification / documentation
  ↓
Final review reveals missing outcomes and penalties
```

Important behavior changes from the original linear model:

- `requires` no longer hides future actions from the action list.
- The exact required-outcomes checklist is hidden during the attempt.
- The left progress panel shows evidence count, action count, penalty count, and overall progress count.
- If an action has unmet `requires`, clicking it does not apply its `sets` or evidence.
- A premature action creates a small `premature-escalation` penalty once for that action/requirement state.
- The action remains available later so the learner can still perform it after gathering the right evidence.
- Completed non-repeatable actions are disabled after successful execution.

Ticket scenarios are loaded from:

```text
fundamentalstrainer/pbq-engine/data/core2/tickets.json
fundamentalstrainer/pbq-engine/data/core2/tickets-sprint.json
```

Current ticket scenario count: **13**.

## Ticket Scenario Schema

The formal ticket scenario schema lives at:

```text
fundamentalstrainer/pbq-engine/schemas/ticket.schema.json
```

The schema is the authoring contract for Ticket Engine v2 content. It defines the expected structure for scenario metadata, ticket metadata, `initialState`, `actions`, action `requires` maps, action `sets` maps, action evidence, action penalties, grading configuration, and required grading states.

The runtime validator and the schema serve different purposes:

- `ticket.schema.json` defines the formal authoring contract.
- `ticket-validator.js` catches practical authoring mistakes in the browser, especially state-key mismatches that JSON Schema cannot easily validate by itself.
- `tools/validate-ticket-data.mjs` provides a dependency-free development check before committing ticket content.

## Terminal Engine Prototype

The Terminal Engine simulates command-line troubleshooting tasks inside the same PBQ shell.

Current Terminal Engine file:

```text
fundamentalstrainer/pbq-engine/engines/terminal-engine.js
```

Current Terminal Engine data files:

```text
fundamentalstrainer/pbq-engine/data/core2/terminal.json
fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
```

Current Terminal Engine validator:

```text
fundamentalstrainer/pbq-engine/validators/terminal-validator.js
```

Current terminal scenario count: **8**.

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
- documentation saved event handling
- penalties
- shared required-state grading
- shared final review rendering

## Design Notes

The PBQ Engine remains a multi-engine shell. `app.js` should stay generic and only coordinate loading, validation, practice filtering, random scenario selection, and engine startup.

Shared learner workflow components belong in:

```text
fundamentalstrainer/pbq-engine/components/
```

Engine-specific behavior currently remains in:

```text
fundamentalstrainer/pbq-engine/engines/
```

Runtime orchestration belongs in:

```text
fundamentalstrainer/pbq-engine/runtime/
```

Shared grading and review belongs in:

```text
fundamentalstrainer/pbq-engine/grading/
```

Engine-specific validators belong in:

```text
fundamentalstrainer/pbq-engine/validators/
```

Engine-specific schemas should eventually live in:

```text
fundamentalstrainer/pbq-engine/schemas/
```

The Terminal Engine is intentionally a prototype. It is enough to prove the interaction model, but it does not yet have a formal JSON Schema.

## Next Recommended Work

Good next steps during the Core 2 sprint:

1. Run the ticket and terminal validators against both the baseline and sprint data files.
2. Browser-test random PBQ loading across All, Ticket only, and Terminal only practice modes.
3. Add weak-area filtering later if it directly supports studying.
4. Add distractor actions to older ticket scenarios where the full action pool still feels too obvious.
5. Add the next terminal batch for `tracert`, `pathping`, `diskpart`, `xcopy`, `robocopy`, `net user`, and `net localgroup`.
6. Add additional ticket scenarios only when they cover exam-relevant gaps.
7. Add formal `terminal.schema.json` only if it speeds up reliable PBQ authoring.
8. Defer deeper runtime migration until after the exam unless it directly improves study workflow.
