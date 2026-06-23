import { objectText } from "./resolver.js";

export function searchObjects(objects, query, { limit = 50, filters = {} } = {}) {
  const q = String(query || "").toLowerCase().trim();
  const filtered = objects.filter(object => matchesObjectFilters(object, filters));
  if (!q) return filtered.slice(0, limit).map(object => ({ object, score: 1, reasons: ["all"] }));

  const terms = q.split(/\s+/).filter(Boolean);

  return filtered
    .map(object => scoreObject(object, q, terms))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.object.title.localeCompare(b.object.title))
    .slice(0, limit);
}

function scoreObject(object, query, terms) {
  const title = String(object.title || "").toLowerCase();
  const aliases = (object.aliases || []).map(alias => String(alias).toLowerCase());
  const id = String(object.id || "").toLowerCase();
  const slug = String(object.slug || "").toLowerCase();
  const haystack = objectText(object).toLowerCase();
  const reasons = [];
  let score = 0;

  if (id === query || slug === query) { score += 100; reasons.push("id/slug exact"); }
  if (title === query) { score += 90; reasons.push("title exact"); }
  if (aliases.includes(query)) { score += 80; reasons.push("alias exact"); }
  if (title.includes(query)) { score += 40; reasons.push("title"); }
  if (id.includes(query) || slug.includes(query)) { score += 30; reasons.push("id/slug"); }

  for (const term of terms) {
    if (haystack.includes(term)) score += 5;
  }

  if (score > 0 && !reasons.length) reasons.push("content");
  return { object, score, reasons };
}

function matchesObjectFilters(object, filters) {
  if (filters.certification) {
    const hasCert = (object.certificationMappings || []).some(mapping => mapping.certification === filters.certification);
    if (!hasCert) return false;
  }

  if (filters.domain && !(object.domains || []).includes(filters.domain)) return false;
  if (filters.type && object.type !== filters.type) return false;
  if (filters.status && object.status !== filters.status) return false;
  if (filters.importance && object.importance !== filters.importance) return false;

  return true;
}
