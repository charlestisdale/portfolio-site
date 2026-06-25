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

function slugify(value) {
  return String(value || "concept")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "concept";
}

function normalizeEnum(value, allowed, fallback) {
  const normalized = String(value || "").trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function normalizeImportance(value, fallback = "medium") {
  return normalizeEnum(value, ["low", "medium", "high", "exam-critical"], fallback);
}

function normalizeDifficulty(value, fallback = "medium") {
  return normalizeEnum(value, ["easy", "medium", "hard"], fallback);
}

function normalizeObjectDifficulty(value) {
  return normalizeEnum(value, ["foundational", "intermediate", "advanced"], "foundational");
}

function normalizeStatus(value) {
  return normalizeEnum(value, ["stub", "draft", "needs-review", "reviewed", "deprecated"], "needs-review");
}

function normalizeType(value) {
  return normalizeEnum(value, [
    "concept",
    "command",
    "tool",
    "protocol",
    "service",
    "file-system",
    "operating-system",
    "procedure",
    "security-control",
    "hardware",
    "troubleshooting-pattern"
  ], "concept");
}

function normalizeFact(item) {
  if (typeof item === "string") {
    return { text: item, importance: "medium", tags: [] };
  }
  return {
    text: String(item?.text || "").trim(),
    importance: normalizeImportance(item?.importance, "medium"),
    tags: asArray(item?.tags).map(String)
  };
}

function normalizeExample(item) {
  if (typeof item === "string") {
    return { text: item, context: "", tags: [] };
  }
  return {
    text: String(item?.text || item?.example || "").trim(),
    context: item?.context || "",
    tags: asArray(item?.tags).map(String)
  };
}

function normalizeExamTip(item) {
  if (typeof item === "string") {
    return { text: item, difficulty: "easy", tags: [] };
  }
  return {
    text: String(item?.text || item?.tip || "").trim(),
    difficulty: normalizeDifficulty(item?.difficulty, "easy"),
    tags: asArray(item?.tags).map(String)
  };
}

function normalizeCommonMistake(item) {
  if (typeof item === "string") {
    return { text: item, difficulty: "medium", tags: [] };
  }
  return {
    text: String(item?.text || item?.mistake || "").trim(),
    difficulty: normalizeDifficulty(item?.difficulty, "medium"),
    tags: asArray(item?.tags).map(String)
  };
}

function normalizeScenario(item) {
  if (typeof item === "string") {
    return { situation: item, expectedAction: "Identify the correct concept or response.", difficulty: "medium", tags: [] };
  }
  return {
    situation: String(item?.situation || item?.text || item?.scenario || "").trim(),
    expectedAction: String(item?.expectedAction || item?.answer || "Identify the correct concept or response.").trim(),
    difficulty: normalizeDifficulty(item?.difficulty, "medium"),
    tags: asArray(item?.tags).map(String)
  };
}

function normalizePbqIdea(item) {
  if (typeof item === "string") {
    return { task: item, skillsTested: [], difficulty: "medium", assetsNeeded: [] };
  }
  return {
    task: String(item?.task || item?.text || "").trim(),
    skillsTested: asArray(item?.skillsTested || item?.skills).map(String),
    difficulty: normalizeDifficulty(item?.difficulty, "medium"),
    assetsNeeded: asArray(item?.assetsNeeded || item?.assets).map(String)
  };
}

function normalizeRelationshipIdList(value) {
  return asArray(value).map(item => {
    if (typeof item === "string") return item;
    return item?.id || item?.targetKnowledgeId || item?.knowledgeId || "";
  }).filter(Boolean);
}

function normalizeRelatedObjects(value) {
  return asArray(value).map(item => {
    if (typeof item === "string") return { id: item, relationship: "related_to", reason: "Suggested relationship." };
    return {
      id: item?.id || item?.targetKnowledgeId || item?.knowledgeId || "",
      relationship: item?.relationship || item?.type || "related_to",
      reason: item?.reason || "Suggested relationship."
    };
  }).filter(item => item.id);
}

function normalizeSources(value) {
  return {
    references: asArray(value?.references).map(item => {
      if (typeof item === "string") return { title: item, url: null, notes: "" };
      return {
        title: item?.title || item?.name || "Reference",
        url: item?.url || null,
        notes: item?.notes || ""
      };
    })
  };
}

function audit(obj) {
  const flags = [];
  if (!obj.id || !/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(obj.id)) flags.push({ code: "bad-id", message: "id must look like domain.slug." });
  if (!obj.learning.summary) flags.push({ code: "missing-summary", message: "learning.summary is required." });
  if (!obj.learning.explanation) flags.push({ code: "missing-explanation", message: "learning.explanation is required." });
  if (!obj.learning.facts.length) flags.push({ code: "missing-facts", message: "At least one learning fact is required." });
  if (obj.status !== "needs-review") flags.push({ code: "wrong-status", message: "AI-authored objects should stay needs-review." });
  if (obj.quality.needsHumanReview !== true) flags.push({ code: "review-not-required", message: "AI-authored objects must require human review." });
  if (obj.sources.transcripts || obj.sources.videos) flags.push({ code: "private-source-provenance", message: "Public knowledge objects must not include sources.transcripts or sources.videos." });
  return { status: flags.length ? "needs-review" : "passed", flags };
}

if (!inputFile) fail("Usage: node tools/ai/normalize-knowledge-author-output.mjs --file=data/ai-imports/responses/knowledge-author/<object>.json");

const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) fail(`Knowledge Author output not found: ${inputFile}`);

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const id = String(raw.id || "general.untitled").trim();
const slug = slugify(raw.slug || id.split(".").at(-1) || raw.title);
const domain = id.includes(".") ? id.split(".")[0] : "general";

