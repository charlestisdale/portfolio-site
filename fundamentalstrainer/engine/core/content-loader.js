export async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

export async function loadCertification(certId) {
  return loadJson(`content/certifications/${certId}.json`);
}

export async function loadObjectives(path) {
  return loadJson(path);
}
