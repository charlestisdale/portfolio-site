const MANIFEST_PATH = './data/imports/pending/manifest.json';

export async function loadPendingManifest() {
  const response = await fetch(MANIFEST_PATH, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load ${MANIFEST_PATH}. Run npm run review:manifest first.`);
  }
  const manifest = await response.json();
  return manifest.imports || [];
}

export async function loadCandidateSet(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Could not load pending import: ${path}`);
  }
  return response.json();
}
