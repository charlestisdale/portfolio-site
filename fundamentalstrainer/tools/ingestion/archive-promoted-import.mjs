#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "./import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const fileArg = args.file;
const lessonArg = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const pendingDir = path.resolve(root, "data", "imports", "pending");
const archiveDir = path.resolve(root, "data", "imports", "archived");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findPendingFile() {
  if (fileArg) return path.resolve(root, fileArg);
  if (!lessonArg) return null;
  if (!fs.existsSync(pendingDir)) return null;

  const matches = fs.readdirSync(pendingDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".json") && entry.name !== "manifest.json")
    .filter(entry => entry.name.startsWith(`${lessonArg}-`))
    .map(entry => path.join(pendingDir, entry.name))
    .sort();

  if (matches.length > 1) {
    fail(`Multiple pending imports matched lesson ${lessonArg}: ${matches.map(file => toProjectPath(file, root)).join(", ")}`);
  }

  return matches[0] || null;
}

function runManifestRefresh() {
  const result = spawnSync(process.execPath, ["tools/ingestion/build-review-manifest.mjs"], {
    cwd: root,
    encoding: "utf8"
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() || "",
    stderr: result.stderr?.trim() || ""
  };
}

const pendingFile = findPendingFile();
if (!pendingFile || !fs.existsSync(pendingFile)) {
  fail("Usage: node tools/ingestion/archive-promoted-import.mjs --lesson=01 or --file=data/imports/pending/01-discovery-candidates.json");
}

const data = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
const lessonId = String(data.lessonId || lessonArg || "00").padStart(2, "0");
const safeId = String(data.id || path.basename(pendingFile, ".json")).toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destinationDir = path.join(archiveDir, lessonId);
const destination = path.join(destinationDir, `${safeId}-${timestamp}.json`);

fs.mkdirSync(destinationDir, { recursive: true });
fs.renameSync(pendingFile, destination);

const manifest = runManifestRefresh();

console.log(JSON.stringify({
  archived: toProjectPath(destination, root),
  removedFromPending: toProjectPath(pendingFile, root),
  manifestRefreshed: manifest.ok,
  manifestOutput: manifest.stdout || manifest.stderr,
  next: [
    "Reload the Import tab.",
    "The archived promoted import should no longer appear as pending."
  ]
}, null, 2));

if (!manifest.ok) process.exit(1);
