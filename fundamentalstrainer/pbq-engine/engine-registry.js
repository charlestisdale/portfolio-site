import { createTicketEngine } from "./engines/ticket-engine.js";
import { validateTicketScenario } from "./validators/ticket-validator.js";

const engineDefinitions = new Map();

registerEngine({
  id: "ticket",
  label: "Ticket Engine",
  create: createTicketEngine,
  validate: validateTicketScenario
});

export function registerEngine(definition) {
  if (!definition || typeof definition !== "object") {
    throw new Error("Engine definition must be an object.");
  }

  if (typeof definition.id !== "string" || !definition.id.trim()) {
    throw new Error("Engine definition must include a non-empty id.");
  }

  if (typeof definition.create !== "function") {
    throw new Error(`Engine \"${definition.id}\" must include a create function.`);
  }

  engineDefinitions.set(definition.id, {
    label: definition.label || definition.id,
    validate: null,
    ...definition
  });
}

export function getEngineDefinition(engineId) {
  return engineDefinitions.get(engineId) || null;
}

export function createEngineInstance({ scenario, elements }) {
  const definition = getEngineDefinition(scenario?.engine);

  if (!definition) {
    throw new Error(`No PBQ engine registered for \"${scenario?.engine || "unknown"}\".`);
  }

  return definition.create({ scenario, elements });
}

export function validateScenario(scenario, index = 0) {
  const definition = getEngineDefinition(scenario?.engine);

  if (!definition) {
    const label = scenario?.id || scenario?.title || `scenario-${index + 1}`;
    return [`${label}: no PBQ engine is registered for \"${scenario?.engine || "unknown"}\".`];
  }

  if (typeof definition.validate !== "function") {
    return [];
  }

  return definition.validate(scenario, index);
}

export function getRegisteredEngineIds() {
  return Array.from(engineDefinitions.keys());
}