const obj = {
  schemaVersion: "1.0.0",
  id,
  slug,
  title: raw.title || id,
  aliases: asArray(raw.aliases).map(String),
  type: normalizeType(raw.type),
  status: normalizeStatus(raw.status),
  domains: asArray(raw.domains).length ? asArray(raw.domains).map(String) : [domain],
  difficulty: normalizeObjectDifficulty(raw.difficulty),
  importance: normalizeImportance(raw.importance, "medium"),
  certificationMappings: asArray(raw.certificationMappings),
  learning: {
    summary: String(raw.learning?.summary || "").trim(),
    explanation: String(raw.learning?.explanation || "").trim(),
    facts: asArray(raw.learning?.facts).map(normalizeFact).filter(item => item.text),
    commands: asArray(raw.learning?.commands),
    examples: asArray(raw.learning?.examples).map(normalizeExample).filter(item => item.text),
    tables: asArray(raw.learning?.tables),
    media: asArray(raw.learning?.media),
    notes: asArray(raw.learning?.notes)
  },
  assessmentSeeds: {
    examTips: asArray(raw.assessmentSeeds?.examTips).map(normalizeExamTip).filter(item => item.text),
    commonMistakes: asArray(raw.assessmentSeeds?.commonMistakes).map(normalizeCommonMistake).filter(item => item.text),
    scenarios: asArray(raw.assessmentSeeds?.scenarios).map(normalizeScenario).filter(item => item.situation),
    pbqIdeas: asArray(raw.assessmentSeeds?.pbqIdeas).map(normalizePbqIdea).filter(item => item.task),
    questionTargets: asArray(raw.assessmentSeeds?.questionTargets).map(String)
  },
  relationships: {
    prerequisites: normalizeRelationshipIdList(raw.relationships?.prerequisites),
    parents: normalizeRelationshipIdList(raw.relationships?.parents),
    children: normalizeRelationshipIdList(raw.relationships?.children),
    related: normalizeRelatedObjects(raw.relationships?.related),
    contrastsWith: normalizeRelatedObjects(raw.relationships?.contrastsWith),
    replacedBy: normalizeRelationshipIdList(raw.relationships?.replacedBy)
  },
  sources: normalizeSources(raw.sources || {}),
  quality: {
    createdAt: raw.quality?.createdAt || new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10),
    lastReviewedAt: raw.quality?.lastReviewedAt || null,
    reviewedBy: raw.quality?.reviewedBy || null,
    confidence: normalizeEnum(raw.quality?.confidence, ["low", "medium", "high"], "medium"),
    needsHumanReview: true,
    reviewNotes: asArray(raw.quality?.reviewNotes).map(String)
  }
};

obj.status = "needs-review";
obj.audit = audit(obj);

const outDir = path.resolve(root, "data", "imports", "authored");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${slug}-knowledge-object.draft.json`);
fs.writeFileSync(outFile, JSON.stringify(obj, null, 2));

console.log(JSON.stringify({
  output: toProjectPath(outFile, root),
  id: obj.id,
  title: obj.title,
  auditStatus: obj.audit.status,
  auditFlags: obj.audit.flags.length,
  next: [
    "Review the normalized draft under data/imports/authored/.",
    "Do not promote until human review and knowledge validation pass."
  ]
}, null, 2));
