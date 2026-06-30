export function createEventBus() {
  const subscribers = new Map();

  function on(eventName, handler) {
    if (typeof eventName !== "string" || !eventName.trim()) {
      throw new Error("Event name must be a non-empty string.");
    }

    if (typeof handler !== "function") {
      throw new Error(`Handler for ${eventName} must be a function.`);
    }

    const handlers = subscribers.get(eventName) || new Set();
    handlers.add(handler);
    subscribers.set(eventName, handlers);

    return () => off(eventName, handler);
  }

  function off(eventName, handler) {
    const handlers = subscribers.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (!handlers.size) {
      subscribers.delete(eventName);
    }
  }

  function emit(eventName, payload = {}) {
    const handlers = subscribers.get(eventName);
    if (!handlers) {
      return;
    }

    handlers.forEach(handler => {
      handler(payload, eventName);
    });
  }

  function clear() {
    subscribers.clear();
  }

  function listenerCount(eventName) {
    return subscribers.get(eventName)?.size || 0;
  }

  return {
    on,
    off,
    emit,
    clear,
    listenerCount
  };
}

export const PBQ_EVENTS = Object.freeze({
  SCENARIO_STARTED: "SCENARIO_STARTED",
  SCENARIO_RESET: "SCENARIO_RESET",
  SCENARIO_GRADED: "SCENARIO_GRADED",
  STATE_UPDATED: "STATE_UPDATED",
  ACTION_COMPLETED: "ACTION_COMPLETED",
  COMMAND_EXECUTED: "COMMAND_EXECUTED",
  EVIDENCE_ADDED: "EVIDENCE_ADDED",
  HISTORY_ADDED: "HISTORY_ADDED",
  DOCUMENTATION_SAVED: "DOCUMENTATION_SAVED",
  PENALTY_ADDED: "PENALTY_ADDED"
});
