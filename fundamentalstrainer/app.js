import { KnowledgeStore } from "./engine/services/knowledge-store.js";
import { renderKnowledgeObject } from "./engine/modes/learn.js";

const store = new KnowledgeStore();
const seedKnowledgePaths = [
  "content/knowledge/windows/task-manager.json",
  "content/knowledge/commands/ipconfig.json"
];

const searchBox = document.querySelector("#searchBox");
const results = document.querySelector("#results");
const conceptView = document.querySelector("#conceptView");

async function loadSeedKnowledge() {
  const objects = await Promise.all(seedKnowledgePaths.map(path => fetch(path).then(r => r.json())));
  objects.forEach(item => store.add(item));
  renderResults(store.all());
  conceptView.innerHTML = renderKnowledgeObject(store.all()[0]);
}

function renderResults(items) {
  results.innerHTML = items.map(item => `
    <button class="result" data-id="${item.id}">
      <strong>${item.title}</strong><br />
      <span>${item.id}</span>
    </button>
  `).join("");
}

searchBox.addEventListener("input", () => renderResults(store.search(searchBox.value)));

results.addEventListener("click", event => {
  const button = event.target.closest("button[data-id]");
  if (!button) return;
  conceptView.innerHTML = renderKnowledgeObject(store.findById(button.dataset.id));
});

loadSeedKnowledge().catch(error => {
  conceptView.innerHTML = `<pre>${error.message}</pre>`;
});
