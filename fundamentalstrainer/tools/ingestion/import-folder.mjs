#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  importTranscript,
  parseImportArgs,
  summarizeTranscriptImport,
  toProjectPath
} from "./import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";
const rawDir = path.resolve(root, args.raw || `data/transcripts/raw/${certificationId}`);
const cleanedDir = path.resolve(root, args.cleaned || `data/transcripts/cleaned/${certificationId}`);
const limit = args.limit ? Number.parseInt(args.limit, 10) : null;
const skipExtract = args["skip-extract"] === "true";
const skipEvidence = args["skip-evidence"] === "true";
const skipPostprocess = args["skip-postprocess"] === "true";
const skipManifest = args["skip-manifest"] === "true";

function emptyTotals(rawFiles = 0) {
  return {
    rawFiles,
    cleaned: 0,
    evidenceBuilt: 0,
    candidatesBuilt: 0,
    duplicateReports: 0,
    importReports: 0,
    failed: 0,
    candidates: 0,
    evidenceRecords: 0,
    conceptGroups: 0,
    postprocessRuns: 0,
    manifestsBuilt: 0
  };
}

function addTotals(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (typeof value === "number") target[key] = (target[key] || 0) + value;
  }
}

function runNode(script, scriptArgs = []) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    encoding: "utf8"
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout?.trim() || "",
    stderr: result.stderr?.trim() || ""
  };
}

if (!fs.existsSync(rawDir)) {
  console.error(`Raw transcript folder not found: ${toProjectPath(rawDir, root)}`);
  process.exit(1);
}

const rawFiles = fs.readdirSync(rawDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".srt"))
  .map(entry => path.join(rawDir, entry.name))
  .sort()
  .slice(0, limit || undefined);

const summary = {
  id: `FOLDER-IMPORT-${certificationId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  createdAt: new Date().toISOString(),
  rawDir: toProjectPath(rawDir, root),
  cleanedDir: toProjectPath(cleanedDir, root),
  importer: {
    perTranscriptFunction: "tools/ingestion/import-transcript.mjs#importTranscript",
    strategy: "Folder import delegates every raw transcript to the single transcript import function. Post-processing only runs after per-transcript imports finish."
  },
  options: {
    limit,
    skipEvidence,
    skipExtract,
    skipPostprocess,
    skipManifest
  },
  totals: emptyTotals(rawFiles.length),
  lessons: [],
  postprocess: {}
};

if (!rawFiles.length) {
  summary.blockers = [`No .srt files found in ${toProjectPath(rawDir, root)}.`];
} else {
  for (const rawFile of rawFiles) {
    const lesson = importTranscript(rawFile, {
      root,
      certificationId,
      cleanedDir,
      skipEvidence,
      skipExtract
    });

    lesson.metrics ||= summarizeTranscriptImport(lesson);
    addTotals(summary.totals, lesson.metrics);
    summary.lessons.push(lesson);
  }
}

if (!skipExtract && !skipPostprocess && summary.totals.candidatesBuilt > 0) {
  const postprocess = runNode("tools/ingestion/normalize-folder-candidates.mjs");
  summary.postprocess.normalizeCandidates = postprocess;
  if (postprocess.ok) summary.totals.postprocessRuns += 1;
  else summary.totals.failed += 1;
}

if (!skipExtract && !skipManifest && summary.totals.candidatesBuilt > 0) {
  const manifest = runNode("tools/ingestion/build-review-manifest.mjs");
  summary.postprocess.reviewManifest = manifest;
  if (manifest.ok) summary.totals.manifestsBuilt += 1;
  else summary.totals.failed += 1;
}

const reportDir = path.resolve(root, "data", "imports", "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportFile = path.join(reportDir, "folder-import-report.json");
fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));

console.log(JSON.stringify({
  report: toProjectPath(reportFile, root),
  totals: summary.totals,
  next: [
    "Open the Import tab to review pending candidates from data/imports/pending/manifest.json.",
    "Review evidence and quality warnings before approving candidates.",
    "Export approved Knowledge Objects only after human review."
  ]
}, null, 2));

if (summary.totals.failed) process.exit(1);
