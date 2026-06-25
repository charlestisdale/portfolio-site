#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);

function run(commandArgs) {
  return spawnSync(process.execPath, commandArgs, {
    stdio: "inherit",
    shell: false
  });
}

const audit = run(["tools/knowledge/audit-approved-export.mjs", ...args]);
if (audit.status !== 0) {
  console.error("\nKnowledge promotion blocked: approved export did not pass audit.");
  console.error("Fix the export or regenerate it through the current pending-candidate review flow before promoting.");
  process.exit(audit.status || 1);
}

const promote = run(["tools/knowledge/promote-approved-objects.mjs", ...args]);
process.exit(promote.status || 0);
