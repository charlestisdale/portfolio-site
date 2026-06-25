#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const cert = args.cert || args.certification || "a-plus-220-1202";
const batch = args.batch ? Number.parseInt(args.batch, 10) : 1;
const promote = args.promote === "true";
const reviewed = args.reviewed === "true";
const allowOverwrite = args["allow-overwrite"] === "true";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function run(commandArgs) {
  return spawnSync(process.execPath, commandArgs, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
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

function walkJsonFiles(dir) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`);
}

function findReviewedFile() {
  return listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file))[0] || null;
}

function findIntelligenceFile() {
  return listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file))[0] || null;
}

function canonicalById(id) {
  return walkJsonFiles("content/knowledge")
    .map(file => {
      try {
        return { file, object: readJson(file) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .find(record => record.object?.id === id) || null;
}

function promptFor(item) {
  return listFiles("data/ai-imports/prompts/knowledge-author", file => {
    const base = path.basename(file);
    return file.endsWith("knowledge-author-prompt.md")
      && lessonMatch(file)
      && (base.includes(slugify(item.proposedKnowledgeId)) || base.includes(slugify(item.title)));
  })[0] || null;
}

function responseFor(item) {
  return listFiles("data/ai-imports/responses/knowledge-author", file => {
    if (!file.endsWith(".json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  })[0] || null;
}

function draftFor(item) {
  return listFiles("data/imports/authored", file => {
    if (!file.endsWith(".draft.json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  })[0] || null;
}

function promoteDraft(file) {
  const command = ["tools/knowledge/promote-authored-draft.mjs", `--file=${toProjectPath(file, root)}`];
  if (allowOverwrite) command.push("--allow-overwrite=true");
  if (reviewed) command.push("--reviewed=true");
  return run(command);
}

function dryRunDraft(file) {
  const command = ["tools/knowledge/promote-authored-draft.mjs", `--file=${toProjectPath(file, root)}`, "--dry-run=true"];
  if (allowOverwrite) command.push("--allow-overwrite=true");
  return run(command);
}

function recordExecution(executed, action, item, result) {
  executed.push({
    type: action,
    conceptId: item.conceptId,
    proposedKnowledgeId: item.proposedKnowledgeId,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  });
  return result.status === 0;
}

function statusFor(item) {
  const canonical = canonicalById(item.proposedKnowledgeId);
  const prompt = promptFor(item);
  const response = responseFor(item);
  const draft = draftFor(item);
  let status = "needs-prompt";
  if (canonical) status = "promoted";
  else if (draft) status = promote ? "ready-to-promote" : "ready-for-dry-run";
  else if (response) status = "needs-normalization";
  else if (prompt) status = "waiting-for-ai";

  return { item, status, canonical, prompt, response, draft };
}

function renderQueue(queue) {
  return queue.map(item => {
    const state = statusFor(item);
    return {
      conceptId: item.conceptId,
      proposedKnowledgeId: item.proposedKnowledgeId,
      title: item.title,
      status: state.status,
      prompt: state.prompt ? toProjectPath(state.prompt, root) : null,
      response: state.response ? toProjectPath(state.response, root) : null,
      draft: state.draft ? toProjectPath(state.draft, root) : null,
      canonical: state.canonical ? toProjectPath(state.canonical.file, root) : null
    };
  });
}

if (!lesson) fail("Usage: npm run ai:expand -- --lesson=01 [--batch=3] [--promote=true]");

const reviewedFile = findReviewedFile();
if (!reviewedFile) fail(`No normalized discovery review found for lesson ${lesson}. Run npm run ai:lesson -- --lesson=${lesson} first.`);

const intelligenceFile = findIntelligenceFile();
if (!intelligenceFile) fail(`No transcript intelligence file found for lesson ${lesson}. Run npm run ai:lesson -- --lesson=${lesson} first.`);

const review = readJson(reviewedFile);
const queue = asArray(review.authoringQueue);
if (!queue.length) fail(`No authoringQueue found in ${toProjectPath(reviewedFile, root)}`);

const executed = [];
let advancedConcepts = 0;
let waitingForAi = null;
let stoppedOnFailure = false;

for (const item of queue) {
  if (advancedConcepts >= Math.max(1, batch)) break;

  let state = statusFor(item);
  if (state.status === "promoted") continue;

  if (state.status === "needs-prompt") {
    const result = run([
      "tools/ai/create-knowledge-author-prompt.mjs",
      `--file=${toProjectPath(reviewedFile, root)}`,
      `--intelligence=${toProjectPath(intelligenceFile, root)}`,
      `--concept=${item.conceptId}`
    ]);
    if (!recordExecution(executed, "generate-prompt", item, result)) {
      stoppedOnFailure = true;
      break;
    }
    advancedConcepts += 1;
    state = statusFor(item);
  }

  if (state.status === "waiting-for-ai") {
    waitingForAi = state;
    break;
  }

  if (state.status === "needs-normalization") {
    const result = run(["tools/ai/normalize-knowledge-author-output.mjs", `--file=${toProjectPath(state.response, root)}`]);
    if (!recordExecution(executed, "normalize-author-output", item, result)) {
      stoppedOnFailure = true;
      break;
    }
    state = statusFor(item);
  }

  if (state.status === "ready-for-dry-run") {
    const result = dryRunDraft(state.draft);
    if (!recordExecution(executed, "dry-run-draft", item, result)) {
      stoppedOnFailure = true;
      break;
    }
    advancedConcepts += 1;
    continue;
  }

  if (state.status === "ready-to-promote") {
    const result = promoteDraft(state.draft);
    if (!recordExecution(executed, "promote-draft", item, result)) {
      stoppedOnFailure = true;
      break;
    }
    advancedConcepts += 1;
  }
}

const refreshed = renderQueue(queue);
const summary = refreshed.reduce((counts, item) => {
  counts[item.status] = (counts[item.status] || 0) + 1;
  counts.total += 1;
  return counts;
}, { total: 0 });

const nextWaiting = refreshed.find(item => item.status === "waiting-for-ai");
const nextNeedsPrompt = refreshed.find(item => item.status === "needs-prompt");
const nextNeedsNormalization = refreshed.find(item => item.status === "needs-normalization");
const nextReady = refreshed.find(item => item.status === "ready-for-dry-run" || item.status === "ready-to-promote");

console.log(JSON.stringify({
  generatedBy: "ai-curriculum-expansion",
  lesson,
  certification: cert,
  reviewedFile: toProjectPath(reviewedFile, root),
  intelligenceFile: toProjectPath(intelligenceFile, root),
  batch: Math.max(1, batch),
  promote,
  summary,
  executed,
  stoppedOnFailure,
  queue: refreshed,
  nextAction: waitingForAi || nextWaiting
    ? {
        type: "send-prompt-to-ai",
        conceptId: (waitingForAi || nextWaiting).item?.conceptId || nextWaiting.conceptId,
        expectedKnowledgeId: (waitingForAi || nextWaiting).item?.proposedKnowledgeId || nextWaiting.proposedKnowledgeId,
        prompt: (waitingForAi || nextWaiting).prompt ? toProjectPath((waitingForAi || nextWaiting).prompt, root) : nextWaiting.prompt,
        saveResponseUnder: "data/ai-imports/responses/knowledge-author/"
      }
    : nextNeedsNormalization
      ? {
          type: "normalize-ai-response",
          command: `npm run ai:expand -- --lesson=${lesson}${promote ? " --promote=true" : ""}`,
          conceptId: nextNeedsNormalization.conceptId
        }
      : nextReady
        ? {
            type: promote ? "promote-ready-draft" : "dry-run-ready-draft",
            command: `npm run ai:expand -- --lesson=${lesson}${promote ? " --promote=true" : ""}`,
            conceptId: nextReady.conceptId
          }
        : nextNeedsPrompt
          ? {
              type: "generate-next-prompt",
              command: `npm run ai:expand -- --lesson=${lesson}`,
              conceptId: nextNeedsPrompt.conceptId
            }
          : {
              type: "lesson-authoring-complete",
              command: "npm run validate:all"
            }
}, null, 2));
