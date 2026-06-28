#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const cert = args.cert || args.certification || "a-plus-220-1202";
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const dryRun = args["dry-run"] === "true";
const minimumCandidateScore = Number(args["minimum-score"] || 20);
const strongMatchScore = Number(args["strong-score"] || 85);
const outputDir = path.resolve(root, "data", "imports", "resolver");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
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

function writeJson(file, value) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
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

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`);
}

function slugify(value) {
  return String(value || "resolver-result")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "resolver-result";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9. -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(value) {
  return new Set(normalizeText(value).split(/[.\s-]+/).filter(token => token.length >= 3));
}

function overlapScore(left, right) {
  if (!left.size || !right.size) return 0;
  const overlap = [...left].filter(token => right.has(token)).length;
  return Math.round((overlap / Math.max(left.size, right.size)) * 35);
}

function collectTags(object) {
  return [
    ...asArray(object.tags),
    ...asArray(object.domains),
    ...asArray(object.learning?.facts).flatMap(item => asArray(item.tags)),
    ...asArray(object.learning?.examples).flatMap(item => asArray(item.tags)),
    ...asArray(object.learning?.commands).flatMap(item => asArray(item.tags)),
    ...asArray(object.assessmentSeeds?.examTips).flatMap(item => asArray(item.tags)),
    ...asArray(object.assessmentSeeds?.commonMistakes).flatMap(item => asArray(item.tags)),
    ...asArray(object.assessmentSeeds?.scenarios).flatMap(item => asArray(item.tags)),
    ...asArray(object.assessmentSeeds?.pbqIdeas).flatMap(item => asArray(item.tags))
  ].map(normalizeText).filter(Boolean);
}

function collectAliases(object) {
  return [
    ...asArray(object.aliases),
    ...asArray(object.metadata?.aliases),
    ...asArray(object.learning?.aliases),
    ...asArray(object.search?.aliases)
  ].map(normalizeText).filter(Boolean);
}

function collectRelationshipIds(object) {
  return [
    ...asArray(object.relationships?.prerequisites),
    ...asArray(object.relationships?.parents),
    ...asArray(object.relationships?.children),
    ...asArray(object.relationships?.replacedBy),
    ...asArray(object.relationships?.related).map(item => item?.id),
    ...asArray(object.relationships?.contrastsWith).map(item => item?.id)
  ].filter(Boolean);
}

function collectObjectSearchText(object) {
  return normalizeText([
    object.id,
    object.slug,
    object.title,
    object.type,
    ...asArray(object.domains),
    ...collectAliases(object),
    ...collectTags(object),
    object.learning?.summary,
    object.learning?.explanation,
    ...asArray(object.learning?.facts).map(item => typeof item === "string" ? item : item?.text),
    ...asArray(object.learning?.examples).map(item => typeof item === "string" ? item : item?.text),
    ...asArray(object.learning?.commands).map(item => typeof item === "string" ? item : `${item?.command || ""} ${item?.description || ""}`),
    ...collectRelationshipIds(object)
  ].filter(Boolean).join(" "));
}

function canonicalKnowledgeObjects() {
  const objects = new Map();
  for (const file of walkJsonFiles("content/knowledge")) {
    const object = readJson(file);
    if (!object.id) continue;
    objects.set(object.id, {
      ...object,
      __file: file,
      __aliases: collectAliases(object),
      __tags: collectTags(object),
      __relationshipIds: collectRelationshipIds(object),
      __searchText: collectObjectSearchText(object)
    });
  }
  return objects;
}

function expectationIndex() {
  const byKnowledgeId = new Map();
  const ids = new Set();

  for (const file of walkJsonFiles("content/expectations")) {
    const expectation = readJson(file);
    if (!expectation.id || !expectation.knowledgeId) continue;
    ids.add(expectation.id);
    if (!byKnowledgeId.has(expectation.knowledgeId)) byKnowledgeId.set(expectation.knowledgeId, []);
    byKnowledgeId.get(expectation.knowledgeId).push(expectation.id);
  }

  return { byKnowledgeId, ids };
}

function graphIndex() {
  const relationshipHints = new Map();

  for (const file of walkJsonFiles("content/relationships")) {
    const graph = readJson(file);
    for (const edge of asArray(graph.relationships)) {
      for (const id of [edge.sourceId, edge.targetId].filter(Boolean)) {
        if (!relationshipHints.has(id)) relationshipHints.set(id, []);
        relationshipHints.get(id).push(edge.id || `${edge.sourceId}.${edge.type}.${edge.targetId}`);
      }
    }
  }

  return relationshipHints;
}

function feedbackFileForLesson() {
  if (args.feedback) return path.resolve(root, args.feedback);
  if (!lesson) return null;
  return path.resolve(root, "data", "imports", "resolver-feedback", `${lesson}-resolver-feedback.json`);
}

function resolverFeedbackIndex() {
  const file = feedbackFileForLesson();
  const feedback = file && fs.existsSync(file) ? tryReadJson(file) : null;
  const byConceptId = new Map();
  if (!feedback || feedback.generatedBy !== "resolver-feedback-writer") {
    return { file, byConceptId, count: 0 };
  }

  for (const entry of asArray(feedback.entries)) {
    if (!entry.conceptId) continue;
    byConceptId.set(String(entry.conceptId).toUpperCase(), entry);
  }

  return { file, byConceptId, count: byConceptId.size };
}

function feedbackForDecision(decision, feedback) {
  if (!decision?.conceptId) return null;
  return feedback.byConceptId.get(String(decision.conceptId).toUpperCase()) || null;
}

function findReviewedFiles() {
  return listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
}

function candidateScore(decision, object) {
  const proposedId = normalizeText(decision.proposedKnowledgeId);
  const targetId = normalizeText(decision.targetKnowledgeId);
  const title = normalizeText(decision.title);
  const objectId = normalizeText(object.id);
  const objectTitle = normalizeText(object.title);
  const objectSlug = normalizeText(object.slug);
  const reasons = [];
  let score = 0;

  if (proposedId && proposedId === objectId) {
    score += 100;
    reasons.push("exact-proposed-id");
  }

  if (targetId && targetId === objectId) {
    score += 100;
    reasons.push("exact-target-id");
  }

  if (title && title === objectTitle) {
    score += 90;
    reasons.push("exact-title");
  }

  const titleSlug = slugify(title);
  if (titleSlug && titleSlug === objectSlug) {
    score += 75;
    reasons.push("title-slug-match");
  }

  if (object.__aliases.some(alias => alias === title || alias === proposedId || alias === titleSlug)) {
    score += 60;
    reasons.push("alias-match");
  }

  const proposedSegments = new Set(proposedId.split(/[.\s-]+/).filter(Boolean));
  const objectSegments = new Set(objectId.split(/[.\s-]+/).filter(Boolean));
  const sharedSegments = [...proposedSegments].filter(segment => objectSegments.has(segment));
  if (sharedSegments.length) {
    score += Math.min(30, sharedSegments.length * 10);
    reasons.push("shared-id-segment");
  }

  const sharedWordScore = overlapScore(words(`${decision.title} ${decision.proposedKnowledgeId}`), words(object.__searchText));
  if (sharedWordScore) {
    score += sharedWordScore;
    reasons.push("shared-keywords");
  }

  const decisionText = normalizeText([decision.title, decision.proposedKnowledgeId, ...asArray(decision.mustCover), ...asArray(decision.reviewFlags)].join(" "));
  const sharedTags = object.__tags.filter(tag => tag && decisionText.includes(tag));
  if (sharedTags.length) {
    score += Math.min(24, sharedTags.length * 6);
    reasons.push("shared-tags");
  }

  return {
    score: Math.min(100, score),
    reasons: [...new Set(reasons)]
  };
}

function candidateMatches(decision, objects, expectations, feedbackEntry = null) {
  const matches = [...objects.values()]
    .map(object => {
      const match = candidateScore(decision, object);
      return {
        knowledgeId: object.id,
        title: object.title || object.id,
        matchScore: match.score,
        matchReasons: match.reasons,
        existingExpectationIds: expectations.byKnowledgeId.get(object.id) || []
      };
    })
    .filter(match => match.matchScore >= minimumCandidateScore)
    .sort((a, b) => b.matchScore - a.matchScore || a.knowledgeId.localeCompare(b.knowledgeId))
    .slice(0, 5);

  const feedbackTarget = feedbackEntry?.targetKnowledgeId;
  if (feedbackTarget && objects.has(feedbackTarget)) {
    const object = objects.get(feedbackTarget);
    const existingIndex = matches.findIndex(match => match.knowledgeId === feedbackTarget);
    const feedbackMatch = {
      knowledgeId: object.id,
      title: object.title || object.id,
      matchScore: 100,
      matchReasons: ["resolver-feedback"],
      existingExpectationIds: expectations.byKnowledgeId.get(object.id) || []
    };
    if (existingIndex >= 0) matches.splice(existingIndex, 1);
    matches.unshift(feedbackMatch);
  }

  return matches.slice(0, 5);
}

function resolverDecision(reviewDecision, matches, objects, feedbackEntry = null) {
  const exactProposedExists = reviewDecision.proposedKnowledgeId && objects.has(reviewDecision.proposedKnowledgeId);
  const targetExists = reviewDecision.targetKnowledgeId && objects.has(reviewDecision.targetKnowledgeId);
  const feedbackTargetExists = feedbackEntry?.targetKnowledgeId && objects.has(feedbackEntry.targetKnowledgeId);
  const best = matches[0];
  const hasStrongMatch = best && best.matchScore >= strongMatchScore;

  if (feedbackEntry?.feedbackAction === "reject") return "reject";
  if (feedbackEntry?.feedbackAction === "defer") return "defer";
  if (feedbackEntry?.feedbackAction === "expand-existing-object") return feedbackTargetExists ? "expand-existing-object" : "defer";
  if (feedbackEntry?.feedbackAction === "expectation-or-update") return feedbackTargetExists ? "expectation-only" : "defer";

  if (reviewDecision.decision === "reject") return "reject";
  if (reviewDecision.decision === "defer" || reviewDecision.decision === "needs-enrichment") return "defer";
  if (reviewDecision.decision === "merge") return targetExists || hasStrongMatch ? "expand-existing-object" : "defer";
  if (targetExists) return "expand-existing-object";
  if (exactProposedExists) return "expectation-only";
  if (hasStrongMatch) return "expand-existing-object";
  return "new-object";
}

function confidenceFor(decision, matches, feedbackEntry = null) {
  if (feedbackEntry?.feedbackAction === "expand-existing-object" && matches[0]?.matchReasons?.includes("resolver-feedback")) return "high";
  if (feedbackEntry?.feedbackAction) return "medium";
  const bestScore = matches[0]?.matchScore || 0;
  if (["reject", "defer"].includes(decision)) return "medium";
  if (bestScore >= 90) return "high";
  if (bestScore >= 60) return "medium";
  return "low";
}

function recommendedActions(decision, resolverDecisionValue, matches, feedbackEntry = null) {
  const bestKnowledgeId = matches[0]?.knowledgeId || feedbackEntry?.targetKnowledgeId || decision.targetKnowledgeId || decision.proposedKnowledgeId;

  if (resolverDecisionValue === "new-object") {
    return [
      {
        type: "create-new-object",
        knowledgeId: decision.proposedKnowledgeId,
        curriculumId: cert,
        notes: "No strong existing canonical match was found. Human review should confirm this is not a duplicate before Knowledge Authoring."
      }
    ];
  }

  if (resolverDecisionValue === "expand-existing-object") {
    return [
      {
        type: "create-update-package",
        knowledgeId: bestKnowledgeId,
        curriculumId: cert,
        notes: feedbackEntry
          ? `Resolver feedback routed this concept to ${bestKnowledgeId}. Use a Knowledge Update Package instead of creating a duplicate object.`
          : "Existing canonical knowledge appears related. Use a Knowledge Update Package instead of creating a duplicate object."
      }
    ];
  }

  if (resolverDecisionValue === "expectation-only") {
    return [
      {
        type: "create-expectation",
        knowledgeId: bestKnowledgeId,
        curriculumId: cert,
        notes: feedbackEntry
          ? `Resolver feedback routed this concept to ${bestKnowledgeId}. Create or update curriculum depth expectations unless reusable canonical knowledge is missing.`
          : "The canonical object already exists. Create or update curriculum depth expectations instead of authoring duplicate knowledge."
      }
    ];
  }

  if (resolverDecisionValue === "relationship-only") {
    return [
      {
        type: "create-relationship",
        knowledgeId: bestKnowledgeId,
        curriculumId: cert,
        notes: "Only relationship changes appear necessary."
      }
    ];
  }

  if (resolverDecisionValue === "duplicate-no-change") {
    return [
      {
        type: "no-change",
        knowledgeId: bestKnowledgeId,
        curriculumId: cert,
        notes: "The source appears to repeat existing knowledge without requiring a content, expectation, or relationship update."
      }
    ];
  }

  if (resolverDecisionValue === "reject") {
    return [{ type: "reject", notes: feedbackEntry?.rationale || decision.reason || "Rejected during Discovery Review." }];
  }

  return [{
    type: "defer",
    notes: feedbackEntry?.targetKnowledgeId && !matches[0]?.matchReasons?.includes("resolver-feedback")
      ? `Resolver feedback suggested ${feedbackEntry.targetKnowledgeId}, but that target does not exist yet.`
      : decision.reason || "Deferred until more evidence or review context is available."
  }];
}

function resolverContext(decision, matches, graphRelationships, expectations, feedbackEntry = null) {
  const matchedIds = matches.map(match => match.knowledgeId);
  return {
    searchedFields: [
      "id",
      "title",
      "slug",
      "aliases",
      "domains",
      "tags",
      "learning.summary",
      "learning.facts",
      "relationships",
      "expectations",
      "resolver-feedback"
    ],
    searchTerms: [
      decision.proposedKnowledgeId,
      decision.targetKnowledgeId,
      decision.title,
      ...asArray(decision.mustCover),
      ...asArray(decision.reviewFlags)
    ].filter(Boolean),
    relationshipHints: matchedIds.flatMap(id => graphRelationships.get(id) || []).slice(0, 20),
    expectationHints: matchedIds.flatMap(id => expectations.byKnowledgeId.get(id) || []).slice(0, 20),
    resolverFeedback: feedbackEntry ? {
      feedbackAction: feedbackEntry.feedbackAction,
      targetKnowledgeId: feedbackEntry.targetKnowledgeId,
      recommendedRoute: feedbackEntry.recommendedRoute,
      triageCategory: feedbackEntry.triageCategory,
      rationale: feedbackEntry.rationale
    } : null
  };
}

function buildResolverResult({ review, decision, objects, expectations, graphRelationships, feedback }) {
  const feedbackEntry = feedbackForDecision(decision, feedback);
  const matches = candidateMatches(decision, objects, expectations, feedbackEntry);
  const resolvedDecision = resolverDecision(decision, matches, objects, feedbackEntry);
  const proposedKnowledgeId = resolvedDecision === "new-object"
    ? decision.proposedKnowledgeId
    : matches[0]?.knowledgeId || feedbackEntry?.targetKnowledgeId || decision.targetKnowledgeId || decision.proposedKnowledgeId;

  return {
    schemaVersion: "1.0.0",
    sourceLessonId: review.lessonId || lesson || "00",
    curriculumId: cert,
    conceptId: decision.conceptId,
    discoveredTitle: decision.title,
    proposedKnowledgeId,
    decision: resolvedDecision,
    confidence: confidenceFor(resolvedDecision, matches, feedbackEntry),
    candidateMatches: matches,
    recommendedActions: recommendedActions(decision, resolvedDecision, matches, feedbackEntry),
    resolverContext: resolverContext(decision, matches, graphRelationships, expectations, feedbackEntry),
    humanReviewRequired: Boolean(feedbackEntry?.humanReviewRequired) || ["defer", "reject"].includes(resolvedDecision),
    reviewNotes: [
      `Discovery Review decision: ${decision.decision}`,
      decision.reason || "No Discovery Review reason provided.",
      feedbackEntry ? `Resolver feedback applied: ${feedbackEntry.feedbackAction} → ${feedbackEntry.targetKnowledgeId || "none"}` : null,
      feedbackEntry?.rationale || null
    ].filter(Boolean)
  };
}

function outputFileFor(review, decision) {
  const lessonId = review.lessonId || lesson || "00";
  const conceptSlug = slugify(decision.proposedKnowledgeId || decision.title || decision.conceptId);
  const conceptId = slugify(decision.conceptId || "concept");
  return path.join(outputDir, `${lessonId}-${conceptId}-${conceptSlug}-resolver-result.json`);
}

function runValidateResolver() {
  return spawnSync(process.execPath, ["tools/validate-resolver-results.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

const reviewedFiles = findReviewedFiles();
if (!reviewedFiles.length) fail(`No reviewed discovery packages found for lesson ${lesson || "all"}.`);

const objects = canonicalKnowledgeObjects();
const expectations = expectationIndex();
const graphRelationships = graphIndex();
const feedback = resolverFeedbackIndex();
const written = [];
const skipped = [];
const decisions = [];
const feedbackApplied = [];

for (const file of reviewedFiles) {
  const review = readJson(file);
  for (const decision of asArray(review.conceptDecisions)) {
    if (!decision.conceptId || !decision.proposedKnowledgeId) {
      skipped.push({ file: toProjectPath(file, root), conceptId: decision.conceptId || "", reason: "Missing conceptId or proposedKnowledgeId." });
      continue;
    }

    const result = buildResolverResult({ review, decision, objects, expectations, graphRelationships, feedback });
    const outFile = outputFileFor(review, decision);
    writeJson(outFile, result);
    written.push(toProjectPath(outFile, root));
    if (result.resolverContext.resolverFeedback) {
      feedbackApplied.push({
        conceptId: result.conceptId,
        decision: result.decision,
        proposedKnowledgeId: result.proposedKnowledgeId,
        feedbackAction: result.resolverContext.resolverFeedback.feedbackAction,
        targetKnowledgeId: result.resolverContext.resolverFeedback.targetKnowledgeId
      });
    }
    decisions.push({
      conceptId: result.conceptId,
      discoveredTitle: result.discoveredTitle,
      proposedKnowledgeId: result.proposedKnowledgeId,
      decision: result.decision,
      confidence: result.confidence,
      topMatch: result.candidateMatches[0]?.knowledgeId || null,
      topMatchScore: result.candidateMatches[0]?.matchScore || 0
    });
  }
}

const validation = dryRun ? { status: 0, stdout: "dry run; validation not executed", stderr: "" } : runValidateResolver();
if (validation.status !== 0) {
  console.error(validation.stdout || "");
  console.error(validation.stderr || "");
  console.error("Knowledge resolver wrote changes but resolver validation failed.");
  process.exit(validation.status || 1);
}

console.log(JSON.stringify({
  generatedBy: "deterministic-knowledge-resolver",
  resolverType: "canonical-knowledge-search-v1",
  dryRun,
  certification: cert,
  lesson,
  reviewedFiles: reviewedFiles.map(file => toProjectPath(file, root)),
  canonicalKnowledgeObjects: objects.size,
  expectationCount: expectations.ids.size,
  resolverFeedback: feedback.file ? {
    file: toProjectPath(feedback.file, root),
    count: feedback.count,
    appliedCount: feedbackApplied.length,
    applied: feedbackApplied
  } : null,
  outputDir: toProjectPath(outputDir, root),
  writtenCount: written.length,
  skippedCount: skipped.length,
  written,
  skipped,
  decisions,
  validation: dryRun ? "skipped-dry-run" : "passed",
  next: [
    "Review resolver result JSON before Knowledge Authoring or Knowledge Maintainer work.",
    "Use new-object only when no existing canonical Knowledge Object covers the discovered concept.",
    "Use expand-existing-object or expectation-only to avoid duplicate canonical concepts."
  ]
}, null, 2));
