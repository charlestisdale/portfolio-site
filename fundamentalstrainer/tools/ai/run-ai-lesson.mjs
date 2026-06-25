#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const cert = args.cert || args.certification || "a-plus-220-1202";
const concept = args.concept || "DISC-001";
const promote = args.promote === "true";
const reviewed = args.reviewed === "true";
const allowOverwrite = args["allow-overwrite"] === "true";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) process.exit(result.status || 1);
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
    const entryPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
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

function checkpoint(title, message, files = []) {
  console.log("\n" + "=".repeat(72));
  console.log(title);
  console.log("=".repeat(72));
  console.log(message);
  if (files.length) {
    console.log("\nRelevant file(s):");
    for (const file of files) console.log(`- ${toProjectPath(file, root)}`);
  }
  console.log("");
}

function canonicalMatchesId(id) {
  if (!id) return [];
  return walkJsonFiles("content/knowledge")
    .map(file => {
      try {
        return { file, object: readJson(file) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(record => record.object?.id === id);
}

function draftKnowledgeId(draftFile) {
  if (!draftFile) return "";
  try {
    return readJson(draftFile).id || "";
  } catch {
    return "";
  }
}

function findAuthoringQueueItem(reviewedFilePath) {
  const review = readJson(reviewedFilePath);
  const queue = Array.isArray(review.authoringQueue) ? review.authoringQueue : [];
  const selected = queue.find(item => item.conceptId === concept || item.proposedKnowledgeId === concept || slugify(item.title) === slugify(concept));
  if (!selected) {
    const available = queue.map(item => `${item.conceptId}: ${item.title} (${item.proposedKnowledgeId})`).join("\n- ");
    fail(`Concept ${concept} was not found in authoringQueue. Available concepts:\n- ${available}`);
  }
  return selected;
}

function matchesSelectedKnowledgeObject(file, selected) {
  try {
    const object = readJson(file);
    return object.id === selected.proposedKnowledgeId;
  } catch {
    return false;
  }
}

function selectedPromptMatches(file, selected) {
  const base = path.basename(file);
  return base.includes(slugify(selected.proposedKnowledgeId)) || base.includes(slugify(selected.title));
}

if (!lesson) fail("Usage: npm run ai:lesson -- --lesson=01 [--concept=DISC-001] [--promote=true]");

const cleaned = listFiles(`data/transcripts/cleaned/${cert}`, file => file.endsWith(".txt") && lessonMatch(file));
if (!cleaned.length) fail(`No cleaned transcript found for lesson ${lesson} under data/transcripts/cleaned/${cert}`);
const cleanedTranscript = firstProject(cleaned);

let tiPrompt = listFiles("data/ai-imports/prompts", file => file.includes("transcript-intelligence-prompt") && lessonMatch(file));
if (!tiPrompt.length) {
  run(["tools/ai/create-ai-import-prompt.mjs", `--lesson=${lesson}`, `--file=${cleanedTranscript}`]);
  tiPrompt = listFiles("data/ai-imports/prompts", file => file.includes("transcript-intelligence-prompt") && lessonMatch(file));
}

const tiResponse = listFiles("data/ai-imports/responses", file => file.includes("transcript-intelligence") && file.endsWith(".json"));
if (!tiResponse.length) {
  checkpoint(
    "WAITING FOR AI: Transcript Intelligence",
    "Paste the Transcript Intelligence prompt into ChatGPT or your AI agent, then save the returned JSON under data/ai-imports/responses/.",
    tiPrompt
  );
  process.exit(0);
}

let tiPending = listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file));
if (!tiPending.length) {
  run(["tools/ai/normalize-ai-import.mjs", `--file=${firstProject(tiResponse)}`]);
  tiPending = listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file));
}

let manifest = listFiles("data/imports/manifests", file => file.includes("discovery-manifest") && lessonMatch(file));
if (!manifest.length) {
  run(["tools/ai/create-discovery-manifest.mjs", `--file=${firstProject(tiPending)}`]);
  manifest = listFiles("data/imports/manifests", file => file.includes("discovery-manifest") && lessonMatch(file));
}

