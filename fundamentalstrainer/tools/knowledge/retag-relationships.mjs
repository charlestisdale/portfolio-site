#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const certification = args.cert || args.certification || "a-plus-220-1202";
const dryRun = args["dry-run"] === "true";

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  if (dryRun) return;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function loadObjects() {
  const indexPath = path.resolve(root, "content", "indexes", "knowledge-index.json");
  const index = readJson(indexPath);
  return new Map(asArray(index.objects).map(objectPath => {
    const object = readJson(path.resolve(root, objectPath));
    return [object.id, object];
  }));
}

function text(value) {
  return String(value || "").toLowerCase();
}

function hasAny(value, words) {
  const haystack = text(value);
  return words.some(word => haystack.includes(word));
}

function domain(object) {
  return object?.domains?.[0] || object?.id?.split(".")[0] || "";
}

function inferType(edge, source, target) {
  const reason = edge.notes || edge.reason || "";
  const sourceTitle = text(source?.title || source?.id);
  const targetTitle = text(target?.title || target?.id);
  const sourceDomain = domain(source);
  const targetDomain = domain(target);

  if (hasAny(reason, ["prerequisite", "before learning", "before understanding"])) return "prerequisite";
  if (hasAny(reason, ["contrast", "compare", "compared", "versus", " vs "])) return "contrasts_with";
  if (hasAny(reason, ["replace", "successor", "supersede", "end of life"])) return "replaces";
  if (hasAny(reason, ["communicate", "connection", "network", "tcp", "port"])) return "communicates_with";
  if (hasAny(reason, ["stores", "storage", "file system", "filesystem"])) return "stores";
  if (hasAny(reason, ["executes", "runs", "launches", "command line", "script"])) return "executes";
  if (hasAny(reason, ["manage", "administer", "configure", "controls"])) return "manages";
  if (hasAny(reason, ["part of", "component", "subtopic"])) return "part_of";
  if (hasAny(reason, ["contains", "includes", "made up of", "consists of"])) return "contains";
  if (hasAny(reason, ["platform", "supports", "provides"])) return "supports";
  if (hasAny(reason, ["uses", "relies on", "depends on"])) return "uses";

  if (source?.type === "command" || source?.type === "tool") {
    if (target?.type === "operating-system" || targetDomain === "operating" || targetDomain === "windows") return "runs_on";
    if (targetDomain === "networking") return "communicates_with";
  }

  if (target?.type === "command" || target?.type === "tool") {
    if (source?.type === "operating-system" || sourceDomain === "operating" || sourceDomain === "windows") return "executes";
  }

  if (source?.type === "operating-system" && target?.type === "file-system") return "uses";
  if (source?.type === "file-system" && target?.type === "operating-system") return "part_of";

  if (sourceTitle === "operating system") {
    if (["windows", "linux", "macos", "chromeos", "android", "ios", "microsoft windows", "apple ios"].includes(targetTitle)) return "supports";
    if (targetDomain === "operating") return "contains";
  }

  if (targetTitle === "operating system") {
    if (["windows", "linux", "macos", "chromeos", "android", "ios", "microsoft windows", "apple ios"].includes(sourceTitle)) return "implements";
    if (sourceDomain === "operating") return "part_of";
  }

  if (sourceDomain === "networking" || targetDomain === "networking") {
    if (sourceTitle.includes("dhcp") || targetTitle.includes("dhcp") || sourceTitle.includes("ip address") || targetTitle.includes("ip address")) return "uses";
  }

  if (sourceDomain === targetDomain && sourceDomain === "operating") return "contains";
  return "related";
}

const graphPath = path.resolve(root, "content", "relationships", `${certification}.graph.json`);
if (!fs.existsSync(graphPath)) {
  console.error(`Graph not found: ${toProjectPath(graphPath, root)}`);
  process.exit(1);
}

const objects = loadObjects();
const graph = readJson(graphPath);
const changes = [];

const relationships = asArray(graph.relationships).map(edge => {
  const source = objects.get(edge.sourceId);
  const target = objects.get(edge.targetId);
  const oldType = edge.type || "related";
  const newType = inferType(edge, source, target);
  if (oldType !== newType) changes.push({ edgeId: edge.id, sourceId: edge.sourceId, targetId: edge.targetId, oldType, newType });
  return {
    ...edge,
    type: newType,
    taxonomyVersion: "1.0.0",
    updatedAt: new Date().toISOString().slice(0, 10)
  };
});

const updated = {
  ...graph,
  generatedBy: "knowledge-builder-relationship-retagger",
  relationshipTaxonomy: "content/relationships/relationship-taxonomy.json",
  updatedAt: new Date().toISOString(),
  relationships
};

writeJson(graphPath, updated);

console.log(JSON.stringify({
  graph: toProjectPath(graphPath, root),
  dryRun,
  relationshipCount: relationships.length,
  changedCount: changes.length,
  changes,
  next: [
    "Run npm run validate:knowledge.",
    "Reload the graph view and compare relationship labels."
  ]
}, null, 2));
