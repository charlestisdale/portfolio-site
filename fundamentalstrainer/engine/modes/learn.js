export function renderLearnMode({ concept, relatedEdges = [], lessonContext = null, objectiveContext = [], progress = null } = {}) {
  if (!concept) return `<article class="card"><p>Select a concept.</p></article>`;

  const facts = concept.learning?.facts || [];
  const commands = concept.learning?.commands || [];
  const examples = concept.learning?.examples || [];
  const mistakes = concept.assessmentSeeds?.commonMistakes || [];
  const tips = concept.assessmentSeeds?.examTips || [];
  const scenarios = concept.assessmentSeeds?.scenarios || [];
  const pbqIdeas = concept.assessmentSeeds?.pbqIdeas || [];
  const mappings = getCertificationMappings(concept);
  const transcriptSources = concept.sources?.transcripts || [];

  return `
    <article class="learn-mode card">
      <header class="learn-hero">
        <div>
          <p class="eyebrow">Learn Mode</p>
          <h2>${escapeHtml(concept.title)}</h2>
          <p class="learn-summary">${escapeHtml(concept.learning?.summary || "No summary available yet.")}</p>
          ${renderProgressControls(concept.id, progress)}
        </div>
        <div class="learn-meta-card">
          ${renderMetaRow("Status", concept.status)}
          ${renderMetaRow("Difficulty", concept.difficulty)}
          ${renderMetaRow("Importance", concept.importance)}
          ${renderMetaRow("Type", concept.type)}
        </div>
      </header>

      <section class="learn-section-grid">
        <section class="learn-section learn-section--wide">
          <h3>What you need to know</h3>
          ${concept.learning?.explanation ? `<p>${escapeHtml(concept.learning.explanation)}</p>` : `<p class="muted">No explanation has been added yet.</p>`}
          ${renderFactList(facts)}
        </section>

        <aside class="learn-section">
          <h3>Study context</h3>
          ${renderLessonContext(lessonContext)}
          ${renderObjectiveContext(objectiveContext)}
          ${renderMappings(mappings)}
        </aside>
      </section>

      ${commands.length ? renderCommands(commands) : ""}
      ${examples.length ? renderSimpleCards("Examples", examples.map(example => example.text)) : ""}

      <section class="learn-section-grid">
        <section class="learn-section">
          <h3>Exam tips</h3>
          ${tips.length ? renderSimpleList(tips.map(tip => tip.text)) : `<p class="muted">No exam tips yet.</p>`}
        </section>

        <section class="learn-section">
          <h3>Common mistakes</h3>
          ${mistakes.length ? renderSimpleList(mistakes.map(mistake => mistake.text)) : `<p class="muted">No common mistakes yet.</p>`}
        </section>
      </section>

      ${scenarios.length ? renderScenarios(scenarios) : ""}
      ${pbqIdeas.length ? renderPbqIdeas(pbqIdeas) : ""}
      ${renderRelatedConcepts(relatedEdges)}
      ${renderSources(transcriptSources, concept.quality)}
    </article>
  `;
}

export function renderKnowledgeObject(item) {
  return renderLearnMode({ concept: item });
}

function renderProgressControls(knowledgeId, progress) {
  const status = progress?.status || "not-started";
  const label = formatLabel(status);
  const nextLabel = getNextProgressLabel(status);

  return `
    <section class="learn-progress-card" aria-label="Learning progress">
      <div>
        <span class="muted">Progress</span>
        <strong>${escapeHtml(label)}</strong>
        ${progress?.updatedAt ? `<small>Updated ${escapeHtml(formatDate(progress.updatedAt))}</small>` : `<small>No progress saved yet.</small>`}
      </div>
      <div class="learn-progress-actions">
        <button type="button" data-progress-action="cycle" data-id="${escapeHtml(knowledgeId)}">${escapeHtml(nextLabel)}</button>
        <button type="button" data-progress-action="reset" data-id="${escapeHtml(knowledgeId)}">Reset</button>
      </div>
    </section>
  `;
}

function getNextProgressLabel(status) {
  if (status === "not-started") return "Start Learning";
  if (status === "learning") return "Mark Reviewed";
  if (status === "reviewed") return "Mark Mastered";
  return "Restart";
}

