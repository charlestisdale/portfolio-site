# PBQ Engine README

## Purpose

The PBQ Engine is a standalone simulation framework for building interactive performance-based questions for the IT Learning Platform.

It is intended to support CompTIA-style PBQs where the learner must perform technician-like actions, not just select an answer. Examples include troubleshooting tickets, command-line tasks, Windows tool navigation, security workflows, file permissions, malware remediation, and operational procedure scenarios.

> **The PBQ Engine is a simulation framework, not a quiz.**
>
> The goal is to emulate real technician workflows and performance-based assessments. PBQs should be authored as interactive scenarios, not as collections of normal multiple-choice questions.

## Relationship to the Existing Quiz App

The PBQ Engine must remain separate from the existing Core 2 quiz app.

The current quiz app is located under:

```text
fundamentalstrainer/
```

The current quiz app supports the lightweight study workflow:

- multiple-choice questions
- typed-answer questions
- simple matching PBQs
- simple ordering PBQs
- local stats and weak-area tracking
- loading `core2-questions.json`

The PBQ Engine is a separate system with its own architecture, rendering logic, state model, and JSON schema. It should not be treated as a small feature extension of the quiz app.

This separation matters because the quiz app should remain stable, simple, and fast for normal study sessions. The PBQ Engine will become more complex over time and should be allowed to evolve without risking the existing trainer.

Current separate PBQ Lab files:

```text
fundamentalstrainer/pbq-lab.html
fundamentalstrainer/core2-pbq-lab.json
```

Planned PBQ Engine documentation and future implementation should live under:

```text
fundamentalstrainer/docs/pbq-engine/
```

A future implementation may also introduce a separate application folder such as:

```text
fundamentalstrainer/pbq-engine/
```

Do not merge PBQ Engine code into the main quiz trainer unless there is a deliberate architecture decision to do so.

## Current Status

A first standalone PBQ Lab exists.

It currently supports these PBQ types:

- `matching`
- `ordering`
- `command`
- `scenario`

The first version is useful for practice, but it is not the final PBQ Engine architecture. It is a bridge between the existing quiz app and the future simulation framework.

Current limitations:

- Scenario PBQs are mostly linear.
- There is no shared engine registry yet.
- There is no formal schema validation yet.
- There is no persistent scenario state beyond the active browser session.
- There is no reusable simulated Windows desktop, terminal, Event Viewer, Device Manager, Services console, Disk Management, or File Explorer yet.
- Individual PBQ types are still directly implemented in one page instead of being modular engines.

## Design Goals

The PBQ Engine should be:

### JSON-driven

New PBQs should be authored mostly as data. Adding a new ticket, terminal task, matching question, or Windows navigation scenario should not require custom JavaScript for that individual PBQ.

### Engine-based

Each PBQ should specify an engine type. The engine renderer should know how to display and grade that type of activity.

Example engines:

```text
matching
ordering
command
ticket
terminal
windows-desktop
file-explorer
device-manager
event-viewer
services
disk-management
registry-editor
active-directory
linux-terminal
network-troubleshooting
permissions
```

### Separate from presentation

PBQ content should not be hardcoded into HTML. Content should live in JSON. Renderers should transform that JSON into the user interface.

### Stateful

Real troubleshooting requires state. The engine should be able to track:

- actions taken
- evidence revealed
- wrong turns
- current scenario state
- completed objectives
- penalties or hints used
- final grading results

### Branching

Wrong choices should not always end the PBQ. In many scenarios, a learner should be allowed to continue, recover, and learn from the consequence.

Example:

```text
Ticket: Computer is slow.
Learner chooses to replace RAM.
Result: The issue remains.
Learner checks Task Manager.
Result: Disk is at 100%.
Learner identifies backup sync loop.
```

### Reusable across certifications

The PBQ Engine should not be locked to A+ Core 2. It should eventually support content for:

- CompTIA A+
- Network+
- Security+
- Linux+
- Microsoft/Azure fundamentals
- homelab scenarios
- help desk simulations
- networking simulations
- cybersecurity workflows

## Proposed PBQ Object Model

Future PBQs should move toward a common shape:

```json
{
  "id": "core2-ticket-slow-pc-001",
  "certification": "CompTIA A+",
  "exam": "Core 2",
  "objective": "3.0 Software Troubleshooting",
  "category": "performance-based-question",
  "difficulty": "hard",
  "engine": "ticket",
  "title": "Troubleshoot a slow Windows PC",
  "description": "A user reports that applications take several minutes to open after login.",
  "scene": {},
  "steps": [],
  "grading": {},
  "teachingNotes": []
}
```

