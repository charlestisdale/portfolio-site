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

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function bullet(items, fallback = "None") {
  const list = asArray(items).filter(Boolean);
  if (!list.length) return `- ${fallback}`;
  return list.map(item => `- ${item}`).join("\n");
}

function evidenceSummary(evidenceItems) {
  const evidence = asArray(evidenceItems).slice(0, 3);
  if (!evidence.length) return "- No source evidence provided.";
  return evidence.map(item => {
    const quote = String(item.quote || item.text || "").trim();
    const reason = String(item.reason || "").trim();
    return `- ${quote}${reason ? ` — ${reason}` : ""}`;
  }).join("\n");
}

function relationshipSummary(concept) {
  const relationships = asArray(concept.relationshipSuggestions).slice(0, 6);
  if (!relationships.length) return "- None suggested.";
  return relationships.map(item => `- ${item.type || "related_to"}: ${item.targetKnowledgeId || item.id || item.target || "unknown"}${item.reason ? ` — ${item.reason}` : ""}`).join("\n");
}

function placementSummary(concept) {
  const placements = asArray(concept.curriculumPlacementSuggestions).slice(0, 3);
  if (!placements.length) return "- No placement suggested.";
  return placements.map(item => {
    const location = [item.curriculumId, item.sectionId, item.moduleId || item.proposedModuleTitle].filter(Boolean).join(" → ");
    return `- ${location || "Unmapped"}${item.reason ? ` — ${item.reason}` : ""}`;
  }).join("\n");
}

function mergeSummary(concept, globalMerges) {
  const own = concept.mergeRecommendation?.targetKnowledgeId ? [concept.mergeRecommendation] : [];
  const global = asArray(globalMerges).filter(item => item.sourceConceptId === concept.conceptId || item.sourceKnowledgeId === concept.proposedKnowledgeId);
  const merges = [...own, ...global];
  if (!merges.length) return "- No merge recommendation.";
  return merges.map(item => `- ${item.targetKnowledgeId || "unknown target"}${item.reason ? ` — ${item.reason}` : ""}`).join("\n");
}

function recommendationFor(concept) {
  if (concept.classification === "ignore" || concept.classification === "mentioned-only") return "Reject or keep as mention.";
  if (concept.classification === "merge-existing") return "Review merge target before authoring.";
  if (concept.classification === "needs-enrichment") return "Defer or enrich before Knowledge Authoring.";
  if (concept.mergeRecommendation?.targetKnowledgeId) return "Review possible merge before authoring.";
  return "Candidate for Knowledge Authoring after discovery review.";
}

if (!inputFile) fail("Usage: node tools/ai/create-discovery-manifest.mjs --file=data/imports/pending/<lesson>-transcript-intelligence.json");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Transcript Intelligence file not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const concepts = asArray(data.discoveredConcepts || data.conceptsDiscovered || data.concepts);
const gaps = asArray(data.knowledgeGaps);
const rejected = asArray(data.rejectedMentions || data.rejectedConcepts);
const merges = asArray(data.mergeRecommendations);

const lessonId = String(data.lessonId || "00").padStart(2, "0");
const safeTitle = String(data.lessonTitle || `Lesson ${lessonId}`)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const outDir = path.resolve(root, "data", "imports", "manifests");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${lessonId}-${safeTitle}-discovery-manifest.md`);

const classificationCounts = concepts.reduce((counts, concept) => {
  const key = concept.classification || "unknown";
  counts[key] = (counts[key] || 0) + 1;
  return counts;
}, {});

const highPriority = concepts.filter(concept => concept.reviewPriority === "high");
const weakEvidenceHighEnrichment = concepts.filter(concept => concept.evidenceStrength === "weak" && concept.enrichmentLevel === "high");

const lines = [];
lines.push(`# Discovery Manifest: ${data.lessonTitle || `Lesson ${lessonId}`}`);
lines.push("");
lines.push("This manifest is a review view of a Transcript Intelligence package. It is not canonical knowledge and it is not a draft Knowledge Object export.");
lines.push("");
lines.push("## Package Summary");
lines.push("");
lines.push(`- Source file: \`${toProjectPath(sourcePath, root)}\``);
lines.push(`- Source transcript: \`${data.sourceTranscript || "unknown"}\``);
lines.push(`- Schema: \`${data.schemaVersion || data.sourceSchemaVersion || "unknown"}\``);
lines.push(`- Certification: \`${data.certificationId || "unknown"}\``);
lines.push(`- Lesson: \`${lessonId}\``);
lines.push(`- Concepts discovered: ${concepts.length}`);
lines.push(`- Knowledge gaps: ${gaps.length}`);
lines.push(`- Merge recommendations: ${merges.length}`);
lines.push(`- Rejected mentions: ${rejected.length}`);
lines.push("");
lines.push("## Classification Counts");
lines.push("");
for (const [key, value] of Object.entries(classificationCounts).sort()) {
  lines.push(`- ${key}: ${value}`);
}
lines.push("");
lines.push("## Review Attention");
lines.push("");
lines.push(`- High-priority concepts: ${highPriority.length}`);
lines.push(`- Weak evidence + high enrichment concepts: ${weakEvidenceHighEnrichment.length}`);
lines.push(`- Concepts with merge recommendations: ${merges.length}`);
lines.push("");

