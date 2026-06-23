export function renderDuplicateList(candidate) {
  const duplicates = candidate.possibleDuplicates || [];
  if (!duplicates.length) {
    return '<p class="muted">No possible duplicates detected.</p>';
  }

  return `<ul class="duplicate-list">${duplicates.map(item => `
    <li>
      <strong>${escapeHtml(item.title)}</strong>
      <code>${escapeHtml(item.knowledgeId)}</code>
      <span>${escapeHtml(item.reason)}</span>
      ${typeof item.score === 'number' ? `<span class="pill">score ${item.score.toFixed(2)}</span>` : ''}
    </li>
  `).join('')}</ul>`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
