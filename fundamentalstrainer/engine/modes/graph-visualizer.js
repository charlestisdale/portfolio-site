const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 420;
const CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
const MAX_VISIBLE_NODES = 42;

export function renderKnowledgeGraphVisualizer({ graph = null, activeConcept = null, activeEdges = [] } = {}) {
  const sourceNodes = graph?.nodes || [];
  const sourceEdges = graph?.edges || [];
  const nodeMap = new Map(sourceNodes.map(node => [node.id, normalizeExistingNode(node)]));
  const activeId = activeConcept?.id || null;
  const graphModel = buildVisibleGraphModel({ nodeMap, edges: sourceEdges, activeId });
  const layout = layoutNodes({ nodes: graphModel.nodes, edges: graphModel.edges, activeId });
  const relationshipTypes = unique(sourceEdges.map(edge => edge.type || "related_to")).sort();

  if (!sourceNodes.length) {
    return `
      <section class="graph-visualizer graph-visualizer--empty">
        <h3>Interactive graph</h3>
        <p class="muted">No graph nodes are loaded yet.</p>
      </section>
    `;
  }

  return `
    <section class="graph-visualizer" aria-label="Interactive knowledge graph">
      <header class="graph-visualizer__header">
        <div>
          <h3>Interactive graph</h3>
          <p class="muted">Click a node to focus that Knowledge Object. Dashed nodes are missing relationship targets that need content created or relationships fixed.</p>
        </div>
        <div class="graph-visualizer__tools" aria-label="Graph summary">
          <span class="pill">${escapeHtml(graphModel.nodes.length)} visible nodes</span>
          <span class="pill">${escapeHtml(graphModel.edges.length)} visible edges</span>
          ${activeId ? `<span class="pill">${escapeHtml(activeEdges.length)} active links</span>` : ""}
          ${graphModel.missingCount ? `<span class="pill">${escapeHtml(graphModel.missingCount)} missing nodes</span>` : ""}
        </div>
      </header>

      <div class="graph-legend" aria-label="Relationship types">
        ${relationshipTypes.map(type => `<span class="graph-legend__item graph-edge-type--${classToken(type)}">${escapeHtml(type)}</span>`).join("")}
        ${graphModel.missingCount ? `<span class="graph-legend__item graph-legend__item--missing">missing target</span>` : ""}
      </div>

      <div class="graph-canvas" role="group" aria-label="Knowledge graph visualization">
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

function buildVisibleGraphModel({ nodeMap, edges, activeId }) {
  const resolvedNodeMap = new Map(nodeMap);
  const candidateIds = new Set();

  if (activeId) {
    candidateIds.add(activeId);
    for (const edge of edges) {
      if (edge.sourceId === activeId) candidateIds.add(edge.targetId);
      if (edge.targetId === activeId) candidateIds.add(edge.sourceId);
    }
  } else {
    for (const id of resolvedNodeMap.keys()) candidateIds.add(id);
  }

  for (const edge of edges) {
    if (candidateIds.has(edge.sourceId)) ensureNode(resolvedNodeMap, edge.sourceId, "source");
    if (candidateIds.has(edge.targetId)) ensureNode(resolvedNodeMap, edge.targetId, "target");
  }

  const existing = [...candidateIds]
    .map(id => resolvedNodeMap.get(id))
    .filter(Boolean);
  const remaining = [...resolvedNodeMap.values()].filter(node => !candidateIds.has(node.id) && !node.missing);
  const nodes = [...existing, ...remaining].slice(0, MAX_VISIBLE_NODES);
  const visibleIds = new Set(nodes.map(node => node.id));
  const visibleEdges = edges.filter(edge => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId));

  return {
    nodes,
    edges: visibleEdges,
    missingCount: nodes.filter(node => node.missing).length
  };
}

function normalizeExistingNode(node) {
  return {
    ...node,
    title: node.title || node.id,
    type: node.type || "concept",
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
  return edges.map(edge => {
    const source = layout.get(edge.sourceId);
    const target = layout.get(edge.targetId);
    if (!source || !target) return "";
    const type = edge.type || "related_to";
    const midpoint = {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2
    };

    return `
      <g class="graph-edge graph-edge-type--${classToken(type)}">
        <line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}"></line>
        <text x="${midpoint.x}" y="${midpoint.y}">${escapeHtml(type)}</text>
      </g>
    `;
  }).join("");
}

function renderNode(node, point, { activeId }) {
  if (!point) return "";
  const primaryDomain = node.domains?.[0] || node.type || "concept";
  const style = `left: ${(point.x / VIEWBOX_WIDTH) * 100}%; top: ${(point.y / VIEWBOX_HEIGHT) * 100}%;`;
  const classes = [
    "graph-visual-node",
    node.id === activeId ? "graph-visual-node--active" : "",
    node.missing ? "graph-visual-node--missing" : ""
  ].filter(Boolean).join(" ");
  const disabled = node.missing ? "disabled" : `data-id="${escapeHtml(node.id)}"`;

  return `
    <button class="${classes}" ${disabled} style="${style}" type="button" title="${escapeHtml(node.id)}">
      <strong>${escapeHtml(node.title || node.id)}</strong>
      <span>${escapeHtml(primaryDomain)}</span>
    </button>
  `;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
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
