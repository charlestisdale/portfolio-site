#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const curriculumId = args.curriculum || args.curriculumId || "a-plus-220-1202";
const today = new Date().toISOString();

const knownRouteHints = [
  {
    patterns: ["domain join", "domain access", "active directory"],
    category: "needs-better-target",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "windows.active-directory-domain-join",
    rationale: "Domain join is a reusable identity/management concept, not a Windows-edition-specific concept."
  },
  {
    patterns: ["bitlocker"],
    category: "low-confidence-merge",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "security.bitlocker",
    rationale: "BitLocker should enrich the reusable BitLocker concept; edition availability can be captured as update facts or curriculum expectations."
  },
  {
    patterns: ["remote desktop", "rdp"],
    category: "needs-better-target",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "windows.remote-desktop",
    rationale: "Remote Desktop client/host support belongs to a broader Remote Desktop concept with edition availability as supporting detail."
  },
  {
    patterns: ["group policy"],
    category: "needs-better-target",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "windows.group-policy",
    rationale: "Group Policy availability should enrich a Group Policy concept rather than a Windows edition object."
  },
  {
    patterns: ["applocker"],
    category: "needs-enrichment",
    recommendedRoute: "future-enrichment",
    suggestedTargetKnowledgeId: "security.application-control",
    rationale: "AppLocker is an enterprise application-control feature, but the lesson evidence is thin and should be enriched before authoring."
  },
  {
    patterns: ["branchcache"],
    category: "needs-enrichment",
    recommendedRoute: "future-enrichment",
    suggestedTargetKnowledgeId: "windows.branchcache",
    rationale: "BranchCache is only briefly described and needs enrichment before becoming canonical knowledge."
  },
  {
    patterns: ["granular user experience", "granular ux", "assigned access"],
    category: "true-human-review",
    recommendedRoute: "human-review",
    suggestedTargetKnowledgeId: null,
    rationale: "The phrase is broad and could overlap Group Policy, MDM, assigned access, or enterprise UX controls."
  },
  {
    patterns: ["32-bit", "64-bit", "32 bit", "64 bit"],
    category: "needs-better-target",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "hardware.cpu-architecture",
    rationale: "32-bit vs 64-bit support is broader than Windows and should connect to CPU/OS architecture support."
  },
  {
    patterns: ["memory limit", "memory limits"],
    category: "low-confidence-merge",
    recommendedRoute: "expectation-or-update",
    suggestedTargetKnowledgeId: "windows.windows-edition-comparison",
    rationale: "Edition memory limits are comparison facts; they may belong in an edition comparison object or curriculum expectation."
  },
  {
    patterns: ["mobile device management", "mdm"],
    category: "needs-better-target",
    recommendedRoute: "knowledge-update",
    suggestedTargetKnowledgeId: "endpoint-management.mdm",
    rationale: "MDM is a broad endpoint management concept used beyond Windows 11 Enterprise."
  },
  {
    patterns: ["mobile application management", "mam"],
    category: "needs-enrichment",
    recommendedRoute: "future-enrichment",
    suggestedTargetKnowledgeId: "endpoint-management.mam",
    rationale: "MAM is broader than this lesson but was only briefly mentioned, so it needs supporting context before authoring."
  },
  {
    patterns: ["copilot"],
    category: "confirmed-reject",
    recommendedRoute: "reject",
    suggestedTargetKnowledgeId: null,
    rationale: "The lesson mention is too shallow and not clearly useful as canonical knowledge or expectation content."
  }
];

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

