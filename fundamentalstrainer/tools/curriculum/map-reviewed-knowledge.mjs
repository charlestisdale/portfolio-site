#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const cert = args.cert || args.certification || "a-plus-220-1202";
const lesson = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const dryRun = args["dry-run"] === "true";
const pruneMissing = args["prune-missing"] !== "false";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  if (dryRun) return;
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function listFiles(dir, matcher = () => true) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(entry => path.join(full, entry.name))
    .filter(file => matcher(file))
    .sort();
}

function walkJsonFiles(dir) {
  const full = path.resolve(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(full, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function lessonMatch(file) {
  if (!lesson) return true;
  return path.basename(file).startsWith(`${lesson}-`);
}

function canonicalKnowledgeIds() {
  return new Set(walkJsonFiles("content/knowledge").map(file => readJson(file).id).filter(Boolean));
}

function findReviewedFiles() {
  return listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
}

function defaultModuleFor(item) {
  const id = item.proposedKnowledgeId || "";
  const title = String(item.title || "").toLowerCase();
  if (id.startsWith("windows.") || id.startsWith("linux.") || id.startsWith("macos.") || id.startsWith("chromeos.")) return "desktop-operating-systems";
  if (id.startsWith("android.") || id.startsWith("apple.") || id.startsWith("ios.") || id.startsWith("ipados.")) return "mobile-operating-systems";
  if (id.startsWith("filesystems.") || title.includes("file system")) return "file-systems";
  if (title.includes("update") || title.includes("patch") || title.includes("end of life") || id.includes("patch") || id.includes("end-of-life")) return "os-maintenance-and-lifecycle";
  return "operating-system-foundations";
}

function placementForDecision(decision) {
  const cd = decision.curriculumDecision || {};
  if (cd.status === "accept" || cd.status === "change") {
    return {
      sectionId: cd.sectionId || "1.0",
      moduleId: cd.moduleId || defaultModuleFor(decision),
      reason: cd.reason || "Mapped from discovery review curriculum decision."
    };
  }
  return {
    sectionId: "1.0",
    moduleId: defaultModuleFor(decision),
    reason: "Mapped from default module rules because no accepted curriculum decision was supplied."
  };
}

function moduleById(curriculum) {
  const map = new Map();
  for (const section of curriculum.sections || []) {
    for (const module of section.modules || []) {
      map.set(`${section.id}.${module.id}`, { section, module });
      map.set(module.id, { section, module });
    }
  }
  return map;
}

function addUnique(array, value) {
  if (!array.includes(value)) array.push(value);
}

function sortModuleKnowledge(curriculum) {
  for (const section of curriculum.sections || []) {
    for (const module of section.modules || []) {
      module.knowledge = [...new Set(asArray(module.knowledge))].sort();
    }
  }
}

function pruneMissingKnowledge(curriculum, ids) {
  const removed = [];
  for (const section of curriculum.sections || []) {
    for (const module of section.modules || []) {
      const before = asArray(module.knowledge);
      module.knowledge = before.filter(id => ids.has(id));
      for (const id of before) {
        if (!ids.has(id)) removed.push({ sectionId: section.id, moduleId: module.id, id });
      }
    }
  }
  return removed;
}

function runValidateArchitecture() {
  return spawnSync(process.execPath, ["tools/validate-architecture.mjs"], {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8",
    shell: false
  });
}

const curriculumFile = path.resolve(root, "content", "curriculum", cert, "curriculum.json");
if (!fs.existsSync(curriculumFile)) fail(`Curriculum file not found: ${toProjectPath(curriculumFile, root)}`);

const reviewedFiles = findReviewedFiles();
if (!reviewedFiles.length) fail(`No reviewed discovery packages found for lesson ${lesson || "all"}.`);

const ids = canonicalKnowledgeIds();
const curriculum = readJson(curriculumFile);
const modules = moduleById(curriculum);
const added = [];
const skipped = [];

for (const file of reviewedFiles) {
  const review = readJson(file);
  for (const decision of asArray(review.conceptDecisions)) {
    if (decision.decision !== "accept-for-authoring") continue;
    const id = decision.proposedKnowledgeId;
    if (!ids.has(id)) {
      skipped.push({ id, reason: "Knowledge Object is not canonical yet." });
      continue;
    }

    const placement = placementForDecision(decision);
    const target = modules.get(`${placement.sectionId}.${placement.moduleId}`) || modules.get(placement.moduleId);
    if (!target) {
      skipped.push({ id, reason: `Target module not found: ${placement.sectionId}.${placement.moduleId}` });
      continue;
    }

    target.module.knowledge = asArray(target.module.knowledge);
    const before = target.module.knowledge.length;
    addUnique(target.module.knowledge, id);
    if (target.module.knowledge.length !== before) {
      added.push({ id, sectionId: target.section.id, moduleId: target.module.id, reason: placement.reason });
    }
  }
}

const removed = pruneMissing ? pruneMissingKnowledge(curriculum, ids) : [];
sortModuleKnowledge(curriculum);
writeJson(curriculumFile, curriculum);

const validation = dryRun ? { status: 0, stdout: "dry run; validation not executed", stderr: "" } : runValidateArchitecture();
if (validation.status !== 0) {
  console.error(validation.stdout || "");
  console.error(validation.stderr || "");
  console.error("Curriculum mapping wrote changes but architecture validation failed.");
  process.exit(validation.status || 1);
}

console.log(JSON.stringify({
  generatedBy: "reviewed-knowledge-curriculum-mapper",
  dryRun,
  certification: cert,
  lesson,
  curriculum: toProjectPath(curriculumFile, root),
  reviewedFiles: reviewedFiles.map(file => toProjectPath(file, root)),
  canonicalKnowledgeObjects: ids.size,
  addedCount: added.length,
  removedMissingCount: removed.length,
  skippedCount: skipped.length,
  added,
  removedMissing: removed,
  skipped,
  validation: dryRun ? "skipped-dry-run" : "passed",
  next: [
    "Run npm run validate:all.",
    "Reload the app and check whether Unmapped Knowledge shrank."
  ]
}, null, 2));
