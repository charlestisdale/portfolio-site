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
const allowMultiplePlacements = args["allow-multiple"] === "true";
const minimumAutoMapScore = Number(args["minimum-score"] || 1);

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

function canonicalKnowledgeObjects() {
  const objects = new Map();
  for (const file of walkJsonFiles("content/knowledge")) {
    const object = readJson(file);
    if (object.id) objects.set(object.id, object);
  }
  return objects;
}

function findReviewedFiles() {
  return listFiles("data/imports/reviewed", file => file.includes("discovery-review") && file.endsWith(".json") && lessonMatch(file));
}

function normalizedText(value) {
  return String(value || "").toLowerCase();
}

function collectDecisionText(decision, object = null) {
  return {
    id: normalizedText(decision.proposedKnowledgeId || object?.id),
    title: normalizedText(decision.title || object?.title),
    type: normalizedText(decision.type || object?.type),
    domains: asArray(decision.domains || object?.domains).map(normalizedText),
    tags: collectTags(decision, object).map(normalizedText)
  };
}

function collectTags(decision, object = null) {
  return [
    ...asArray(decision.tags),
    ...asArray(object?.tags),
    ...asArray(object?.domains),
    ...asArray(object?.learning?.facts).flatMap(fact => asArray(fact.tags)),
    ...asArray(object?.assessmentSeeds?.examTips).flatMap(tip => asArray(tip.tags))
  ];
}

function scoreList(values, matcher, weight) {
  return asArray(values).reduce((score, value) => score + (matcher(normalizedText(value)) ? weight : 0), 0);
}

function scoreAutoMap(autoMap, decision, object) {
  if (!autoMap) return 0;
  const text = collectDecisionText(decision, object);
  let score = 0;

  score += scoreList(autoMap.idExact, value => text.id === value, 100);
  score += scoreList(autoMap.idPrefixes, value => text.id.startsWith(value), 40);
  score += scoreList(autoMap.idIncludes, value => text.id.includes(value), 25);
  score += scoreList(autoMap.titleIncludes, value => text.title.includes(value) || text.id.includes(value.replaceAll(" ", "-")), 15);
  score += scoreList(autoMap.types, value => text.type === value, 10);
  score += scoreList(autoMap.domains, value => text.domains.includes(value), 8);
  score += scoreList(autoMap.tags, value => text.tags.includes(value), 6);

  return score;
}

function flattenModules(curriculum) {
  return asArray(curriculum.sections).flatMap(section =>
    asArray(section.modules).map(module => ({ section, module }))
  );
}

function bestAutoMapPlacement(curriculum, decision, object) {
  const candidates = flattenModules(curriculum)
    .map(target => ({
      ...target,
      score: scoreAutoMap(target.module.autoMap, decision, object)
    }))
    .filter(candidate => candidate.score >= minimumAutoMapScore)
    .sort((a, b) => b.score - a.score || Number(a.section.order || 0) - Number(b.section.order || 0) || Number(a.module.order || 0) - Number(b.module.order || 0));

  const best = candidates[0];
  if (!best) return null;

  return {
    sectionId: best.section.id,
    moduleId: best.module.id,
    reason: `Mapped by curriculum autoMap rules in ${best.section.id}.${best.module.id} with score ${best.score}.`,
    score: best.score
  };
}

function moduleById(curriculum) {
  const map = new Map();
  for (const section of asArray(curriculum.sections)) {
    for (const module of asArray(section.modules)) {
      map.set(`${section.id}.${module.id}`, { section, module });
      map.set(module.id, { section, module });
    }
  }
  return map;
}

function fallbackPlacement(curriculum) {
  const configured = curriculum.mappingDefaults || curriculum.autoMapDefaults || {};
  if (configured.sectionId && configured.moduleId) {
    return {
      sectionId: configured.sectionId,
      moduleId: configured.moduleId,
      reason: "Mapped from curriculum mappingDefaults."
    };
  }

  const firstSection = asArray(curriculum.sections).sort((a, b) => Number(a.order || 0) - Number(b.order || 0))[0];
  const firstModule = asArray(firstSection?.modules).sort((a, b) => Number(a.order || 0) - Number(b.order || 0))[0];
  return {
    sectionId: firstSection?.id || "1.0",
    moduleId: firstModule?.id || "operating-system-foundations",
    reason: "Mapped to the first curriculum module because no autoMap or accepted curriculum decision matched."
  };
}

