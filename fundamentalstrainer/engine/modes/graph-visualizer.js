import { getGraphScope } from "./graph-scope.js";

const VIEWBOX_WIDTH = 980;
const VIEWBOX_HEIGHT = 620;
const CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
const MAX_VISIBLE_NODES = 42;
const GRAPH_SCOPES = ["focused", "expanded"];
const GRAPH_LAYOUT_STORAGE_KEY = "it-learning-platform.graph-layout.v1";
const GRAPH_VIEWPORT_STORAGE_KEY = "it-learning-platform.graph-viewport.v1";
const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 };
const FIT_VIEW_PADDING = 42;
const FIT_NODE_MARGIN_X = 96;
const FIT_NODE_MARGIN_Y = 54;
const MIN_AUTO_FIT_ZOOM = 0.45;
const MAX_AUTO_FIT_ZOOM = 1.25;
const ZOOM_BUTTON_STEP = 1.16;
const NODE_CARD_WIDTH = 188;
const NODE_CARD_HEIGHT = 66;
const NODE_CARD_TALL_HEIGHT = 84;
const NODE_EDGE_GAP = 2;
const NODE_COLLISION_PADDING_X = 24;
const NODE_COLLISION_PADDING_Y = 18;
const LAYOUT_RELAXATION_PASSES = 18;

const RELATIONSHIP_LABELS = {
  contains: "contains",
  part_of: "part of",
  prerequisite: "prerequisite",
  uses: "uses",
  supports: "supports",
  runs_on: "runs on",
  manages: "manages",
  stores: "stores",
  executes: "executes",
  communicates_with: "communicates with",
  contrasts_with: "contrasts with",
  replaces: "replaces",
  implements: "implements",
  related: "related",
  related_to: "related",
  troubleshoots: "troubleshooting",
  troubleshooting: "troubleshooting",
  depends_on: "depends on",
  command: "command",
  security: "security",
  networking: "networking"
};

