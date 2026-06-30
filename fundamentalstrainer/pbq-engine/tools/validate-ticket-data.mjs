#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const engineRoot = path.resolve(__dirname, "..");
const defaultDataPath = path.join(engineRoot, "data", "core2", "tickets.json");
const defaultSchemaPath = path.join(engineRoot, "schemas", "ticket.schema.json");
const allowedPenaltyTypes = [
  "unsafe",
  "insecure",
  "too-invasive",
  "not-relevant",
  "wrong-root-cause",
  "premature-escalation",
  "missed-verification",
  "missed-documentation",
  "penalty"
];

const args = new Map(
  process.argv.slice(2).map(arg => {
    const [key, ...valueParts] = arg.split("=");
    return [key, valueParts.join("=")];
  })
);

const dataPath = path.resolve(args.get("--data") || defaultDataPath);
const schemaPath = path.resolve(args.get("--schema") || defaultSchemaPath);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${filePath}: ${error.message}`);
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stateValueIsValid(value) {
  return ["boolean", "string", "number"].includes(typeof value) || value === null;
}

function validateStateMap({ map, pathLabel, errors }) {
  if (!isPlainObject(map)) {
    errors.push(`${pathLabel} must be an object.`);
    return;
  }

  Object.entries(map).forEach(([key, value]) => {
    if (!key.trim()) {
      errors.push(`${pathLabel} contains an empty state key.`);
    }

    if (!stateValueIsValid(value)) {
      errors.push(`${pathLabel}.${key} must be a boolean, string, number, or null.`);
    }
  });
}

function validateTicketScenario(scenario, index) {
  const errors = [];
  const label = scenario?.id || scenario?.title || `scenario-${index + 1}`;
  const pathPrefix = `[${index}] ${label}`;

  if (!isPlainObject(scenario)) {
    return [`[${index}] scenario must be an object.`];
  }

  requireString({ value: scenario.id, label: `${pathPrefix}.id`, errors });
  requireString({ value: scenario.title, label: `${pathPrefix}.title`, errors });

  if (scenario.engine !== "ticket") {
    errors.push(`${pathPrefix}.engine must be "ticket".`);
  }

  if (scenario.difficulty && !["easy", "medium", "hard"].includes(scenario.difficulty)) {
    errors.push(`${pathPrefix}.difficulty must be easy, medium, or hard.`);
  }

  validateTicketMetadata({ ticket: scenario.ticket, pathPrefix, errors });

  const initialState = scenario.initialState;
  validateStateMap({ map: initialState, pathLabel: `${pathPrefix}.initialState`, errors });
  const knownStateKeys = new Set(isPlainObject(initialState) ? Object.keys(initialState) : []);

  validateActions({ actions: scenario.actions, pathPrefix, knownStateKeys, errors });
  validateGrading({ grading: scenario.grading, pathPrefix, knownStateKeys, errors });

  return errors;
}

function requireString({ value, label, errors, required = true }) {
  if (value === undefined || value === null) {
    if (required) {
      errors.push(`${label} is required.`);
    }
    return;
  }

  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} must be a non-empty string.`);
  }
}

function validateTicketMetadata({ ticket, pathPrefix, errors }) {
  if (!isPlainObject(ticket)) {
    errors.push(`${pathPrefix}.ticket must be an object.`);
    return;
  }

  requireString({ value: ticket.description, label: `${pathPrefix}.ticket.description`, errors });

  if (ticket.priority && !["Low", "Medium", "High", "Critical"].includes(ticket.priority)) {
    errors.push(`${pathPrefix}.ticket.priority must be Low, Medium, High, or Critical.`);
  }
}

function validateActions({ actions, pathPrefix, knownStateKeys, errors }) {
  if (!Array.isArray(actions) || !actions.length) {
    errors.push(`${pathPrefix}.actions must be a non-empty array.`);
    return;
  }

  const seenActionIds = new Set();

  actions.forEach((action, actionIndex) => {
    const actionLabel = `${pathPrefix}.actions[${actionIndex}]`;

    if (!isPlainObject(action)) {
      errors.push(`${actionLabel} must be an object.`);
      return;
    }

    requireString({ value: action.id, label: `${actionLabel}.id`, errors });
    requireString({ value: action.label, label: `${actionLabel}.label`, errors });

    if (typeof action.id === "string" && action.id.trim()) {
      if (seenActionIds.has(action.id)) {
        errors.push(`${actionLabel}.id duplicates action id "${action.id}".`);
      }
      seenActionIds.add(action.id);
    }

    if (action.requires !== undefined) {
      validateStateReferenceMap({
        map: action.requires,
        pathLabel: `${actionLabel}.requires`,
        knownStateKeys,
        errors
      });
    }

    if (action.sets !== undefined) {
      validateStateReferenceMap({
        map: action.sets,
        pathLabel: `${actionLabel}.sets`,
        knownStateKeys,
        errors
      });
    }

    if (action.penalty !== undefined) {
      validatePenalty({ penalty: action.penalty, pathLabel: `${actionLabel}.penalty`, errors });
    }
  });
}