The exact schema can evolve, but future work should avoid one-off structures that only work for a single PBQ.

## Planned Engines

### 1. Matching Engine

Used for mapping prompts to correct answers.

Examples:

- Windows tools to tasks
- malware symptoms to malware types
- backup types to behavior
- commands to functions
- security controls to protections

### 2. Ordering Engine

Used for putting steps into the correct order.

Examples:

- malware removal process
- troubleshooting methodology
- change management workflow
- incident response workflow
- backup restoration process

### 3. Command Engine

Used for one-command tasks.

Examples:

```text
ipconfig /flushdns
sfc /scannow
DISM /Online /Cleanup-Image /RestoreHealth
gpupdate /force
chkdsk /f
```

This engine should accept normalized answers where appropriate, including case-insensitive matching and reasonable spacing tolerance.

### 4. Terminal Engine

A richer version of the Command Engine.

The learner sees a simulated terminal prompt and can run multiple commands. The engine returns simulated output based on the scenario state.

Examples:

```text
C:\Users\Student> ipconfig /all
C:\Users\Student> nslookup example.com
C:\Users\Student> ping 8.8.8.8
```

Linux examples:

```text
$ pwd
$ ls -la
$ chmod 640 report.txt
$ chown user:group file.txt
```

### 5. Ticket Engine

A stateful help desk simulator.

The learner works a ticket by selecting actions, asking questions, running commands, inspecting evidence, documenting findings, and choosing fixes.

A ticket should include:

- ticket number
- priority
- user
- department
- device
- reported symptom
- action menu
- evidence log
- notes/history pane
- grading rubric

Actions may reveal evidence or change state.

Example action types:

```text
ask-user
inspect-tool
run-command
change-setting
restart-service
quarantine-system
escalate
document
verify-fix
```

### 6. Windows Desktop Engine

Simulates a Windows desktop or admin environment.

Learners should choose tools and navigate simplified interfaces.

Possible tools:

- Task Manager
- Settings
- Control Panel
- Device Manager
- Event Viewer
- Services
- Computer Management
- Disk Management
- Command Prompt
- PowerShell
- Registry Editor

### 7. File Explorer and Permissions Engine

Simulates file/folder access, NTFS permissions, share permissions, and effective access.

Should eventually support:

- folder trees
- users/groups
- share permissions
- NTFS permissions
- inherited permissions
- least privilege tasks
- effective access grading

### 8. Device Manager Engine

Simulates hardware and driver tasks.

Examples:

- identify a disabled device
- roll back a driver
- update a driver
- uninstall a problem device
- view device properties

### 9. Services Engine

Simulates Windows service troubleshooting.

Examples:

- restart Print Spooler
- set a service to Automatic
- identify stopped service dependency
- verify service status

### 10. Event Viewer Engine

Simulates log analysis.

Learners should identify relevant logs and events.

Examples:

- application crash
- disk errors
- service failures
- authentication failures
- Windows Update failures

### 11. Disk Management Engine

Simulates common storage tasks.

Examples:

- initialize a disk
- create a partition
- assign a drive letter
- extend a volume
- identify unallocated space
- recognize recovery partitions

### 12. Active Directory Engine

Simulates basic help desk identity tasks.

Examples:

- reset a password
- unlock an account
- disable an account
- add user to group
- remove stale access
- verify group membership

This should be limited to exam-appropriate and help-desk-appropriate tasks.

## Ticket Engine v2 Direction

The next major build should focus on the Ticket Engine because it provides the highest value for Core 2 exam prep and real-world help desk practice.

Ticket Engine v2 should include:

- ticket pane
- action menu
- evidence/history pane
- learner notes
- scenario state
- branching paths
- grading rubric
- final review screen

A future ticket definition might look like this:

```json
{
  "id": "core2-ticket-browser-hijacker-001",
  "engine": "ticket",
  "title": "Browser redirects and pop-ups",
  "ticket": {
    "priority": "Medium",
    "user": "Jordan Lee",
    "department": "Accounting",
    "device": "Windows 11 laptop",
    "description": "Browser homepage changes and pop-ups appear after login."
  },
  "initialState": {
    "networkIsolated": false,
    "symptomsIdentified": false,
    "malwareRemoved": false,
    "userEducated": false
  },
  "actions": [
    {
      "id": "ask-when-started",
      "label": "Ask when the issue started",
      "result": "The user says it started after installing a free PDF tool yesterday.",
      "sets": {
        "symptomsIdentified": true
      }
    },
    {
      "id": "quarantine-system",
      "label": "Quarantine the system",
      "result": "The device is isolated from the network to reduce spread.",
      "sets": {
        "networkIsolated": true
      }
    }
  ],
  "grading": {
    "requiredStates": [
      "symptomsIdentified",
      "networkIsolated",
      "malwareRemoved",
      "userEducated"
    ],
    "penalizedActions": [
      "wipe-drive-first",
      "disable-security-tools"
    ]
  }
}
```

