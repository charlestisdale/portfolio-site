import { renderKnowledgeGraphVisualizer } from "./graph-visualizer.js";

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

export function renderGraphMode({ activeConcept = null, edges = [], stats = {}, graph = null } = {}) {
  const nodes = graph?.nodes || [];
  const missing = stats.missingRelationshipTargets || [];

  return `
    <section class="graph-mode card">
      <header class="graph-hero">
        <div>
          <p class="eyebrow">Knowledge Graph</p>
          <h2>${escapeHtml(activeConcept?.title || "Graph Explorer")}</h2>
          <p class="muted">Explore how concepts connect through reusable typed relationship edges.</p>
        </div>
        <div class="graph-summary-grid">
          <article><strong>${escapeHtml(nodes.length)}</strong><span>Nodes</span></article>
          <article><strong>${escapeHtml(stats.relationships || 0)}</strong><span>Edges</span></article>
          <article><strong>${escapeHtml(edges.length)}</strong><span>Active links</span></article>
          <article><strong>${escapeHtml(missing.length)}</strong><span>Missing targets</span></article>
        </div>
      </header>

      ${renderKnowledgeGraphVisualizer({ graph, activeConcept, activeEdges: edges })}
      ${activeConcept ? renderActiveConcept(activeConcept, edges) : renderEmptyState(nodes)}
      ${missing.length ? renderMissingTargets(missing) : ""}
    </section>
  `;
}

function renderActiveConcept(concept, edges) {
  return `
    <section class="graph-layout">
      <article class="graph-node-card graph-node-card--active">
        <span class="pill">${escapeHtml(concept.status === "stub" ? "stub" : concept.type || "concept")}</span>
        <h3>${escapeHtml(concept.title)}</h3>
        <p>${escapeHtml(concept.learning?.summary || "No summary available yet.")}</p>
        <div class="tag-list">
          ${(concept.domains || []).map(domain => `<span class="pill">${escapeHtml(domain)}</span>`).join("")}
        </div>
      </article>

      <section class="graph-edge-list">
        <h3>Connected concepts</h3>
        ${edges.length ? edges.map(renderEdge).join("") : `<p class="muted">No graph relationships yet for this concept.</p>`}
      </section>
    </section>
  `;
}

function renderEdge(edge) {
  const neighbor = edge.directionFromSource === "outbound" ? edge.target : edge.source;
  const missing = edge.directionFromSource === "outbound" ? edge.targetId : edge.sourceId;
  const directionLabel = edge.directionFromSource === "outbound" ? "Points to" : "Referenced by";

  return `
    <button class="graph-edge-card" ${neighbor ? `data-id="${escapeHtml(neighbor.id)}"` : "disabled"}>
      <span class="pill">${escapeHtml(formatRelationshipLabel(edge.type || "related"))}</span>
      <strong>${escapeHtml(neighbor?.title || missing)}</strong>
      <small>${escapeHtml(directionLabel)} · ${escapeHtml(edge.strength || "unrated")}</small>
      ${edge.notes ? `<p>${escapeHtml(edge.notes)}</p>` : ""}
    </button>
  `;
}

function renderEmptyState(nodes) {
  return `
    <section class="graph-empty compact-empty">
      <h3>Select a concept</h3>
      <p class="muted">Choose a concept from Learn or Search mode to inspect its relationships here.</p>
      ${nodes.length ? `<p>${escapeHtml(nodes.length)} graph node${nodes.length === 1 ? "" : "s"} loaded.</p>` : ""}
    </section>
  `;
}

function renderMissingTargets(missing) {
  return `
    <section class="graph-missing compact-empty">
      <h3>Missing relationship targets</h3>
      <p class="muted">These edges point to planned concepts that do not exist as knowledge objects yet.</p>
      <ul>
        ${missing.map(item => `<li><code>${escapeHtml(item.id)}</code> <span class="muted">${escapeHtml(item.role)} in ${escapeHtml(item.edgeId)}</span></li>`).join("")}
      </ul>
    </section>
  `;
}

function formatRelationshipLabel(type) {
  const key = String(type || "related");
  return RELATIONSHIP_LABELS[key] || key.replaceAll("_", " ");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
