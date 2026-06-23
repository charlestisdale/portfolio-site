import { collectSearchFacets } from "../knowledge/search.js";

export function renderSearchControls({ objects = [], filters = {} } = {}) {
  const facets = collectSearchFacets(objects);

  return `
    <div class="search-controls">
      ${renderSelect("domain", "Domain", facets.domains, filters.domain)}
      ${renderSelect("type", "Type", facets.types, filters.type)}
      ${renderSelect("status", "Status", facets.statuses, filters.status)}
      ${renderSelect("difficulty", "Difficulty", facets.difficulties, filters.difficulty)}
      ${renderSelect("importance", "Importance", facets.importances, filters.importance)}
      <button class="secondary-button search-reset-button" type="button" data-search-reset>Reset</button>
    </div>
  `;
}

export function renderSearchResults({ query = "", results = [], totalObjects = 0, filters = {} } = {}) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const summary = query || activeFilterCount
    ? `${results.length} result${results.length === 1 ? "" : "s"} from ${totalObjects} knowledge object${totalObjects === 1 ? "" : "s"}`
    : `${totalObjects} knowledge object${totalObjects === 1 ? "" : "s"}`;

  if (!results.length) {
    return `
      <div class="search-summary">
        <strong>${escapeHtml(summary)}</strong>
        <span class="muted">Try removing filters or searching for another term.</span>
      </div>
      <div class="empty-card compact-empty">No matching concepts found.</div>
    `;
  }

  return `
    <div class="search-summary">
      <strong>${escapeHtml(summary)}</strong>
      <span class="muted">${activeFilterCount ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}` : "No active filters"}</span>
    </div>
    <div class="search-result-list">
      ${results.map(result => renderResult(result)).join("")}
    </div>
  `;
}

function renderSelect(name, label, values, selectedValue) {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select data-search-filter="${escapeHtml(name)}">
        <option value="">All</option>
        ${values.map(value => `<option value="${escapeHtml(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHtml(formatLabel(value))}</option>`).join("")}
      </select>
    </label>
  `;
}

function renderResult(result) {
  const item = result.object || result;
  const reasons = result.reasons || [];
  const domains = item.domains || [];

  return `
    <button class="search-result-card" data-id="${escapeHtml(item.id)}">
      <span class="search-result-card__title">${escapeHtml(item.title)}</span>
      <span class="search-result-card__id">${escapeHtml(item.id)}</span>
      <span class="search-result-card__snippet">${escapeHtml(result.snippet || item.learning?.summary || "No summary available yet.")}</span>
      <span class="search-result-card__meta">
        ${item.type ? `<span class="pill">${escapeHtml(formatLabel(item.type))}</span>` : ""}
        ${item.difficulty ? `<span class="pill">${escapeHtml(formatLabel(item.difficulty))}</span>` : ""}
        ${item.importance ? `<span class="pill">${escapeHtml(formatLabel(item.importance))}</span>` : ""}
        ${domains.slice(0, 2).map(domain => `<span class="pill">${escapeHtml(formatLabel(domain))}</span>`).join("")}
      </span>
      ${reasons.length ? `<span class="search-result-card__reasons">Matched: ${escapeHtml(reasons.join(", "))}</span>` : ""}
    </button>
  `;
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
