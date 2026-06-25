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

function scrollLearnModeToTop() {
  document.body.classList.remove(GRAPH_EXPANDED_CLASS);
  updateGraphExpandButtonLabel();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const learnPanel = document.querySelector('[data-mode-panel="learn"]');
      const conceptView = document.querySelector("#conceptView");
      const target = conceptView || learnPanel;

      if (target) {
        target.scrollIntoView({ block: "start", inline: "nearest" });
      }

      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  });
}

function scheduleScrollLearnModeToTop() {
  window.setTimeout(scrollLearnModeToTop, 0);
  window.setTimeout(scrollLearnModeToTop, 75);
}

function normalizeGraphCenterControls() {
  const visualizer = document.querySelector(".graph-visualizer");
  if (!visualizer) return;

  const toolbar = visualizer.querySelector(".graph-scope-toggle");

  visualizer.querySelectorAll("button[onclick]").forEach(button => {
    const action = button.getAttribute("onclick") || "";

    if (action.includes("__centerKnowledgeGraphSearch") || action.includes("__resetKnowledgeGraphViewport")) {
      button.remove();
      return;
    }

    if (action.includes("__fitKnowledgeGraphViewport")) {
      button.textContent = "Fit graph";
      button.setAttribute("aria-label", "Fit visible graph");
    }

    if (action.includes("__centerKnowledgeGraphNode")) {
      button.remove();
    }
  });

  ensureGraphToolbarCenterButton(visualizer, toolbar);
  ensureGraphExpandButton(visualizer, toolbar);
  updateGraphExpandButtonLabel();
}

function ensureGraphToolbarCenterButton(visualizer, toolbar = visualizer.querySelector(".graph-scope-toggle")) {
  if (!toolbar || toolbar.querySelector("[data-graph-center-active]")) return;

  const fitButton = toolbar.querySelector("button[onclick*='__fitKnowledgeGraphViewport']");
  const button = document.createElement("button");
  button.className = "graph-scope-button graph-center-active";
  button.type = "button";
  button.dataset.graphCenterActive = "true";
  button.textContent = "Center";
  button.setAttribute("aria-label", "Center active graph node");

  if (fitButton?.nextSibling) {
    toolbar.insertBefore(button, fitButton.nextSibling);
  } else {
    toolbar.appendChild(button);
  }
}

function ensureGraphExpandButton(visualizer, toolbar = visualizer.querySelector(".graph-scope-toggle")) {
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
  const openLearnButton = event.target.closest("[data-graph-open-learn]");
  if (openLearnButton) {
    scheduleScrollLearnModeToTop();
    return;
  }

  const centerButton = event.target.closest("[data-graph-center-active]");
  if (centerButton) {
    centerActiveGraphNode();
    event.preventDefault();
    event.stopPropagation();
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