function renderMetaRow(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || "Not set")}</strong>
    </div>
  `;
}

function renderFactList(facts) {
  if (!facts.length) return `<p class="muted">No facts have been added yet.</p>`;

  return `
    <ul class="learn-fact-list">
      ${facts.map(fact => `
        <li>
          <span>${escapeHtml(fact.text)}</span>
          ${fact.importance ? `<span class="pill">${escapeHtml(fact.importance)}</span>` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

function renderCommands(commands) {
  return `
    <section class="learn-section">
      <h3>Commands</h3>
      <div class="learn-command-list">
        ${commands.map(command => `
          <article>
            <code>${escapeHtml(command.command)}</code>
            <p>${escapeHtml(command.purpose)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderSimpleCards(title, values) {
  return `
    <section class="learn-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="learn-card-list">
        ${values.map(value => `<article>${escapeHtml(value)}</article>`).join("")}
      </div>
    </section>
  `;
}

function renderSimpleList(values) {
  return `<ul>${values.map(value => `<li>${escapeHtml(value)}</li>`).join("")}</ul>`;
}

function renderLessonContext(lessonContext) {
  if (!lessonContext?.lesson) return `<p class="muted">No lesson mapping yet.</p>`;

  return `
    <div class="context-block">
      <span>Lesson</span>
      <strong>${String(lessonContext.lesson.order || "").padStart(2, "0")} · ${escapeHtml(lessonContext.lesson.title)}</strong>
      <p class="muted">${escapeHtml(lessonContext.knowledge.length)} linked knowledge object${lessonContext.knowledge.length === 1 ? "" : "s"}</p>
    </div>
  `;
}

function renderObjectiveContext(objectives) {
  if (!objectives.length) return `<p class="muted">No objective mapping yet.</p>`;

  return `
    <div class="context-block">
      <span>Objectives</span>
      <div class="tag-list">
        ${objectives.map(item => `<span class="pill">${escapeHtml(item.objective?.id || item.id)} ${escapeHtml(item.objective?.title || item.objective?.name || "")}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderMappings(mappings) {
  if (!mappings.length) return "";

  return `
    <div class="context-block">
      <span>Certification mapping</span>
      ${mappings.map(mapping => `<strong>${escapeHtml(mapping)}</strong>`).join("")}
    </div>
  `;
}

function renderScenarios(scenarios) {
  return `
    <section class="learn-section">
      <h3>Scenario practice</h3>
      <div class="learn-card-list">
        ${scenarios.map(scenario => `
          <article>
            <strong>Situation</strong>
            <p>${escapeHtml(scenario.situation)}</p>
            <strong>Expected action</strong>
            <p>${escapeHtml(scenario.expectedAction)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderPbqIdeas(pbqIdeas) {
  return `
    <section class="learn-section">
      <h3>PBQ seeds</h3>
      <div class="learn-card-list">
        ${pbqIdeas.map(pbq => `
          <article>
            <p>${escapeHtml(pbq.task)}</p>
            ${(pbq.skillsTested || []).length ? `<p class="muted">Skills: ${escapeHtml(pbq.skillsTested.join(", "))}</p>` : ""}
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRelatedConcepts(edges) {
  if (!edges.length) {
    return `
      <section class="learn-section">
        <h3>Related concepts</h3>
        <p class="muted">No graph relationships yet.</p>
      </section>
    `;
  }

  return `
    <section class="learn-section">
      <h3>Related concepts</h3>
      <div class="learn-card-list">
        ${edges.map(edge => {
          const neighbor = edge.directionFromSource === "outbound" ? edge.target : edge.source;
          const missing = edge.directionFromSource === "outbound" ? edge.targetId : edge.sourceId;
          return `
            <button class="related-card" ${neighbor ? `data-id="${escapeHtml(neighbor.id)}"` : "disabled"}>
              <strong>${escapeHtml(edge.type)}</strong>
              <span>${escapeHtml(neighbor?.title || missing)}</span>
              <small>${escapeHtml(edge.notes || edge.strength || "")}</small>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderSources(transcripts, quality = {}) {
  return `
    <section class="learn-section learn-sources">
      <h3>Source and quality</h3>
      <div class="learn-section-grid">
        <div>
          <h4>Transcript references</h4>
          ${transcripts.length ? renderSimpleList(transcripts.map(source => `${source.lessonId || "Lesson"}: ${source.lessonTitle || source.sourceFile || "Transcript"}`)) : `<p class="muted">No transcript references yet.</p>`}
        </div>
        <div>
          <h4>Review status</h4>
          <p>Confidence: <strong>${escapeHtml(quality.confidence || "Not set")}</strong></p>
          <p>Needs review: <strong>${quality.needsHumanReview ? "Yes" : "No"}</strong></p>
          ${(quality.reviewNotes || []).length ? renderSimpleList(quality.reviewNotes) : ""}
        </div>
      </div>
    </section>
  `;
}

function getCertificationMappings(concept) {
  return (concept.certificationMappings || []).map(mapping => `${mapping.certification}${mapping.examCode ? ` ${mapping.examCode}` : ""}`);
}

function formatLabel(value) {
  return String(value || "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
