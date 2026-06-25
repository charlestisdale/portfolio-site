#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const inputFile = args.file;
const dryRun = args["dry-run"] !== "false";

if (!inputFile) {
  console.error("Usage: node tools/ingestion/merge-review.mjs --file=data/imports/pending/16-ai-candidates.json [--dry-run=false]");
  process.exit(1);
}

const root = process.cwd();
const inputPath = path.resolve(root, inputFile);
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const approved = data.candidates.filter(c => ["create-new", "merge-existing"].includes(c.reviewDecision));
const rejected = data.candidates.filter(c => c.reviewDecision === "ignore");

if (data.candidates.some(c => (c.reviewDecision || "undecided") === "undecided")) {
  console.error("Merge blocked: at least one candidate is still undecided.");
  process.exit(1);
}

function firstDomain(candidate) {
  return candidate.domains?.[0] || candidate.category || "windows";
}

function knowledgePath(candidate) {
  return path.resolve(root, "content", "knowledge", firstDomain(candidate), `${candidate.slug}.json`);
}

function ensureFactObjects(facts) {
  return (facts || []).map(fact => {
    if (typeof fact === "string") return { text: fact, importance: "medium", tags: [] };
    return {
      text: fact.text || "Imported fact needs review.",
      importance: fact.importance || "medium",
      tags: fact.tags || [],
      basis: fact.basis || undefined,
      requiresReview: fact.requiresReview !== false
    };
  });
}

function ensureExamTipObjects(items) {
  return (items || []).map(item => {
    if (typeof item === "string") return { text: item, difficulty: "medium", tags: [] };
    return {
      text: item.text || "Imported exam tip needs review.",
      difficulty: item.difficulty || "medium",
      tags: item.tags || [],
      basis: item.basis || undefined,
      requiresReview: item.requiresReview !== false
    };
  });
}

function ensureExampleObjects(items) {
  return (items || []).map(item => {
    if (typeof item === "string") return { text: item, context: "Imported source review", tags: [] };
    return {
      text: item.text || "Imported example needs review.",
      context: item.context || "Imported source review",
      tags: item.tags || [],
      basis: item.basis || undefined,
      requiresReview: item.requiresReview !== false
    };
  });
}

function normalizeRelationship(item) {
  if (typeof item === "string") {
    return { id: item, reason: "Suggested during import review.", strength: "weak" };
  }

  return {
    id: item.id,
    reason: item.evidence || item.reason || "Suggested during import review.",
    strength: item.type === "depends_on" || item.type === "contrasts_with" ? "medium" : "weak",
    basis: item.basis || undefined,
    requiresReview: item.requiresReview !== false
  };
}

function relationshipBuckets(candidate) {
  const relationships = (candidate.suggestedRelationships || [])
    .map(normalizeRelationship)
    .filter(item => item.id && item.id !== candidate.proposedKnowledgeId);

  return {
    related: relationships.filter(item => !/contrast/i.test(item.reason)).slice(0, 12),
    contrastsWith: relationships.filter(item => /contrast|different|unlike/i.test(item.reason)).slice(0, 12)
  };
}

function makeObject(candidate) {
  const domains = candidate.domains?.length ? candidate.domains : [candidate.category || "windows"];
  const today = new Date().toISOString().slice(0, 10);
  const buckets = relationshipBuckets(candidate);

  return {
    schemaVersion: "1.0.0",
    id: candidate.proposedKnowledgeId,
    slug: candidate.slug,
    title: candidate.title,
    aliases: candidate.aliases || [],
    type: candidate.type || "concept",
    status: "needs-review",
    domains,
    difficulty: "foundational",
    importance: candidate.confidence >= 0.85 ? "high" : "medium",
    certificationMappings: [
      {
        certification: data.certificationId,
        examCode: data.certificationId.includes("220-1202") ? "220-1202" : "",
        objectives: [
          {
            id: "unmapped",
            name: "Needs objective mapping",
            weight: null,
            subtopics: []
          }
        ],
        lessons: [
          {
            lessonId: data.lessonId,
            title: data.lessonTitle || `Lesson ${data.lessonId}`,
            order: Number.parseInt(data.lessonId, 10) || null
          }
        ]
      }
    ],
    learning: {
      summary: candidate.summaryDraft || `${candidate.title} was imported as a draft concept and needs human review.`,
      explanation: candidate.explanationDraft || "",
      facts: ensureFactObjects(candidate.factsDraft),
      commands: [],
      examples: ensureExampleObjects(candidate.examplesDraft),
      tables: [],
      media: [],
      notes: ["Imported from a private/admin review record. Verify before marking reviewed."]
    },
    assessmentSeeds: {
      examTips: ensureExamTipObjects(candidate.examTipsDraft),
      commonMistakes: candidate.commonMistakesDraft || [],
      scenarios: candidate.scenariosDraft || [],
      pbqIdeas: candidate.pbqIdeasDraft || [],
      questionTargets: []
    },
    relationships: {
      prerequisites: [],
      parents: [],
      children: [],
      related: buckets.related,
      contrastsWith: buckets.contrastsWith,
      replacedBy: []
    },
    sources: {
      references: []
    },
    quality: {
      createdAt: today,
      updatedAt: today,
      lastReviewedAt: null,
      reviewedBy: null,
      confidence: candidate.confidence >= 0.85 ? "medium" : "low",
      needsHumanReview: true,
      reviewNotes: [
        `Created from import record ${data.id}.`,
        "Private source evidence remains in data/imports and should not be copied into public knowledge JSON.",
        "Map certification objectives before marking reviewed."
      ]
    }
  };
}

const actions = [];
for (const candidate of approved) {
  if (candidate.reviewDecision === "create-new") {
    const out = knowledgePath(candidate);
    actions.push({ action: "create", title: candidate.title, id: candidate.proposedKnowledgeId, path: path.relative(root, out) });
    if (!dryRun) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (!fs.existsSync(out)) fs.writeFileSync(out, JSON.stringify(makeObject(candidate), null, 2));
    }
  } else {
    actions.push({
      action: "manual-merge-required",
      title: candidate.title,
      target: candidate.possibleDuplicates?.[0]?.knowledgeId || null,
      reason: "Merge-existing decisions require human editing so existing reviewed fields are not overwritten."
    });
  }
}

if (!dryRun) {
  const now = new Date().toISOString();
  data.status = "merged";
  data.mergedAt = now;
  data.mergeState = {
    mode: "in-place",
    promoted: approved.length,
    rejected: rejected.length,
    retainedInSourceFile: true
  };
  fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));
}

console.log(JSON.stringify({
  dryRun,
  approvedCount: approved.length,
  rejectedCount: rejected.length,
  retainedInSourceFile: true,
  actions
}, null, 2));
