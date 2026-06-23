export function renderAssessmentMode({ assessment = null, answers = {}, grade = null } = {}) {
  if (!assessment) {
    return `
      <section class="assessment-mode card">
        <header class="assessment-hero">
          <div>
            <p class="eyebrow">Assessment Generator</p>
            <h2>Generated Practice</h2>
            <p class="muted">Generate questions directly from knowledge objects. No manual question bank required.</p>
          </div>
          <button type="button" data-assessment-action="generate">Generate Practice Set</button>
        </header>
      </section>
    `;
  }

  return `
    <section class="assessment-mode card">
      <header class="assessment-hero">
        <div>
          <p class="eyebrow">Assessment Generator</p>
          <h2>Generated Practice</h2>
          <p class="muted">${escapeHtml(assessment.summary.generated)} generated questions from ${escapeHtml(assessment.summary.sourceObjects)} knowledge objects.</p>
        </div>
        <div class="assessment-actions">
          <button type="button" data-assessment-action="generate">Regenerate</button>
          <button type="button" data-assessment-action="grade">Grade</button>
        </div>
      </header>

      ${grade ? renderGradeSummary(grade) : ""}

      <div class="assessment-question-list">
        ${assessment.questions.map((question, index) => renderQuestion(question, index, answers, grade)).join("")}
      </div>
    </section>
  `;
}

function renderGradeSummary(grade) {
  return `
    <section class="assessment-grade-summary">
      <strong>${escapeHtml(grade.percent)}%</strong>
      <span>${escapeHtml(grade.correct)} correct out of ${escapeHtml(grade.total)}</span>
    </section>
  `;
}

function renderQuestion(question, index, answers, grade) {
  const selectedAnswerId = answers[question.id] || null;
  const result = grade?.results?.find(item => item.questionId === question.id) || null;

  return `
    <article class="assessment-question-card">
      <header>
        <span class="pill">${escapeHtml(formatLabel(question.type))}</span>
        <span class="muted">Question ${escapeHtml(index + 1)}</span>
      </header>
      <h3>${escapeHtml(question.prompt)}</h3>
      <div class="assessment-answer-list">
        ${question.answers.map(answer => renderAnswer(question, answer, selectedAnswerId, result)).join("")}
      </div>
      ${result ? renderFeedback(result) : ""}
    </article>
  `;
}

function renderAnswer(question, answer, selectedAnswerId, result) {
  const isSelected = answer.id === selectedAnswerId;
  const isCorrect = result && answer.id === result.correctAnswerId;
  const isWrongSelection = result && isSelected && !result.correct;
  const stateClass = isCorrect ? "correct" : isWrongSelection ? "incorrect" : isSelected ? "selected" : "";

  return `
    <button type="button" class="assessment-answer ${stateClass}" data-assessment-question="${escapeHtml(question.id)}" data-assessment-answer="${escapeHtml(answer.id)}">
      ${escapeHtml(answer.text)}
    </button>
  `;
}

function renderFeedback(result) {
  return `
    <section class="assessment-feedback ${result.correct ? "correct" : "incorrect"}">
      <strong>${result.correct ? "Correct" : "Review this one"}</strong>
      <p>${escapeHtml(result.explanation || "No explanation available yet.")}</p>
    </section>
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
