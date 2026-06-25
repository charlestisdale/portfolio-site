#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const cert = args.cert || args.certification || "a-plus-220-1202";

function exists(filePath) {
  return fs.existsSync(path.resolve(root, filePath));
}

function listFiles(dir, matcher = () => true) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(full, entry.name))
    .filter(file => matcher(file))
    .map(file => toProjectPath(file, root))
    .sort();
}

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`) || path.basename(file).includes(`-${lesson}-`) || path.basename(file).includes(`/${lesson}-`);
}

function first(files) {
  return files[0] || null;
}

const cleaned = listFiles(`data/transcripts/cleaned/${cert}`, file => file.endsWith(".txt") && lessonMatch(file));
const tiPrompts = listFiles("data/ai-imports/prompts", file => file.includes("transcript-intelligence-prompt") && lessonMatch(file));
const tiResponses = listFiles("data/ai-imports/responses", file => file.includes("transcript-intelligence") && file.endsWith(".json"));
const tiPending = listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file));
const manifests = listFiles("data/imports/manifests", file => file.includes("discovery-manifest") && lessonMatch(file));
const reviewPrompts = listFiles("data/ai-imports/prompts", file => file.includes("discovery-review-prompt") && lessonMatch(file));
const reviewResponses = listFiles("data/ai-imports/responses", file => file.includes("discovery-review") && file.endsWith(".json"));
const reviewed = listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
const authorPrompts = listFiles("data/ai-imports/prompts/knowledge-author", file => file.endsWith("knowledge-author-prompt.md") && lessonMatch(file));
const authorResponses = listFiles("data/ai-imports/responses/knowledge-author", file => file.endsWith(".json"));
const authored = listFiles("data/imports/authored", file => file.endsWith(".draft.json"));

const steps = [
  {
    name: "Clean transcript",
    status: cleaned.length ? "complete" : "missing",
    files: cleaned,
    next: lesson ? `npm run ai:import:prompt -- --lesson=${lesson} --file="${first(cleaned) || `data/transcripts/cleaned/${cert}/${lesson}-lesson.txt`}"` : "Provide --lesson=<id>."
  },
  {
    name: "Transcript Intelligence prompt",
    status: tiPrompts.length ? "complete" : "missing",
    files: tiPrompts,
    next: "Paste the generated prompt into AI and save transcript-intelligence.v1 JSON under data/ai-imports/responses/."
  },
  {
    name: "Transcript Intelligence response",
    status: tiResponses.length ? "complete" : "waiting-for-ai",
    files: tiResponses,
    next: `npm run ai:import:normalize -- --file="${first(tiResponses) || "data/ai-imports/responses/<transcript-intelligence>.json"}"`
  },
  {
    name: "Normalized Transcript Intelligence",
    status: tiPending.length ? "complete" : "missing",
    files: tiPending,
    next: `npm run ai:discovery:manifest -- --file="${first(tiPending) || `data/imports/pending/${lesson || "00"}-transcript-intelligence.json`}"`
  },
  {
    name: "Discovery manifest",
    status: manifests.length ? "complete" : "missing",
    files: manifests,
    next: `npm run ai:discovery:review-prompt -- --file="${first(manifests) || "data/imports/manifests/<manifest>.md"}"`
  },
  {
    name: "Discovery Review prompt",
    status: reviewPrompts.length ? "complete" : "missing",
    files: reviewPrompts,
    next: "Paste the Discovery Review prompt into AI and save discovery-review.v1 JSON under data/ai-imports/responses/."
  },
  {
    name: "Discovery Review response",
    status: reviewResponses.length ? "complete" : "waiting-for-ai",
    files: reviewResponses,
    next: `npm run ai:discovery:review-normalize -- --file="${first(reviewResponses) || "data/ai-imports/responses/<discovery-review>.json"}"`
  },
  {
    name: "Normalized Discovery Review",
    status: reviewed.length ? "complete" : "missing",
    files: reviewed,
    next: `npm run ai:knowledge:author-prompt -- --file="${first(reviewed) || "data/imports/reviewed/<discovery-review>.json"}" --intelligence="${first(tiPending) || "data/imports/pending/<transcript-intelligence>.json"}" --concept=DISC-001`
  },
  {
    name: "Knowledge Author prompts",
    status: authorPrompts.length ? "complete" : "missing",
    files: authorPrompts,
    next: "Paste one Knowledge Author prompt into AI and save the draft Knowledge Object JSON under data/ai-imports/responses/knowledge-author/."
  },
  {
    name: "Knowledge Author responses",
    status: authorResponses.length ? "complete" : "waiting-for-ai",
    files: authorResponses,
    next: `npm run ai:knowledge:author-normalize -- --file="${first(authorResponses) || "data/ai-imports/responses/knowledge-author/<knowledge-object>.json"}"`
  },
  {
    name: "Normalized authored drafts",
    status: authored.length ? "complete" : "missing",
    files: authored,
    next: `npm run ai:knowledge:promote-authored -- --file="${first(authored) || "data/imports/authored/<draft>.json"}" --dry-run=true`
  }
];

console.log(JSON.stringify({
  generatedBy: "ai-pipeline-status",
  lesson,
  certification: cert,
  steps,
  nextIncomplete: steps.find(step => step.status !== "complete") || null
}, null, 2));