function validateStateReferenceMap({ map, pathLabel, knownStateKeys, errors }) {
  validateStateMap({ map, pathLabel, errors });

  if (!isPlainObject(map)) {
    return;
  }

  Object.keys(map).forEach(key => {
    if (!knownStateKeys.has(key)) {
      errors.push(`${pathLabel} references unknown initialState key "${key}".`);
    }
  });
}

function validatePenalty({ penalty, pathLabel, errors }) {
  if (!isPlainObject(penalty)) {
    errors.push(`${pathLabel} must be an object.`);
    return;
  }

  if (penalty.type && !allowedPenaltyTypes.includes(penalty.type)) {
    errors.push(`${pathLabel}.type is not a recognized penalty category.`);
  }

  if (typeof penalty.points !== "number" || Number.isNaN(penalty.points) || penalty.points < 0) {
    errors.push(`${pathLabel}.points must be a non-negative number.`);
  }
}

function validateGrading({ grading, pathPrefix, knownStateKeys, errors }) {
  if (!isPlainObject(grading)) {
    errors.push(`${pathPrefix}.grading must be an object.`);
    return;
  }

  if (grading.maxScore !== undefined && (typeof grading.maxScore !== "number" || grading.maxScore < 0)) {
    errors.push(`${pathPrefix}.grading.maxScore must be a non-negative number.`);
  }

  if (grading.passingScore !== undefined && (typeof grading.passingScore !== "number" || grading.passingScore < 0 || grading.passingScore > 100)) {
    errors.push(`${pathPrefix}.grading.passingScore must be a number from 0 through 100.`);
  }

  if (grading.pointsPerMissingState !== undefined && (typeof grading.pointsPerMissingState !== "number" || grading.pointsPerMissingState < 0)) {
    errors.push(`${pathPrefix}.grading.pointsPerMissingState must be a non-negative number.`);
  }

  if (!Array.isArray(grading.requiredStates) || !grading.requiredStates.length) {
    errors.push(`${pathPrefix}.grading.requiredStates must be a non-empty array.`);
    return;
  }

  grading.requiredStates.forEach((requiredState, requiredIndex) => {
    const stateLabel = `${pathPrefix}.grading.requiredStates[${requiredIndex}]`;

    if (!isPlainObject(requiredState)) {
      errors.push(`${stateLabel} must be an object.`);
      return;
    }

    requireString({ value: requiredState.key, label: `${stateLabel}.key`, errors });

    if (!("value" in requiredState)) {
      errors.push(`${stateLabel}.value is required.`);
    } else if (!stateValueIsValid(requiredState.value)) {
      errors.push(`${stateLabel}.value must be a boolean, string, number, or null.`);
    }

    if (typeof requiredState.key === "string" && requiredState.key.trim() && !knownStateKeys.has(requiredState.key)) {
      errors.push(`${stateLabel}.key references unknown initialState key "${requiredState.key}".`);
    }
  });
}

function validateSchemaFile(schema) {
  const errors = [];

  if (!isPlainObject(schema)) {
    return ["Schema must be a JSON object."];
  }

  if (schema.title !== "PBQ Engine Ticket Scenario") {
    errors.push("Schema title should be PBQ Engine Ticket Scenario.");
  }

  if (schema.properties?.engine?.const !== "ticket") {
    errors.push("Schema must constrain properties.engine.const to ticket.");
  }

  if (!schema.$defs?.action || !schema.$defs?.grading || !schema.$defs?.stateMap) {
    errors.push("Schema should define reusable $defs for action, grading, and stateMap.");
  }

  const schemaPenaltyTypes = schema.$defs?.penalty?.properties?.type?.enum || [];
  const missingPenaltyTypes = allowedPenaltyTypes.filter(type => !schemaPenaltyTypes.includes(type));
  if (missingPenaltyTypes.length) {
    errors.push(`Schema penalty enum is missing: ${missingPenaltyTypes.join(", ")}.`);
  }

  return errors;
}

function main() {
  const schema = readJson(schemaPath);
  const data = readJson(dataPath);
  const errors = [];

  errors.push(...validateSchemaFile(schema));

  if (!Array.isArray(data)) {
    errors.push(`${dataPath} must contain a JSON array of ticket scenarios.`);
  } else {
    data.forEach((scenario, index) => {
      errors.push(...validateTicketScenario(scenario, index));
    });
  }

  if (errors.length) {
    console.error(`\nTicket data validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Ticket data validation passed.`);
  console.log(`Validated data: ${dataPath}`);
  console.log(`Checked schema: ${schemaPath}`);
  console.log(`Scenario count: ${data.length}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
