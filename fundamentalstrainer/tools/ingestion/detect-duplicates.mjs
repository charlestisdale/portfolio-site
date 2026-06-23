#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));
const inputFile = args.file;
if (!inputFile) {
  console.error("Usage: node tools/ingestion/detect-duplicates.mjs --file=data/imports/pending/16-candidates.json");
  process.exit(1);
}
const root = process.cwd();
const inputPath = path.resolve(root, inputFile);
const candidateSet = JSON.parse(fs.readFileSync(inputPath, "utf8"));

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith(".json") ? [full] : [];
  });
}
function norm(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function tokenSet(value) { return new Set(String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)); }
function jaccard(a, b) {
  const A = tokenSet(a), B = tokenSet(b);
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

const existing = walk(path.resolve(root, "content/knowledge"))
  .filter(file => !file.includes(`${path.sep}_templates${path.sep}`))
  .map(file => {
    try {
      const obj = JSON.parse(fs.readFileSync(file, "utf8"));
      return { file, id: obj.id, title: obj.title, slug: obj.slug, aliases: obj.aliases || [] };
    } catch { return null; }
  })
  .filter(Boolean);

for (const candidate of candidateSet.candidates) {
  const checks = [];
  for (const item of existing) {
    const fields = [item.title, item.slug, ...item.aliases];
    let best = 0;
    let reason = "";
    for (const field of fields) {
      if (norm(field) === norm(candidate.title) || norm(field) === norm(candidate.slug)) {
        best = 1; reason = "Exact normalized title/alias match"; break;
      }
      const score = Math.max(jaccard(field, candidate.title), jaccard(field, candidate.slug));
      if (score > best) { best = score; reason = "Similar title/alias tokens"; }
    }
    if (best >= 0.5) checks.push({ knowledgeId: item.id, title: item.title, reason, score: Number(best.toFixed(2)) });
  }
  candidate.possibleDuplicates = checks.sort((a,b)=>b.score-a.score).slice(0,5);
}

fs.writeFileSync(inputPath, JSON.stringify(candidateSet, null, 2));
const report = {
  id: candidateSet.id + "-DUPLICATE-REPORT",
  createdAt: new Date().toISOString(),
  source: inputFile,
  totalCandidates: candidateSet.candidates.length,
  candidatesWithPossibleDuplicates: candidateSet.candidates.filter(c => c.possibleDuplicates.length).length,
  duplicates: candidateSet.candidates.filter(c => c.possibleDuplicates.length).map(c => ({ candidateId: c.candidateId, title: c.title, possibleDuplicates: c.possibleDuplicates }))
};
const reportDir = path.resolve(root, "data/imports/reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportFile = path.join(reportDir, path.basename(inputFile).replace(/\.json$/, "-duplicate-report.json"));
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(`Updated ${inputFile}`);
console.log(`Wrote duplicate report to ${path.relative(root, reportFile)}`);
