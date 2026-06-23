import { KnowledgeEngine } from "./engine/knowledge/index.js";
import { renderKnowledgeObject } from "./engine/modes/learn.js";

const knowledge = new KnowledgeEngine();

const searchBox = document.querySelector("#searchBox");
const results = document.querySelector("#results");
const conceptView = document.querySelector("#conceptView");
const platformStats = document.querySelector("#platformStats");
const relatedView = document.querySelector("#relatedView");
const commandView = document.querySelector("#commandView");

async function loadPlatform() {
  await knowledge.loadCertification("a-plus-220-1202");
  renderStats();
  renderResults(knowledge.search(""));
  renderCommands();

  const first = knowledge.all()[0];
  if (first) renderConcept(first.id);
}

function renderStats() {
  const stats = knowledge.statistics();
  platformStats.innerHTML = `
    <div><strong>${stats.knowledgeObjects}</strong><span>Knowledge Objects</span></div>
    <div><strong>${stats.relationships}</strong><span>Graph Edges</span></div>
    <div><strong>${stats.commands}</strong><span>Commands</span></div>
    <div><strong>${stats.pbqIdeas}</strong><span>PBQ Seeds</span></div>
  `;
}

function renderResults(searchResults) {
  const rows = searchResults.map(result => result.object || result);

  results.innerHTML = rows.map(item => `
    <button class="result" data-id="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.title)}</strong><br />
      <span>${escapeHtml(item.id)}</span>
    </button>
  `).join("");
}

function renderConcept(id) {
  const concept = knowledge.get(id);
  conceptView.innerHTML = renderKnowledgeObject(concept);
  renderRelated(id);
}

function renderRelated(id) {
  const edges = knowledge.related(id);

  if (!edges.length) {
    relatedView.innerHTML = "<p>No graph relationships yet.</p>";
    return;
  }

  relatedView.innerHTML = edges.map(edge => {
    const neighbor = edge.directionFromSource === "outbound" ? edge.target : edge.source;
    const missing = edge.directionFromSource === "outbound" ? edge.targetId : edge.sourceId;
    return `
      <button class="result" ${neighbor ? `data-id="${escapeHtml(neighbor.id)}"` : "disabled"}>
        <strong>${escapeHtml(edge.type)}</strong>: ${escapeHtml(neighbor?.title || missing)}<br />
        <span>${escapeHtml(edge.notes || edge.strength || "")}</span>
      </button>
    `;
  }).join("");
}

function renderCommands() {
  const commands = knowledge.commands();
  commandView.innerHTML = commands.length ? commands.map(command => `
    <li><code>${escapeHtml(command.command)}</code> — ${escapeHtml(command.purpose)} <span class="pill">${escapeHtml(command.title)}</span></li>
  `).join("") : "<li>No commands loaded yet.</li>";
}

searchBox.addEventListener("input", () => renderResults(knowledge.search(searchBox.value)));

results.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  renderConcept(button.dataset.id);
});

relatedView.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  renderConcept(button.dataset.id);
});

loadPlatform().catch(error => {
  conceptView.innerHTML = `<pre>${escapeHtml(error.stack || error.message)}</pre>`;
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
