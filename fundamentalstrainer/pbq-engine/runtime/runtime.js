import { createComponentManager } from "./component-manager.js";
import { createEventBus, PBQ_EVENTS } from "./event-bus.js";
import { createStateManager } from "./state-manager.js";

export function createPbqRuntime({ scenario, elements = {}, componentDefinitions = [] } = {}) {
  if (!scenario || typeof scenario !== "object") {
    throw new Error("PBQ runtime requires a scenario object.");
  }

  const eventBus = createEventBus();
  const stateManager = createStateManager({
    scenario,
    initialState: scenario.initialState || {}
  });
  const componentManager = createComponentManager();

  componentDefinitions.forEach(definition => componentManager.register(definition));

  const context = {
    scenario,
    elements,
    events: eventBus,
    state: stateManager,
    components: componentManager
  };

  function getScenarioComponentIds() {
    if (Array.isArray(scenario.components) && scenario.components.length) {
      return scenario.components;
    }

    if (scenario.engine) {
      return [scenario.engine];
    }

    return [];
  }

  function start() {
    componentManager.unmountAll();
    stateManager.reset({ scenario, initialState: scenario.initialState || {} });
    componentManager.mountMany(getScenarioComponentIds(), context);
    eventBus.emit(PBQ_EVENTS.SCENARIO_STARTED, {
      scenarioId: scenario.id,
      scenario
    });
    componentManager.renderAll();
  }

  function reset() {
    eventBus.emit(PBQ_EVENTS.SCENARIO_RESET, {
      scenarioId: scenario.id
    });
    start();
  }

  function grade(grader) {
    if (typeof grader !== "function") {
      throw new Error("PBQ runtime grade requires a grader function.");
    }

    const result = grader({
      scenario,
      state: stateManager.getState()
    });

    eventBus.emit(PBQ_EVENTS.SCENARIO_GRADED, {
      scenarioId: scenario.id,
      result
    });

    return result;
  }

  function serialize() {
    return {
      scenarioId: scenario.id,
      state: stateManager.serialize(),
      components: componentManager.serialize()
    };
  }

  function unmount() {
    componentManager.unmountAll();
    eventBus.clear();
  }

  return {
    context,
    start,
    reset,
    grade,
    serialize,
    unmount
  };
}
