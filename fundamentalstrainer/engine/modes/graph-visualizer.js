const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 460;
const CENTER = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT / 2 };
const MAX_VISIBLE_NODES = 42;

export function renderKnowledgeGraphVisualizer({ graph = null, activeConcept = null, activeEdges = [] } = {}) {
  const nodes = graph?.nodes || [];
  const edges = graph?.edges || [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const activeId = activeConcept?.id || null;
  const visibleNodes = selectVisibleNodes({ nodes, edges, activeId });
  const visibleIds = new Set(visibleNodes.map(node => node.id));
  const visibleEdges = edges.filter(edge => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId));
  const layout = layoutNodes({ nodes: visibleNodes, edges: visibleEdges, activeId });
  const relationshipTypes = unique(edges.map(edge => edge.type || "related_to")).sort();

  if (!nodes.length) {
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
          <p class="muted">Click a node to focus that Knowledge Object. The active concept stays centered and its neighbors are pulled closer.</p>
        </div>
        <div class="graph-visualizer__tools" aria-label="Graph summary">
          <span class="pill">${escapeHtml(visibleNodes.length)} visible nodes</span>
          <span class="pill">${escapeHtml(visibleEdges.length)} visible edges</span>
          ${activeId ? `<span class="pill">${escapeHtml(activeEdges.length)} active links</span>` : ""}
        </div>
      </header>

      <div class="graph-legend" aria-label="Relationship types">
        ${relationshipTypes.map(type => `<span class="graph-legend__item graph-edge-type--${classToken(type)}">${escapeHtml(type)}</span>`).join("")}
      </div>

      <div class="graph-canvas" role="group" aria-label="Knowledge graph visualization">
        <svg class="graph-canvas__edges" viewBox="0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}" role="img" aria-label="Knowledge object relationships">
          ${renderEdges(visibleEdges, layout)}
        </svg>
        <div class="graph-canvas__nodes">
          ${visibleNodes.map(node => renderNode(node, layout.get(node.id), { activeId, nodeMap })).join("")}
        </div>
      </div>
    </section>
  `;
}

function selectVisibleNodes({ nodes, edges, activeId }) {
  if (!activeId) return nodes.slice(0, MAX_VISIBLE_NODES);

  const connectedIds = new Set([activeId]);
  for (const edge of edges) {
    if (edge.sourceId === activeId) connectedIds.add(edge.targetId);
    if (edge.targetId === activeId) connectedIds.add(edge.sourceId);
  }

  const connected = nodes.filter(node => connectedIds.has(node.id));
  const remaining = nodes.filter(node => !connectedIds.has(node.id));
  return [...connected, ...remaining].slice(0, MAX_VISIBLE_NODES);
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

  distributeAround(layout, neighbors, activeNode ? 150 : 180, activeNode ? -90 : -90);
  distributeAround(layout, context, activeNode ? 250 : 180, activeNode ? -72 : -90);

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

function renderNode(node, point, { activeId, nodeMap }) {
  if (!point) return "";
  const primaryDomain = node.domains?.[0] || node.type || "concept";
  const nodeExists = nodeMap.has(node.id);
  const style = `left: ${(point.x / VIEWBOX_WIDTH) * 100}%; top: ${(point.y / VIEWBOX_HEIGHT) * 100}%;`;
  const classes = [
    "graph-visual-node",
    node.id === activeId ? "graph-visual-node--active" : "",
    nodeExists ? "" : "graph-visual-node--missing"
  ].filter(Boolean).join(" ");

  return `
    <button class="${classes}" data-id="${escapeHtml(node.id)}" style="${style}" type="button">
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
