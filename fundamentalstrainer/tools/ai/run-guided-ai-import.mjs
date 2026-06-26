#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  cleanOutputFile,
  findRawTranscriptByLesson,
  importTranscript,
  lessonInfo,
  parseImportArgs,
  toProjectPath
} from "../ingestion/import-transcript.mjs";

const rawArgv = process.argv.slice(2);
const args = parseImportArgs(rawArgv);
const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";

function resolveLessonArg() {
  if (args.lesson) return String(args.lesson).padStart(2, "0");

  for (const arg of rawArgv) {
    const compact = arg.match(/^--lesson[-_=]?(\d{1,3})$/i);
    if (compact) return compact[1].padStart(2, "0");

    const bare = arg.match(/^--(\d{1,3})$/);
    if (bare) return bare[1].padStart(2, "0");
  }

  for (const key of Object.keys(args)) {
    const compact = key.match(/^lesson[-_]?([0-9]{1,3})$/i);
    if (compact) return compact[1].padStart(2, "0");
  }

  return null;
}

const lesson = resolveLessonArg();
const maxCycles = args["max-cycles"] ? Number.parseInt(args["max-cycles"], 10) : 200;
const autoValidate = args.validate === "true";
const autoMap = args.map !== "false";
const stagingDir = path.resolve(root, args.dir || "ai-staging");
const queueFile = path.resolve(root, args.queue || "data/ai-imports/staging-queue.json");

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

function runNode(script, scriptArgs = [], options = {}) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: options.inherit ? "inherit" : "pipe",
    encoding: "utf8",
    shell: false
  });

  if (!options.inherit && options.print !== false) {
    if (result.stdout?.trim()) console.log(result.stdout.trim());
    if (result.stderr?.trim()) console.error(result.stderr.trim());
  }

  return result;
}

