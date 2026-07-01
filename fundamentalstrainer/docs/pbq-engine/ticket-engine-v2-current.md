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

Until the exam is complete, development should prioritize Core 2 PBQ scenario quality, high-yield command practice, ticket troubleshooting workflows, validation tooling, bug fixes, and study workflow improvements.

Do not add large PBQ JSON content through GitHub unless explicitly requested. The preferred content workflow is to generate clean JSON for manual paste/review.

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

## Validation Commands

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
- Exam Mode for hiding PBQ titles that give away the answer
- browser-session stats for attempts, passes, average score, and best score
- current scenario restart
- current scenario grading
- learner notes
- formal ticket documentation component
- documentation saved events through `PBQ_EVENTS.DOCUMENTATION_SAVED`
- stateful scenario execution
- evidence collection
- action/command history
- explicit terminal `hint` command with progressive scenario-aware hints
- realistic unknown-command output for Windows/Linux-style terminals
- forgiving terminal aliases for common incomplete commands such as `chkdsk`, `chkdsk /f`, `sfc`, `gpupdate`, and `shutdown /r`
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
Learner may enable Exam Mode to hide giveaway titles
  ↓
Learner works the scenario
  ↓
Learner may restart current PBQ, grade current PBQ, or load a new random PBQ from the active filter
```

Current controls:

- `Practice Mode`: filters the random scenario pool. Supported values are All PBQs, Ticket PBQs only, and Terminal PBQs only.
- `Exam Mode`: hides the current PBQ title in the toolbar. Terminal scenarios also hide the title in the scenario metadata panel.
- `New Random PBQ`: selects a random scenario from the active filtered scenario pool. When more than one scenario exists, it avoids immediately repeating the currently loaded scenario.
- `Restart Current PBQ`: restarts the currently loaded scenario without selecting a new one.
- `Grade Scenario`: grades the currently loaded scenario and opens final review.
- `Reset Session`: clears the browser-session stats panel.

Exam Mode exists because some PBQ titles, such as command-specific terminal titles, can reveal the intended troubleshooting path before the learner has investigated the issue.

## Session Stats

A browser-session stats panel appears above the PBQ work area.

It tracks:

- attempts graded
- passed attempts
- average score
- best score

Session stats are intentionally lightweight and do not persist after refresh. The app records an attempt when the learner clicks `Grade Scenario` and the final review score is rendered. Re-clicking grade on the same attempt does not double-count. Restarting the current PBQ or loading a new random PBQ starts a fresh countable attempt.

## Ticket Engine

The Ticket Engine is now an investigation-style help desk simulator rather than a linear click-through checklist.

The Ticket Engine supports a full visible pool of technician actions, evidence-driven investigation, action dependencies through `requires`, state mutation through `sets`, premature-action handling, penalties, documentation, hidden exact outcomes during the attempt, and shared final grading/review.

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

## Terminal Engine Prototype

The Terminal Engine simulates command-line troubleshooting tasks inside the same PBQ shell.

Terminal scenarios currently support prompt rendering, command input, command aliases, command output, command prerequisites through `requires`, state mutation through `sets`, evidence collection, command history, documentation, penalties, explicit hints, recognized-but-premature command feedback, shared required-state grading, and shared final review rendering.

Current terminal help/hint behavior:

- Unknown commands now return OS-style errors instead of scenario answer text.
- Windows-style terminals return messages like `'command' is not recognized as an internal or external command, operable program or batch file.`
- Linux-style terminals return `command: command not found`.
- After repeated unsuccessful attempts, the engine prompts the learner with `Need a hint? Type: hint`.
- The engine does not automatically reveal hints after failed attempts.
- Typing `hint` displays the next progressive hint.
- Typing `help`, `?`, or `/?` displays terminal simulation help.
- Hints are generated from the next incomplete required state and the next available good command.
- Generic command-family hints exist for common Core 2 commands such as `net use`, `ipconfig`, `ping`, `nslookup`, `sfc`, `DISM`, `gpupdate`, `gpresult`, `netstat`, `tasklist`, `taskkill`, `bootrec`, `chkdsk`, `ls`, `chown`, and `chmod`.
- Scenario authors may later add a `hint` field to individual commands for more precise hints, but existing JSON works without it.
- Common learner shorthand is accepted for several commands without editing JSON, such as `chkdsk` for `chkdsk c:`, `chkdsk /f` for `chkdsk c: /f`, `sfc` for `sfc /scannow`, `gpupdate` for `gpupdate /force`, and `shutdown /r` for `shutdown /r /t 0`.

Current Terminal Engine files:

```text
fundamentalstrainer/pbq-engine/engines/terminal-engine.js
fundamentalstrainer/pbq-engine/data/core2/terminal.json
fundamentalstrainer/pbq-engine/data/core2/terminal-sprint.json
fundamentalstrainer/pbq-engine/validators/terminal-validator.js
```

Current terminal scenario count: **8**.

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

The active engine subscribes to this event and updates `state.documentation` and `state.flags.documented`.

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

## Architecture Notes

The PBQ Engine remains a multi-engine shell. `app.js` should stay generic and only coordinate loading, validation, practice filtering, random scenario selection, Exam Mode display state, session stats, and engine startup.

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
3. Browser-test Exam Mode against both Ticket and Terminal scenarios.
4. Browser-test session stats by grading multiple PBQs, restarting one, and resetting the session.
5. Browser-test terminal `hint`, `help`, realistic unknown-command output, and shorthand command acceptance on `chkdsk`, `net use`, DNS, Windows repair, Group Policy, and Linux permission scenarios.
6. Add weak-area filtering later if it directly supports studying.
7. Add distractor actions to older ticket scenarios where the full action pool still feels too obvious.
8. Add the next terminal batch for `tracert`, `pathping`, `diskpart`, `xcopy`, `robocopy`, `net user`, and `net localgroup`.
9. Add additional ticket scenarios only when they cover exam-relevant gaps.
10. Add formal `terminal.schema.json` only if it speeds up reliable PBQ authoring.
11. Defer deeper runtime migration until after the exam unless it directly improves study workflow.
