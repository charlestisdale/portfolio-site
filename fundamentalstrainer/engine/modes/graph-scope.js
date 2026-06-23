const STORAGE_KEY = "it-learning-graph-scope";
const VALID_SCOPES = new Set(["focused", "expanded"]);

export function getGraphScope() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return VALID_SCOPES.has(value) ? value : "focused";
  } catch {
    return "focused";
  }
}

export function setGraphScope(scope) {
  if (!VALID_SCOPES.has(scope)) return "focused";
  try {
    window.localStorage.setItem(STORAGE_KEY, scope);
  } catch {
    // Ignore storage failures; the visualizer can still render the default scope.
  }
  return scope;
}
