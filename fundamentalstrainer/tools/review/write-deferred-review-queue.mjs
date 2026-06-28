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

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeText(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, value, "utf8");
}

function writeJson(file, value) {
  writeText(file, `${JSON.stringify(value, null, 2)}\n`);
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function workPlanFile() {
  if (args.file || args.plan) return path.resolve(root, args.file || args.plan);
  if (!lesson) fail("Usage: node tools/review/write-deferred-review-queue.mjs --lesson=05");
  return path.resolve(root, "data", "imports", "reports", `${lesson}-resolver-work-plan.json`);
}

function itemStatus(item) {
  if (item.action === "reject") return "rejected";
  return "deferred";
}

function reviewReason(item) {
  if (item.reason) return item.reason;
  if (item.action === "reject") return "Resolver rejected this concept.";
  return "Resolver deferred this concept for human review.";
}

function conceptSummaries(item) {
  return asArray(item.concepts).map(concept => ({
    conceptId: concept.conceptId || null,
    title: concept.title || item.title || item.knowledgeId || null,
    confidence: concept.confidence || null,
    topMatch: concept.topMatch || null,
    topMatchScore: concept.topMatchScore ?? null,
    notes: asArray(concept.notes)
  }));
}

function reviewItem(item) {
  return {
    id: item.workItemId,
    status: itemStatus(item),
    action: item.action,
    knowledgeId: item.knowledgeId || null,
    reason: reviewReason(item),
    conceptCount: item.conceptCount || asArray(item.concepts).length,
    concepts: conceptSummaries(item),
    recommendedHumanAction: item.action === "reject"
      ? "Confirm rejection or reopen as a resolver work item if the concept should be retained."
      : "Review the source concept and decide whether it should become a new object, expectation, relationship, maintainer update, rejection, or future enrichment item."
  };
}

function markdownReport(queue) {
  const lines = [];
  lines.push(`# Deferred Review Queue: Lesson ${queue.lesson}`);
  lines.push("");
  lines.push(`- curriculumId: ${queue.curriculumId}`);
  lines.push(`- sourceWorkPlan: ${queue.sourceWorkPlan}`);
  lines.push(`- deferred: ${queue.counts.deferred}`);
  lines.push(`- rejected: ${queue.counts.rejected}`);
  lines.push(`- total: ${queue.items.length}`);
  lines.push("");

  for (const item of queue.items) {
    lines.push(`## ${item.id}`);
    lines.push("");
    lines.push(`- status: ${item.status}`);
    lines.push(`- action: ${item.action}`);
    lines.push(`- knowledgeId: ${item.knowledgeId || "none"}`);
    lines.push(`- reason: ${item.reason}`);
    lines.push(`- recommendedHumanAction: ${item.recommendedHumanAction}`);
    lines.push("");

    if (item.concepts.length) {
      lines.push("### Concepts");
      lines.push("");
      for (const concept of item.concepts) {
        lines.push(`- ${concept.conceptId || "unknown"}: ${concept.title || "Untitled"}`);
        if (concept.confidence) lines.push(`  - confidence: ${concept.confidence}`);
        if (concept.topMatch) lines.push(`  - topMatch: ${concept.topMatch} (${concept.topMatchScore ?? "n/a"})`);
        for (const note of concept.notes || []) lines.push(`  - note: ${note}`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

const planFile = workPlanFile();
if (!fs.existsSync(planFile)) fail(`Resolver work plan not found: ${toProjectPath(planFile, root)}`);

const workPlan = readJson(planFile);
if (workPlan.generatedBy !== "resolver-work-plan") {
  fail(`Expected resolver-work-plan, received ${workPlan.generatedBy || "missing"}`);
}

const items = asArray(workPlan.workItems)
  .filter(item => ["defer-human-review", "reject"].includes(item.action))
  .map(reviewItem);

const queue = {
  generatedBy: "deferred-review-queue-writer",
  schemaVersion: "1.0.0",
  lesson: workPlan.lesson || lesson,
  curriculumId,
  generatedAt: today,
  sourceWorkPlan: toProjectPath(planFile, root),
  counts: {
    deferred: items.filter(item => item.status === "deferred").length,
    rejected: items.filter(item => item.status === "rejected").length
  },
  items
};

const lessonId = workPlan.lesson || lesson || "00";
const outDir = path.resolve(root, "data", "imports", "review-queues");
const jsonFile = path.join(outDir, `${lessonId}-deferred-review-queue.json`);
const mdFile = path.join(outDir, `${lessonId}-deferred-review-queue.md`);

writeJson(jsonFile, queue);
writeText(mdFile, markdownReport(queue));

console.log(JSON.stringify({
  generatedBy: "deferred-review-queue-writer",
  lesson: queue.lesson,
  curriculumId,
  deferred: queue.counts.deferred,
  rejected: queue.counts.rejected,
  total: queue.items.length,
  outputs: [toProjectPath(jsonFile, root), toProjectPath(mdFile, root)],
  next: [
    "Open the Markdown review queue for human review.",
    "Deferred and rejected items are now tracked artifacts instead of blocking AI-routable lesson work."
  ]
}, null, 2));