if (highPriority.length) {
  lines.push("### High-Priority Concepts");
  lines.push("");
  lines.push(bullet(highPriority.map(concept => `${concept.conceptId}: ${concept.title} (${concept.proposedKnowledgeId})`)));
  lines.push("");
}

if (weakEvidenceHighEnrichment.length) {
  lines.push("### Weak Evidence / High Enrichment Concepts");
  lines.push("");
  lines.push(bullet(weakEvidenceHighEnrichment.map(concept => `${concept.conceptId}: ${concept.title} (${concept.proposedKnowledgeId})`)));
  lines.push("");
}

lines.push("## Concepts for Discovery Review");
lines.push("");

for (const concept of concepts) {
  lines.push(`### ${concept.conceptId || "DISC-???"}: ${concept.title || concept.proposedKnowledgeId}`);
  lines.push("");
  lines.push(`- Proposed ID: \`${concept.proposedKnowledgeId || "unknown"}\``);
  lines.push(`- Classification: \`${concept.classification || "unknown"}\``);
  lines.push(`- Type: \`${concept.type || "concept"}\``);
  lines.push(`- Domains: ${asArray(concept.domains).join(", ") || "none"}`);
  lines.push(`- Teaching value: ${concept.teachingValue || "unknown"}`);
  lines.push(`- Topic confidence: ${concept.topicConfidence ?? "unknown"}`);
  lines.push(`- Evidence strength: ${concept.evidenceStrength || "unknown"}`);
  lines.push(`- Enrichment level: ${concept.enrichmentLevel || "unknown"}`);
  lines.push(`- Review priority: ${concept.reviewPriority || "normal"}`);
  lines.push(`- Recommendation: **${recommendationFor(concept)}**`);
  lines.push("");
  lines.push("#### Source Evidence");
  lines.push(evidenceSummary(concept.sourceEvidence));
  lines.push("");
  lines.push("#### Curriculum Placement");
  lines.push(placementSummary(concept));
  lines.push("");
  lines.push("#### Merge Review");
  lines.push(mergeSummary(concept, merges));
  lines.push("");
  lines.push("#### Relationships");
  lines.push(relationshipSummary(concept));
  lines.push("");
  lines.push("#### Authoring Guidance");
  lines.push(bullet([
    ...(concept.authoringGuidance?.mustCover || []).map(item => `Must cover: ${item}`),
    ...(concept.authoringGuidance?.niceToCover || []).map(item => `Nice to cover: ${item}`),
    ...(concept.authoringGuidance?.notes || []).map(item => `Note: ${item}`)
  ], "No authoring guidance provided."));
  lines.push("");
}

lines.push("## Knowledge Gaps");
lines.push("");
if (!gaps.length) {
  lines.push("- None reported.");
} else {
  for (const gap of gaps) {
    lines.push(`### ${gap.gapId || "GAP-???"}: ${gap.title || "Knowledge gap"}`);
    lines.push("");
    lines.push(`- Severity: ${gap.severity || "medium"}`);
    lines.push(`- Basis: ${gap.basis || "unknown"}`);
    lines.push(`- Related concepts: ${asArray(gap.relatedConceptIds).join(", ") || "none"}`);
    lines.push(`- Description: ${gap.description || "No description provided."}`);
    lines.push(`- Recommendation: ${gap.recommendation || "Review required."}`);
    lines.push("");
  }
}

lines.push("## Rejected Mentions");
lines.push("");
if (!rejected.length) {
  lines.push("- None reported.");
} else {
  for (const item of rejected) {
    lines.push(`- **${item.title || "Rejected mention"}** (${item.classification || "mentioned-only"}): ${item.reason || "No reason provided."}`);
  }
}

lines.push("");
lines.push("## Import Notes");
lines.push("");
lines.push(bullet(data.importNotes || data.notes, "No import notes provided."));
lines.push("");
lines.push("## Next Step");
lines.push("");
lines.push("Use this manifest as the input context for AI-assisted Discovery Review. The review output should decide which concepts are accepted, merged, deferred, rejected, or sent to Knowledge Authoring.");

fs.writeFileSync(outFile, `${lines.join("\n")}\n`, "utf8");

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  concepts: concepts.length,
  gaps: gaps.length,
  mergeRecommendations: merges.length,
  rejectedMentions: rejected.length,
  next: [
    "Review the Markdown manifest manually or feed it to an AI Discovery Review prompt.",
    "Keep the original Transcript Intelligence JSON as the machine-readable source of truth."
  ]
}, null, 2));
