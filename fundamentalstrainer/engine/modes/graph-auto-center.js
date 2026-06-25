function centerGraphAfterNavigation(nodeId) {
  if (!nodeId) return;

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const visualizer = document.querySelector(".graph-visualizer");
      const viewportKey = visualizer?.dataset.graphViewportKey;
      if (!viewportKey) return;
      window.__centerKnowledgeGraphNode?.(viewportKey, nodeId);
    });
  });
}

document.addEventListener("click", event => {
  const graphRoot = event.target.closest("#relatedView");
  if (!graphRoot) return;

  const graphNodeButton = event.target.closest("button[data-id]");
  if (!graphNodeButton) return;

  centerGraphAfterNavigation(graphNodeButton.dataset.id);
});
