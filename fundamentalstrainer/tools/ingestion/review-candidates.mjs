#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const allowedDecisions = new Set(["undecided", "create-new", "merge-existing", "ignore"]);
const root = process.cwd();
const inputFile = args.file;
const candidateId = args.candidate || args.id;
const decision = args.decision;
const notes = args.notes || "";
const reviewer = args.reviewer || "local-admin";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!inputFile) fail("Usage: node tools/ingestion/review-candidates.mjs --file=data/imports/pending/16-ai-candidates.json --candidate=AI-CAND-001 --decision=create-new [--notes='review note']");
if (!candidateId && args.list !== "true") fail("Missing --candidate=<candidateId>. Use --list=true to show candidates.");
if (decision && !allowedDecisions.has(decision)) fail(`Invalid --decision=${decision}. Allowed: ${Array.from(allowedDecisions).join(", ")}`);

const inputPath = path.resolve(root, inputFile);
if (!fs.existsSync(inputPath)) fail(`Candidate file not found: ${inputFile}`);

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
if (!Array.isArray(data.candidates)) fail("Candidate file does not contain a candidates array.");

if (args.list === "true") {
  console.log(JSON.stringify({
    file: inputFile,
    status: data.status,
    candidates: data.candidates.map(candidate => ({
      candidateId: candidate.candidateId,
      title: candidate.title,
      proposedKnowledgeId: candidate.proposedKnowledgeId,
      reviewDecision: candidate.reviewDecision || "undecided",
      quality: candidate.quality?.band || "unknown"
    }))
  }, null, 2));
  process.exit(0);
}

if (!decision) fail("Missing --decision=<undecided|create-new|merge-existing|ignore>.");

const candidate = data.candidates.find(item => item.candidateId === candidateId);
if (!candidate) fail(`Candidate not found: ${candidateId}`);

candidate.reviewDecision = decision;
candidate.reviewNotes = notes || candidate.reviewNotes || "";
candidate.reviewedAt = new Date().toISOString();
candidate.reviewedBy = reviewer;

data.status = "pending-review";
data.updatedAt = new Date().toISOString();
data.reviewState = {
  mode: "in-place",
  lastReviewedAt: candidate.reviewedAt,
  lastReviewedBy: reviewer,
  undecided: data.candidates.filter(item => (item.reviewDecision || "undecided") === "undecided").length,
  createNew: data.candidates.filter(item => item.reviewDecision === "create-new").length,
  mergeExisting: data.candidates.filter(item => item.reviewDecision === "merge-existing").length,
  ignored: data.candidates.filter(item => item.reviewDecision === "ignore").length
};

fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));

console.log(JSON.stringify({
  file: inputFile,
  updated: candidate.candidateId,
  decision: candidate.reviewDecision,
  reviewState: data.reviewState,
  next: data.reviewState.undecided
    ? "Continue reviewing remaining undecided candidates."
    : "Run npm run ingest:merge -- --file=<candidate-file> for dry-run promotion."
}, null, 2));
