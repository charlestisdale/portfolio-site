import { getGraphScope } from "./graph-scope.js";

const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 420;
const CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
const MAX_VISIBLE_NODES = 42;
const GRAPH_SCOPES = ["focused", "expanded"];
const GRAPH_LAYOUT_STORAGE_KEY = "it-learning-platform.graph-layout.v1";

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
  const nodeMap = new Map(sourceNodes.map(node => [node.id, normalizeExistingNode(node)]));
  const graphModel = buildVisibleGraphModel({ nodeMap, edges: sourceEdges, activeId, scope: graphScope });
  const layout = applySavedLayout(layoutNodes({ nodes: graphModel.nodes, edges: graphModel.edges, activeId }), layoutKey);
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
    <section class="graph-visualizer" aria-label="Interactive knowledge graph" data-graph-layout-key="${escapeHtml(layoutKey)}">
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
        <button class="graph-scope-button" data-graph-reset-layout="${escapeHtml(layoutKey)}" type="button">Reset layout</button>
      </div>

      <div class="graph-legend" aria-label="Relationship types">
        ${relationshipTypes.map(type => `<span class="graph-legend__item graph-edge-type--${classToken(type)}">${escapeHtml(formatRelationshipLabel(type))}</span>`).join("")}
        ${graphModel.stubCount ? `<span class="graph-legend__item graph-legend__item--stub">stub Knowledge Object</span>` : ""}
        ${graphModel.missingCount ? `<span class="graph-legend__item graph-legend__item--missing">missing Knowledge Object</span>` : ""}
      </div>

      <div class="graph-canvas" role="group" aria-label="Knowledge graph visualization" data-graph-canvas>
        <svg class="graph-canvas__edges" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" role="img" aria-label="Knowledge object relationships">
          ${renderEdges(graphModel.edges, layout)}
        </svg>
        <div class="graph-canvas__nodes">
          ${graphModel.nodes.map(node => renderNode(node, layout.get(node.id), { activeId })).join("")}
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
    const scope = document.querySelector(".graph-scope-button.active")?.dataset.graphScope || getGraphScope();
    window.__renderKnowledgeGraphScope(scope);
  };

  window.__startKnowledgeGraphDrag = event => {
    const node = event.currentTarget;
    if (!node || node.disabled) return;
    if (event.button !== undefined && event.button !== 0) return;

    const visualizer = node.closest(".graph-visualizer");
    const canvas = node.closest("[data-graph-canvas]");
    const layoutKey = visualizer?.dataset.graphLayoutKey;
    const nodeId = node.dataset.id;
    if (!canvas || !layoutKey || !nodeId) return;

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
      const dx = ((moveEvent.clientX - start.x) / rect.width) * VIEWBOX_WIDTH;
      const dy = ((moveEvent.clientY - start.y) / rect.height) * VIEWBOX_HEIGHT;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;
      const next = {
        x: clamp(startX + dx, 30, VIEWBOX_WIDTH - 30),
        y: clamp(startY + dy, 24, VIEWBOX_HEIGHT - 24)
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
        window.__knowledgeGraphSuppressClickUntil = Date.now() + 450;
        stopEvent?.preventDefault?.();
        stopEvent?.stopPropagation?.();
        const scope = document.querySelector(".graph-scope-button.active")?.dataset.graphScope || getGraphScope();
        window.__renderKnowledgeGraphScope(scope);
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
    window.addEventListener("pointercancel", stop, { once: true });
  };
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
    // Ignore localStorage failures. Dragging should still work for the current session.
  }
}

function graphLayoutKey({ activeId, scope }) {
  return `${scope}:${activeId || "all"}`;
}

function applySavedLayout(layout, layoutKey) {
  if (typeof window === "undefined") return layout;
  const saved = readStoredLayouts()[layoutKey] || {};
  for (const [nodeId, point] of Object.entries(saved)) {
    if (!layout.has(nodeId)) continue;
    layout.set(nodeId, {
      x: clamp(Number(point.x), 30, VIEWBOX_WIDTH - 30),
      y: clamp(Number(point.y), 24, VIEWBOX_HEIGHT - 24)
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

  distributeAround(layout, neighbors, activeNode ? 135 : 155, -90);
  distributeAround(layout, context, activeNode ? 225 : 155, -72);

  if (!activeNode && nodes.length === 1) layout.set(nodes[0].id, CENTER);
  return layout;
}

function distributeAround(layout, nodes, radius, startDegrees) {
  if (!nodes.length) return;
  const step = 360 / nodes.length;

  nodes.forEach((node, index) => {
    const angle = ((startDegrees + index * step) * Math.PI) / 180;
    layout.set(node.id, {
      x: CENTER.x + Math.cos(angle) * radius,
      y: CENTER.y + Math.sin(angle) * radius
    });
  });
}

function renderEdges(edges, layout) {
  return edges.map((edge, index) => {
    const source = layout.get(edge.sourceId);
    const target = layout.get(edge.targetId);
    if (!source || !target) return "";
    const type = edge.type || "related";
    const label = formatRelationshipLabel(type);
    const labelPosition = getEdgeLabelPosition(source, target, index);
    const labelWidth = estimateLabelWidth(label);

    return `
      <g class="graph-edge graph-edge-type--${classToken(type)}">
        <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"></line>
        <g class="graph-edge-label">
          <rect x="${labelPosition.x - labelWidth / 2}" y="${labelPosition.y - 12}" width="${labelWidth}" height="18" rx="9"></rect>
          <text x="${labelPosition.x}" y="${labelPosition.y}">${escapeHtml(label)}</text>
        </g>
      </g>
    `;
  }).join("");
}

function getEdgeLabelPosition(source, target, index = 0) {
  const midpoint = {
    x: (source.x + target.x) / 2,
    y: (source.y + target.y) / 2
  };
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy) || 1;
  const perpendicular = {
    x: -dy / length,
    y: dx / length
  };
  const direction = index % 2 === 0 ? 1 : -1;
  const verticalBias = Math.abs(dx) < 24 ? -20 : 0;

  return {
    x: clamp(midpoint.x + perpendicular.x * 32 * direction, 52, VIEWBOX_WIDTH - 52),
    y: clamp(midpoint.y + perpendicular.y * 32 * direction + verticalBias, 30, VIEWBOX_HEIGHT - 30)
  };
}

function estimateLabelWidth(label) {
  return Math.max(44, Math.min(170, String(label).length * 7.2 + 18));
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
    return "Expanded view: drag nodes to clean up overlap. Reset layout restores the generated view.";
  }
  return "Focused view: drag nodes to clean up overlap. Stub nodes mark referenced concepts that still need full discovery.";
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
