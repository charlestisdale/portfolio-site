# PBQ Engine Phase 2 Runtime Architecture

## Purpose

The PBQ Engine is moving from a collection of individual engines toward a reusable simulation platform.

The current working prototype has:

```text
app.js
engine-registry.js
engines/ticket-engine.js
engines/terminal-engine.js
components/documentation-component.js
```

That structure works, but the next phase should separate orchestration, state, events, components, grading, review, and persistence.

The goal is not to rewrite everything at once. The goal is to introduce the new runtime layer beside the current working PBQ page, then migrate features into it without breaking existing Ticket and Terminal scenarios.

## Current Phase 1 Model

```text
PBQ Shell
│
├── app.js
├── engine-registry.js
├── ticket-engine.js
├── terminal-engine.js
└── documentation-component.js
```

In Phase 1, each engine owns most of its own lifecycle:

- state initialization
- UI rendering
- action or command execution
- evidence updates
- history updates
- grading
- final review
- documentation integration

This helped prove the concept, but it will become hard to scale when scenarios combine terminal, browser, desktop, file explorer, services, registry, event viewer, network maps, and other reusable components.

## Phase 2 Target Model

```text
PBQ Runtime
│
├── Runtime Orchestrator
├── State Manager
├── Event Bus
├── Component Manager
├── Grading Engine
├── Review Engine
├── Persistence Layer
│
└── Components
    ├── Ticket
    ├── Terminal
    ├── Documentation
    ├── Evidence
    ├── History
    ├── Browser
    ├── Desktop
    ├── File Explorer
    ├── Services
    ├── Registry
    ├── Event Viewer
    ├── Network Map
    └── Inventory
```

In Phase 2, there is one runtime. Ticket, Terminal, Documentation, Evidence, and History become runtime-managed components.

## Runtime Responsibilities

The runtime is the orchestrator. It should not contain ticket-specific, terminal-specific, browser-specific, or desktop-specific behavior.

The runtime should:

1. Load a scenario.
2. Create a structured state object.
3. Create shared services.
4. Initialize components.
5. Connect components through the event bus.
6. Render components into assigned UI regions.
7. Delegate grading to a grading service.
8. Delegate final review to a review service.
9. Serialize state for save/resume.
10. Destroy or reset components when the scenario changes.

## State Manager

The current engines mostly use a flat `flags` object plus local arrays for evidence, history, and penalties.

Phase 2 should centralize state behind a State Manager.

Target shape:

```js
{
  scenarioId: "core2-example-001",
  engine: "runtime",
  flags: {},
  ticket: {},
  terminal: {},
  documentation: {},
  evidence: [],
  history: [],
  penalties: [],
  learnerNotes: "",
  components: {}
}
```

Later slices can expand the shape:

```js
{
  desktop: {},
  browser: {},
  filesystem: {},
  registry: {},
  services: {},
  network: {},
  users: {},
  inventory: {}
}
```

The State Manager should expose a small API:

```js
getState()
get(path)
set(path, value)
merge(path, patch)
reset(initialState)
serialize()
```

Components should update state through the manager instead of reaching directly into each other's internal state.

## Event Bus

Components should communicate through events, not direct imports or direct method calls.

Examples:

```text
COMMAND_EXECUTED
ACTION_COMPLETED
EVIDENCE_ADDED
HISTORY_ADDED
DOCUMENTATION_SAVED
PENALTY_ADDED
STATE_UPDATED
SCENARIO_STARTED
SCENARIO_GRADED
SCENARIO_RESET
```

Example flow:

```text
Terminal component
  emits COMMAND_EXECUTED

Runtime/event subscribers
  update history
  add evidence
  set flags
  add penalties
  refresh requirements
```

The Event Bus should expose:

```js
on(eventName, handler)
off(eventName, handler)
emit(eventName, payload)
clear()
```

## Component Manager

The Component Manager owns component registration and lifecycle.

Responsibilities:

- register component definitions
- create component instances
- initialize components with runtime context
- render components
- destroy components
- report unknown component IDs

Target component contract:

