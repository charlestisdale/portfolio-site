const MAX_CENTER_ATTEMPTS = 8;
const GRAPH_EXPANDED_CLASS = "graph-workspace-expanded";

function centerActiveGraphNode(attempt = 1) {
  window.requestAnimationFrame(() => {
    const visualizer = document.querySelector(".graph-visualizer");
    const viewportKey = visualizer?.dataset.graphViewportKey;
    const activeNode = visualizer?.querySelector(".graph-visual-node--active[data-id]");

    if (viewportKey && activeNode?.dataset.id && typeof window.__centerKnowledgeGraphNode === "function") {
      window.__centerKnowledgeGraphNode(viewportKey, activeNode.dataset.id);
      return;
    }

    if (attempt < MAX_CENTER_ATTEMPTS) {
      window.setTimeout(() => centerActiveGraphNode(attempt + 1), 35);
    }
  });
}

function scheduleCenterActiveGraphNode() {
  window.setTimeout(() => centerActiveGraphNode(), 0);
}

function fitGraphViewFromResetButton(resetButton) {
  const visualizer = resetButton.closest(".graph-visualizer");
  const viewportKey = visualizer?.dataset.graphViewportKey;
  if (!viewportKey || typeof window.__fitKnowledgeGraphViewport !== "function") return false;

  window.__fitKnowledgeGraphViewport(viewportKey);
  return true;
}

function normalizeGraphCenterControls() {
  const visualizer = document.querySelector(".graph-visualizer");
  if (!visualizer) return;

  visualizer.querySelectorAll("button[onclick]").forEach(button => {
    const action = button.getAttribute("onclick") || "";

    if (action.includes("__centerKnowledgeGraphSearch")) {
      button.remove();
      return;
    }

    if (action.includes("__centerKnowledgeGraphNode")) {
      button.textContent = "Center";
      button.setAttribute("aria-label", "Center active graph node");
    }
  });

  ensureGraphExpandButton(visualizer);
  updateGraphExpandButtonLabel();
}

function ensureGraphExpandButton(visualizer) {
  const toolbar = visualizer.querySelector(".graph-scope-toggle");
  if (!toolbar || toolbar.querySelector("[data-graph-expand-toggle]")) return;

  const button = document.createElement("button");
  button.className = "graph-scope-button graph-expand-toggle";
  button.type = "button";
  button.dataset.graphExpandToggle = "true";
  button.textContent = document.body.classList.contains(GRAPH_EXPANDED_CLASS) ? "Exit expanded graph" : "Expand graph";
  toolbar.appendChild(button);
}

function updateGraphExpandButtonLabel() {
  const expanded = document.body.classList.contains(GRAPH_EXPANDED_CLASS);
  document.querySelectorAll("[data-graph-expand-toggle]").forEach(button => {
    button.textContent = expanded ? "Exit expanded graph" : "Expand graph";
    button.setAttribute("aria-pressed", String(expanded));
  });
}

function toggleExpandedGraph(force = null) {
  const next = force === null ? !document.body.classList.contains(GRAPH_EXPANDED_CLASS) : Boolean(force);
  document.body.classList.toggle(GRAPH_EXPANDED_CLASS, next);
  updateGraphExpandButtonLabel();
  window.setTimeout(() => centerActiveGraphNode(), 60);
}

function scheduleNormalizeGraphControls() {
  window.requestAnimationFrame(() => {
    normalizeGraphCenterControls();
    window.setTimeout(normalizeGraphCenterControls, 50);
    window.setTimeout(normalizeGraphCenterControls, 150);
  });
}

document.addEventListener("click", event => {
  const resetViewButton = event.target.closest("button[onclick*='__resetKnowledgeGraphViewport']");
  if (resetViewButton && fitGraphViewFromResetButton(resetViewButton)) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return;
  }

  const expandButton = event.target.closest("[data-graph-expand-toggle]");
  if (expandButton) {
    toggleExpandedGraph();
    return;
  }

  const graphRoot = event.target.closest("#relatedView");
  if (!graphRoot) return;

  const graphNavigationButton = event.target.closest("button[data-id]");
  if (!graphNavigationButton) return;

  scheduleCenterActiveGraphNode();
  scheduleNormalizeGraphControls();
}, true);

window.addEventListener("DOMContentLoaded", scheduleNormalizeGraphControls);
window.addEventListener("load", scheduleNormalizeGraphControls);
window.addEventListener("hashchange", scheduleNormalizeGraphControls);

window.setTimeout(scheduleNormalizeGraphControls, 0);
window.setTimeout(scheduleNormalizeGraphControls, 250);
window.setTimeout(scheduleNormalizeGraphControls, 750);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && document.body.classList.contains(GRAPH_EXPANDED_CLASS)) {
    toggleExpandedGraph(false);
  }
});

document.addEventListener("click", event => {
  if (event.target.closest("[data-mode-target='graph'], [data-graph-scope], [data-graph-reset-layout]")) {
    scheduleNormalizeGraphControls();
  }
});
