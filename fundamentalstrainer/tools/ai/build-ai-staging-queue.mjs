#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const queueFile = path.resolve(root, args.queue || "data/ai-imports/staging-queue.json");

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

if (!lesson) fail("Usage: npm run ai:stage:build -- --lesson=02");

const reviewedFile = findReviewedFile();
if (!reviewedFile) fail(`No normalized discovery review found for lesson ${lesson}.`);

const review = readJson(reviewedFile);
const queue = [];
for (const item of review.authoringQueue || []) {
  if (hasCanonical(item) || hasDraft(item) || hasResponse(item)) continue;
  const prompt = promptFor(item);
  if (!prompt) continue;
  const expectedOutputName = `${slugify(item.proposedKnowledgeId)}.knowledge-object.json`;
  queue.push({
    conceptId: item.conceptId,
    proposedKnowledgeId: item.proposedKnowledgeId,
    title: item.title,
    promptPath: toProjectPath(prompt, root),
    outputPath: `data/ai-imports/responses/knowledge-author/${expectedOutputName}`,
    expectedOutputName
  });
}

fs.mkdirSync(path.dirname(queueFile), { recursive: true });
fs.writeFileSync(queueFile, `${JSON.stringify({ lesson, reviewedFile: toProjectPath(reviewedFile, root), queue }, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  output: toProjectPath(queueFile, root),
  lesson,
  queued: queue.length,
  nextCommand: queue.length ? "npm run ai:stage:next" : "No pending Knowledge Author prompts found."
}, null, 2));
