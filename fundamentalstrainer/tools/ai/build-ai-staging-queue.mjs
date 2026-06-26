#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const queueFile = path.resolve(root, args.queue || "data/ai-imports/staging-queue.json");
const bootstrap = args.bootstrap !== "false";
const promote = args.promote !== "false";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function listFiles(dir, matcher = () => true) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(full, entry.name))
    .filter(file => matcher(file))
    .sort();
}

function slugify(value) {
  return String(value || "knowledge-object")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "knowledge-object";
}

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`);
}

function findReviewedFile() {
  return listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file))[0] || null;
}

function findReviewPrompt() {
  return listFiles("data/ai-imports/prompts", file => file.includes("discovery-review-prompt") && lessonMatch(file))[0] || null;
}

function findTranscriptPrompt() {
  return listFiles("data/ai-imports/prompts", file => file.includes("transcript-intelligence-prompt") && lessonMatch(file))[0] || null;
}

function runLessonBootstrap() {
  return spawnSync(process.execPath, ["tools/ai/run-ai-lesson.mjs", `--lesson=${lesson}`], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

function runExpansion() {
  const command = ["tools/ai/run-ai-expansion.mjs", `--lesson=${lesson}`];
  if (promote) command.push("--promote=true");
  return spawnSync(process.execPath, command, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

function parseExpansionOutput(expansionResult) {
  const stdout = expansionResult?.stdout?.trim();
  if (!stdout) return null;

  try {
    return JSON.parse(stdout);
  } catch {
    const start = stdout.indexOf("{");
    const end = stdout.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;

    try {
      return JSON.parse(stdout.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function promptFor(item) {
  return listFiles("data/ai-imports/prompts/knowledge-author", file => {
    const base = path.basename(file);
    return file.endsWith("knowledge-author-prompt.md")
      && lessonMatch(file)
      && (base.includes(slugify(item.proposedKnowledgeId)) || base.includes(slugify(item.title)));
  })[0] || null;
}

function hasResponse(item) {
  return listFiles("data/ai-imports/responses/knowledge-author", file => {
    if (!file.endsWith(".json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  }).length > 0;
}

function hasDraft(item) {
  return listFiles("data/imports/authored", file => {
    if (!file.endsWith(".draft.json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  }).length > 0;
}

function hasCanonical(item) {
  const knowledgeRoot = path.resolve(root, "content", "knowledge");
  if (!fs.existsSync(knowledgeRoot)) return false;
  const stack = [knowledgeRoot];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      if (entry.isFile() && entry.name.endsWith(".json")) {
        try {
          if (readJson(full).id === item.proposedKnowledgeId) return true;
        } catch {
          // ignore malformed files here; validation catches them elsewhere
        }
      }
    }
  }
  return false;
}

function knowledgeAuthorQueueItem(item, prompt) {
  const expectedOutputName = `${slugify(item.proposedKnowledgeId)}.knowledge-object.json`;
  return {
    type: "knowledge-author",
    lesson,
    conceptId: item.conceptId,
    proposedKnowledgeId: item.proposedKnowledgeId,
    expectedKnowledgeId: item.proposedKnowledgeId,
    title: item.title,
    promptPath: toProjectPath(prompt, root),
    outputPath: `data/ai-imports/responses/knowledge-author/${expectedOutputName}`,
    expectedOutputName
  };
}

function buildKnowledgeAuthorQueue(reviewedFile) {
  const review = readJson(reviewedFile);
  const queue = [];
  for (const item of review.authoringQueue || []) {
    if (hasCanonical(item) || hasDraft(item) || hasResponse(item)) continue;
    const prompt = promptFor(item);
    if (!prompt) continue;
    queue.push(knowledgeAuthorQueueItem(item, prompt));
  }
  return queue;
}

function buildQueueFromExpansionNextAction(expansionResult, reviewedFile) {
  if (!expansionResult || expansionResult.status !== 0) return [];

  const expansion = parseExpansionOutput(expansionResult);
  const nextAction = expansion?.nextAction;
  if (nextAction?.type !== "send-prompt-to-ai" || !nextAction.prompt) return [];

  const prompt = path.resolve(root, nextAction.prompt);
  if (!fs.existsSync(prompt)) return [];

  const expectedKnowledgeId = nextAction.expectedKnowledgeId;
  const review = readJson(reviewedFile);
  const reviewedItem = (review.authoringQueue || [])
    .find(item => item.proposedKnowledgeId === expectedKnowledgeId || item.conceptId === nextAction.conceptId);

  const item = reviewedItem || {
    conceptId: nextAction.conceptId,
    proposedKnowledgeId: expectedKnowledgeId,
    title: expectedKnowledgeId
  };

  if (!item.proposedKnowledgeId) return [];
  if (hasCanonical(item) || hasDraft(item) || hasResponse(item)) return [];

  return [knowledgeAuthorQueueItem(item, prompt)];
}

function writeQueue(queue, metadata = {}) {
  fs.mkdirSync(path.dirname(queueFile), { recursive: true });
  fs.writeFileSync(queueFile, `${JSON.stringify({ lesson, ...metadata, queue }, null, 2)}\n`, "utf8");
}

if (!lesson) fail("Usage: npm run ai:stage:build -- --lesson=03");

let reviewedFile = findReviewedFile();
if (!reviewedFile && bootstrap) {
  const bootstrapResult = runLessonBootstrap();
  reviewedFile = findReviewedFile();

  if (!reviewedFile) {
    const reviewPrompt = findReviewPrompt();
    const transcriptPrompt = findTranscriptPrompt();
    const waitingPrompt = reviewPrompt || transcriptPrompt;
    const expectedName = reviewPrompt
      ? `${lesson}-discovery-review.json`
      : `${lesson}-transcript-intelligence.json`;
    const outputPath = `data/ai-imports/responses/${expectedName}`;

    if (waitingPrompt) {
      writeQueue([
        {
          type: reviewPrompt ? "discovery-review" : "transcript-intelligence",
          lesson,
          promptPath: toProjectPath(waitingPrompt, root),
          outputPath,
          expectedOutputName: expectedName
        }
      ], {
        status: "waiting-for-ai-prerequisite",
        bootstrapStdout: bootstrapResult.stdout?.trim() || "",
        bootstrapStderr: bootstrapResult.stderr?.trim() || ""
      });
      console.log(JSON.stringify({
        output: toProjectPath(queueFile, root),
        lesson,
        queued: 1,
        status: "waiting-for-ai-prerequisite",
        prompt: toProjectPath(waitingPrompt, root),
        nextCommand: "npm run ai:stage:next"
      }, null, 2));
      process.exit(0);
    }
  }
}

if (!reviewedFile) fail(`No normalized discovery review found for lesson ${lesson}. Run npm run ai:lesson -- --lesson=${lesson} first.`);

let queue = buildKnowledgeAuthorQueue(reviewedFile);
let expansionResult = null;

if (!queue.length && bootstrap) {
  expansionResult = runExpansion();
  queue = buildKnowledgeAuthorQueue(reviewedFile);

  if (!queue.length) {
    queue = buildQueueFromExpansionNextAction(expansionResult, reviewedFile);
  }
}

writeQueue(queue, {
  status: "knowledge-author-queue",
  reviewedFile: toProjectPath(reviewedFile, root),
  expansionStdout: expansionResult?.stdout?.trim() || "",
  expansionStderr: expansionResult?.stderr?.trim() || "",
  expansionStatus: expansionResult ? expansionResult.status : null
});

console.log(JSON.stringify({
  output: toProjectPath(queueFile, root),
  lesson,
  queued: queue.length,
  expansionRan: Boolean(expansionResult),
  expansionStatus: expansionResult ? expansionResult.status : null,
  nextCommand: queue.length ? "npm run ai:stage:next" : "No pending Knowledge Author prompts found. Run npm run ai:expand -- --lesson=<lesson> --promote=true."
}, null, 2));