```js
{
  id: "terminal",
  label: "Terminal",
  initialize(context) {},
  render() {},
  handleEvent(eventName, payload) {},
  serialize() {},
  destroy() {}
}
```

Not every method has to be required at first. The manager can safely check whether a method exists before calling it.

## Components vs Engines

Phase 1 uses the word `engine` for `ticket` and `terminal`.

Phase 2 should treat these as components:

```text
ticket component
terminal component
documentation component
```

The only true engine should be the runtime.

This naming matters because future PBQs will combine multiple interfaces. A scenario may use ticket + terminal + browser + documentation, or ticket + desktop + file explorer + services.

## Scenario Definition Direction

Current Phase 1 scenarios use:

```json
{
  "engine": "terminal"
}
```

Phase 2 scenarios should eventually use:

```json
{
  "runtime": "pbq-v2",
  "components": [
    "ticket",
    "terminal",
    "documentation",
    "evidence",
    "history"
  ]
}
```

The migration should be gradual. The current `engine` field should continue working until component-based scenarios are ready.

## Grading Engine

Current grading logic lives inside Ticket Engine and Terminal Engine.

Phase 2 should move grading into a shared grading service.

Initial grading inputs:

```js
{
  state,
  requiredStates,
  penalties,
  maxScore,
  passingScore,
  pointsPerMissingState
}
```

Initial grading output:

```js
{
  score,
  passed,
  missing,
  penalties,
  maxScore,
  passingScore
}
```

This lets Ticket, Terminal, Browser, Desktop, and future components all use the same scoring behavior.

## Review Engine

The final review screen should also become shared.

It should render:

- score
- pass/fail status
- missing outcomes
- penalties
- actions/commands taken
- evidence collected
- learner notes
- saved documentation

The current Ticket and Terminal engines have duplicated final-review logic. That should be migrated into a shared review service after the grading service exists.

## Persistence Layer

Save/resume should happen after runtime and state manager exist.

The persistence layer should serialize:

- scenario ID
- state
- component snapshots
- learner notes
- documentation
- history
- evidence
- penalties

Initial storage can be `localStorage`.

Future storage could be exported JSON, cloud sync, or portfolio-local progress tracking.

## Migration Plan

Do not rewrite the working PBQ page in one pass.

Recommended order:

1. Add runtime folder and service skeletons.
2. Add unit-like self-check helpers where possible without build tooling.
3. Move shared grading logic out of Ticket/Terminal into `grading/grader.js`.
4. Move shared review rendering out of Ticket/Terminal into `grading/review-renderer.js`.
5. Add a State Manager and make one engine use it internally.
6. Add an Event Bus and use it for documentation saved events.
7. Convert Terminal into a runtime-managed component.
8. Convert Ticket into a runtime-managed component.
9. Introduce component-based scenario JSON while preserving current `engine` scenarios.

## Non-Goals For The First Runtime Commit

The first runtime commit should not:

- break existing Ticket or Terminal scenarios
- remove `engine-registry.js`
- rename all existing files
- introduce a build step
- require npm packages
- require OpenAI API access
- require a backend

## Near-Term File Layout

Start with this non-breaking addition:

```text
fundamentalstrainer/pbq-engine/runtime/event-bus.js
fundamentalstrainer/pbq-engine/runtime/state-manager.js
fundamentalstrainer/pbq-engine/runtime/component-manager.js
fundamentalstrainer/pbq-engine/runtime/runtime.js
fundamentalstrainer/pbq-engine/grading/grader.js
fundamentalstrainer/pbq-engine/grading/review-renderer.js
```

These files can exist before the current engines fully depend on them.

## Long-Term File Layout

Later, after migration:

```text
fundamentalstrainer/pbq-engine/
  app.js
  runtime/
    runtime.js
    state-manager.js
    event-bus.js
    component-manager.js
  components/
    ticket/
    terminal/
    documentation/
    evidence/
    history/
    browser/
    desktop/
    file-explorer/
    services/
    registry/
    network-map/
  grading/
    grader.js
    review-renderer.js
  persistence/
    local-storage-adapter.js
  schemas/
  validators/
  data/
    core2/
```
