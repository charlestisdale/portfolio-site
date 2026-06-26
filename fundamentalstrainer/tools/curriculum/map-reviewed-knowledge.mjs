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

const curriculumRules = [
  {
    sectionId: "1.0",
    moduleId: "firmware-and-boot-methods",
    reason: "Mapped by curriculum rule for firmware and boot method concepts.",
    idPrefixes: ["firmware.", "bios.", "uefi.", "pxe.", "boot."],
    idIncludes: ["firmware", "uefi", "bios", "pxe", "bootable-usb", "iso-image"],
    titleIncludes: ["firmware", "uefi", "bios", "compatibility mode", "pxe", "network boot", "bootable usb", "iso image"]
  },
  {
    sectionId: "1.0",
    moduleId: "os-installation-methods",
    reason: "Mapped by curriculum rule for OS installation method concepts.",
    idPrefixes: ["os.installation", "os.clean-install", "os.in-place-upgrade"],
    idIncludes: ["clean-install", "in-place-upgrade", "multiboot", "installation-planning"],
    titleIncludes: ["clean install", "in-place upgrade", "installation planning", "multiboot", "multi boot"]
  },
  {
    sectionId: "1.0",
    moduleId: "os-deployment-and-recovery",
    reason: "Mapped by curriculum rule for OS deployment and recovery concepts.",
    idPrefixes: ["os.deployment", "os.recovery", "os.repair", "os.driver-loading"],
    idIncludes: ["image-deployment", "zero-touch", "recovery-partition", "repair-installation", "third-party-driver-loading"],
    titleIncludes: ["image deployment", "zero touch", "recovery partition", "repair installation", "third-party driver", "driver loading"]
  },
  {
    sectionId: "1.0",
    moduleId: "os-compatibility-and-readiness",
    reason: "Mapped by curriculum rule for OS compatibility and readiness concepts.",
    idPrefixes: [
      "os.hardware-compatibility",
      "windows.pc-health-check",
      "windows.system-information",
      "windows.application-driver-compatibility",
      "security.tpm",
      "windows.tpm",
      "security.secure-boot"
    ],
    idIncludes: ["compatibility-check", "pc-health-check", "system-information", "application-driver-compatibility", "hardware-compatibility", "tpm", "secure-boot"],
    titleIncludes: ["compatibility", "readiness", "pc health check", "system information", "tpm", "secure boot", "hardware requirement", "driver compatibility"]
  },
  {
    sectionId: "1.0",
    moduleId: "os-maintenance-and-lifecycle",
    reason: "Mapped by curriculum rule for OS maintenance and lifecycle concepts.",
    idIncludes: ["patch", "update", "end-of-life", "product-lifecycle"],
    titleIncludes: ["update", "patch", "end of life", "product lifecycle", "lifecycle", "support lifecycle"]
  },
  {
    sectionId: "1.0",
    moduleId: "file-systems",
    reason: "Mapped by curriculum rule for file system concepts.",
    idPrefixes: ["filesystems.", "linux.ext", "macos.apfs", "windows.ntfs"],
    titleIncludes: ["file system", "ntfs", "refs", "xfs", "ext4", "apfs", "fat32", "exfat"]
  },
  {
    sectionId: "1.0",
    moduleId: "mobile-operating-systems",
    reason: "Mapped by curriculum rule for mobile operating system concepts.",
    idPrefixes: ["android.", "apple.", "ios.", "ipados.", "mobile."],
    titleIncludes: ["android", "ios", "ipados", "mobile"]
  },
  {
    sectionId: "1.0",
    moduleId: "desktop-operating-systems",
    reason: "Mapped by curriculum rule for desktop operating system concepts.",
    idPrefixes: ["windows.", "linux.", "macos.", "chromeos."],
    titleIncludes: ["windows", "linux", "macos", "chromeos", "desktop"]
  }
];

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

function textFor(item) {
  return {
    id: String(item.proposedKnowledgeId || item.id || "").toLowerCase(),
    title: String(item.title || "").toLowerCase()
  };
}

function matchesRule(item, rule) {
  const { id, title } = textFor(item);
  const idPrefixMatch = asArray(rule.idPrefixes).some(prefix => id.startsWith(String(prefix).toLowerCase()));
  const idIncludeMatch = asArray(rule.idIncludes).some(value => id.includes(String(value).toLowerCase()));
  const titleIncludeMatch = asArray(rule.titleIncludes).some(value => title.includes(String(value).toLowerCase()));
  return idPrefixMatch || idIncludeMatch || titleIncludeMatch;
}

function rulePlacementFor(item) {
  const rule = curriculumRules.find(candidate => matchesRule(item, candidate));
  if (!rule) return null;
  return {
    sectionId: rule.sectionId,
    moduleId: rule.moduleId,
    reason: rule.reason
  };
}

function defaultModuleFor(item) {
  return rulePlacementFor(item)?.moduleId || "operating-system-foundations";
}

function placementForDecision(decision) {
  const rulePlacement = rulePlacementFor(decision);
  const cd = decision.curriculumDecision || {};

  if (rulePlacement) {
    return {
      ...rulePlacement,
      originalSectionId: cd.sectionId || null,
      originalModuleId: cd.moduleId || null
    };
  }

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

function sameModule(left, right) {
  return left.section.id === right.section.id && left.module.id === right.module.id;
}

function removeFromOtherModules(curriculum, id, target) {
  const removed = [];
  if (allowMultiplePlacements) return removed;

  for (const section of curriculum.sections || []) {
    for (const module of section.modules || []) {
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
const relocated = [];
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
        reason: placement.reason,
        originalSectionId: placement.originalSectionId || undefined,
        originalModuleId: placement.originalModuleId || undefined
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