export function renderKnowledgeGraphVisualizer({ graph = null, activeConcept = null, activeEdges = [], scope = getGraphScope() } = {}) {
  const sourceNodes = graph?.nodes || [];
  const sourceEdges = graph?.edges || [];
  const graphScope = GRAPH_SCOPES.includes(scope) ? scope : "focused";
  const activeId = activeConcept?.id || null;
  const layoutKey = graphLayoutKey({ activeId, scope: graphScope });
  const viewportKey = graphViewportKey({ activeId, scope: graphScope });
  const nodeMap = new Map(sourceNodes.map(node => [node.id, normalizeExistingNode(node)]));
  const graphModel = buildVisibleGraphModel({ nodeMap, edges: sourceEdges, activeId, scope: graphScope });
  const layout = applySavedLayout(layoutNodes({ nodes: graphModel.nodes, edges: graphModel.edges, activeId }), layoutKey);
  const storedViewports = readStoredViewports();
  const viewport = storedViewports[viewportKey] || getFittedViewport(layout);
  const relationshipTypes = unique(graphModel.edges.map(edge => edge.type || "related")).sort();

  registerScopeRenderer({ graph, activeConcept, activeEdges });

  if (!sourceNodes.length) {
    return `
      <section class="graph-visualizer graph-visualizer--empty">
        <h3>Interactive graph</h3>
        <p class="muted">No graph nodes are loaded yet.</p>
      </section>
    `;
  }

  return `
    <section class="graph-visualizer" aria-label="Interactive knowledge graph" data-graph-layout-key="${escapeHtml(layoutKey)}" data-graph-viewport-key="${escapeHtml(viewportKey)}">
      <header class="graph-visualizer__header">
        <div>
          <h3>Interactive graph</h3>
          <p class="muted">${escapeHtml(getScopeDescription(graphScope))}</p>
        </div>
        <div class="graph-visualizer__tools" aria-label="Graph summary">
          <span class="pill">${escapeHtml(graphModel.nodes.length)} visible nodes</span>
          <span class="pill">${escapeHtml(graphModel.edges.length)} visible edges</span>
          ${activeId ? `<span class="pill">${escapeHtml(activeEdges.length)} active links</span>` : ""}
          ${graphModel.stubCount ? `<span class="pill">${escapeHtml(graphModel.stubCount)} stub nodes</span>` : ""}
          ${graphModel.missingCount ? `<span class="pill">${escapeHtml(graphModel.missingCount)} missing nodes</span>` : ""}
        </div>
      </header>

      <div class="graph-scope-toggle" aria-label="Graph scope">
        ${GRAPH_SCOPES.map(item => `
          <button class="graph-scope-button ${item === graphScope ? "active" : ""}" data-graph-scope="${escapeHtml(item)}" type="button" aria-pressed="${item === graphScope ? "true" : "false"}">
            ${escapeHtml(capitalize(item))}
          </button>
        `).join("")}
        <button class="graph-scope-button" data-graph-reset-layout="${escapeHtml(layoutKey)}" type="button">Reset nodes</button>
        <button class="graph-scope-button" type="button" onclick="window.__zoomKnowledgeGraphViewportByButton?.('${escapeAttribute(viewportKey)}', ${ZOOM_BUTTON_STEP})">Zoom in</button>
        <button class="graph-scope-button" type="button" onclick="window.__zoomKnowledgeGraphViewportByButton?.('${escapeAttribute(viewportKey)}', ${1 / ZOOM_BUTTON_STEP})">Zoom out</button>
        <button class="graph-scope-button" type="button" onclick="window.__fitKnowledgeGraphViewport?.('${escapeAttribute(viewportKey)}')">Fit view</button>
        <button class="graph-scope-button" type="button" onclick="window.__resetKnowledgeGraphViewport?.('${escapeAttribute(viewportKey)}')">Reset view</button>
      </div>

      <div class="graph-legend" aria-label="Relationship types">
        ${relationshipTypes.map(type => `<span class="graph-legend__item graph-edge-type--${classToken(type)}">${escapeHtml(formatRelationshipLabel(type))}</span>`).join("")}
        ${graphModel.stubCount ? `<span class="graph-legend__item graph-legend__item--stub">stub Knowledge Object</span>` : ""}
        ${graphModel.missingCount ? `<span class="graph-legend__item graph-legend__item--missing">missing Knowledge Object</span>` : ""}
      </div>

      <div class="graph-canvas" role="group" aria-label="Knowledge graph visualization" data-graph-canvas onpointerdown="window.__startKnowledgeGraphPan?.(event)">
        <div class="graph-canvas__viewport" data-graph-viewport style="position:absolute; inset:0; transform-origin:0 0; ${viewportStyle(viewport)}">
          <svg class="graph-canvas__edges" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" role="img" aria-label="Knowledge object relationships">
            ${renderEdges(graphModel.edges, layout, graphModel.nodes)}
          </svg>
          <div class="graph-canvas__nodes">
            ${graphModel.nodes.map(node => renderNode(node, layout.get(node.id), { activeId })).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function registerScopeRenderer(renderState) {
  if (typeof window === "undefined") return;

  window.__renderKnowledgeGraphScope = nextScope => {
    const mount = document.querySelector(".graph-visualizer");
    if (!mount) return;
    mount.outerHTML = renderKnowledgeGraphVisualizer({ ...renderState, scope: nextScope });
  };

  window.__resetKnowledgeGraphLayout = layoutKey => {
    const layouts = readStoredLayouts();
    delete layouts[layoutKey];
    writeStoredLayouts(layouts);
    renderCurrentScope();
  };

  window.__resetKnowledgeGraphViewport = viewportKey => {
    const viewports = readStoredViewports();
    delete viewports[viewportKey];
    writeStoredViewports(viewports);
    renderCurrentScope();
  };

  window.__fitKnowledgeGraphViewport = viewportKey => {
    const canvas = document.querySelector(".graph-visualizer [data-graph-canvas]");
    if (!canvas || !viewportKey) return;

    const layout = readLayoutFromRenderedNodes(canvas);
    const next = getFittedViewport(layout, canvas.getBoundingClientRect());
    const viewports = readStoredViewports();
    viewports[viewportKey] = next;
    writeStoredViewports(viewports);
    applyViewportToCanvas(canvas, next);
  };

  window.__zoomKnowledgeGraphViewportByButton = (viewportKey, zoomFactor) => {
    const canvas = document.querySelector(".graph-visualizer [data-graph-canvas]");
    if (!canvas || !viewportKey) return;

    const viewports = readStoredViewports();
    const current = viewports[viewportKey] || getFittedViewport(readLayoutFromRenderedNodes(canvas), canvas.getBoundingClientRect());
    const rect = canvas.getBoundingClientRect();
    const center = { x: rect.width / 2, y: rect.height / 2 };
    const nextZoom = clamp(current.zoom * Number(zoomFactor || 1), 0.35, 3.5);
    const ratio = nextZoom / current.zoom;
    const next = {
      zoom: nextZoom,
      x: clamp(center.x - (center.x - current.x) * ratio, -1800, 1800),
      y: clamp(center.y - (center.y - current.y) * ratio, -1200, 1200)
    };

    viewports[viewportKey] = next;
    writeStoredViewports(viewports);
    applyViewportToCanvas(canvas, next);
  };

  window.__startKnowledgeGraphPan = event => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button[data-id]")) return;

    const canvas = event.currentTarget;
    const visualizer = canvas.closest(".graph-visualizer");
    const viewportKey = visualizer?.dataset.graphViewportKey;
    if (!viewportKey) return;

    const viewports = readStoredViewports();
    const current = viewports[viewportKey] || getFittedViewport(readLayoutFromRenderedNodes(canvas), canvas.getBoundingClientRect());
    const start = { x: event.clientX, y: event.clientY, viewportX: current.x, viewportY: current.y };
    let didPan = false;

    canvas.setPointerCapture?.(event.pointerId);
    canvas.classList.add("graph-canvas--panning");
    event.preventDefault();

    const move = moveEvent => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didPan = true;
      const next = {
        zoom: current.zoom,
        x: clamp(start.viewportX + dx, -1800, 1800),
        y: clamp(start.viewportY + dy, -1200, 1200)
      };
      viewports[viewportKey] = next;
      writeStoredViewports(viewports);
      applyViewportToCanvas(canvas, next);
    };

    const stop = stopEvent => {
      canvas.releasePointerCapture?.(event.pointerId);
      canvas.classList.remove("graph-canvas--panning");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      if (didPan) {
        window.__knowledgeGraphSuppressClickUntil = Date.now() + 250;
        stopEvent?.preventDefault?.();
        stopEvent?.stopPropagation?.();
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };

  window.__startKnowledgeGraphDrag = event => {
    const node = event.currentTarget;
    if (!node || node.disabled) return;
    if (event.button !== undefined && event.button !== 0) return;

    const visualizer = node.closest(".graph-visualizer");
    const canvas = node.closest("[data-graph-canvas]");
    const layoutKey = visualizer?.dataset.graphLayoutKey;
    const viewportKey = visualizer?.dataset.graphViewportKey;
    const nodeId = node.dataset.id;
    if (!canvas || !layoutKey || !viewportKey || !nodeId) return;

    const viewports = readStoredViewports();
    const viewport = viewports[viewportKey] || getFittedViewport(readLayoutFromRenderedNodes(canvas), canvas.getBoundingClientRect());
    viewports[viewportKey] = viewport;
    writeStoredViewports(viewports);

    const start = { x: event.clientX, y: event.clientY };
    const startX = Number(node.dataset.graphX || 0);
    const startY = Number(node.dataset.graphY || 0);
    let didDrag = false;

    node.setPointerCapture?.(event.pointerId);
    node.classList.add("graph-visual-node--dragging");
    event.preventDefault();
    event.stopPropagation();

    const move = moveEvent => {
      const rect = canvas.getBoundingClientRect();
      const dx = ((moveEvent.clientX - start.x) / rect.width) * VIEWBOX_WIDTH / viewport.zoom;
      const dy = ((moveEvent.clientY - start.y) / rect.height) * VIEWBOX_HEIGHT / viewport.zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      const next = {
        x: clamp(startX + dx, 40, VIEWBOX_WIDTH - 40),
        y: clamp(startY + dy, 34, VIEWBOX_HEIGHT - 34)
      };
      node.dataset.graphX = String(next.x);
      node.dataset.graphY = String(next.y);
      node.style.left = `${(next.x / VIEWBOX_WIDTH) * 100}%`;
      node.style.top = `${(next.y / VIEWBOX_HEIGHT) * 100}%`;
    };

    const stop = stopEvent => {
      node.releasePointerCapture?.(event.pointerId);
      node.classList.remove("graph-visual-node--dragging");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);

      if (didDrag) {
        const layouts = readStoredLayouts();
        layouts[layoutKey] ||= {};
        layouts[layoutKey][nodeId] = {
          x: Number(node.dataset.graphX || startX),
          y: Number(node.dataset.graphY || startY)
        };
        writeStoredLayouts(layouts);
        const latestViewports = readStoredViewports();
        latestViewports[viewportKey] ||= viewport;
        writeStoredViewports(latestViewports);
        window.__knowledgeGraphSuppressClickUntil = Date.now() + 450;
        stopEvent?.preventDefault?.();
        stopEvent?.stopPropagation?.();
        renderCurrentScope();
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };
}

function renderCurrentScope() {
  const scope = document.querySelector(".graph-scope-button.active")?.dataset.graphScope || getGraphScope();
  window.__renderKnowledgeGraphScope?.(scope);
}

function applyViewportToCanvas(canvas, viewport) {
  const target = canvas.querySelector("[data-graph-viewport]");
  if (!target) return;
  target.style.transform = viewportTransform(viewport);
}

function viewportStyle(viewport) {
  return `transform:${viewportTransform(viewport)};`;
}

function viewportTransform(viewport) {
  const next = normalizeViewport(viewport);
  return `translate(${next.x}px, ${next.y}px) scale(${next.zoom})`;
}

function normalizeViewport(viewport) {
  return {
    x: clamp(Number(viewport?.x ?? 0), -2200, 2200),
    y: clamp(Number(viewport?.y ?? 0), -1600, 1600),
    zoom: clamp(Number(viewport?.zoom ?? 1), 0.35, 3.5)
  };
}

function getFittedViewport(layout, rect = null) {
  const bounds = getLayoutBounds(layout);
  if (!bounds) return { ...DEFAULT_VIEWPORT };

  const width = Number(rect?.width) || VIEWBOX_WIDTH;
  const height = Number(rect?.height) || VIEWBOX_HEIGHT;
  const scaleX = width / VIEWBOX_WIDTH;
  const scaleY = height / VIEWBOX_HEIGHT;
  const minX = Math.max(0, bounds.minX - FIT_NODE_MARGIN_X) * scaleX;
  const maxX = Math.min(VIEWBOX_WIDTH, bounds.maxX + FIT_NODE_MARGIN_X) * scaleX;
  const minY = Math.max(0, bounds.minY - FIT_NODE_MARGIN_Y) * scaleY;
  const maxY = Math.min(VIEWBOX_HEIGHT, bounds.maxY + FIT_NODE_MARGIN_Y) * scaleY;
  const graphWidth = Math.max(1, maxX - minX);
  const graphHeight = Math.max(1, maxY - minY);
  const zoom = clamp(
    Math.min((width - FIT_VIEW_PADDING * 2) / graphWidth, (height - FIT_VIEW_PADDING * 2) / graphHeight),
    MIN_AUTO_FIT_ZOOM,
    MAX_AUTO_FIT_ZOOM
  );

  return normalizeViewport({
    zoom,
    x: (width - (minX + maxX) * zoom) / 2,
    y: (height - (minY + maxY) * zoom) / 2
  });
}

function getLayoutBounds(layout) {
  const points = [...layout.values()].filter(point => Number.isFinite(point?.x) && Number.isFinite(point?.y));
  if (!points.length) return null;

  return {
    minX: Math.min(...points.map(point => point.x)),
    maxX: Math.max(...points.map(point => point.x)),
    minY: Math.min(...points.map(point => point.y)),
    maxY: Math.max(...points.map(point => point.y))
  };
}

function readLayoutFromRenderedNodes(root) {
  const layout = new Map();
  root.querySelectorAll("[data-graph-x][data-graph-y]").forEach(node => {
    const id = node.dataset.id || node.getAttribute("title");
    if (!id) return;
    layout.set(id, {
      x: Number(node.dataset.graphX),
      y: Number(node.dataset.graphY)
    });
  });
  return layout;
}

function readStoredLayouts() {
  try {
    return JSON.parse(window.localStorage.getItem(GRAPH_LAYOUT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStoredLayouts(layouts) {
  try {
    window.localStorage.setItem(GRAPH_LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  } catch {
    // Ignore localStorage failures.
  }
}

function readStoredViewports() {
  try {
    return JSON.parse(window.localStorage.getItem(GRAPH_VIEWPORT_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeStoredViewports(viewports) {
  try {
    window.localStorage.setItem(GRAPH_VIEWPORT_STORAGE_KEY, JSON.stringify(viewports));
  } catch {
    // Ignore localStorage failures.
  }
}

function graphLayoutKey({ activeId, scope }) {
  return `${scope}:${activeId || "all"}`;
}

function graphViewportKey({ activeId, scope }) {
  return `${scope}:${activeId || "all"}`;
}

function applySavedLayout(layout, layoutKey) {
  if (typeof window === "undefined") return layout;
  const saved = readStoredLayouts()[layoutKey] || {};
  for (const [nodeId, point] of Object.entries(saved)) {
    if (!layout.has(nodeId)) continue;
    layout.set(nodeId, {
      x: clamp(Number(point.x), 40, VIEWBOX_WIDTH - 40),
      y: clamp(Number(point.y), 34, VIEWBOX_HEIGHT - 34)
    });
  }
  return layout;
}

function buildVisibleGraphModel({ nodeMap, edges, activeId, scope }) {
  const resolvedNodeMap = new Map(nodeMap);
  const candidateIds = new Set();
  const candidateEdges = [];

  if (activeId) {
    candidateIds.add(activeId);
    for (const edge of edges) {
      if (edge.sourceId === activeId || edge.targetId === activeId) {
        candidateIds.add(edge.sourceId);
        candidateIds.add(edge.targetId);
        candidateEdges.push(edge);
      }
    }

    if (scope === "expanded") {
      const directIds = new Set(candidateIds);
      for (const edge of edges) {
        if (directIds.has(edge.sourceId) || directIds.has(edge.targetId)) {
          candidateIds.add(edge.sourceId);
          candidateIds.add(edge.targetId);
          candidateEdges.push(edge);
        }
      }
    }
  } else {
    for (const id of resolvedNodeMap.keys()) candidateIds.add(id);
    candidateEdges.push(...edges);
  }

  for (const edge of candidateEdges) {
    ensureNode(resolvedNodeMap, edge.sourceId, "source");
    ensureNode(resolvedNodeMap, edge.targetId, "target");
  }

  const activeNodes = [...candidateIds]
    .map(id => resolvedNodeMap.get(id))
    .filter(Boolean);
  const fallbackNodes = activeId ? [] : [...resolvedNodeMap.values()].filter(node => !candidateIds.has(node.id) && !node.missing);
  const nodes = [...activeNodes, ...fallbackNodes].slice(0, MAX_VISIBLE_NODES);
  const visibleIds = new Set(nodes.map(node => node.id));
  const visibleEdges = uniqueEdges(candidateEdges).filter(edge => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId));

  return {
    nodes,
    edges: visibleEdges,
    missingCount: nodes.filter(node => node.missing).length,
    stubCount: nodes.filter(node => node.status === "stub").length
  };
}

function normalizeExistingNode(node) {
  return {
    ...node,
    title: node.title || node.id,
    type: node.type || "concept",
    status: node.status || "draft",
    domains: node.domains || [],
    missing: false
  };
}

function ensureNode(nodeMap, id, role) {
  if (!id || nodeMap.has(id)) return;
  nodeMap.set(id, {
    id,
    title: id,
    type: "missing",
    status: "missing",
    domains: [role === "source" ? "missing source" : "missing target"],
    missing: true
  });
}

function layoutNodes({ nodes, edges, activeId }) {
  const layout = new Map();
  if (!nodes.length) return layout;

  const activeNode = nodes.find(node => node.id === activeId) || null;
  const neighborIds = new Set();
  if (activeId) {
    for (const edge of edges) {
      if (edge.sourceId === activeId) neighborIds.add(edge.targetId);
      if (edge.targetId === activeId) neighborIds.add(edge.sourceId);
    }
  }

  if (activeNode) layout.set(activeNode.id, CENTER);

  const neighbors = nodes.filter(node => node.id !== activeId && neighborIds.has(node.id));
  const context = nodes.filter(node => node.id !== activeId && !neighborIds.has(node.id));

  if (activeNode) {
    distributeAroundEllipse(layout, neighbors, 275, 165, -92);
    distributeAroundEllipse(layout, context, 405, 245, -70);
  } else {
    distributeAroundEllipse(layout, nodes, 330, 210, -86);
  }

  if (!activeNode && nodes.length === 1) layout.set(nodes[0].id, CENTER);
  relaxLayout(layout, nodes, activeNode?.id || null);
  return layout;
}

function distributeAroundEllipse(layout, nodes, radiusX, radiusY, startDegrees) {
  if (!nodes.length) return;
  const step = 360 / nodes.length;

  nodes.forEach((node, index) => {
    const angle = ((startDegrees + index * step) * Math.PI) / 180;
    layout.set(node.id, {
      x: CENTER.x + Math.cos(angle) * radiusX,
      y: CENTER.y + Math.sin(angle) * radiusY
    });
  });
}

function relaxLayout(layout, nodes, fixedId = null) {
  for (let pass = 0; pass < LAYOUT_RELAXATION_PASSES; pass += 1) {
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const leftNode = nodes[leftIndex];
        const rightNode = nodes[rightIndex];
        const left = layout.get(leftNode.id);
        const right = layout.get(rightNode.id);
        if (!left || !right) continue;

        const leftSize = getNodeCardSize(leftNode);
        const rightSize = getNodeCardSize(rightNode);
        const minX = (leftSize.width + rightSize.width) / 2 + NODE_COLLISION_PADDING_X;
        const minY = (leftSize.height + rightSize.height) / 2 + NODE_COLLISION_PADDING_Y;
        const dx = right.x - left.x || 0.01;
        const dy = right.y - left.y || 0.01;
        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;

        const moveX = Math.sign(dx) * overlapX * 0.28;
        const moveY = Math.sign(dy) * overlapY * 0.28;
        const leftLocked = leftNode.id === fixedId;
        const rightLocked = rightNode.id === fixedId;

        if (!leftLocked) {
          left.x = clamp(left.x - moveX, 60, VIEWBOX_WIDTH - 60);
          left.y = clamp(left.y - moveY, 50, VIEWBOX_HEIGHT - 50);
        }
        if (!rightLocked) {
          right.x = clamp(right.x + moveX, 60, VIEWBOX_WIDTH - 60);
          right.y = clamp(right.y + moveY, 50, VIEWBOX_HEIGHT - 50);
        }
      }
    }
  }
}

function renderEdges(edges, layout, nodes = []) {
  const nodeLookup = new Map(nodes.map(node => [node.id, node]));

  return edges.map(edge => {
    const sourceCenter = layout.get(edge.sourceId);
    const targetCenter = layout.get(edge.targetId);
    if (!sourceCenter || !targetCenter) return "";

    const type = edge.type || "related";
    const line = getClippedEdgeLine({
      sourceCenter,
      targetCenter,
      sourceNode: nodeLookup.get(edge.sourceId),
      targetNode: nodeLookup.get(edge.targetId)
    });

    return `
      <g class="graph-edge graph-edge-type--${classToken(type)}">
        <line x1="${line.source.x}" y1="${line.source.y}" x2="${line.target.x}" y2="${line.target.y}"></line>
      </g>
    `;
  }).join("");
}

function getClippedEdgeLine({ sourceCenter, targetCenter, sourceNode, targetNode }) {
  return {
    source: getNodeBoundaryPoint(sourceCenter, targetCenter, getNodeCardSize(sourceNode)),
    target: getNodeBoundaryPoint(targetCenter, sourceCenter, getNodeCardSize(targetNode))
  };
}

function getNodeBoundaryPoint(from, toward, size) {
  const dx = toward.x - from.x;
  const dy = toward.y - from.y;
  const length = Math.hypot(dx, dy);
  if (!length) return from;

  const halfWidth = size.width / 2;
  const halfHeight = size.height / 2;
  const xScale = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const yScale = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const boundaryScale = Math.min(xScale, yScale);
  const gapScale = NODE_EDGE_GAP / length;
  const scale = Math.min(0.98, boundaryScale + gapScale);

  return {
    x: from.x + dx * scale,
    y: from.y + dy * scale
  };
}

function getNodeCardSize(node) {
  const title = String(node?.title || node?.id || "");
  const hasWrappedTitle = title.length > 22 || title.includes(" ");
  return {
    width: NODE_CARD_WIDTH,
    height: hasWrappedTitle ? NODE_CARD_TALL_HEIGHT : NODE_CARD_HEIGHT
  };
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function renderNode(node, point, { activeId }) {
  if (!point) return "";
  const primaryDomain = node.status === "stub" ? "stub" : node.domains?.[0] || node.type || "concept";
  const style = `left: ${(point.x / VIEWBOX_WIDTH) * 100}%; top: ${(point.y / VIEWBOX_HEIGHT) * 100}%;`;
  const classes = [
    "graph-visual-node",
    node.id === activeId ? "graph-visual-node--active" : "",
    node.missing ? "graph-visual-node--missing" : "",
    node.status === "stub" ? "graph-visual-node--stub" : ""
  ].filter(Boolean).join(" ");
  const disabled = node.missing ? "disabled" : `data-id="${escapeHtml(node.id)}"`;

  return `
    <button class="${classes}" ${disabled} style="${style}" type="button" title="${escapeHtml(node.id)}" data-graph-x="${escapeHtml(point.x)}" data-graph-y="${escapeHtml(point.y)}" onpointerdown="window.__startKnowledgeGraphDrag?.(event)">
      <strong>${escapeHtml(node.title || node.id)}</strong>
      <span>${escapeHtml(primaryDomain)}</span>
    </button>
  `;
}

function getScopeDescription(scope) {
  if (scope === "expanded") {
    return "Expanded view: drag empty space to pan, use Zoom in/out, drag nodes to clean up overlap, and use Fit view to recenter the current graph.";
  }
  return "Focused view: drag empty space to pan, use Zoom in/out, drag nodes to clean up overlap, and use Fit view to recenter the current graph.";
}

function formatRelationshipLabel(type) {
  const key = String(type || "related");
  return RELATIONSHIP_LABELS[key] || key.replaceAll("_", " ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueEdges(edges) {
  const seen = new Set();
  return edges.filter(edge => {
    const key = edge.id || `${edge.sourceId}::${edge.type}::${edge.targetId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function capitalize(value) {
  const text = String(value || "");
  return `${text.slice(0, 1).toUpperCase()}${text.slice(1)}`;
}

function classToken(value) {
  return String(value || "related")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "related";
}

function escapeAttribute(value) {
  return String(value ?? "").replaceAll("\\", "\\\\").replaceAll("'", "\\'").replaceAll("\n", " ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
