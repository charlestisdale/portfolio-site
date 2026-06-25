#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const inputFile = args.file;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function safeSlug(value) {
  return String(value || "discovery-review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "discovery-review";
}

function inferLessonId(text, fallback = "00") {
  const match = text.match(/- Lesson:\s*`?(\d+)`?/i) || text.match(/"lessonId"\s*:\s*"?(\d+)"?/i);
  return String(match?.[1] || fallback).padStart(2, "0");
}

function inferTitle(text, fallback = "Discovery Review") {
  const heading = text.match(/^#\s+Discovery Manifest:\s*(.+)$/m);
  if (heading?.[1]) return heading[1].trim();
  const jsonTitle = text.match(/"lessonTitle"\s*:\s*"([^"]+)"/i);
  return jsonTitle?.[1] || fallback;
}

if (!inputFile) fail("Usage: node tools/ai/create-discovery-review-prompt.mjs --file=data/imports/manifests/<manifest>.md");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Discovery manifest or transcript intelligence file not found: ${inputFile}`);

const sourceText = readText(sourcePath);
const lessonId = inferLessonId(sourceText);
const lessonTitle = inferTitle(sourceText);
const inputKind = sourcePath.toLowerCase().endsWith(".md") ? "discovery-manifest" : "transcript-intelligence-json";

const outDir = path.resolve(root, "data", "ai-imports", "prompts");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-${safeSlug(lessonTitle)}-discovery-review-prompt.md`);

const prompt = `# AI Discovery Review Prompt

You are reviewing a Transcript Intelligence discovery package for a knowledge-first IT learning platform.

You are not generating Transcript Intelligence from scratch. You are not writing Knowledge Objects. You are not recreating the original JSON. Your job is to review the discovered concepts and decide what should happen next.

## Input Metadata
- inputKind: ${inputKind}
- inputFile: ${toProjectPath(sourcePath, root)}
- lessonId: ${lessonId}
- lessonTitle: ${lessonTitle}

## Your Role
Act as a curriculum reviewer and knowledge-base gatekeeper.

For each discovered concept, decide whether it should be:

- accepted for Knowledge Authoring
- merged into an existing or proposed concept
- rejected
- deferred
- sent for enrichment before authoring

You should also review knowledge gaps, curriculum placement, relationship suggestions, duplicate risks, and rejected mentions.

## Critical Rules
- Return JSON only. Do not wrap the JSON in markdown.
- Do not recreate the Transcript Intelligence JSON.
- Do not write Knowledge Objects.
- Do not invent missing source evidence.
- Use the manifest/package as the review input.
- Preserve concept IDs and proposedKnowledgeIds when making decisions.
- Be willing to reject or merge concepts that are too broad, too thin, duplicative, or better handled as part of another concept.
- Prefer fewer, stronger Knowledge Authoring targets over many weak objects.
- Mark uncertainty clearly.

## Decision Values
Use one of these values for each concept:

- accept-for-authoring
- merge
- reject
- defer
- needs-enrichment

## Required Output Shape
{
  "schemaVersion": "discovery-review.v1",
  "lessonId": "${lessonId}",
  "lessonTitle": "${lessonTitle}",
  "sourceReviewInput": "${toProjectPath(sourcePath, root)}",
  "reviewSummary": {
    "acceptedForAuthoring": 0,
    "merge": 0,
    "rejected": 0,
    "deferred": 0,
    "needsEnrichment": 0,
    "reviewNotes": []
  },
  "conceptDecisions": [
    {
      "conceptId": "DISC-001",
      "title": "Concept title from input",
      "proposedKnowledgeId": "domain.stable-id",
      "decision": "accept-for-authoring | merge | reject | defer | needs-enrichment",
      "targetKnowledgeId": "required when decision is merge, otherwise optional",
      "authoringPriority": "high | normal | low | none",
      "recommendedDepth": "brief | normal | deep | none",
      "reason": "Explain the review decision.",
      "mustCover": [],
      "avoidAuthoringAsStandalone": false,
      "duplicateRisk": "none | low | medium | high",
      "curriculumDecision": {
        "status": "accept | change | reject | defer",
        "curriculumId": "a-plus-220-1202",
        "sectionId": "1.0",
        "moduleId": "module-id",
        "reason": "Explain curriculum decision."
      },
      "relationshipDecision": {
        "status": "accept-some | accept-all | reject-all | defer",
        "accepted": [],
        "rejected": [],
        "notes": []
      },
      "reviewFlags": []
    }
  ],
  "mergePlan": [
    {
      "sourceConceptId": "DISC-000",
      "sourceKnowledgeId": "domain.source-id",
      "targetKnowledgeId": "domain.target-id",
      "reason": "Why this should merge.",
      "preserveAuthoringGuidance": true
    }
  ],
  "authoringQueue": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "priority": "high | normal | low",
      "recommendedDepth": "brief | normal | deep",
      "reason": "Why this should go to Knowledge Author next."
    }
  ],
  "enrichmentQueue": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "neededEvidenceOrContext": [],
      "reason": "Why enrichment is needed before authoring."
    }
  ],
  "rejectedConcepts": [
    {
      "conceptId": "DISC-000",
      "proposedKnowledgeId": "domain.stable-id",
      "title": "Concept title",
      "reason": "Why this should not move forward."
    }
  ],
  "gapReview": [
    {
      "gapId": "GAP-001",
      "decision": "accept | reject | defer | convert-to-authoring-target",
      "relatedConceptIds": [],
      "reason": "Review decision for this gap.",
      "recommendedAction": "What should happen next."
    }
  ],
  "globalReviewNotes": []
}

## Review Input
${sourceText}
`;

fs.writeFileSync(outFile, prompt, "utf8");

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  sourceReviewInput: toProjectPath(sourcePath, root),
  inputKind,
  lessonId,
  lessonTitle,
  schemaVersion: "discovery-review.v1",
  next: [
    "Paste this prompt into the AI reviewer.",
    "Save the returned JSON under data/ai-imports/responses/.",
    "Do not ask the reviewer to recreate Transcript Intelligence JSON; it should output discovery-review.v1 decisions."
  ]
}, null, 2));
