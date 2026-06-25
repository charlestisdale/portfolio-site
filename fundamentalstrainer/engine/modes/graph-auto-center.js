const MAX_CENTER_ATTEMPTS = 8;

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
}

function scheduleNormalizeGraphControls() {
  window.requestAnimationFrame(() => {
    normalizeGraphCenterControls();
    window.setTimeout(normalizeGraphCenterControls, 50);
  });
}

document.addEventListener("click", event => {
  const graphRoot = event.target.closest("#relatedView");
  if (!graphRoot) return;

  const graphNavigationButton = event.target.closest("button[data-id]");
  if (!graphNavigationButton) return;

  scheduleCenterActiveGraphNode();
  scheduleNormalizeGraphControls();
}, true);

window.addEventListener("DOMContentLoaded", scheduleNormalizeGraphControls);
window.addEventListener("hashchange", scheduleNormalizeGraphControls);

document.addEventListener("click", event => {
  if (event.target.closest("[data-mode-target='graph'], [data-graph-scope], [data-graph-reset-layout]")) {
    scheduleNormalizeGraphControls();
  }
});
