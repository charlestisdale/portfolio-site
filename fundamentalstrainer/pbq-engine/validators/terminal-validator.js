export function validateTerminalScenario(scenario, index = 0) {
  const errors = [];
  const label = scenario?.id || scenario?.title || `scenario-${index + 1}`;

  function requireString(path, value) {
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${label}: ${path} must be a non-empty string.`);
    }
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function validateStateMap(path, map, knownStateKeys) {
    if (!map) {
      return;
    }

    if (!isPlainObject(map)) {
      errors.push(`${label}: ${path} must be an object when provided.`);
      return;
    }

    Object.keys(map).forEach(key => {
      if (knownStateKeys && !knownStateKeys.has(key)) {
        errors.push(`${label}: ${path} references unknown state key "${key}".`);
      }
    });
  }

  function normalizeCommand(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function requiresSignature(requires) {
    if (!isPlainObject(requires)) {
      return "{}";
    }

    return JSON.stringify(
      Object.keys(requires)
        .sort()
        .reduce((signature, key) => {
          signature[key] = requires[key];
          return signature;
        }, {})
    );
  }

  requireString("id", scenario?.id);
  requireString("title", scenario?.title);

  if (scenario?.engine !== "terminal") {
    errors.push(`${label}: engine must be "terminal".`);
  }

  if (!isPlainObject(scenario?.terminal)) {
    errors.push(`${label}: terminal must be an object.`);
  }

  const initialState = scenario?.initialState || {};
  if (!isPlainObject(initialState)) {
    errors.push(`${label}: initialState must be an object.`);
  }
  const knownStateKeys = new Set(isPlainObject(initialState) ? Object.keys(initialState) : []);

  if (!Array.isArray(scenario?.commands) || !scenario.commands.length) {
    errors.push(`${label}: commands must be a non-empty array.`);
  } else {
    const seenCommandStates = new Map();

    scenario.commands.forEach((command, commandIndex) => {
      const commandLabel = command?.command || `command-${commandIndex + 1}`;

      requireString(`commands[${commandIndex}].command`, command?.command);

      const commandKeys = [command?.command, ...(command?.aliases || [])]
        .map(normalizeCommand)
        .filter(Boolean);
      const stateSignature = requiresSignature(command?.requires);

      commandKeys.forEach(commandKey => {
        const key = `${commandKey}|${stateSignature}`;
        if (seenCommandStates.has(key)) {
          errors.push(`${label}: command or alias "${commandKey}" duplicates another command with the same requires state.`);
        }
        seenCommandStates.set(key, true);
      });

      if (command?.aliases && !Array.isArray(command.aliases)) {
        errors.push(`${label}: ${commandLabel}.aliases must be an array when provided.`);
      }

      validateStateMap(`${commandLabel}.requires`, command?.requires, knownStateKeys);
      validateStateMap(`${commandLabel}.sets`, command?.sets, knownStateKeys);

      if (command?.penalty && Number.isNaN(Number(command.penalty.points || 0))) {
        errors.push(`${label}: ${commandLabel}.penalty.points must be numeric when provided.`);
      }
    });
  }

  const grading = scenario?.grading;
  if (!isPlainObject(grading)) {
    errors.push(`${label}: grading must be an object.`);
  } else if (!Array.isArray(grading.requiredStates) || !grading.requiredStates.length) {
    errors.push(`${label}: grading.requiredStates must be a non-empty array.`);
  } else {
    grading.requiredStates.forEach((requiredState, stateIndex) => {
      if (!requiredState?.key) {
        errors.push(`${label}: grading.requiredStates[${stateIndex}].key must be a non-empty string.`);
        return;
      }

      if (!knownStateKeys.has(requiredState.key)) {
        errors.push(`${label}: grading.requiredStates[${stateIndex}] references unknown state key "${requiredState.key}".`);
      }

      if (!("value" in requiredState)) {
        errors.push(`${label}: grading.requiredStates[${stateIndex}] must include a value.`);
      }
    });
  }

  return errors;
}
