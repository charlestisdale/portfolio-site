#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";
const rawDir = path.resolve(root, args.raw || `data/transcripts/raw/${certificationId}`);
const cleanedDir = path.resolve(root, args.cleaned || `data/transcripts/cleaned/${certificationId}`);
const limit = args.limit ? Number.parseInt(args.limit, 10) : null;
const skipExtract = args["skip-extract"] === "true";
const skipEvidence = args["skip-evidence"] === "true";

function runNode(script, scriptArgs) {
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

function toProjectPath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function lessonInfo(file) {
  const base = path.basename(file, ".srt");
  const match = base.match(/^(\d{1,3})[-_\s]+(.+?)(?:\s+-\s+CompTIA.+)?$/i);
  const lessonId = match ? match[1].padStart(2, "0") : base.replace(/[^a-z0-9]+/gi, "-").slice(0, 30).toLowerCase();
  const title = (match ? match[2] : base)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { lessonId, title: title || `Lesson ${lessonId}` };
}

function cleanOutputFile(rawFile, lessonId, title) {
  const safeTitle = title.replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, " ").trim();
  return path.join(cleanedDir, `${lessonId}-${safeTitle}.txt`);
}

if (!fs.existsSync(rawDir)) {
  console.error(`Raw transcript folder not found: ${toProjectPath(rawDir)}`);
  process.exit(1);
}

fs.mkdirSync(cleanedDir, { recursive: true });

const rawFiles = fs.readdirSync(rawDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".srt"))
  .map(entry => path.join(rawDir, entry.name))
  .sort()
  .slice(0, limit || undefined);

const summary = {
  id: `FOLDER-IMPORT-${certificationId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  createdAt: new Date().toISOString(),
  rawDir: toProjectPath(rawDir),
  cleanedDir: toProjectPath(cleanedDir),
  options: {
    limit,
    skipEvidence,
    skipExtract
  },
  totals: {
    rawFiles: rawFiles.length,
    cleaned: 0,
    evidenceBuilt: 0,
    candidatesBuilt: 0,
    duplicateReports: 0,
    importReports: 0,
    failed: 0,
    candidates: 0,
    evidenceRecords: 0,
    conceptGroups: 0
  },
  lessons: []
};

if (!rawFiles.length) {
  summary.blockers = [`No .srt files found in ${toProjectPath(rawDir)}.`];
} else {
  for (const rawFile of rawFiles) {
    const { lessonId, title } = lessonInfo(rawFile);
    const cleanedFile = cleanOutputFile(rawFile, lessonId, title);
    const pendingFile = path.resolve(root, "data", "imports", "pending", `${lessonId}-candidates.json`);
    const evidenceFile = path.resolve(root, "data", "imports", "evidence", certificationId, `${lessonId}-evidence.json`);

    const lesson = {
      lessonId,
      title,
      rawFile: toProjectPath(rawFile),
      cleanedFile: toProjectPath(cleanedFile),
      evidenceFile: toProjectPath(evidenceFile),
      candidatesFile: toProjectPath(pendingFile),
      steps: {}
    };

    const clean = runNode("tools/ingestion/clean-srt.mjs", [toProjectPath(rawFile), toProjectPath(cleanedFile)]);
    lesson.steps.clean = clean;
    if (clean.ok) summary.totals.cleaned += 1;
    else {
      summary.totals.failed += 1;
      summary.lessons.push(lesson);
      continue;
    }

    if (!skipEvidence) {
      const evidence = runNode("tools/ingestion/build-evidence.mjs", [
        `--lesson=${lessonId}`,
        `--title=${title}`,
        `--cert=${certificationId}`,
        `--file=${toProjectPath(cleanedFile)}`
      ]);
      lesson.steps.evidence = evidence;
      if (evidence.ok) {
        summary.totals.evidenceBuilt += 1;
        if (fs.existsSync(evidenceFile)) {
          const evidenceData = JSON.parse(fs.readFileSync(evidenceFile, "utf8"));
          lesson.evidenceMetrics = evidenceData.metrics;
          summary.totals.evidenceRecords += evidenceData.metrics?.evidenceRecords || 0;
          summary.totals.conceptGroups += evidenceData.metrics?.conceptGroups || 0;
        }
      } else summary.totals.failed += 1;
    }

    if (!skipExtract) {
      const extract = runNode("tools/ingestion/extract-concepts.mjs", [
        `--lesson=${lessonId}`,
        `--title=${title}`,
        `--cert=${certificationId}`,
        `--file=${toProjectPath(cleanedFile)}`
      ]);
      lesson.steps.extract = extract;

      if (extract.ok) {
        summary.totals.candidatesBuilt += 1;
        if (fs.existsSync(pendingFile)) {
          const candidateData = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
          lesson.candidateMetrics = candidateData.metrics;
          summary.totals.candidates += candidateData.metrics?.candidates || candidateData.candidates?.length || 0;
        }

        const duplicate = runNode("tools/ingestion/detect-duplicates.mjs", [`--file=${toProjectPath(pendingFile)}`]);
        lesson.steps.duplicates = duplicate;
        if (duplicate.ok) summary.totals.duplicateReports += 1;
        else summary.totals.failed += 1;

        const report = runNode("tools/ingestion/build-import-report.mjs", [`--file=${toProjectPath(pendingFile)}`]);
        lesson.steps.report = report;
        if (report.ok) summary.totals.importReports += 1;
        else summary.totals.failed += 1;
      } else summary.totals.failed += 1;
    }

    summary.lessons.push(lesson);
  }
}

const reportDir = path.resolve(root, "data", "imports", "reports");
fs.mkdirSync(reportDir, { recursive: true });
const reportFile = path.join(reportDir, "folder-import-report.json");
fs.writeFileSync(reportFile, JSON.stringify(summary, null, 2));

console.log(JSON.stringify({
  report: toProjectPath(reportFile),
  totals: summary.totals,
  next: [
    "Review folder-import-report.json for failed lessons or low evidence counts.",
    "Review data/imports/evidence/<cert>/<lesson>-evidence.json before promoting candidates.",
    "Do not merge candidates until reviewDecision values have been set."
  ]
}, null, 2));
