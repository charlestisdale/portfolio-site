#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const workPlanFile = args.file || args.plan || "";
const requestedWorkItem = args.workItem || args.work || args.id || "";
const batchLimit = args.limit ? Number.parseInt(args.limit, 10) : 1;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function slugify(value) {
  return String(value || "work-item")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "work-item";
}

function loadJson(filePath, label) {
  if (!filePath) return null;
  const resolved = path.resolve(root, filePath);
  if (!fs.existsSync(resolved)) fail(`${label} not found: ${filePath}`);
  return { path: resolved, data: JSON.parse(fs.readFileSync(resolved, "utf8")) };
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

function findKnowledgeObject(knowledgeId) {
  for (const file of walkJsonFiles("content/knowledge")) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (data.id === knowledgeId) return { path: file, data };
  }
  return null;
}

function selectWorkItems(workPlan) {
  const candidates = asArray(workPlan.workItems).filter(item => ["create-knowledge-update", "create-update-package"].includes(item.action));
  if (!requestedWorkItem) return candidates.slice(0, Math.max(1, batchLimit));

  const selected = candidates.filter(item => item.workItemId === requestedWorkItem || item.knowledgeId === requestedWorkItem || slugify(item.workItemId) === slugify(requestedWorkItem));
  if (!selected.length) fail(`No maintainer work item matched: ${requestedWorkItem}`);
  return selected.slice(0, Math.max(1, batchLimit));
}

function compactKnowledgeObject(object) {
  return JSON.stringify(object, null, 2);
}

function conceptList(workItem) {
  return asArray(workItem.concepts).map(concept => `- ${concept.conceptId}: ${concept.title}\n  - confidence: ${concept.confidence}\n  - topMatch: ${concept.topMatch || "none"} (${concept.topMatchScore ?? "n/a"})\n  - notes: ${asArray(concept.notes).join(" | ") || "none"}`).join("\n");
}

function promptForWorkItem({ workPlan, workPlanPath, workItem, knowledge }) {
  const isPackage = workItem.action === "create-update-package";
  const outputSchema = {
    schemaVersion: "1.0.0",
    type: isPackage ? "knowledge-update-package" : "knowledge-update",
    workItemId: workItem.workItemId,
    targetKnowledgeId: workItem.knowledgeId,
    status: "needs-review",
    sourceLessonId: workPlan.lesson || null,
    proposedChanges: {
      summaryUpdates: [
        {
          text: "Replacement or supplemental summary text to add/review.",
          reason: "Why this summary update is needed based on the work item."
        }
      ],
      explanationUpdates: [
        {
          text: "Paragraph-level explanation text to add/review.",
          reason: "Why this explanation update is needed based on the work item."
        }
      ],
      factsToAdd: [
        {
          text: "Atomic fact to add if not already covered.",
          importance: "low | medium | high | exam-critical",
          tags: []
        }
      ],
      examplesToAdd: [
        {
          text: "Concrete example to add if useful.",
          importance: "low | medium | high | exam-critical",
          tags: []
        }
      ],
      commandsToAdd: [],
      assessmentSeedsToAdd: {
        examTips: [],
        commonMistakes: [],
        scenarios: [],
        pbqIdeas: [],
        questionTargets: []
      },
      relationshipsToAdd: []
    },
    preservationNotes: [],
    duplicateChecks: [],
    quality: {
      confidence: "low | medium | high",
      needsHumanReview: true,
      reviewNotes: []
    }
  };

  return `# Knowledge Maintainer Prompt

You are maintaining one existing canonical Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. You are not deciding whether this concept belongs here. The resolver and merge planner already made that routing decision.

Your job is to create a reviewable update package for the target Knowledge Object. Do not rewrite the full object. Do not create a new Knowledge Object. Do not duplicate existing facts.

## Source Files
- resolverWorkPlan: ${toProjectPath(workPlanPath, root)}
- targetKnowledgeObject: ${toProjectPath(knowledge.path, root)}

## Work Item
- workItemId: ${workItem.workItemId}
- action: ${workItem.action}
- targetKnowledgeId: ${workItem.knowledgeId}
- conceptCount: ${workItem.conceptCount}
- reason: ${workItem.reason}

## Concepts To Merge
${conceptList(workItem)}

## Existing Canonical Knowledge Object

\`\`\`json
${compactKnowledgeObject(knowledge.data)}
\`\`\`

## Required Output

Return JSON only. No markdown around the JSON.

Return one ${isPackage ? "Knowledge Update Package" : "Knowledge Update"} using this shape:

\`\`\`json
${JSON.stringify(outputSchema, null, 2)}
\`\`\`

## Required Item Shapes
- proposedChanges.summaryUpdates must be an array of objects, never strings. Each object must include text and reason.
- proposedChanges.explanationUpdates must be an array of objects, never strings. Each object must include text and reason.
- proposedChanges.factsToAdd and proposedChanges.examplesToAdd must be arrays of objects with text, optional importance, and optional tags.
- Use empty arrays when no update is needed. Do not put placeholder sample text in the final JSON.

## Maintainer Rules
- Preserve the existing Knowledge Object ID exactly: ${workItem.knowledgeId}
- Do not output a full replacement Knowledge Object.
- Do not create a new canonical concept.
- Add only the smallest useful updates needed for the supplied concepts.
- If the current object already covers something, note it in duplicateChecks instead of adding it again.
- Keep reusable knowledge certification-agnostic.
- Put curriculum-specific depth or exam emphasis in reviewNotes, not in canonical concept meaning.
- Do not include private transcript or video provenance in sources.
- If a fact depends on current vendor policy, mark it for human verification instead of presenting it as timeless.
- Keep status as needs-review.
`;
}

if (!workPlanFile) fail("Usage: node tools/ai/create-knowledge-maintainer-prompt.mjs --file=data/imports/reports/<lesson>-resolver-work-plan.json --workItem=<workItemId>");

const workPlanLoaded = loadJson(workPlanFile, "Resolver work plan file");
if (workPlanLoaded.data.generatedBy !== "resolver-work-plan") {
  fail(`Expected resolver-work-plan, received ${workPlanLoaded.data.generatedBy || "missing"}`);
}

const selected = selectWorkItems(workPlanLoaded.data);
const outDir = path.resolve(root, "data", "ai-imports", "prompts", "knowledge-maintainer");
fs.mkdirSync(outDir, { recursive: true });

const outputs = [];
for (const workItem of selected) {
  const knowledge = findKnowledgeObject(workItem.knowledgeId);
  if (!knowledge) fail(`Target Knowledge Object not found: ${workItem.knowledgeId}`);

  const prompt = promptForWorkItem({
    workPlan: workPlanLoaded.data,
    workPlanPath: workPlanLoaded.path,
    workItem,
    knowledge
  });

  const filename = `${workPlanLoaded.data.lesson || "00"}-${slugify(workItem.workItemId)}-knowledge-maintainer-prompt.md`;
  const outFile = path.join(outDir, filename);
  fs.writeFileSync(outFile, prompt, "utf8");
  outputs.push(toProjectPath(outFile, root));
}

console.log(JSON.stringify({
  outputs,
  count: outputs.length,
  selected: selected.map(item => ({ workItemId: item.workItemId, action: item.action, knowledgeId: item.knowledgeId, conceptCount: item.conceptCount })),
  next: [
    "Paste a generated Knowledge Maintainer prompt into the AI maintainer.",
    "Save the returned Knowledge Update JSON under data/ai-imports/responses/knowledge-maintainer/.",
    "Do not merge updates into canonical knowledge until validation and human review pass."
  ]
}, null, 2));
