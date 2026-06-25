# Interactive Knowledge Graph Visualizer

This document captures the current graph implementation for future development chats.

## Purpose

The graph is a learner-facing explorer for canonical Knowledge Objects. It is not a separate content system and it must not become a hand-authored concept map outside the Knowledge Object pipeline.

Knowledge flow remains:

```text
Transcripts / reviewed source material
→ Evidence
→ Candidate Knowledge Objects
→ Human Review
→ Canonical Knowledge Objects
→ Knowledge Graph
→ Graph Visualizer / Learn mode / Search / Assessments
```

## Source of truth

The graph consumes canonical platform data:

```text
content/knowledge/**
content/indexes/knowledge-index.json
content/relationships/a-plus-220-1202.graph.json
engine/knowledge/**
```

Do not hardcode instructional facts, certification facts, or lesson content into the graph UI. Graph labels, controls, and layout behavior may live in UI code, but concept meaning belongs in Knowledge Objects and relationship data.

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

- Do not restore `Reset view`; it was removed because it duplicated Fit graph and caused left-shifted viewport behavior.
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
- No edge label chips such as `supports`, `executes`, `related`, or `communicates with` displayed as separate UI clutter.
- Stub nodes are visible as nodes, but stub explanation belongs in future cleanup tooling, not as repeated chips around the graph.

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
- Expanded mode is acceptable and can be lived with, but future polish is still possible.

## Future graph improvements

Good next graph improvements, in priority order:

1. Relationship filtering.
   - Hide weak/generic `related` edges.
   - Show active links only.
   - Toggle stubs on/off.

2. Stub cleanup visibility.
   - Show visible stub count.
   - List stubs visible in the current graph.
   - Explain which relationship created each stub.
   - Later allow review/merge/create workflows through admin tooling.

3. Node detail preview.
   - Hover or side-panel preview with title, summary, domain, status, and relationship reason.
   - Keep click behavior as navigation unless intentionally redesigned.

4. Better layout engine.
   - Keep active concept central.
   - Put strong/direct edges closer.
   - Push stubs and weak context outward.
   - Reduce overlap automatically.

5. Graph-to-learning bridge.
   - Add mastery/weakness coloring later.
   - Use graph prerequisites to recommend study paths.
   - Keep recommendations generated from Knowledge Objects and progress state.

## Architecture rule

The graph must stay downstream of the Knowledge Objects and Knowledge Engine. It should visualize relationships; it should not define the learning content itself.
