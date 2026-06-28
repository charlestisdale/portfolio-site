#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const curriculumId = args.curriculum || args.curriculumId || "a-plus-220-1202";
const today = new Date().toISOString();

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

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function queueFile() {
  if (args.file || args.queue) return path.resolve(root, args.file || args.queue);
  if (!lesson) fail("Usage: node tools/review/write-resolver-feedback.mjs --lesson=05");
  return path.resolve(root, "data", "imports", "review-queues", `${lesson}-deferred-review-queue.json`);
}

function feedbackAction(item) {
  if (item.recommendedRoute === "knowledge-update") return "expand-existing-object";
  if (item.recommendedRoute === "expectation-or-update") return "expectation-or-update";
  if (item.recommendedRoute === "future-enrichment") return "defer";
  if (item.recommendedRoute === "reject") return "reject";
  return "defer";
}

function shouldCreateFeedback(item) {
  if (!item?.id) return false;
  if (item.recommendedRoute === "knowledge-update") return Boolean(item.suggestedTargetKnowledgeId);
  if (item.recommendedRoute === "expectation-or-update") return Boolean(item.suggestedTargetKnowledgeId);
  if (["future-enrichment", "reject"].includes(item.recommendedRoute)) return true;
  return false;
}

function conceptIdFor(item) {
  const fromConcept = asArray(item.concepts)[0]?.conceptId;
  if (fromConcept) return fromConcept;
  const match = String(item.id || "").match(/disc-\d+/i);
  return match ? match[0].toUpperCase().replace("-", "-") : item.id;
}

const inputFile = queueFile();
if (!fs.existsSync(inputFile)) fail(`Deferred review queue not found: ${toProjectPath(inputFile, root)}`);

const queue = readJson(inputFile);
if (queue.generatedBy !== "deferred-review-queue-writer") {
  fail(`Expected deferred-review-queue-writer, received ${queue.generatedBy || "missing"}`);
}

const entries = asArray(queue.items)
  .filter(shouldCreateFeedback)
  .map(item => ({
    conceptId: conceptIdFor(item),
    workItemId: item.id,
    sourceStatus: item.status,
    sourceAction: item.action,
    feedbackAction: feedbackAction(item),
    targetKnowledgeId: item.suggestedTargetKnowledgeId || item.knowledgeId || null,
    recommendedRoute: item.recommendedRoute,
    triageCategory: item.triageCategory,
    rationale: item.triageRationale,
    humanReviewRequired: ["future-enrichment", "reject", "expectation-or-update"].includes(item.recommendedRoute),
    notes: [
      item.reason,
      item.recommendedHumanAction
    ].filter(Boolean)
  }));

const feedback = {
  generatedBy: "resolver-feedback-writer",
  schemaVersion: "1.0.0",
  lesson: queue.lesson || lesson,
  curriculumId: queue.curriculumId || curriculumId,
  generatedAt: today,
  sourceReviewQueue: toProjectPath(inputFile, root),
  count: entries.length,
  entries
};

const outDir = path.resolve(root, "data", "imports", "resolver-feedback");
const outFile = path.join(outDir, `${feedback.lesson || lesson || "00"}-resolver-feedback.json`);
writeJson(outFile, feedback);

console.log(JSON.stringify({
  generatedBy: "resolver-feedback-writer",
  lesson: feedback.lesson,
  curriculumId: feedback.curriculumId,
  count: feedback.count,
  output: toProjectPath(outFile, root),
  byFeedbackAction: entries.reduce((counts, entry) => {
    counts[entry.feedbackAction] = (counts[entry.feedbackAction] || 0) + 1;
    return counts;
  }, {}),
  next: [
    "Rerun npm run ai:resolver -- --lesson=<lesson> to apply resolver feedback.",
    "Rerun npm run ai:resolver:plan -- --lesson=<lesson> to rebuild the work plan."
  ]
}, null, 2));
