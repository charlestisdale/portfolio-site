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
  console.error("Usage: node tools/ingestion/merge-review.mjs --file=data/imports/pending/16-candidates.json [--dry-run=false]");
  process.exit(1);
}
const root = process.cwd();
const inputPath = path.resolve(root, inputFile);
const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const approved = data.candidates.filter(c => ["create-new", "merge-existing"].includes(c.reviewDecision));
if (data.candidates.some(c => c.reviewDecision === "undecided")) {
  console.error("Merge blocked: at least one candidate is still undecided.");
  process.exit(1);
}
function knowledgePath(category, slug) { return path.resolve(root, "content/knowledge", category, `${slug}.json`); }
function makeObject(c) {
  return {
    id: c.proposedKnowledgeId,
    slug: c.slug,
    title: c.title,
    aliases: c.aliases || [],
    status: "draft",
    type: "concept",
    categories: [c.category],
    certifications: [{ certificationId: data.certificationId, objectiveIds: [], lessonIds: [data.lessonId] }],
    summary: c.summaryDraft || "Draft created from transcript ingestion review. Needs human expansion.",
    explanation: "",
    facts: c.factsDraft || [],
    commands: [],
    examples: [],
    commonMistakes: [],
    examTips: c.examTipsDraft || [],
    scenarios: [],
    pbqIdeas: [],
    relationships: { prerequisites: [], related: [], parent: null, children: [] },
    sources: { transcriptRefs: [{ lessonId: data.lessonId, sourceTranscript: data.sourceTranscript, evidence: c.evidence }], sourceVideos: [], references: [] },
    analytics: { difficulty: "unknown", examFrequency: "unknown", masteryWeight: 1 }
  };
}
const actions=[];
for (const c of approved) {
  if (c.reviewDecision === "create-new") {
    const out = knowledgePath(c.category, c.slug);
    actions.push({ action:"create", title:c.title, path:path.relative(root,out) });
    if (!dryRun) {
      fs.mkdirSync(path.dirname(out), { recursive:true });
      if (!fs.existsSync(out)) fs.writeFileSync(out, JSON.stringify(makeObject(c), null, 2));
    }
  } else {
    actions.push({ action:"manual-merge-required", title:c.title, target:c.possibleDuplicates?.[0]?.knowledgeId || null });
  }
}
if (!dryRun) {
  data.status = "merged";
  const approvedDir = path.resolve(root, "data/imports/approved");
  fs.mkdirSync(approvedDir, { recursive:true });
  fs.writeFileSync(path.join(approvedDir, path.basename(inputFile)), JSON.stringify(data, null, 2));
}
console.log(JSON.stringify({ dryRun, approvedCount: approved.length, actions }, null, 2));
