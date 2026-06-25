#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const stagingDir = path.resolve(root, args.dir || "ai-staging");
const queueFile = path.resolve(root, args.queue || "data/ai-imports/staging-queue.json");
const mode = args.mode || "next";
const keepPromptCopy = args["copy-prompt"] !== "false";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureQueue() {
  if (!fs.existsSync(queueFile)) {
    writeJson(queueFile, {
      queue: [],
      notes: [
        "Add items with promptPath, outputPath, and expectedOutputName.",
        "Use npm run ai:stage:build -- --lesson=02 to generate queue items from existing Knowledge Author prompts."
      ]
    });
  }
}

function loadQueueFile() {
  ensureQueue();
  return readJson(queueFile);
}

function loadQueue() {
  const data = loadQueueFile();
  return Array.isArray(data.queue) ? data.queue : [];
}

function saveQueue(queue, metadata = {}) {
  const existing = fs.existsSync(queueFile) ? readJson(queueFile) : {};
  writeJson(queueFile, { ...existing, ...metadata, queue });
}

function listStagingFiles() {
  if (!fs.existsSync(stagingDir)) return [];
  return fs.readdirSync(stagingDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name !== ".gitkeep")
    .map(entry => path.join(stagingDir, entry.name));
}

function clearStaging() {
  fs.mkdirSync(stagingDir, { recursive: true });
  for (const file of listStagingFiles()) fs.unlinkSync(file);
}

function expectedOutputPath(item) {
  return path.resolve(root, item.outputPath);
}

function promptPath(item) {
  return path.resolve(root, item.promptPath);
}

function stagedPromptPath(item) {
  return path.join(stagingDir, path.basename(item.promptPath));
}

function stagedExpectedOutputPath(item) {
  return path.join(stagingDir, item.expectedOutputName || path.basename(item.outputPath));
}

function stagePrompt(item) {
  const sourcePrompt = promptPath(item);
  if (!fs.existsSync(sourcePrompt)) fail(`Prompt not found: ${toProjectPath(sourcePrompt, root)}`);
  clearStaging();
  const targetPrompt = stagedPromptPath(item);
  if (keepPromptCopy) {
    fs.copyFileSync(sourcePrompt, targetPrompt);
  } else {
    fs.renameSync(sourcePrompt, targetPrompt);
  }
  return targetPrompt;
}

function completeItem(item) {
  const stagedOutput = stagedExpectedOutputPath(item);
  if (!fs.existsSync(stagedOutput)) {
    fail(`Expected output not found in ai-staging: ${path.basename(stagedOutput)}\nSave the AI JSON there, then rerun npm run ai:stage:complete.`);
  }

  const destination = expectedOutputPath(item);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(stagedOutput, destination);

  const stagedPrompt = stagedPromptPath(item);
  if (!keepPromptCopy && fs.existsSync(stagedPrompt)) {
    const originalPrompt = promptPath(item);
    fs.mkdirSync(path.dirname(originalPrompt), { recursive: true });
    fs.renameSync(stagedPrompt, originalPrompt);
  } else if (fs.existsSync(stagedPrompt)) {
    fs.unlinkSync(stagedPrompt);
  }

  clearStaging();
  return destination;
}

function nextCommandForCompletedItem(item, remaining, queueData) {
  if (remaining.length) return "npm run ai:stage:next";
  const lesson = item.lesson || queueData.lesson || "<lesson>";
  if (item.type === "transcript-intelligence" || item.type === "discovery-review") {
    return `npm run ai:lesson -- --lesson=${lesson}`;
  }
  if (item.type === "knowledge-author") {
    return `npm run ai:expand -- --lesson=${lesson} --promote=true`;
  }
  return `npm run ai:lesson -- --lesson=${lesson}`;
}

function printStatus(queue) {
  console.log(JSON.stringify({
    generatedBy: "ai-staging-helper",
    queueFile: toProjectPath(queueFile, root),
    stagingDir: toProjectPath(stagingDir, root),
    remaining: queue.length,
    next: queue[0] || null,
    stagedFiles: listStagingFiles().map(file => toProjectPath(file, root))
  }, null, 2));
}

async function runNext() {
  const queue = loadQueue();
  if (!queue.length) {
    printStatus(queue);
    return;
  }

  const item = queue[0];
  const stagedPrompt = stagePrompt(item);

  console.log("\nAI prompt staged:");
  console.log(`  ${toProjectPath(stagedPrompt, root)}`);
  console.log("\nUpload or paste that prompt into ChatGPT / your AI tool.");
  console.log("\nSave the AI JSON response as:");
  console.log(`  ${toProjectPath(stagedExpectedOutputPath(item), root)}`);
  console.log("\nThen run:");
  console.log("  npm run ai:stage:complete");
}

function runComplete() {
  const queueData = loadQueueFile();
  const queue = Array.isArray(queueData.queue) ? queueData.queue : [];
  if (!queue.length) {
    printStatus(queue);
    return;
  }

  const item = queue[0];
  const destination = completeItem(item);
  const remaining = queue.slice(1);
  saveQueue(remaining, { lastCompleted: item });

  console.log(JSON.stringify({
    completed: true,
    completedType: item.type || "unknown",
    outputMovedTo: toProjectPath(destination, root),
    remaining: remaining.length,
    nextCommand: nextCommandForCompletedItem(item, remaining, queueData)
  }, null, 2));
}

function runStatus() {
  printStatus(loadQueue());
}

async function main() {
  if (mode === "next") return runNext();
  if (mode === "complete") return runComplete();
  if (mode === "status") return runStatus();
  if (mode === "interactive") {
    await runNext();
    const rl = readline.createInterface({ input, output });
    await rl.question("\nPress Enter after saving the JSON response into ai-staging...");
    rl.close();
    return runComplete();
  }
  fail(`Unknown mode: ${mode}`);
}

main();
