#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const inputFile = args.file;
if (!inputFile) {
  console.error("Usage: node tools/ingestion/build-import-report.mjs --file=data/imports/pending/16-candidates.json");
  process.exit(1);
}
const root = process.cwd();
const data = JSON.parse(fs.readFileSync(path.resolve(root, inputFile), "utf8"));
const counts = data.candidates.reduce((acc, c) => {
  acc.byDecision[c.reviewDecision] = (acc.byDecision[c.reviewDecision] || 0) + 1;
  acc.byCategory[c.category] = (acc.byCategory[c.category] || 0) + 1;
  if (c.possibleDuplicates?.length) acc.possibleDuplicates++;
  return acc;
}, { byDecision: {}, byCategory: {}, possibleDuplicates: 0 });
const report = {
  id: data.id + "-IMPORT-REPORT",
  createdAt: new Date().toISOString(),
  source: inputFile,
  certificationId: data.certificationId,
  lessonId: data.lessonId,
  status: data.status,
  totals: { candidates: data.candidates.length, possibleDuplicates: counts.possibleDuplicates },
  byDecision: counts.byDecision,
  byCategory: counts.byCategory,
  readyToMerge: data.candidates.filter(c => ["create-new", "merge-existing"].includes(c.reviewDecision)).map(c => ({ candidateId: c.candidateId, title: c.title, decision: c.reviewDecision, proposedKnowledgeId: c.proposedKnowledgeId, duplicateTarget: c.possibleDuplicates?.[0]?.knowledgeId || null })),
  needsReview: data.candidates.filter(c => c.reviewDecision === "undecided").map(c => ({ candidateId: c.candidateId, title: c.title, possibleDuplicates: c.possibleDuplicates?.length || 0 }))
};
const reportDir = path.resolve(root, "data/imports/reports");
fs.mkdirSync(reportDir, { recursive: true });
const outFile = path.join(reportDir, path.basename(inputFile).replace(/\.json$/, "-import-report.json"));
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
console.log(`Wrote import report to ${path.relative(root, outFile)}`);