function placementForDecision({ curriculum, modules, decision, object }) {
  const autoMapPlacement = bestAutoMapPlacement(curriculum, decision, object);
  if (autoMapPlacement) return autoMapPlacement;

  const cd = decision.curriculumDecision || {};
  if ((cd.status === "accept" || cd.status === "change") && cd.moduleId) {
    const target = modules.get(`${cd.sectionId || "1.0"}.${cd.moduleId}`) || modules.get(cd.moduleId);
    if (target) {
      return {
        sectionId: target.section.id,
        moduleId: target.module.id,
        reason: cd.reason || "Mapped from accepted discovery review curriculum decision."
      };
    }
  }

  return fallbackPlacement(curriculum);
}

function addUnique(array, value) {
  if (!array.includes(value)) array.push(value);
}

function sameModule(left, right) {
  return left.section.id === right.section.id && left.module.id === right.module.id;
}

function removeFromOtherModules(curriculum, id, target) {
  const removed = [];
  if (allowMultiplePlacements) return removed;

  for (const section of asArray(curriculum.sections)) {
    for (const module of asArray(section.modules)) {
      if (sameModule({ section, module }, target)) continue;
      const before = asArray(module.knowledge);
      if (!before.includes(id)) {
        module.knowledge = before;
        continue;
      }
      module.knowledge = before.filter(item => item !== id);
      removed.push({ id, sectionId: section.id, moduleId: module.id });
    }
  }

  return removed;
}

function sortModuleKnowledge(curriculum) {
  for (const section of asArray(curriculum.sections)) {
    for (const module of asArray(section.modules)) {
      module.knowledge = [...new Set(asArray(module.knowledge))].sort();
    }
  }
}

function pruneMissingKnowledge(curriculum, ids) {
  const removed = [];
  for (const section of asArray(curriculum.sections)) {
    for (const module of asArray(section.modules)) {
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

const objects = canonicalKnowledgeObjects();
const ids = new Set(objects.keys());
const curriculum = readJson(curriculumFile);
const modules = moduleById(curriculum);
const added = [];
const relocated = [];
const skipped = [];

for (const file of reviewedFiles) {
  const review = readJson(file);
  for (const decision of asArray(review.conceptDecisions)) {
    if (decision.decision !== "accept-for-authoring") continue;
    const id = decision.proposedKnowledgeId;
    const object = objects.get(id);
    if (!object) {
      skipped.push({ id, reason: "Knowledge Object is not canonical yet." });
      continue;
    }

    const placement = placementForDecision({ curriculum, modules, decision, object });
    const target = modules.get(`${placement.sectionId}.${placement.moduleId}`) || modules.get(placement.moduleId);
    if (!target) {
      skipped.push({ id, reason: `Target module not found: ${placement.sectionId}.${placement.moduleId}` });
      continue;
    }

    const movedFrom = removeFromOtherModules(curriculum, id, target);
    relocated.push(...movedFrom.map(item => ({
      ...item,
      targetSectionId: target.section.id,
      targetModuleId: target.module.id
    })));

    target.module.knowledge = asArray(target.module.knowledge);
    const before = target.module.knowledge.length;
    addUnique(target.module.knowledge, id);
    if (target.module.knowledge.length !== before) {
      added.push({
        id,
        sectionId: target.section.id,
        moduleId: target.module.id,
        reason: placement.reason
      });
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
  mapperType: "curriculum-driven-autoMap",
  dryRun,
  certification: cert,
  lesson,
  curriculum: toProjectPath(curriculumFile, root),
  reviewedFiles: reviewedFiles.map(file => toProjectPath(file, root)),
  canonicalKnowledgeObjects: ids.size,
  addedCount: added.length,
  relocatedCount: relocated.length,
  removedMissingCount: removed.length,
  skippedCount: skipped.length,
  added,
  relocated,
  removedMissing: removed,
  skipped,
  validation: dryRun ? "skipped-dry-run" : "passed",
  next: [
    "Run npm run validate:all.",
    "Reload the app and check whether Unmapped Knowledge shrank."
  ]
}, null, 2));