function searchableText(item) {
  const concepts = asArray(item.concepts);
  return [
    item.workItemId,
    item.knowledgeId,
    item.reason,
    ...concepts.flatMap(concept => [
      concept.conceptId,
      concept.title,
      concept.topMatch,
      ...asArray(concept.notes)
    ])
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function inferTriage(item) {
  const text = searchableText(item);
  const matchedHint = knownRouteHints.find(hint => hint.patterns.some(pattern => text.includes(pattern)));
  if (matchedHint) return matchedHint;

  if (item.action === "reject") {
    return {
      category: "confirmed-reject",
      recommendedRoute: "reject",
      suggestedTargetKnowledgeId: null,
      rationale: "Resolver rejected this item and no stronger routing hint was found."
    };
  }

  const notes = asArray(item.concepts).flatMap(concept => asArray(concept.notes)).join(" ").toLowerCase();
  if (notes.includes("needs-enrichment")) {
    return {
      category: "needs-enrichment",
      recommendedRoute: "future-enrichment",
      suggestedTargetKnowledgeId: item.knowledgeId || null,
      rationale: "Discovery Review marked this item as needing enrichment before safe authoring."
    };
  }

  if (notes.includes("merge")) {
    return {
      category: "low-confidence-merge",
      recommendedRoute: "knowledge-update",
      suggestedTargetKnowledgeId: item.knowledgeId || null,
      rationale: "Discovery Review marked this as a merge, but the resolver was not confident enough to route it automatically."
    };
  }

  return {
    category: "true-human-review",
    recommendedRoute: "human-review",
    suggestedTargetKnowledgeId: item.knowledgeId || null,
    rationale: "No deterministic routing hint was found. Human review is required."
  };
}

function recommendedHumanAction(triage, item) {
  switch (triage.category) {
    case "needs-better-target":
      return `Use ${triage.suggestedTargetKnowledgeId} as the likely target, then rerun/adjust resolver routing or create the missing canonical object if it does not exist.`;
    case "low-confidence-merge":
      return `Review whether this can safely become a Knowledge Maintainer update for ${triage.suggestedTargetKnowledgeId || item.knowledgeId}.`;
    case "needs-enrichment":
      return `Leave this out of canonical import for now unless supporting evidence is added for ${triage.suggestedTargetKnowledgeId || item.knowledgeId || "the concept"}.`;
    case "confirmed-reject":
      return "Keep rejected unless later lessons provide stronger evidence or exam relevance.";
    default:
      return "Review manually and decide whether this becomes a new object, expectation, relationship, maintainer update, rejection, or future enrichment item.";
  }
}

function reviewItem(item) {
  const triage = inferTriage(item);
  return {
    id: item.workItemId,
    status: itemStatus(item),
    action: item.action,
    knowledgeId: item.knowledgeId || null,
    reason: reviewReason(item),
    triageCategory: triage.category,
    recommendedRoute: triage.recommendedRoute,
    suggestedTargetKnowledgeId: triage.suggestedTargetKnowledgeId,
    triageRationale: triage.rationale,
    conceptCount: item.conceptCount || asArray(item.concepts).length,
    concepts: conceptSummaries(item),
    recommendedHumanAction: recommendedHumanAction(triage, item)
  };
}

function countBy(items, field) {
  return items.reduce((counts, item) => {
    const key = item[field] || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
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

  lines.push("## Triage Summary");
  lines.push("");
  for (const [category, count] of Object.entries(queue.counts.byTriageCategory)) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push("");

  lines.push("## Recommended Route Summary");
  lines.push("");
  for (const [route, count] of Object.entries(queue.counts.byRecommendedRoute)) {
    lines.push(`- ${route}: ${count}`);
  }
  lines.push("");

  for (const item of queue.items) {
    lines.push(`## ${item.id}`);
    lines.push("");
    lines.push(`- status: ${item.status}`);
    lines.push(`- action: ${item.action}`);
    lines.push(`- knowledgeId: ${item.knowledgeId || "none"}`);
    lines.push(`- triageCategory: ${item.triageCategory}`);
    lines.push(`- recommendedRoute: ${item.recommendedRoute}`);
    lines.push(`- suggestedTargetKnowledgeId: ${item.suggestedTargetKnowledgeId || "none"}`);
    lines.push(`- triageRationale: ${item.triageRationale}`);
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
  schemaVersion: "1.1.0",
  lesson: workPlan.lesson || lesson,
  curriculumId,
  generatedAt: today,
  sourceWorkPlan: toProjectPath(planFile, root),
  counts: {
    deferred: items.filter(item => item.status === "deferred").length,
    rejected: items.filter(item => item.status === "rejected").length,
    byTriageCategory: countBy(items, "triageCategory"),
    byRecommendedRoute: countBy(items, "recommendedRoute")
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
  byTriageCategory: queue.counts.byTriageCategory,
  byRecommendedRoute: queue.counts.byRecommendedRoute,
  outputs: [toProjectPath(jsonFile, root), toProjectPath(mdFile, root)],
  next: [
    "Open the Markdown review queue for human review.",
    "Use triageCategory, recommendedRoute, and suggestedTargetKnowledgeId to decide the next deterministic resolver improvement."
  ]
}, null, 2));
