#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateTerminalScenario } from "../validators/terminal-validator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const engineRoot = path.resolve(__dirname, "..");
const defaultDataPath = path.join(engineRoot, "data", "core2", "terminal.json");

const args = new Map(
  process.argv.slice(2).map(arg => {
    const [key, ...valueParts] = arg.split("=");
    return [key, valueParts.join("=")];
  })
);

const dataPath = path.resolve(args.get("--data") || defaultDataPath);

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Could not read valid JSON from ${filePath}: ${error.message}`);
  }
}

function main() {
  const data = readJson(dataPath);
  const errors = [];

  if (!Array.isArray(data)) {
    errors.push(`${dataPath} must contain a JSON array of terminal scenarios.`);
  } else {
    data.forEach((scenario, index) => {
      errors.push(...validateTerminalScenario(scenario, index));
    });
  }

  if (errors.length) {
    console.error(`\nTerminal data validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:\n`);
    errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log("Terminal data validation passed.");
  console.log(`Validated data: ${dataPath}`);
  console.log(`Scenario count: ${data.length}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
