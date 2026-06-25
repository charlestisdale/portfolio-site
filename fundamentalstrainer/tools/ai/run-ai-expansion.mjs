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
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
  return result;
}

function runOrFail(commandArgs) {
  const result = run(commandArgs);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
  return result;
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

function firstProject(files) {
  return files[0] ? toProjectPath(files[0], root) : null;
}

function findReviewedFile() {
  const files = listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
  return files[0] || null;
}

function findIntelligenceFile() {
  const files = listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file));
  return files[0] || null;
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
  const files = listFiles("data/ai-imports/prompts/knowledge-author", file => {
    const base = path.basename(file);
    return file.endsWith("knowledge-author-prompt.md")
      && lessonMatch(file)
      && (base.includes(slugify(item.proposedKnowledgeId)) || base.includes(slugify(item.title)));
  });
  return files[0] || null;
}

function responseFor(item) {
  const files = listFiles("data/ai-imports/responses/knowledge-author", file => {
    if (!file.endsWith(".json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  });
  return files[0] || null;
}

function draftFor(item) {
  const files = listFiles("data/imports/authored", file => {
    if (!file.endsWith(".draft.json")) return false;
    try {
      return readJson(file).id === item.proposedKnowledgeId;
    } catch {
      return false;
    }
  });
  return files[0] || null;
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

if (!lesson) fail("Usage: npm run ai:expand -- --lesson=01 [--batch=3] [--promote=true]");

const reviewedFile = findReviewedFile();
if (!reviewedFile) {
  fail(`No normalized discovery review found for lesson ${lesson}. Run npm run ai:lesson -- --lesson=${lesson} first.`);
}

const intelligenceFile = findIntelligenceFile();
if (!intelligenceFile) {
  fail(`No transcript intelligence file found for lesson ${lesson}. Run npm run ai:lesson -- --lesson=${lesson} first.`);
}

const review = readJson(reviewedFile);
const queue = asArray(review.authoringQueue);
if (!queue.length) fail(`No authoringQueue found in ${toProjectPath(reviewedFile, root)}`);

const statuses = [];
const actions = [];

for (const item of queue) {
  const canonical = canonicalById(item.proposedKnowledgeId);
  const prompt = promptFor(item);
  const response = responseFor(item);
  let draft = draftFor(item);

  if (!prompt && !canonical) {
    actions.push({ type: "generate-prompt", item });
    statuses.push({ item, status: "needs-prompt", canonical, prompt, response, draft });
    continue;
  }

  if (!response && !canonical) {
    statuses.push({ item, status: "waiting-for-ai", canonical, prompt, response, draft });
    continue;
  }

  if (response && !draft && !canonical) {
    actions.push({ type: "normalize-author-output", item, response });
    statuses.push({ item, status: "needs-normalization", canonical, prompt, response, draft });
    continue;
  }

  if (draft && !canonical) {
    if (promote) {
      actions.push({ type: "promote-draft", item, draft });
      statuses.push({ item, status: "ready-to-promote", canonical, prompt, response, draft });
    } else {
      actions.push({ type: "dry-run-draft", item, draft });
      statuses.push({ item, status: "ready-for-dry-run", canonical, prompt, response, draft });
    }
    continue;
  }

  statuses.push({ item, status: "promoted", canonical, prompt, response, draft });
}

const executable = actions.slice(0, Math.max(1, batch));
const executed = [];

for (const action of executable) {
  if (action.type === "generate-prompt") {
    const result = run([
      "tools/ai/create-knowledge-author-prompt.mjs",
      `--file=${toProjectPath(reviewedFile, root)}`,
      `--intelligence=${toProjectPath(intelligenceFile, root)}`,
      `--concept=${action.item.conceptId}`
    ]);
    executed.push({ type: action.type, conceptId: action.item.conceptId, status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() });
    if (result.status !== 0) break;
  }

  if (action.type === "normalize-author-output") {
    const result = run(["tools/ai/normalize-knowledge-author-output.mjs", `--file=${toProjectPath(action.response, root)}`]);
    executed.push({ type: action.type, conceptId: action.item.conceptId, status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() });
    if (result.status !== 0) break;
  }

  if (action.type === "dry-run-draft") {
    const result = dryRunDraft(action.draft);
    executed.push({ type: action.type, conceptId: action.item.conceptId, status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() });
    if (result.status !== 0) break;
  }

  if (action.type === "promote-draft") {
    const result = promoteDraft(action.draft);
    executed.push({ type: action.type, conceptId: action.item.conceptId, status: result.status, stdout: result.stdout.trim(), stderr: result.stderr.trim() });
    if (result.status !== 0) break;
  }
}

const refreshed = queue.map(item => {
  const canonical = canonicalById(item.proposedKnowledgeId);
  const prompt = promptFor(item);
  const response = responseFor(item);
  const draft = draftFor(item);
  let status = "needs-prompt";
  if (canonical) status = "promoted";
  else if (draft) status = promote ? "ready-to-promote" : "ready-for-dry-run";
  else if (response) status = "needs-normalization";
  else if (prompt) status = "waiting-for-ai";

  return {
    conceptId: item.conceptId,
    proposedKnowledgeId: item.proposedKnowledgeId,
    title: item.title,
    status,
    prompt: prompt ? toProjectPath(prompt, root) : null,
    response: response ? toProjectPath(response, root) : null,
    draft: draft ? toProjectPath(draft, root) : null,
    canonical: canonical ? toProjectPath(canonical.file, root) : null
  };
});

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
  queue: refreshed,
  nextAction: nextWaiting
    ? {
        type: "send-prompt-to-ai",
        conceptId: nextWaiting.conceptId,
        expectedKnowledgeId: nextWaiting.proposedKnowledgeId,
        prompt: nextWaiting.prompt,
        saveResponseUnder: "data/ai-imports/responses/knowledge-author/"
      }
    : nextNeedsNormalization
      ? {
          type: "normalize-ai-response",
          command: `npm run ai:expand -- --lesson=${lesson}`,
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
