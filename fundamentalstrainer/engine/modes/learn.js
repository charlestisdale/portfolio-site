export function renderKnowledgeObject(item) {
  if (!item) return "<p>Select a concept.</p>";

  const list = values => (values || []).map(value => `<li>${escapeHtml(value)}</li>`).join("");
  const factList = (item.learning?.facts || [])
    .map(fact => `<li>${escapeHtml(fact.text)} ${fact.importance ? `<span class="pill">${escapeHtml(fact.importance)}</span>` : ""}</li>`)
    .join("");
  const commands = (item.learning?.commands || [])
    .map(cmd => `<li><code>${escapeHtml(cmd.command)}</code> — ${escapeHtml(cmd.purpose)}</li>`)
    .join("");
  const examples = (item.learning?.examples || [])
    .map(example => `<li>${escapeHtml(example.text)}</li>`)
    .join("");
  const mistakes = (item.assessmentSeeds?.commonMistakes || [])
    .map(mistake => `<li>${escapeHtml(mistake.text)}</li>`)
    .join("");
  const tips = (item.assessmentSeeds?.examTips || [])
    .map(tip => `<li>${escapeHtml(tip.text)}</li>`)
    .join("");
  const scenarios = (item.assessmentSeeds?.scenarios || [])
    .map(scenario => `<li><strong>Situation:</strong> ${escapeHtml(scenario.situation)}<br><strong>Expected:</strong> ${escapeHtml(scenario.expectedAction)}</li>`)
    .join("");
  const related = (item.relationships?.related || [])
    .map(relationship => `${relationship.id} (${relationship.reason})`);
  const mappings = (item.certificationMappings || [])
    .map(mapping => `${mapping.certification}${mapping.examCode ? ` ${mapping.examCode}` : ""}`)
    .join(", ");

  return `
    <article class="card">
      <p class="eyebrow">${escapeHtml(mappings)} • ${escapeHtml(item.status)} • ${escapeHtml(item.importance || "")}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.learning?.summary || "")}</p>
      ${item.learning?.explanation ? `<h3>Explanation</h3><p>${escapeHtml(item.learning.explanation)}</p>` : ""}
      <h3>Facts</h3><ul>${factList}</ul>
      ${commands ? `<h3>Commands</h3><ul>${commands}</ul>` : ""}
      ${examples ? `<h3>Examples</h3><ul>${examples}</ul>` : ""}
      ${mistakes ? `<h3>Common Mistakes</h3><ul>${mistakes}</ul>` : ""}
      ${tips ? `<h3>Exam Tips</h3><ul>${tips}</ul>` : ""}
      ${scenarios ? `<h3>Scenarios</h3><ul>${scenarios}</ul>` : ""}
      <h3>Related Concepts</h3><p>${escapeHtml(related.join(" → "))}</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