let reviewPrompt = listFiles("data/ai-imports/prompts", file => file.includes("discovery-review-prompt") && lessonMatch(file));
if (!reviewPrompt.length) {
  run(["tools/ai/create-discovery-review-prompt.mjs", `--file=${firstProject(manifest)}`]);
  reviewPrompt = listFiles("data/ai-imports/prompts", file => file.includes("discovery-review-prompt") && lessonMatch(file));
}

const reviewResponse = listFiles("data/ai-imports/responses", file => file.includes("discovery-review") && file.endsWith(".json"));
if (!reviewResponse.length) {
  checkpoint(
    "WAITING FOR AI: Discovery Review",
    "Paste the Discovery Review prompt into ChatGPT or your AI agent, then save the returned discovery-review.v1 JSON under data/ai-imports/responses/.",
    reviewPrompt
  );
  process.exit(0);
}

let reviewedFile = listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
if (!reviewedFile.length) {
  run(["tools/ai/normalize-discovery-review.mjs", `--file=${firstProject(reviewResponse)}`]);
  reviewedFile = listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
}

const selected = findAuthoringQueueItem(reviewedFile[0]);

let authorPrompt = listFiles("data/ai-imports/prompts/knowledge-author", file => file.endsWith("knowledge-author-prompt.md") && lessonMatch(file) && selectedPromptMatches(file, selected));
if (!authorPrompt.length) {
  run([
    "tools/ai/create-knowledge-author-prompt.mjs",
    `--file=${firstProject(reviewedFile)}`,
    `--intelligence=${firstProject(tiPending)}`,
    `--concept=${concept}`
  ]);
  authorPrompt = listFiles("data/ai-imports/prompts/knowledge-author", file => file.endsWith("knowledge-author-prompt.md") && lessonMatch(file) && selectedPromptMatches(file, selected));
}

const authorResponse = listFiles("data/ai-imports/responses/knowledge-author", file => file.endsWith(".json") && matchesSelectedKnowledgeObject(file, selected));
if (!authorResponse.length) {
  checkpoint(
    `WAITING FOR AI: Knowledge Author (${selected.conceptId})`,
    `Paste the Knowledge Author prompt into ChatGPT or your AI agent, then save the returned Knowledge Object JSON under data/ai-imports/responses/knowledge-author/. Expected id: ${selected.proposedKnowledgeId}`,
    authorPrompt
  );
  process.exit(0);
}

let authoredDraft = listFiles("data/imports/authored", file => file.endsWith(".draft.json") && matchesSelectedKnowledgeObject(file, selected));
if (!authoredDraft.length) {
  run(["tools/ai/normalize-knowledge-author-output.mjs", `--file=${firstProject(authorResponse)}`]);
  authoredDraft = listFiles("data/imports/authored", file => file.endsWith(".draft.json") && matchesSelectedKnowledgeObject(file, selected));
}

const draftId = draftKnowledgeId(authoredDraft[0]);
const existingCanonical = canonicalMatchesId(draftId);

if (existingCanonical.length && !promote && !allowOverwrite) {
  checkpoint(
    "ALREADY PROMOTED",
    `The authored draft id ${draftId} already exists in the canonical knowledge store. Nothing else is required unless you intentionally want to overwrite it.`,
    existingCanonical.map(record => record.file)
  );
  process.exit(0);
}

const dryRunArgs = ["tools/knowledge/promote-authored-draft.mjs", `--file=${firstProject(authoredDraft)}`, "--dry-run=true"];
if (allowOverwrite) dryRunArgs.push("--allow-overwrite=true");
run(dryRunArgs);

if (!promote) {
  checkpoint(
    "READY FOR PROMOTION",
    "Dry-run promotion passed. Re-run with --promote=true after you are ready to write this object into the canonical knowledge store.",
    authoredDraft
  );
  process.exit(0);
}

const promoteArgs = ["tools/knowledge/promote-authored-draft.mjs", `--file=${firstProject(authoredDraft)}`];
if (reviewed) promoteArgs.push("--reviewed=true");
if (allowOverwrite) promoteArgs.push("--allow-overwrite=true");
run(promoteArgs);
run(["tools/validate-architecture.mjs"]);

checkpoint(
  "AI LESSON PIPELINE COMPLETE",
  "The lesson pipeline completed through authored draft promotion and validation.",
  authoredDraft
);
