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

export function renderRelationshipList(candidate) {
  const relationships = candidate.suggestedRelationships || [];
  if (!relationships.length) {
    return '<p class="muted">No relationship suggestions.</p>';
  }

  return `<ul>${relationships.map(item => `
    <li>
      <strong>${escapeHtml(item.type)}</strong> → <code>${escapeHtml(item.target)}</code>
      ${item.reason ? `— ${escapeHtml(item.reason)}` : ''}
      ${typeof item.confidence === 'number' ? ` <span class="pill">confidence ${Math.round(item.confidence * 100)}%</span>` : ''}
      ${item.strength ? ` <span class="pill">${escapeHtml(item.strength)}</span>` : ''}
    </li>
  `).join('')}</ul>`;
}

export function renderEvidenceList(candidate) {
  const evidence = candidate.evidence || [];
  if (!evidence.length) {
    return '<p class="muted">No transcript evidence.</p>';
  }

  return `<ol>${evidence.map((item, index) => `
    <li value="${Number(item.line) || index + 1}">
      ${item.startTime ? `<span class="pill">${escapeHtml(item.startTime)}${item.endTime ? ` → ${escapeHtml(item.endTime)}` : ''}</span> ` : ''}
      ${escapeHtml(item.text)}
    </li>
  `).join('')}</ol>`;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
