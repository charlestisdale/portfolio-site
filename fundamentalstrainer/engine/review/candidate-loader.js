import { normalizeCandidateSet } from "./candidate-normalizer.js";

const MANIFEST_PATHS = [
  "./data/imports/pending/manifest.json",
  "./content/imports/review-queue/manifest.json"
];

export async function loadPendingManifest() {
  const attempts = [];

  for (const path of MANIFEST_PATHS) {
    const response = await fetch(path, { cache: "no-store" });
    attempts.push(path);
    if (response.ok) {
      const manifest = await response.json();
      return (manifest.imports || []).map(item => ({
        ...item,
        path: normalizePath(item.path, path)
      }));
    }
  }

  throw new Error(`Could not load pending import manifest. Tried: ${attempts.join(", ")}.`);
}

export async function loadCandidateSet(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load pending import: ${path}`);
  }
  return normalizeCandidateSet(await response.json());
}

function normalizePath(itemPath, manifestPath) {
  if (!itemPath || /^https?:\/\//.test(itemPath) || itemPath.startsWith("./") || itemPath.startsWith("/")) {
    return itemPath;
  }

  const base = manifestPath.split("/").slice(0, -1).join("/");
  return `${base}/${itemPath}`;
}
