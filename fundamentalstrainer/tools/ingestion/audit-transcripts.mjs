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
const cleanedRoot = path.resolve(root, args.dir || `data/transcripts/cleaned/${certificationId}`);
const reportsRoot = path.resolve(root, "data/imports/reports");
const pendingRoot = path.resolve(root, "data/imports/pending");
const writeCandidates = args["write-candidates"] !== "false";

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".txt") ? [full] : [];
  });
}

function lessonFromFile(file) {
  const base = path.basename(file, ".txt");
  const match = base.match(/^(\d{1,3})[-_\s]/);
  return match ? match[1].padStart(2, "0") : base.replace(/[^a-z0-9]+/gi, "-").slice(0, 30).toLowerCase();
}

function titleFromFile(file) {
  const base = path.basename(file, ".txt");
  return base
    .replace(/^\d{1,3}[-_\s]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || `Lesson ${lessonFromFile(file)}`;
}

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

fs.mkdirSync(reportsRoot, { recursive: true });
fs.mkdirSync(pendingRoot, { recursive: true });

const files = walk(cleanedRoot).sort();
const report = {
  id: `INGESTION-AUDIT-${certificationId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  createdAt: new Date().toISOString(),
  cleanedRoot: path.relative(root, cleanedRoot),
  writeCandidates,
  totals: {
    cleanedTranscriptFiles: files.length,
    extractedFiles: 0,
    failedFiles: 0,
    candidates: 0,
    highConfidenceCandidates: 0,
    candidatesWithFactDrafts: 0,
    possibleDuplicates: 0
  },
  lessons: [],
  blockers: [],
  nextActions: []
};

if (!files.length) {
  report.blockers.push(`No cleaned transcript .txt files found in ${path.relative(root, cleanedRoot)}.`);
  report.nextActions.push("Run clean:srt against one raw transcript, then rerun ingest:audit.");
} else {
  for (const file of files) {
    const lessonId = lessonFromFile(file);
    const title = titleFromFile(file);
    const relativeFile = path.relative(root, file).replaceAll(path.sep, "/");
    const pendingFile = path.join(pendingRoot, `${lessonId}-candidates.json`);

    const extraction = writeCandidates
      ? runNode("tools/ingestion/extract-concepts.mjs", [
          `--cert=${certificationId}`,
          `--lesson=${lessonId}`,
          `--title=${title}`,
          `--file=${relativeFile}`
        ])
      : { ok: false, status: null, stdout: "", stderr: "write-candidates=false" };

    let duplicate = { ok: false, stdout: "", stderr: "Skipped" };
    let importReport = { ok: false, stdout: "", stderr: "Skipped" };
    let candidateData = null;

    if (extraction.ok && fs.existsSync(pendingFile)) {
      duplicate = runNode("tools/ingestion/detect-duplicates.mjs", [
        `--file=${path.relative(root, pendingFile).replaceAll(path.sep, "/")}`
      ]);
      importReport = runNode("tools/ingestion/build-import-report.mjs", [
        `--file=${path.relative(root, pendingFile).replaceAll(path.sep, "/")}`
      ]);
      candidateData = JSON.parse(fs.readFileSync(pendingFile, "utf8"));
    }

    const metrics = candidateData?.metrics || {
      candidates: 0,
      highConfidenceCandidates: 0,
      candidatesWithFactDrafts: 0
    };
    const possibleDuplicates = candidateData?.candidates?.filter(candidate => candidate.possibleDuplicates?.length).length || 0;

    const lesson = {
      lessonId,
      title,
      cleanedFile: relativeFile,
      pendingCandidatesFile: candidateData ? path.relative(root, pendingFile).replaceAll(path.sep, "/") : null,
      extraction: {
        ok: extraction.ok,
        stdout: extraction.stdout,
        stderr: extraction.stderr
      },
      duplicateDetection: {
        ok: duplicate.ok,
        stdout: duplicate.stdout,
        stderr: duplicate.stderr
      },
      importReport: {
        ok: importReport.ok,
        stdout: importReport.stdout,
        stderr: importReport.stderr
      },
      metrics: {
        candidates: metrics.candidates || 0,
        highConfidenceCandidates: metrics.highConfidenceCandidates || 0,
        candidatesWithFactDrafts: metrics.candidatesWithFactDrafts || 0,
        possibleDuplicates
      },
      topCandidates: (candidateData?.candidates || []).slice(0, 10).map(candidate => ({
        candidateId: candidate.candidateId,
        title: candidate.title,
        proposedKnowledgeId: candidate.proposedKnowledgeId,
        type: candidate.type,
        domains: candidate.domains,
        confidence: candidate.confidence,
        factsDrafted: candidate.factsDraft?.length || 0,
        possibleDuplicates: candidate.possibleDuplicates?.length || 0
      }))
    };

    report.lessons.push(lesson);

    if (extraction.ok) report.totals.extractedFiles += 1;
    else report.totals.failedFiles += 1;

    report.totals.candidates += lesson.metrics.candidates;
    report.totals.highConfidenceCandidates += lesson.metrics.highConfidenceCandidates;
    report.totals.candidatesWithFactDrafts += lesson.metrics.candidatesWithFactDrafts;
    report.totals.possibleDuplicates += lesson.metrics.possibleDuplicates;
  }

  const emptyLessons = report.lessons.filter(lesson => lesson.metrics.candidates === 0);
  const weakLessons = report.lessons.filter(lesson => lesson.metrics.candidates > 0 && lesson.metrics.candidatesWithFactDrafts === 0);
  if (emptyLessons.length) report.blockers.push(`${emptyLessons.length} cleaned transcript(s) produced zero candidates.`);
  if (weakLessons.length) report.blockers.push(`${weakLessons.length} lesson(s) produced candidates but no fact drafts.`);

  report.nextActions.push("Review data/imports/reports/ingestion-audit.json for candidate counts and weak lessons.");
  report.nextActions.push("Open the pending candidate JSON for one strong lesson and mark reviewDecision values before merge dry-run.");
  report.nextActions.push("Run npm run ingest:merge -- --file=data/imports/pending/<lesson>-candidates.json for a dry run after review decisions are set.");
}

const outFile = path.join(reportsRoot, "ingestion-audit.json");
fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

console.log(JSON.stringify({
  auditReport: path.relative(root, outFile).replaceAll(path.sep, "/"),
  totals: report.totals,
  blockers: report.blockers,
  nextActions: report.nextActions
}, null, 2));
