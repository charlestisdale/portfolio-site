#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function parseImportArgs(argv = process.argv.slice(2)) {
  return Object.fromEntries(argv.map(arg => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=") || true];
  }));
}

export function toProjectPath(filePath, root = process.cwd()) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

export function lessonInfo(file) {
  const base = path.basename(file, path.extname(file));
  const match = base.match(/^(\d{1,3})[-_\s]+(.+?)(?:\s+-\s+CompTIA.+)?$/i);
  const lessonId = match ? match[1].padStart(2, "0") : base.replace(/[^a-z0-9]+/gi, "-").slice(0, 30).toLowerCase();
  const title = (match ? match[2] : base)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { lessonId, title: title || `Lesson ${lessonId}` };
}

export function cleanOutputFile({ cleanedDir, lessonId, title }) {
  const safeTitle = title.replace(/[<>:"/\\|?*]+/g, "").replace(/\s+/g, " ").trim();
  return path.join(cleanedDir, `${lessonId}-${safeTitle}.txt`);
}

function runNode(root, script, scriptArgs) {
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

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function summarizeTranscriptImport(lesson) {
  return {
    cleaned: lesson.steps.clean?.ok ? 1 : 0,
    evidenceBuilt: lesson.steps.evidence?.ok ? 1 : 0,
    candidatesBuilt: lesson.steps.extract?.ok ? 1 : 0,
    duplicateReports: lesson.steps.duplicates?.ok ? 1 : 0,
    importReports: lesson.steps.report?.ok ? 1 : 0,
    failed: Object.values(lesson.steps).filter(step => step && !step.ok).length,
    candidates: lesson.candidateMetrics?.candidates || 0,
    evidenceRecords: lesson.evidenceMetrics?.evidenceRecords || 0,
    conceptGroups: lesson.evidenceMetrics?.conceptGroups || 0
  };
}

export function importTranscript(rawFile, options = {}) {
  const root = options.root || process.cwd();
  const certificationId = options.certificationId || "a-plus-220-1202";
  const cleanedDir = path.resolve(root, options.cleanedDir || `data/transcripts/cleaned/${certificationId}`);
  const skipEvidence = Boolean(options.skipEvidence);
  const skipExtract = Boolean(options.skipExtract);
  const { lessonId, title } = options.lessonId && options.title
    ? { lessonId: String(options.lessonId).padStart(2, "0"), title: options.title }
    : lessonInfo(rawFile);

  fs.mkdirSync(cleanedDir, { recursive: true });

  const resolvedRawFile = path.resolve(root, rawFile);
  const cleanedFile = cleanOutputFile({ cleanedDir, lessonId, title });
  const pendingFile = path.resolve(root, "data", "imports", "pending", `${lessonId}-candidates.json`);
  const evidenceFile = path.resolve(root, "data", "imports", "evidence", certificationId, `${lessonId}-evidence.json`);

  const lesson = {
    lessonId,
    title,
    rawFile: toProjectPath(resolvedRawFile, root),
    cleanedFile: toProjectPath(cleanedFile, root),
    evidenceFile: toProjectPath(evidenceFile, root),
    candidatesFile: toProjectPath(pendingFile, root),
    steps: {}
  };

  lesson.steps.clean = runNode(root, "tools/ingestion/clean-srt.mjs", [lesson.rawFile, lesson.cleanedFile]);
  if (!lesson.steps.clean.ok) {
    lesson.metrics = summarizeTranscriptImport(lesson);
    return lesson;
  }

  if (!skipEvidence) {
    lesson.steps.evidence = runNode(root, "tools/ingestion/build-evidence.mjs", [
      `--lesson=${lessonId}`,
      `--title=${title}`,
      `--cert=${certificationId}`,
      `--file=${lesson.cleanedFile}`
    ]);

    const evidenceData = readJsonIfExists(evidenceFile);
    if (lesson.steps.evidence.ok && evidenceData) lesson.evidenceMetrics = evidenceData.metrics;
  }

  if (!skipExtract) {
    lesson.steps.extract = runNode(root, "tools/ingestion/extract-concepts.mjs", [
      `--lesson=${lessonId}`,
      `--title=${title}`,
      `--cert=${certificationId}`,
      `--file=${lesson.cleanedFile}`
    ]);

    const candidateData = readJsonIfExists(pendingFile);
    if (lesson.steps.extract.ok && candidateData) lesson.candidateMetrics = candidateData.metrics;

    if (lesson.steps.extract.ok) {
      lesson.steps.duplicates = runNode(root, "tools/ingestion/detect-duplicates.mjs", [`--file=${lesson.candidatesFile}`]);
      lesson.steps.report = runNode(root, "tools/ingestion/build-import-report.mjs", [`--file=${lesson.candidatesFile}`]);
    }
  }

  lesson.metrics = summarizeTranscriptImport(lesson);
  return lesson;
}

export function createSingleTranscriptReport(lesson, options = {}) {
  const root = options.root || process.cwd();
  const certificationId = options.certificationId || "a-plus-220-1202";

  return {
    id: `TRANSCRIPT-IMPORT-${certificationId}-${lesson.lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
    certificationId,
    createdAt: new Date().toISOString(),
    lesson,
    totals: lesson.metrics,
    next: [
      "Review the candidate file before merging into canonical Knowledge Objects.",
      "Run npm run ingest:postprocess when you want quality normalization across pending candidates.",
      "Run npm run review:manifest to refresh the browser review queue."
    ]
  };
}

async function main() {
  const args = parseImportArgs();
  const root = process.cwd();
  const certificationId = args.cert || args.certification || "a-plus-220-1202";
  const rawFile = args.file || args._;

  if (!rawFile) {
    console.error("Usage: node tools/ingestion/import-transcript.mjs --file=data/transcripts/raw/a-plus-220-1202/01-title.srt [--cert=a-plus-220-1202]");
    process.exit(1);
  }

  const lesson = importTranscript(rawFile, {
    root,
    certificationId,
    cleanedDir: args.cleaned || `data/transcripts/cleaned/${certificationId}`,
    skipEvidence: args["skip-evidence"] === "true",
    skipExtract: args["skip-extract"] === "true"
  });

  const report = createSingleTranscriptReport(lesson, { root, certificationId });
  const reportDir = path.resolve(root, "data", "imports", "reports");
  fs.mkdirSync(reportDir, { recursive: true });
  const reportFile = path.join(reportDir, `${lesson.lessonId}-transcript-import-report.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    report: toProjectPath(reportFile, root),
    lesson: lesson.lessonId,
    totals: report.totals
  }, null, 2));

  if (report.totals.failed) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
