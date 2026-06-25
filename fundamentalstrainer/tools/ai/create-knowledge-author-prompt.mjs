#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const reviewFile = args.file;
const intelligenceFile = args.intelligence || args.source || "";
const requestedConcept = args.concept || args.id || args.knowledgeId || "";
const batchLimit = args.limit ? Number.parseInt(args.limit, 10) : 1;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function slugify(value) {
  return String(value || "concept")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "concept";
}

function loadJson(filePath, label) {
  if (!filePath) return null;
  const resolved = path.resolve(root, filePath);
  if (!fs.existsSync(resolved)) fail(`${label} not found: ${filePath}`);
  return { path: resolved, data: JSON.parse(fs.readFileSync(resolved, "utf8")) };
}

function findConceptSource(intelligence, queueItem) {
  const concepts = asArray(intelligence?.discoveredConcepts || intelligence?.conceptsDiscovered || intelligence?.concepts);
  return concepts.find(item => item.conceptId === queueItem.conceptId || item.proposedKnowledgeId === queueItem.proposedKnowledgeId) || null;
}

function relevantMerges(review, queueItem) {
  return asArray(review.mergePlan).filter(item => item.targetKnowledgeId === queueItem.proposedKnowledgeId || item.sourceConceptId === queueItem.conceptId);
}

function relevantGaps(review, queueItem) {
  return asArray(review.gapReview).filter(gap => asArray(gap.relatedConceptIds).includes(queueItem.conceptId) || asArray(gap.relatedConceptIds).includes(queueItem.proposedKnowledgeId));
}

function selectQueueItems(review) {
  const queue = asArray(review.authoringQueue);
  if (!requestedConcept) return queue.slice(0, Math.max(1, batchLimit));
  const selected = queue.filter(item => item.conceptId === requestedConcept || item.proposedKnowledgeId === requestedConcept || slugify(item.title) === slugify(requestedConcept));
  if (!selected.length) fail(`No authoringQueue item matched concept: ${requestedConcept}`);
  return selected.slice(0, Math.max(1, batchLimit));
}

function promptForItem({ review, intelligence, reviewPath, intelligencePath, item }) {
  const sourceConcept = findConceptSource(intelligence, item);
  const mergesIntoThis = relevantMerges(review, item);
  const gaps = relevantGaps(review, item);
  const domains = asArray(sourceConcept?.domains).length ? sourceConcept.domains : [];
  const type = sourceConcept?.type || "concept";
  const title = item.title || sourceConcept?.title || item.proposedKnowledgeId;
  const proposedKnowledgeId = item.proposedKnowledgeId || sourceConcept?.proposedKnowledgeId;
  const slug = slugify(proposedKnowledgeId?.split(".").at(-1) || title);

  return `# Knowledge Author Prompt

You are writing one draft Knowledge Object for a knowledge-first IT learning platform.

You are not doing Transcript Intelligence. You are not doing Discovery Review. Those stages are already complete. Your job is to author one reviewable draft Knowledge Object from the approved concept below.

## Source Files
- normalizedDiscoveryReview: ${toProjectPath(reviewPath, root)}
${intelligencePath ? `- transcriptIntelligence: ${toProjectPath(intelligencePath, root)}` : "- transcriptIntelligence: not provided"}

## Approved Concept
- conceptId: ${item.conceptId}
- proposedKnowledgeId: ${proposedKnowledgeId}
- title: ${title}
- type: ${type}
- domains: ${domains.join(", ") || "unknown"}
- priority: ${item.priority || item.authoringPriority || "normal"}
- recommendedDepth: ${item.recommendedDepth || "normal"}
- reason: ${item.reason || "Approved for Knowledge Authoring."}

## Discovery Review Requirements
Must cover:
${asArray(item.mustCover).map(value => `- ${value}`).join("\n") || "- Use the approved concept and source evidence to determine essential coverage."}

Merge guidance to preserve:
${mergesIntoThis.map(value => `- Merge ${value.sourceKnowledgeId || value.sourceConceptId} into this object: ${value.reason}`).join("\n") || "- No merge guidance targets this object."}

Relevant gap review:
${gaps.map(value => `- ${value.gapId}: ${value.recommendedAction} (${value.reason})`).join("\n") || "- No specific gap review targets this object."}

## Source Evidence From Transcript Intelligence
${asArray(sourceConcept?.sourceEvidence).map(evidence => `- ${evidence.evidenceId || "EVID"}: "${String(evidence.quote || evidence.text || "").replace(/"/g, "'")}" — ${evidence.reason || "source evidence"}`).join("\n") || "- No source evidence was available in the supplied context. Mark this clearly in quality.reviewNotes."}

## Suggested Relationships From Discovery
Prerequisites:
${asArray(sourceConcept?.prerequisites).map(value => `- ${value.proposedKnowledgeId || value.id}: ${value.reason || "suggested prerequisite"}`).join("\n") || "- None suggested."}

Relationships:
${asArray(sourceConcept?.relationshipSuggestions).map(value => `- ${value.type || "related_to"}: ${value.targetKnowledgeId || value.id || value.target} — ${value.reason || "suggested relationship"}`).join("\n") || "- None suggested."}

