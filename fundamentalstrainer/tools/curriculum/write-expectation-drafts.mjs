#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const curriculumId = args.curriculum || args.curriculumId || "a-plus-220-1202";
const today = new Date().toISOString().slice(0, 10);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function unique(values) {
  return [...new Set(asArray(values).filter(value => typeof value === "string" && value.trim()).map(value => value.trim()))];
}

function mergeUnique(existing, additions) {
  return unique([...asArray(existing), ...asArray(additions)]);
}

function expectationFileFor(knowledgeId) {
  const [domain, ...parts] = String(knowledgeId || "general.unknown").split(".");
  const slug = slugify(parts.join("-") || knowledgeId);
  return path.resolve(root, "content", "expectations", curriculumId, slugify(domain), `${slug}.json`);
}

function skillFromConcept(concept, index) {
  const title = concept?.title || concept?.conceptId || `Concept ${index + 1}`;
  return {
    id: slugify(title).slice(0, 80) || `skill-${index + 1}`,
    description: `Recognize and explain ${title} in the context of this curriculum.`,
    depth: "recognize-and-explain"
  };
}

function noteFromConcept(concept) {
  const parts = [];
  if (concept?.conceptId) parts.push(concept.conceptId);
  if (concept?.title) parts.push(concept.title);
  if (concept?.decision) parts.push(`resolver decision: ${concept.decision}`);
  if (concept?.confidence) parts.push(`confidence: ${concept.confidence}`);
  if (concept?.topMatch) parts.push(`top match: ${concept.topMatch}`);
  const notes = asArray(concept?.notes).filter(Boolean).join(" | ");
  if (notes) parts.push(notes);
  return parts.join(" — ");
}

function buildExpectation(workItem, existing = null) {
  const knowledgeId = workItem.knowledgeId;
  const concepts = asArray(workItem.concepts);
  const base = existing || {
    schemaVersion: "1.0.0",
    id: `${curriculumId}.${knowledgeId}`,
    curriculumId,
    knowledgeId,
    status: "needs-review",
    expectedDepth: "recognize-and-explain",
    objectiveIds: [],
    moduleIds: [],
    includeTags: ["fundamental"],
    excludeTags: [],
    requiredSkills: [],
    assessmentStyles: ["multiple-choice", "basic-scenario-recognition"],
    labRequired: false,
    pbqRelevance: "medium",
    notes: [],
    quality: {
      createdAt: today,
      updatedAt: today,
      lastReviewedAt: null,
      reviewedBy: null,
      confidence: "medium",
      needsHumanReview: true,
      reviewNotes: []
    }
  };

  const conceptSkills = concepts.map(skillFromConcept);
  const existingSkillIds = new Set(asArray(base.requiredSkills).map(skill => skill?.id).filter(Boolean));
  const requiredSkills = [
    ...asArray(base.requiredSkills),
    ...conceptSkills.filter(skill => !existingSkillIds.has(skill.id))
  ];

  const conceptNotes = concepts.map(noteFromConcept).filter(Boolean);
  const workItemNote = `${workItem.workItemId}: ${workItem.reason || "Expectation generated from resolver work item."}`;

  return {
    ...base,
    schemaVersion: "1.0.0",
    id: `${curriculumId}.${knowledgeId}`,
    curriculumId,
    knowledgeId,
    status: base.status === "reviewed" ? "needs-review" : (base.status || "needs-review"),
    expectedDepth: base.expectedDepth || "recognize-and-explain",
    objectiveIds: unique(base.objectiveIds),
    moduleIds: unique(base.moduleIds),
    includeTags: mergeUnique(base.includeTags, ["fundamental", `lesson-${lesson || "unknown"}`]),
    excludeTags: unique(base.excludeTags),
    requiredSkills,
    assessmentStyles: mergeUnique(base.assessmentStyles, ["multiple-choice", "basic-scenario-recognition"]),
    labRequired: Boolean(base.labRequired),
    pbqRelevance: base.pbqRelevance || "medium",
    notes: mergeUnique(base.notes, [workItemNote, ...conceptNotes]),
    quality: {
      ...(base.quality || {}),
      createdAt: base.quality?.createdAt || today,
      updatedAt: today,
      lastReviewedAt: base.quality?.lastReviewedAt ?? null,
      reviewedBy: base.quality?.reviewedBy ?? null,
      confidence: base.quality?.confidence || "medium",
      needsHumanReview: true,
      reviewNotes: mergeUnique(base.quality?.reviewNotes, [
        `Generated or updated from resolver expectation work item ${workItem.workItemId}. Human review required before treating this expectation as finalized.`
      ])
    }
  };
}

function workPlanFile() {
  if (args.file || args.plan) return path.resolve(root, args.file || args.plan);
  if (!lesson) fail("Usage: npm run expectations:write -- --lesson=05");
  return path.resolve(root, "data", "imports", "reports", `${lesson}-resolver-work-plan.json`);
}

const planFile = workPlanFile();
if (!fs.existsSync(planFile)) fail(`Resolver work plan not found: ${toProjectPath(planFile, root)}`);

const workPlan = readJson(planFile);
if (workPlan.generatedBy !== "resolver-work-plan") {
  fail(`Expected resolver-work-plan, received ${workPlan.generatedBy || "missing"}`);
}

const items = asArray(workPlan.workItems).filter(item => item.action === "create-or-update-expectation");
const outputs = [];

for (const item of items) {
  if (!item.knowledgeId) continue;
  const file = expectationFileFor(item.knowledgeId);
  const existing = fs.existsSync(file) ? readJson(file) : null;
  const expectation = buildExpectation(item, existing);
  writeJson(file, expectation);
  outputs.push({
    workItemId: item.workItemId,
    knowledgeId: item.knowledgeId,
    output: toProjectPath(file, root),
    updatedExisting: Boolean(existing)
  });
}

console.log(JSON.stringify({
  generatedBy: "expectation-draft-writer",
  schemaVersion: "1.0.0",
  lesson: workPlan.lesson || lesson,
  curriculumId,
  sourceWorkPlan: toProjectPath(planFile, root),
  expectationCount: outputs.length,
  outputs,
  next: [
    "Run npm run validate:expectations.",
    "Review generated expectation files before treating them as finalized.",
    "Run npm run validate:all after expectation review."
  ]
}, null, 2));
