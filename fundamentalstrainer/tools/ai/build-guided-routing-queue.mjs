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
const resolverAware = args.resolver !== "false";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function tryReadJson(file) {
  try {
    return readJson(file);
  } catch {
    return null;
  }
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

function slugify(value) {
  return String(value || "work-item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "work-item";
}

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`);
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

function runNode(script, scriptArgs = []) {
  return spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

function runLessonBootstrap() {
  return runNode("tools/ai/run-ai-lesson.mjs", [`--lesson=${lesson}`]);
}

function runExpansion() {
  const command = [`--lesson=${lesson}`];
  if (promote) command.push("--promote=true");
  return runNode("tools/ai/run-ai-expansion.mjs", command);
}

function runResolverArtifacts() {
  const resolver = runNode("tools/ai/run-knowledge-resolver.mjs", [`--lesson=${lesson}`]);
  if (resolver.status !== 0) return { ok: false, stage: "resolver", resolver };

  const summary = runNode("tools/ai/build-resolver-summary.mjs", [`--lesson=${lesson}`]);
  if (summary.status !== 0) return { ok: false, stage: "resolver-summary", resolver, summary };

  const plan = runNode("tools/ai/build-resolver-work-plan.mjs", [`--lesson=${lesson}`]);
  if (plan.status !== 0) return { ok: false, stage: "resolver-work-plan", resolver, summary, plan };

  return { ok: true, resolver, summary, plan, parsedPlan: parseJsonFromStdout(plan.stdout) };
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

function findTranscriptIntelligenceFile() {
  return listFiles("data/imports/pending", file => file.includes("transcript-intelligence") && file.endsWith(".json") && lessonMatch(file))[0] || "";
}

function findKnowledgeObjectById(knowledgeId) {
  return walkJsonFiles("content/knowledge").find(file => tryReadJson(file)?.id === knowledgeId) || null;
}

function hasCanonical(knowledgeId) {
  return Boolean(findKnowledgeObjectById(knowledgeId));
}

function hasAuthorResponse(knowledgeId) {
  return listFiles("data/ai-imports/responses/knowledge-author", file => {
    if (!file.endsWith(".json")) return false;
    return tryReadJson(file)?.id === knowledgeId;
  }).length > 0;
}

function hasDraft(knowledgeId) {
  return listFiles("data/imports/authored", file => {
    if (!file.endsWith(".draft.json")) return false;
    return tryReadJson(file)?.id === knowledgeId;
  }).length > 0;
}

function hasMaintainerResponse(workItem) {
  const expected = path.resolve(root, maintainerOutputPath(workItem));
  if (fs.existsSync(expected)) return true;

  return listFiles("data/ai-imports/responses/knowledge-maintainer", file => {
    if (!file.endsWith(".json")) return false;
    const data = tryReadJson(file);
    return data?.workItemId === workItem.workItemId || data?.targetKnowledgeId === workItem.knowledgeId;
  }).length > 0;
}

function authorPromptFor(workItem) {
  return listFiles("data/ai-imports/prompts/knowledge-author", file => {
    const base = path.basename(file);
    return file.endsWith("knowledge-author-prompt.md")
      && lessonMatch(file)
      && (base.includes(slugify(workItem.knowledgeId)) || base.includes(slugify(workItem.concepts?.[0]?.title)));
  })[0] || null;
}

function createAuthorPrompt(reviewedFile, workItem) {
  const concept = workItem.concepts?.[0];
  if (!concept?.conceptId && !workItem.knowledgeId) return null;

  const command = [
    `--file=${toProjectPath(reviewedFile, root)}`,
    `--concept=${concept?.conceptId || workItem.knowledgeId}`
  ];
  const intelligence = findTranscriptIntelligenceFile();
  if (intelligence) command.push(`--intelligence=${toProjectPath(intelligence, root)}`);

  const result = runNode("tools/ai/create-knowledge-author-prompt.mjs", command);
  if (result.status !== 0) return null;

  const parsed = parseJsonFromStdout(result.stdout);
  const output = parsed?.outputs?.[0];
  return output ? path.resolve(root, output) : authorPromptFor(workItem);
}

function authorQueueItem(workItem, prompt) {
  const concept = workItem.concepts?.[0] || {};
  const expectedOutputName = `${slugify(workItem.knowledgeId)}.knowledge-object.json`;
  return {
    type: "knowledge-author",
    lesson,
    conceptId: concept.conceptId,
    proposedKnowledgeId: workItem.knowledgeId,
    expectedKnowledgeId: workItem.knowledgeId,
    title: concept.title || workItem.knowledgeId,
    resolverWorkItemId: workItem.workItemId,
    promptPath: toProjectPath(prompt, root),
    outputPath: `data/ai-imports/responses/knowledge-author/${expectedOutputName}`,
    expectedOutputName
  };
}

function maintainerPromptFor(workItem) {
  return listFiles("data/ai-imports/prompts/knowledge-maintainer", file => {
    const base = path.basename(file);
    return file.endsWith("knowledge-maintainer-prompt.md")
      && lessonMatch(file)
      && base.includes(slugify(workItem.workItemId));
  })[0] || null;
}

function createMaintainerPrompt(workPlanFile, workItem) {
  const result = runNode("tools/ai/create-knowledge-maintainer-prompt.mjs", [
    `--file=${toProjectPath(workPlanFile, root)}`,
    `--workItem=${workItem.workItemId}`
  ]);
  if (result.status !== 0) return null;

  const parsed = parseJsonFromStdout(result.stdout);
  const output = parsed?.outputs?.[0];
  return output ? path.resolve(root, output) : maintainerPromptFor(workItem);
}

function maintainerOutputPath(workItem) {
  const suffix = workItem.action === "create-update-package" ? "knowledge-update-package" : "knowledge-update";
  return `data/ai-imports/responses/knowledge-maintainer/${lesson}-${slugify(workItem.workItemId)}-${suffix}.json`;
}

function maintainerQueueItem(workItem, prompt) {
  const outputPath = maintainerOutputPath(workItem);
  return {
    type: "knowledge-maintainer",
    lesson,
    workItemId: workItem.workItemId,
    action: workItem.action,
    proposedKnowledgeId: workItem.knowledgeId,
    expectedKnowledgeId: workItem.knowledgeId,
    targetKnowledgeId: workItem.knowledgeId,
    title: workItem.concepts?.map(item => item.title).join(" + ") || workItem.knowledgeId,
    promptPath: toProjectPath(prompt, root),
    outputPath,
    expectedOutputName: path.basename(outputPath)
  };
}

function buildResolverAwareQueue({ reviewedFile, workPlan }) {
  const workPlanFile = path.resolve(root, "data", "imports", "reports", `${lesson}-resolver-work-plan.json`);
  const queue = [];
  const manualItems = [];
  const completedItems = [];

  for (const workItem of workPlan.workItems || []) {
    if (workItem.action === "create-new-object") {
      if (hasCanonical(workItem.knowledgeId) || hasDraft(workItem.knowledgeId) || hasAuthorResponse(workItem.knowledgeId)) {
        completedItems.push(workItem);
        continue;
      }
      const prompt = authorPromptFor(workItem) || createAuthorPrompt(reviewedFile, workItem);
      if (prompt) queue.push(authorQueueItem(workItem, prompt));
      else manualItems.push({ ...workItem, reason: "Could not create or locate Knowledge Author prompt." });
      continue;
    }

    if (["create-knowledge-update", "create-update-package"].includes(workItem.action)) {
      if (!hasCanonical(workItem.knowledgeId)) {
        manualItems.push({ ...workItem, reason: "Target Knowledge Object is missing, so maintainer prompt cannot be generated." });
        continue;
      }
      if (hasMaintainerResponse(workItem)) {
        completedItems.push(workItem);
        continue;
      }
      const prompt = maintainerPromptFor(workItem) || createMaintainerPrompt(workPlanFile, workItem);
      if (prompt) queue.push(maintainerQueueItem(workItem, prompt));
      else manualItems.push({ ...workItem, reason: "Could not create or locate Knowledge Maintainer prompt." });
      continue;
    }

    manualItems.push(workItem);
  }

  return { queue, manualItems, completedItems };
}

function buildLegacyAuthorQueue(reviewedFile) {
  const expansionResult = bootstrap ? runExpansion() : null;
  const expansion = parseJsonFromStdout(expansionResult?.stdout);
  const review = readJson(reviewedFile);
  const queue = [];

  for (const item of review.authoringQueue || []) {
    const workItem = {
      workItemId: `${lesson}.legacy.${item.conceptId || item.proposedKnowledgeId}`,
      knowledgeId: item.proposedKnowledgeId,
      concepts: [{ conceptId: item.conceptId, title: item.title }]
    };
    if (hasCanonical(item.proposedKnowledgeId) || hasDraft(item.proposedKnowledgeId) || hasAuthorResponse(item.proposedKnowledgeId)) continue;
    const prompt = authorPromptFor(workItem) || createAuthorPrompt(reviewedFile, workItem);
    if (prompt) queue.push(authorQueueItem(workItem, prompt));
  }

  return { queue, expansionResult, expansion };
}

function writeQueue(queue, metadata = {}) {
  fs.mkdirSync(path.dirname(queueFile), { recursive: true });
  fs.writeFileSync(queueFile, `${JSON.stringify({ lesson, ...metadata, queue }, null, 2)}\n`, "utf8");
}

if (!lesson) fail("Usage: npm run ai:stage:build -- --lesson=04");

let reviewedFile = findReviewedFile();
let bootstrapResult = null;

if (!reviewedFile && bootstrap) {
  bootstrapResult = runLessonBootstrap();
  reviewedFile = findReviewedFile();

  if (!reviewedFile) {
    const reviewPrompt = findReviewPrompt();
    const transcriptPrompt = findTranscriptPrompt();
    const waitingPrompt = reviewPrompt || transcriptPrompt;
    const expectedName = reviewPrompt ? `${lesson}-discovery-review.json` : `${lesson}-transcript-intelligence.json`;
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

if (!resolverAware) {
  const legacy = buildLegacyAuthorQueue(reviewedFile);
  const nextAction = legacy.queue.length
    ? { type: "send-prompt-to-ai", command: "npm run ai:stage:next", prompt: legacy.queue[0].promptPath, expectedKnowledgeId: legacy.queue[0].expectedKnowledgeId }
    : legacy.expansion?.nextAction || { type: "lesson-authoring-complete", command: "No pending legacy authoring work." };

  writeQueue(legacy.queue, {
    status: "legacy-knowledge-author-queue",
    reviewedFile: toProjectPath(reviewedFile, root),
    expansionStdout: legacy.expansionResult?.stdout?.trim() || "",
    expansionStderr: legacy.expansionResult?.stderr?.trim() || "",
    expansionStatus: legacy.expansionResult ? legacy.expansionResult.status : null,
    expansionSummary: legacy.expansion?.summary || null,
    expansionNextAction: nextAction
  });

  console.log(JSON.stringify({
    output: toProjectPath(queueFile, root),
    lesson,
    resolverAware: false,
    queued: legacy.queue.length,
    expansionNextAction: nextAction,
    nextCommand: legacy.queue.length ? "npm run ai:stage:next" : nextAction.command
  }, null, 2));
  process.exit(0);
}

const resolverArtifacts = runResolverArtifacts();
if (!resolverArtifacts.ok) {
  writeQueue([], {
    status: "resolver-failed",
    failedStage: resolverArtifacts.stage,
    resolverStdout: resolverArtifacts.resolver?.stdout?.trim() || "",
    resolverStderr: resolverArtifacts.resolver?.stderr?.trim() || "",
    summaryStdout: resolverArtifacts.summary?.stdout?.trim() || "",
    summaryStderr: resolverArtifacts.summary?.stderr?.trim() || "",
    planStdout: resolverArtifacts.plan?.stdout?.trim() || "",
    planStderr: resolverArtifacts.plan?.stderr?.trim() || ""
  });
  fail(`Resolver-aware queue build failed during ${resolverArtifacts.stage}.`);
}

const workPlan = resolverArtifacts.parsedPlan || readJson(path.resolve(root, "data", "imports", "reports", `${lesson}-resolver-work-plan.json`));
const routed = buildResolverAwareQueue({ reviewedFile, workPlan });
const pendingReviewItems = routed.manualItems.filter(item => !["duplicate-no-change", "reject"].includes(item.action));

const nextAction = routed.queue.length
  ? { type: "send-prompt-to-ai", command: "npm run ai:stage:next", prompt: routed.queue[0].promptPath, expectedKnowledgeId: routed.queue[0].expectedKnowledgeId }
  : pendingReviewItems.length
    ? { type: "manual-review-required", command: "Review resolver work plan items that do not have deterministic tooling yet." }
    : routed.completedItems.some(item => ["create-knowledge-update", "create-update-package"].includes(item.action))
      ? { type: "knowledge-update-review-required", command: "Review update previews, then apply approved updates explicitly." }
      : { type: "lesson-authoring-complete", command: "Resolver-aware routing has no pending AI prompts." };

writeQueue(routed.queue, {
  status: "resolver-aware-routing-queue",
  reviewedFile: toProjectPath(reviewedFile, root),
  resolverStdout: resolverArtifacts.resolver.stdout?.trim() || "",
  resolverSummaryStdout: resolverArtifacts.summary.stdout?.trim() || "",
  resolverPlanStdout: resolverArtifacts.plan.stdout?.trim() || "",
  resolverWorkPlan: `data/imports/reports/${lesson}-resolver-work-plan.json`,
  resolverCounts: workPlan.counts || null,
  manualItems: routed.manualItems.map(item => ({ workItemId: item.workItemId, action: item.action, knowledgeId: item.knowledgeId, reason: item.reason })),
  completedItems: routed.completedItems.map(item => ({ workItemId: item.workItemId, action: item.action, knowledgeId: item.knowledgeId })),
  expansionNextAction: nextAction
});

console.log(JSON.stringify({
  output: toProjectPath(queueFile, root),
  lesson,
  resolverAware: true,
  queued: routed.queue.length,
  resolverWorkPlan: `data/imports/reports/${lesson}-resolver-work-plan.json`,
  resolverCounts: workPlan.counts || null,
  queuedTypes: routed.queue.map(item => item.type),
  manualItemCount: routed.manualItems.length,
  completedItemCount: routed.completedItems.length,
  expansionNextAction: nextAction,
  nextCommand: routed.queue.length ? "npm run ai:stage:next" : nextAction.command
}, null, 2));
