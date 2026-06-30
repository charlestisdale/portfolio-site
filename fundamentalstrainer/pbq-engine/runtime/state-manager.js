function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path;
  }

  if (typeof path === "string" && path.trim()) {
    return path.split(".").filter(Boolean);
  }

  return [];
}

function buildInitialRuntimeState({ scenario = {}, initialState = {} } = {}) {
  return {
    scenarioId: scenario.id || null,
    engine: scenario.engine || scenario.runtime || null,
    flags: clone(initialState) || {},
    ticket: {},
    terminal: {},
    documentation: {},
    evidence: [],
    history: [],
    penalties: [],
    learnerNotes: "",
    components: {}
  };
}

export function createStateManager({ scenario = {}, initialState = {} } = {}) {
  let state = buildInitialRuntimeState({ scenario, initialState });
  const subscribers = new Set();

  function notify(change) {
    subscribers.forEach(handler => handler({ state: getState(), change }));
  }

  function getState() {
    return clone(state);
  }

  function get(path) {
    const parts = normalizePath(path);
    let current = state;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[part];
    }

    return clone(current);
  }

  function set(path, value) {
    const parts = normalizePath(path);

    if (!parts.length) {
      state = clone(value) || {};
      notify({ type: "set", path: [] });
      return;
    }

    let current = state;
    parts.slice(0, -1).forEach(part => {
      if (!current[part] || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    });

    current[parts.at(-1)] = clone(value);
    notify({ type: "set", path: parts, value: clone(value) });
  }

  function merge(path, patch) {
    const current = get(path) || {};
    set(path, {
      ...current,
      ...clone(patch)
    });
  }

  function reset({ scenario: nextScenario = scenario, initialState: nextInitialState = nextScenario.initialState || {} } = {}) {
    state = buildInitialRuntimeState({ scenario: nextScenario, initialState: nextInitialState });
    notify({ type: "reset" });
  }

  function serialize() {
    return getState();
  }

  function subscribe(handler) {
    if (typeof handler !== "function") {
      throw new Error("State subscriber must be a function.");
    }

    subscribers.add(handler);
    return () => subscribers.delete(handler);
  }

  return {
    getState,
    get,
    set,
    merge,
    reset,
    serialize,
    subscribe
  };
}
