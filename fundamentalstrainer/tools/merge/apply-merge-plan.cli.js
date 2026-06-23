#!/usr/bin/env node

import { resolve } from "node:path";
import { loadJsonFile, writeMergePlanFiles } from "./write-plan-files.js";

const args = parseArgs(process.argv.slice(2));

if (!args.plan) {
  printUsage();
  process.exit(1);
}

const planPath = resolve(args.plan);
const projectRoot = resolve(args.projectRoot || ".");
const dryRun = args.dryRun !== false;

try {
  const plan = await loadJsonFile(planPath);
  const result = await writeMergePlanFiles(plan, {
    projectRoot,
    dryRun,
    allowOverwrite: args.allowOverwrite !== false
  });

  console.log(JSON.stringify(result, null, 2));

  if (dryRun) {
    console.log("\nDry run only. Re-run with --write to create/update files.");
  }
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {
    dryRun: true,
    allowOverwrite: true
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--plan") parsed.plan = argv[++index];
    else if (arg === "--project-root") parsed.projectRoot = argv[++index];
    else if (arg === "--write") parsed.dryRun = false;
    else if (arg === "--no-overwrite") parsed.allowOverwrite = false;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
  }

  if (parsed.help) {
    printUsage();
    process.exit(0);
  }

  return parsed;
}

function printUsage() {
  console.log(`Usage:
  node tools/merge/apply-merge-plan.cli.js --plan <merge-plan.json> [--project-root .] [--write]

Options:
  --plan <path>          Path to reviewed import merge plan JSON.
  --project-root <path>  Project root where content/ lives. Defaults to current directory.
  --write                Actually write files. Without this flag, dry-run mode is used.
  --no-overwrite         Skip files that already exist.
  --help                 Show this help.

Examples:
  node tools/merge/apply-merge-plan.cli.js --plan content/imports/approved/example-plan.json
  node tools/merge/apply-merge-plan.cli.js --plan content/imports/approved/example-plan.json --write
`);
}
