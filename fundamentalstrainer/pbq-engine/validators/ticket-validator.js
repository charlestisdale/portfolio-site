export function validateTicketScenario(scenario, index = 0) {
  const errors = [];
  const label = scenario?.id || scenario?.title || `scenario-${index + 1}`;

  function requireString(path, value) {
    if (typeof value !== "string" || !value.trim()) {
      errors.push(`${label}: ${path} must be a non-empty string.`);
    }
  }

  function requireObject(path, value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${label}: ${path} must be an object.`);
      return false;
    }
    return true;
  }

  requireString("id", scenario?.id);
  requireString("title", scenario?.title);

  if (scenario?.engine !== "ticket") {
    errors.push(`${label}: engine must be \"ticket\".`);
  }

  const hasTicket = requireObject("ticket", scenario?.ticket);
  if (hasTicket) {
    requireString("ticket.description", scenario.ticket.description);
  }

  const initialState = scenario?.initialState || {};
  const hasInitialState = requireObject("initialState", initialState);
  const knownStateKeys = new Set(hasInitialState ? Object.keys(initialState) : []);

  if (!Array.isArray(scenario?.actions) || !scenario.actions.length) {
    errors.push(`${label}: actions must be a non-empty array.`);
  } else {
    validateActions({ scenario, label, errors, knownStateKeys });
  }

  validateGrading({ scenario, label, errors, knownStateKeys });

  return errors;
}

function validateActions({ scenario, label, errors, knownStateKeys }) {
  const seenActionIds = new Set();

  scenario.actions.forEach((action, actionIndex) => {
    const actionLabel = action?.id || `action-${actionIndex + 1}`;

    if (typeof action?.id !== "string" || !action.id.trim()) {
      errors.push(`${label}: actions[${actionIndex}].id must be a non-empty string.`);
    } else if (seenActionIds.has(action.id)) {
      errors.push(`${label}: duplicate action id \"${action.id}\".`);
    } else {
      seenActionIds.add(action.id);
    }

    if (typeof action?.label !== "string" || !action.label.trim()) {
      errors.push(`${label}: ${actionLabel}.label must be a non-empty string.`);
    }

    validateStateMap({
      mapName: `${actionLabel}.requires`,
      map: action?.requires,
      label,
      errors,
      knownStateKeys
    });

    validateStateMap({
      mapName: `${actionLabel}.sets`,
      map: action?.sets,
      label,
      errors,
      knownStateKeys
    });

    if (action?.penalty && Number.isNaN(Number(action.penalty.points || 0))) {
      errors.push(`${label}: ${actionLabel}.penalty.points must be numeric when provided.`);
    }
  });
}

function validateGrading({ scenario, label, errors, knownStateKeys }) {
  const grading = scenario?.grading;

  if (!grading || typeof grading !== "object" || Array.isArray(grading)) {
    errors.push(`${label}: grading must be an object.`);
    return;
  }

  if (!Array.isArray(grading.requiredStates) || !grading.requiredStates.length) {
    errors.push(`${label}: grading.requiredStates must be a non-empty array.`);
    return;
  }

  grading.requiredStates.forEach((requiredState, index) => {
    if (!requiredState || typeof requiredState !== "object" || Array.isArray(requiredState)) {
      errors.push(`${label}: grading.requiredStates[${index}] must be an object.`);
      return;
    }

    if (typeof requiredState.key !== "string" || !requiredState.key.trim()) {
      errors.push(`${label}: grading.requiredStates[${index}].key must be a non-empty string.`);
      return;
    }

    if (!knownStateKeys.has(requiredState.key)) {
      errors.push(`${label}: grading.requiredStates[${index}] references unknown state key \"${requiredState.key}\".`);
    }

    if (!("value" in requiredState)) {
      errors.push(`${label}: grading.requiredStates[${index}] must include a value.`);
    }
  });
}

function validateStateMap({ mapName, map, label, errors, knownStateKeys }) {
  if (!map) {
    return;
  }

  if (typeof map !== "object" || Array.isArray(map)) {
    errors.push(`${label}: ${mapName} must be an object when provided.`);
    return;
  }

  Object.keys(map).forEach(key => {
    if (!knownStateKeys.has(key)) {
      errors.push(`${label}: ${mapName} references unknown state key \"${key}\".`);
    }
  });
}
