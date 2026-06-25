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

document.addEventListener("click", event => {
  const graphRoot = event.target.closest("#relatedView");
  if (!graphRoot) return;

  const graphNavigationButton = event.target.closest("button[data-id]");
  if (!graphNavigationButton) return;

  scheduleCenterActiveGraphNode();
}, true);
