#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const dryRun = args["dry-run"] !== "false";
const includePending = args["include-pending"] === "true";
const includeReports = args["include-reports"] === "true";
const includeAiResponses = args["include-ai-responses"] === "true";

function walkJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_templates") return [];
      return walkJsonFiles(full);
    }
    return entry.isFile() && entry.name.endsWith(".json") ? [full] : [];
  });
}

function removeFiles(files) {
  const removed = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    removed.push(toProjectPath(file, root));
    if (!dryRun) fs.rmSync(file, { force: true });
  }
  return removed;
}

function writeJson(filePath, data) {
  if (dryRun) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
}

function resetKnowledgeIndex() {
  const indexPath = path.resolve(root, "content", "indexes", "knowledge-index.json");
  writeJson(indexPath, {
    generatedBy: "knowledge-reset",
    description: "Canonical Knowledge Object index cleared so reviewed enriched imports can be promoted cleanly.",
    objects: []
  });
  return toProjectPath(indexPath, root);
}

function resetGraph() {
  const graphPath = path.resolve(root, "content", "relationships", "a-plus-220-1202.graph.json");
  writeJson(graphPath, {
    schemaVersion: "1.0.0",
    certification: "a-plus-220-1202",
    generatedBy: "knowledge-reset",
    description: "Relationship graph cleared so new graph edges come only from reviewed enriched imports.",
    relationships: []
  });
  return toProjectPath(graphPath, root);
}

const removedKnowledge = removeFiles(walkJsonFiles(path.resolve(root, "content", "knowledge")));
const removedApprovedExports = removeFiles([
  path.resolve(root, "approved-knowledge-objects.json"),
  path.resolve(root, "data", "knowledge-builder", "approved-knowledge-objects.json")
]);
const removedPending = includePending ? removeFiles(walkJsonFiles(path.resolve(root, "data", "imports", "pending"))) : [];
const removedReports = includeReports ? removeFiles(walkJsonFiles(path.resolve(root, "data", "imports", "reports"))) : [];
const removedAiResponses = includeAiResponses ? removeFiles(walkJsonFiles(path.resolve(root, "data", "ai-imports", "responses"))) : [];
const indexPath = resetKnowledgeIndex();
const graphPath = resetGraph();

console.log(JSON.stringify({
  generatedBy: "knowledge-store-reset",
  dryRun,
  removedKnowledgeCount: removedKnowledge.length,
  removedApprovedExportCount: removedApprovedExports.length,
  removedPendingCount: removedPending.length,
  removedReportsCount: removedReports.length,
  removedAiResponsesCount: removedAiResponses.length,
  removedKnowledge,
  removedApprovedExports,
  removedPending,
  removedReports,
  removedAiResponses,
  resetFiles: [indexPath, graphPath],
  next: dryRun
    ? ["Run again with --dry-run=false to delete these files."]
    : [
      "Clear browser localStorage for old review approvals.",
      "Regenerate review manifest if pending imports were kept: npm run review:manifest.",
      "Promote only a newly exported enriched approved-knowledge-objects.json."
    ]
}, null, 2));