function runNpmScript(scriptName, npmArgs = []) {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return spawnSync(command, ["run", scriptName, "--", ...npmArgs], {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
}

function parseJsonFromStdout(stdout) {
  const text = stdout?.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function listStagingFiles() {
  if (!fs.existsSync(stagingDir)) return [];
  return fs.readdirSync(stagingDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name !== ".gitkeep")
    .map(entry => path.join(stagingDir, entry.name));
}

function listStagingJsonFiles() {
  return listStagingFiles().filter(file => path.extname(file).toLowerCase() === ".json");
}

function loadQueue() {
  if (!fs.existsSync(queueFile)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(queueFile, "utf8"));
    return Array.isArray(data.queue) ? data.queue : [];
  } catch {
    return [];
  }
}

function printHeader(title) {
  console.log(`\n${"=".repeat(72)}`);
  console.log(title);
  console.log("=".repeat(72));
}

function findCleanedTranscriptForLesson() {
  const cleanedDir = path.resolve(root, `data/transcripts/cleaned/${certificationId}`);
  if (!fs.existsSync(cleanedDir)) return null;

  return fs.readdirSync(cleanedDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .map(entry => path.join(cleanedDir, entry.name))
    .find(file => path.basename(file).startsWith(`${lesson}-`)) || null;
}

function prepareTranscript() {
  printHeader(`TRANSCRIPT PREP LESSON ${lesson}`);

  const existingCleaned = findCleanedTranscriptForLesson();
  if (existingCleaned && args["force-clean"] !== "true") {
    console.log(`Cleaned transcript already exists: ${toProjectPath(existingCleaned, root)}`);
    return;
  }

  const rawFile = args.file
    ? path.resolve(root, args.file)
    : findRawTranscriptByLesson({
        root,
        certificationId,
        lessonId: lesson,
        rawDir: args.raw
      });

  if (!rawFile) {
    fail([
      `No raw transcript found for lesson ${lesson}.`,
      `Expected location: data/transcripts/raw/${certificationId}/`,
      "Add the .srt file there, or run with --file=path/to/transcript.srt."
    ].join("\n"));
  }

  if (!fs.existsSync(rawFile)) fail(`Raw transcript file not found: ${toProjectPath(rawFile, root)}`);

  const info = lessonInfo(rawFile);
  const cleanedFile = cleanOutputFile({
    cleanedDir: path.resolve(root, `data/transcripts/cleaned/${certificationId}`),
    lessonId: lesson,
    title: info.title
  });

  if (fs.existsSync(cleanedFile) && args["force-clean"] !== "true") {
    console.log(`Cleaned transcript already exists: ${toProjectPath(cleanedFile, root)}`);
    return;
  }

  const report = importTranscript(rawFile, {
    root,
    certificationId,
    lessonId: lesson,
    title: info.title,
    legacyExtract: false
  });

  if (report.error || report.steps?.clean?.ok === false) {
    console.log(JSON.stringify(report, null, 2));
    fail(`Transcript prep failed for lesson ${lesson}.`);
  }

  console.log(JSON.stringify({
    prepared: true,
    raw: report.rawFile,
    cleaned: report.cleanedFile,
    mode: report.mode
  }, null, 2));
}

function printStagedPromptHelp() {
  const files = listStagingFiles().map(file => toProjectPath(file, root));
  const promptFiles = files.filter(file => file.endsWith(".md"));
  const jsonFiles = files.filter(file => file.endsWith(".json"));

  console.log("\nStaging folder:");
  console.log(`  ${toProjectPath(stagingDir, root)}/`);

  if (promptFiles.length) {
    console.log("\nPrompt to send to AI:");
    for (const file of promptFiles) console.log(`  ${file}`);
  }

  if (jsonFiles.length) {
    console.log("\nJSON already in staging:");
    for (const file of jsonFiles) console.log(`  ${file}`);
  }

  console.log("\nAfter AI returns JSON:");
  console.log("  1. Save the JSON into ai-staging/.");
  console.log("  2. Press Enter here.");
  console.log("\nThe helper accepts a different filename if the JSON content matches the expected id/schema.");
}

async function waitForAiResponse(rl) {
  printStagedPromptHelp();
  await rl.question("\nPress Enter after the AI JSON response is saved in ai-staging...");

  if (!listStagingJsonFiles().length) {
    fail("No JSON file found in ai-staging. Save the AI response JSON there, then rerun the guided command.");
  }
}

function runBuild() {
  printHeader(`BUILD / CONTINUE LESSON ${lesson}`);
  const result = runNode("tools/ai/build-ai-staging-queue.mjs", [`--lesson=${lesson}`]);
  if (result.status !== 0) process.exit(result.status || 1);
  return parseJsonFromStdout(result.stdout) || {};
}

function runStageNext() {
  printHeader("AI INTERVENTION REQUIRED");
  const result = runNode("tools/ai/stage-ai-file.mjs", ["--mode=next"]);
  if (result.status !== 0) process.exit(result.status || 1);
}

function runStageComplete() {
  printHeader("IMPORTING AI RESPONSE");
  const result = runNode("tools/ai/stage-ai-file.mjs", ["--mode=complete"]);
  if (result.status !== 0) process.exit(result.status || 1);
  return parseJsonFromStdout(result.stdout) || {};
}

function runExpansion({ promote = false } = {}) {
  printHeader(promote ? "NORMALIZE / PROMOTE" : "GENERATE NEXT PROMPT");
  const expansionArgs = [`--lesson=${lesson}`];
  if (promote) expansionArgs.push("--promote=true");
  const result = runNode("tools/ai/run-ai-expansion.mjs", expansionArgs);
  if (result.status !== 0) process.exit(result.status || 1);
  return parseJsonFromStdout(result.stdout) || {};
}

function runLessonBootstrap() {
  printHeader("LESSON BOOTSTRAP / DISCOVERY NORMALIZATION");
  const result = runNode("tools/ai/run-ai-lesson.mjs", [`--lesson=${lesson}`]);
  if (result.status !== 0) process.exit(result.status || 1);
}

function runCurriculumMap() {
  printHeader("CURRICULUM MAPPING");
  const result = runNpmScript("curriculum:map-reviewed", [`--lesson=${lesson}`]);
  if (result.status !== 0) process.exit(result.status || 1);
}

function runValidateAll() {
  printHeader("VALIDATION");
  const result = runNpmScript("validate:all");
  if (result.status !== 0) process.exit(result.status || 1);
}

function shouldRunCommand(command, type) {
  if (!command) return false;
  if (type === "send-prompt-to-ai") return false;
  if (type === "lesson-authoring-complete") return false;
  return command.includes("ai:lesson") || command.includes("ai:expand");
}

function runNextAction(action) {
  if (!action?.type) return false;

  if (action.type === "normalize-ai-response" || action.type === "promote-ready-draft") {
    runExpansion({ promote: action.command?.includes("--promote=true") ?? true });
    return true;
  }

  if (action.type === "dry-run-ready-draft") {
    runExpansion({ promote: false });
    return true;
  }

  if (action.type === "generate-next-prompt") {
    runExpansion({ promote: false });
    return true;
  }

  if (shouldRunCommand(action.command, action.type)) {
    if (action.command.includes("ai:lesson")) runLessonBootstrap();
    else if (action.command.includes("--promote=true")) runExpansion({ promote: true });
    else if (action.command.includes("ai:expand")) runExpansion({ promote: false });
    else return false;
    return true;
  }

  return false;
}

async function main() {
  if (!lesson) {
    fail([
      "Usage:",
      "  npm run ai:guided -- --lesson=04",
      "  npm run ai:guided -- --lesson04",
      "  npm run ai:guided -- --04"
    ].join("\n"));
  }

  const rl = readline.createInterface({ input, output });

  try {
    console.log(`Guided AI import started for lesson ${lesson}.`);
    console.log("This is the normal one-command workflow. It prepares the transcript, then pauses only when an AI JSON response is needed.");

    prepareTranscript();

    for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
      const build = runBuild();
      const queue = loadQueue();

      if (queue.length) {
        runStageNext();
        await waitForAiResponse(rl);
        const completed = runStageComplete();

        if (completed.completedType === "transcript-intelligence" || completed.completedType === "discovery-review") {
          runLessonBootstrap();
          continue;
        }

        if (completed.completedType === "knowledge-author") {
          runExpansion({ promote: true });
          continue;
        }

        continue;
      }

      const action = build.expansionNextAction;
      if (runNextAction(action)) continue;

      if (action?.type === "send-prompt-to-ai") {
        fail("Expansion found a prompt that needs AI, but staging queue was empty. Run npm run ai:stage:build -- --lesson=<lesson> and share the output.");
      }

      if (action?.type === "lesson-authoring-complete") {
        printHeader("LESSON AUTHORING COMPLETE");
        console.log(`Lesson ${lesson} authoring appears complete.`);
        if (autoMap) runCurriculumMap();
        if (autoValidate) runValidateAll();
        console.log("\nGuided import complete.");
        return;
      }

      if (build.nextCommand?.includes("ai:lesson")) {
        runLessonBootstrap();
        continue;
      }

      if (build.nextCommand?.includes("ai:expand")) {
        runExpansion({ promote: build.nextCommand.includes("--promote=true") });
        continue;
      }

      printHeader("NO NEXT ACTION");
      console.log("No queued prompt and no deterministic next action was reported.");
      console.log("Last build output:");
      console.log(JSON.stringify(build, null, 2));
      return;
    }

    fail(`Stopped after ${maxCycles} cycles to prevent an accidental infinite loop.`);
  } finally {
    rl.close();
  }
}

main();
