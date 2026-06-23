export function renderKnowledgeObject(item) {
  if (!item) return "<p>Select a concept.</p>";

  const list = values => (values || []).map(value => `<li>${escapeHtml(value)}</li>`).join("");
  const commands = (item.commands || [])
    .map(cmd => `<li><code>${escapeHtml(cmd.command)}</code> — ${escapeHtml(cmd.purpose)}</li>`)
    .join("");

  return `
    <article class="card">
      <p class="eyebrow">${escapeHtml((item.certifications || []).join(", "))}</p>
      <h2>${escapeHtml(item.title)}</h2>
      <p>${escapeHtml(item.summary || "")}</p>
      <h3>Facts</h3><ul>${list(item.facts)}</ul>
      ${commands ? `<h3>Commands</h3><ul>${commands}</ul>` : ""}
      <h3>Common Mistakes</h3><ul>${list(item.commonMistakes)}</ul>
      <h3>Exam Tips</h3><ul>${list(item.examTips)}</ul>
      <h3>Related Concepts</h3><p>${escapeHtml((item.relatedConcepts || []).join(" → "))}</p>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