Curriculum placement:
${asArray(sourceConcept?.curriculumPlacementSuggestions).map(value => `- ${value.curriculumId || "curriculum"} → ${value.sectionId || "section"} → ${value.moduleId || value.proposedModuleTitle || "module"}: ${value.reason || "suggested placement"}`).join("\n") || "- Use the discovery review curriculum decision."}

## Required Output
Return JSON only. No markdown around the JSON.

Return exactly one draft Knowledge Object using this schema shape:

{
  "schemaVersion": "1.0.0",
  "id": "${proposedKnowledgeId}",
  "slug": "${slug}",
  "title": "${title}",
  "aliases": [],
  "type": "${type}",
  "status": "needs-review",
  "domains": ${JSON.stringify(domains.length ? domains : [proposedKnowledgeId?.split(".")[0] || "general"])},
  "difficulty": "foundational | intermediate | advanced",
  "importance": "low | medium | high | exam-critical",
  "certificationMappings": [
    {
      "certification": "a-plus-220-1202",
      "examCode": "220-1202",
      "objectives": [
        {
          "id": "1.0",
          "name": "Operating Systems",
          "weight": null,
          "subtopics": []
        }
      ],
      "lessons": [
        {
          "lessonId": "${review.lessonId || "01"}",
          "title": "${review.lessonTitle || "Lesson"}",
          "order": ${Number.parseInt(review.lessonId || "1", 10) || 1}
        }
      ]
    }
  ],
  "learning": {
    "summary": "2-3 sentence learner-ready summary.",
    "explanation": "2-4 paragraph explanation. Teach the concept clearly without copying the transcript.",
    "facts": [
      {
        "text": "Atomic fact that can generate questions or flashcards.",
        "importance": "low | medium | high | exam-critical",
        "tags": []
      }
    ],
    "commands": [],
    "examples": [
      {
        "text": "Concrete example or use case.",
        "context": "",
        "tags": []
      }
    ],
    "tables": [],
    "media": [],
    "notes": []
  },
  "assessmentSeeds": {
    "examTips": [],
    "commonMistakes": [],
    "scenarios": [],
    "pbqIdeas": [],
    "questionTargets": []
  },
  "relationships": {
    "prerequisites": [],
    "parents": [],
    "children": [],
    "related": [],
    "contrastsWith": [],
    "replacedBy": []
  },
  "sources": {
    "references": []
  },
  "quality": {
    "createdAt": "2026-06-25",
    "updatedAt": "2026-06-25",
    "lastReviewedAt": null,
    "reviewedBy": null,
    "confidence": "low | medium | high",
    "needsHumanReview": true,
    "reviewNotes": []
  }
}

## Authoring Rules
- Use the approved concept ID exactly: ${proposedKnowledgeId}
- Keep status as needs-review.
- Do not include private transcript or video provenance in sources. Public JSON allows sources.references only.
- Do not invent exact exam objective numbers beyond the supplied section unless clearly supported.
- Preserve source-supported facts separately in reviewNotes when needed.
- Add reviewNotes for any enriched content that was not directly supported by source evidence.
- Do not create quiz questions. Add examTips, commonMistakes, scenarios, pbqIdeas, and questionTargets only as seeds.
- Keep the object reusable and certification-agnostic even though it is mapped to A+.
- Avoid duplicating concepts that Discovery Review marked for merge.
`;
}

if (!reviewFile) fail("Usage: node tools/ai/create-knowledge-author-prompt.mjs --file=data/imports/reviewed/<discovery-review>.json --intelligence=data/imports/pending/<transcript-intelligence>.json --concept=DISC-001");

const reviewLoaded = loadJson(reviewFile, "Normalized Discovery Review file");
if (reviewLoaded.data.schemaVersion !== "normalized-discovery-review.v1") {
  fail(`Expected normalized-discovery-review.v1, received ${reviewLoaded.data.schemaVersion || "missing"}`);
}

const intelligenceLoaded = intelligenceFile ? loadJson(intelligenceFile, "Transcript Intelligence file") : null;
const selected = selectQueueItems(reviewLoaded.data);
const outDir = path.resolve(root, "data", "ai-imports", "prompts", "knowledge-author");
fs.mkdirSync(outDir, { recursive: true });

const outputs = [];
for (const item of selected) {
  const prompt = promptForItem({
    review: reviewLoaded.data,
    intelligence: intelligenceLoaded?.data,
    reviewPath: reviewLoaded.path,
    intelligencePath: intelligenceLoaded?.path,
    item
  });
  const filename = `${reviewLoaded.data.lessonId || "00"}-${slugify(item.proposedKnowledgeId || item.title)}-knowledge-author-prompt.md`;
  const outFile = path.join(outDir, filename);
  fs.writeFileSync(outFile, prompt, "utf8");
  outputs.push(toProjectPath(outFile, root));
}

console.log(JSON.stringify({
  outputs,
  count: outputs.length,
  selected: selected.map(item => ({ conceptId: item.conceptId, proposedKnowledgeId: item.proposedKnowledgeId, title: item.title })),
  next: [
    "Paste a generated Knowledge Author prompt into the AI author.",
    "Save the returned draft Knowledge Object JSON under data/ai-imports/responses/knowledge-author/.",
    "Do not promote authored objects until audit and human review pass."
  ]
}, null, 2));
