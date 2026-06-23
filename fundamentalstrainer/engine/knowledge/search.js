import { objectText } from "./resolver.js";

export function searchObjects(objects, query, { limit = 50, filters = {} } = {}) {
  const q = String(query || "").toLowerCase().trim();
  const filtered = objects.filter(object => matchesObjectFilters(object, filters));

  if (!q) {
    return filtered.slice(0, limit).map(object => ({
      object,
      score: 1,
      reasons: ["all"],
      snippet: createSnippet(object)
    }));
  }

  const terms = q.split(/\s+/).filter(Boolean);

  return filtered
    .map(object => scoreObject(object, q, terms))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.object.title.localeCompare(b.object.title))
    .slice(0, limit);
}

export function collectSearchFacets(objects) {
  return {
    domains: unique(objects.flatMap(object => object.domains || [])).sort(),
    types: unique(objects.map(object => object.type).filter(Boolean)).sort(),
    statuses: unique(objects.map(object => object.status).filter(Boolean)).sort(),
    difficulties: unique(objects.map(object => object.difficulty).filter(Boolean)).sort(),
    importances: unique(objects.map(object => object.importance).filter(Boolean)).sort()
  };
}

function scoreObject(object, query, terms) {
  const title = String(object.title || "").toLowerCase();
  const aliases = (object.aliases || []).map(alias => String(alias).toLowerCase());
  const id = String(object.id || "").toLowerCase();
  const slug = String(object.slug || "").toLowerCase();
  const summary = String(object.learning?.summary || "").toLowerCase();
  const haystack = objectText(object).toLowerCase();
  const reasons = [];
  let score = 0;

  if (id === query || slug === query) { score += 100; reasons.push("id/slug exact"); }
  if (title === query) { score += 90; reasons.push("title exact"); }
  if (aliases.includes(query)) { score += 80; reasons.push("alias exact"); }
  if (title.includes(query)) { score += 40; reasons.push("title"); }
  if (id.includes(query) || slug.includes(query)) { score += 30; reasons.push("id/slug"); }
  if (summary.includes(query)) { score += 20; reasons.push("summary"); }

  for (const term of terms) {
    if (title.includes(term)) score += 10;
    if (summary.includes(term)) score += 8;
    if (haystack.includes(term)) score += 5;
  }

  if (score > 0 && !reasons.length) reasons.push("content");
  return { object, score, reasons: unique(reasons), snippet: createSnippet(object, terms) };
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
  if (filters.difficulty && object.difficulty !== filters.difficulty) return false;

  return true;
}

function createSnippet(object, terms = []) {
  const candidates = [
    object.learning?.summary,
    object.learning?.explanation,
    ...(object.learning?.facts || []).map(fact => fact.text),
    ...(object.learning?.examples || []).map(example => example.text),
    ...(object.assessmentSeeds?.examTips || []).map(tip => tip.text),
    ...(object.assessmentSeeds?.commonMistakes || []).map(mistake => mistake.text)
  ].filter(Boolean);

  if (!terms.length) return truncate(candidates[0] || object.title || object.id || "No snippet available.");

  const matched = candidates.find(candidate => {
    const text = String(candidate).toLowerCase();
    return terms.some(term => text.includes(term));
  });

  return truncate(matched || candidates[0] || object.title || object.id || "No snippet available.");
}

function truncate(value, maxLength = 180) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
