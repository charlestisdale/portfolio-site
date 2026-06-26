# Interactive Knowledge Graph Visualizer

This document captures the current graph implementation and the architectural rules future chats should preserve.

## Purpose

The graph is a learner-facing explorer for canonical Knowledge Objects and their relationships.

It is not a separate content system, not an authoring tool, and not a hand-maintained concept map outside the Knowledge Object pipeline.

## Current knowledge-to-graph flow

```text
Instructional source
    ↓
Transcript / source text
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Author
    ↓
Draft Knowledge Object
    ↓
Promotion + validation
    ↓
Canonical Knowledge Object
    ↓
Relationship extraction / merge
    ↓
content/relationships/*.graph.json
    ↓
Knowledge Engine
    ↓
Graph Visualizer
```

The graph must stay downstream of canonical Knowledge Objects and relationship files.

## Graph source of truth

The graph consumes canonical platform data:

```text
content/knowledge/**
content/indexes/knowledge-index.json
content/relationships/a-plus-220-1202.graph.json
engine/knowledge/**
```

Do not hardcode instructional facts, certification facts, transcript facts, or lesson content into the graph UI. Graph labels, controls, and layout behavior may live in UI code, but concept meaning belongs in Knowledge Objects and relationship data.

## Graph versus curriculum

The graph and curriculum answer different questions.

```text
Knowledge Object = what the learner needs to know
Knowledge Graph  = how concepts relate
Curriculum       = where and when concepts are taught
```

A graph edge should not be used as curriculum placement. A curriculum module reference should not be treated as a conceptual relationship.

Examples:

```text
filesystems.ntfs contrasts_with filesystems.fat32     = graph relationship
filesystems.ntfs appears in File Systems module       = curriculum placement
```

## Relationship lifecycle

Relationships may originate from AI authoring, discovery review, or Knowledge Object metadata, but they are not trusted until promotion and validation.

```text
AI relationship suggestion
    ↓
normalized draft relationship
    ↓
promotion mapping
    ↓
allowed relationship type
    ↓
graph edge
    ↓
architecture validation
```

Promotion tooling should map or reject relationship aliases instead of letting arbitrary edge types enter the graph.

## Stub and missing nodes

Missing targets can appear as stub/planned nodes when a relationship points to a Knowledge Object that has not been authored yet.

This is expected during ingestion. Warnings about missing graph targets are roadmap signals unless validation fails. Do not fix missing targets by creating shallow placeholder Knowledge Objects. Author those concepts through the normal pipeline.

## Current implementation files

```text
engine/modes/graph-visualizer.js       Main graph renderer and graph viewport functions
engine/modes/graph-auto-center.js      Graph UI helper for centering, toolbar cleanup, expanded mode, and Learn scroll behavior
graph-visualizer.css                   Graph visual styling, fixed graph-world sizing, expanded workspace styling
app.js                                 Mode switching and graph node navigation
index.html                             Loads graph helper module
```

## Current behavior

The graph currently supports:

- Focused and Expanded graph scopes.
- Active node in the center of the graph model.
- Direct and nearby relationship context.
- Stub/missing nodes generated from unresolved references.
- Node dragging with persisted layout in `localStorage`.
- Pan by dragging empty canvas space.
- Zoom in and zoom out controls.
- Fit graph control.
- Center control for the active node.
- Reset nodes control for manual node positions.
- Expand graph / Exit expanded graph workspace.
- Escape key exits expanded graph mode.
- Recent graph nodes row in normal mode.
- Search visible node input in normal mode.
- Open active in Learn button.
- Open active in Learn exits expanded mode and scrolls Learn mode to the top.

## Current toolbar design

The graph toolbar should keep graph camera/layout controls together:

```text
Focused | Expanded | Reset nodes | Zoom in | Zoom out | Fit graph | Center | Open active in Learn | Expand graph
```

Current cleanup rules:

- Do not restore `Reset view`; it duplicated Fit graph and caused left-shifted viewport behavior.
- Do not put Center beside the search input. Search should stay search-only.
- Center means center the active graph node.
- Fit graph means fit all visible graph nodes into the current canvas.
- Reset nodes means clear saved manual node positions for the current active graph layout.

## Expanded graph workspace

Expanded mode is intentionally canvas-focused.

When expanded:

- The graph visualizer becomes the workspace.
- The active concept card is hidden.
- The recent node row is hidden.
- The search panel is hidden.
- Graph stat pills are hidden.
- The canvas receives most of the screen height.
- The graph uses an opaque background to prevent the page from bleeding through.
- The graph world remains fixed at `1180 x 760`; expanded mode should not stretch graph geometry.

This fixed graph-world rule prevents SVG relationship lines and absolutely positioned node cards from drifting apart.

## Important layout notes

The graph uses a fixed coordinate world:

```text
VIEWBOX_WIDTH = 1180
VIEWBOX_HEIGHT = 760
```

The SVG edge layer and node layer must stay the same fixed size. Avoid CSS changes that stretch one layer without the other.

The current layout is a radial/ellipse layout around the active node. The user disliked the earlier lane-style layout, so do not return to lane layout unless explicitly requested.

## Relationship display choices

The graph intentionally avoids extra clutter:

- No arrowheads.
- No relationship chips.
- No edge label chips displayed as repeated UI clutter.
- Stub nodes are visible as nodes, but stub explanation belongs in future cleanup tooling.

## LocalStorage keys

Current graph state uses browser `localStorage` keys similar to:

```text
it-learning-platform.graph-layout.v4
it-learning-platform.graph-viewport.v4
it-learning-platform.graph-history.v1
```

Changing these versions resets saved layout/viewport/history state.

## Known good state

As of the latest graph pass:

- Clicking graph nodes stays in Graph mode.
- Auto-centering after graph node clicks works well enough.
- Fit graph makes the graph larger and centered.
- Reset view was removed.
- Center is now in the main toolbar.
- Open active in Learn returns to Learn mode at the top of the page.
- Expanded mode is usable, but future polish is still possible.

## Future graph improvements

1. Relationship filtering.
2. Stub cleanup visibility.
3. Node detail preview.
4. Better layout engine.
5. Graph-to-learning bridge with mastery and prerequisite recommendations.

## Architecture rule

The graph must stay downstream of Knowledge Objects and the Knowledge Engine. It should visualize relationships; it should not define learning content, curriculum placement, or source ingestion behavior.