## Grading Principles

The PBQ Engine should grade based on technician decision-making, not simple memorization.

Important grading concepts:

- Did the learner choose the least invasive reasonable action?
- Did the learner gather evidence before making disruptive changes?
- Did the learner identify the root cause?
- Did the learner verify the fix?
- Did the learner document the result?
- Did the learner avoid unsafe or insecure actions?
- Did the learner escalate when appropriate?

Wrong actions should be categorized when possible:

```text
unsafe
insecure
too-invasive
not-relevant
premature-escalation
missed-verification
missed-documentation
```

This will make feedback more useful than a simple correct/wrong message.

## Content Authoring Rules

PBQs should be scenario-based, practical, and aligned with technician workflows.

Authoring rules:

1. Prefer realistic tickets over trivia.
2. Include enough evidence for the learner to reason.
3. Avoid trick questions that depend on wording games.
4. Include plausible wrong choices.
5. Teach least-invasive troubleshooting.
6. Include verification and documentation when relevant.
7. Keep content JSON-driven.
8. Avoid writing custom JavaScript for one specific PBQ.
9. Keep certification metadata attached to the PBQ, but do not make the engine certification-specific.
10. When a PBQ maps to a Knowledge Object in the future, reference that canonical object ID.

## Folder Guidance

Current files:

```text
fundamentalstrainer/pbq-lab.html
fundamentalstrainer/core2-pbq-lab.json
fundamentalstrainer/docs/pbq-engine/README.md
```

Recommended future structure:

```text
fundamentalstrainer/pbq-engine/
  index.html
  styles.css
  app.js
  engines/
    matching-engine.js
    ordering-engine.js
    command-engine.js
    terminal-engine.js
    ticket-engine.js
    desktop-engine.js
  schemas/
    pbq.schema.json
    ticket.schema.json
    terminal.schema.json
  data/
    core2/
      tickets.json
      commands.json
      matching.json
      ordering.json
```

This structure keeps the PBQ Engine separate from the current quiz trainer.

## Roadmap

### Phase 1: Stabilize Current PBQ Lab

- Keep `pbq-lab.html` separate from the quiz app.
- Confirm current 25 PBQs load correctly.
- Add link from main trainer page to PBQ Lab.
- Add basic schema documentation for current PBQ types.

### Phase 2: Build Ticket Engine v2

- Add stateful ticket object model.
- Add action history.
- Add evidence pane.
- Add branching actions.
- Add required-state grading.
- Add final review screen.

### Phase 3: Modularize Engines

- Move engine logic out of a single HTML file.
- Create engine registry.
- Create reusable render/grade lifecycle.
- Add schema validation during development.

### Phase 4: Add Simulated Tools

- Windows Desktop
- Command Prompt / PowerShell terminal
- Event Viewer
- Services
- Device Manager
- Disk Management
- File Explorer permissions
- Linux terminal

### Phase 5: Integrate With Knowledge Platform

Eventually, PBQs should be generated from or linked to canonical Knowledge Objects.

The long-term flow should be:

```text
Knowledge Object
  ↓
Scenario Template
  ↓
PBQ Definition JSON
  ↓
PBQ Engine Renderer
  ↓
Learner Performance Data
```

The PBQ Engine should become one learner experience generated from the knowledge-first curriculum system, not an isolated hand-authored quiz bank forever.

## Important Instruction for Future Chats

When continuing this work in future chats:

1. Read this README first.
2. Do not redesign the PBQ Engine as part of the existing quiz app.
3. Preserve separation between the quiz trainer and PBQ Engine.
4. Treat the PBQ Engine as a reusable simulation framework.
5. Prefer JSON schemas and reusable renderers over custom one-off JavaScript.
6. Build the Ticket Engine v2 before adding hundreds of new PBQs.
7. Keep the long-term IT Learning Platform architecture in mind: content should eventually come from canonical Knowledge Objects.

## Summary

The PBQ Engine exists to make the trainer more realistic and more valuable than standard multiple-choice practice.

The current quiz app remains the lightweight study tool.

The PBQ Engine should become the separate, reusable simulation layer that supports realistic technician workflows, branching tickets, terminals, Windows tools, permissions, troubleshooting, and future certification content.