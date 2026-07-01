import {
  createEngineInstance,
  getRegisteredEngineIds,
  validateScenario
} from "./engine-registry.js";

const DATA_URLS = [
  "./data/core2/tickets.json",
  "./data/core2/tickets-sprint.json",
  "./data/core2/terminal.json",
  "./data/core2/terminal-sprint.json"
];

const elements = {
  loadStatus: document.getElementById("loadStatus"),
  validationPanel: document.getElementById("validationPanel"),
  currentScenarioLabel: document.getElementById("currentScenarioLabel"),
  practiceFilter: document.getElementById("practiceFilter"),
  examModeToggle: document.getElementById("examModeToggle"),
  randomBtn: document.getElementById("randomBtn"),
  restartBtn: document.getElementById("restartBtn"),
  gradeBtn: document.getElementById("gradeBtn"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  sessionAttempts: document.getElementById("sessionAttempts"),
  sessionPassed: document.getElementById("sessionPassed"),
  sessionAverage: document.getElementById("sessionAverage"),
  sessionBest: document.getElementById("sessionBest"),
  ticketMeta: document.getElementById("ticketMeta"),
  requirementsPane: document.getElementById("requirementsPane"),
  actionMenu: document.getElementById("actionMenu"),
  evidencePane: document.getElementById("evidencePane"),
  historyPane: document.getElementById("historyPane"),
  learnerNotes: document.getElementById("learnerNotes"),
  documentationPane: document.getElementById("documentationPane"),
  reviewPanel: document.getElementById("reviewPanel")
};

let allScenarios = [];
let scenarios = [];
let currentScenarioIndex = -1;
let currentScenario = null;
let currentAttemptGraded = false;
let engine = null;
let loadedSourceCount = 0;
let registeredEngineCount = 0;
let validationWarningCount = 0;

const sessionStats = {
  attempts: 0,
  passed: 0,
  totalScore: 0,
  bestScore: null
};

function setStatus(message) {
  elements.loadStatus.textContent = message;
}

function currentFilter() {
  return elements.practiceFilter?.value || "all";
}

function examModeEnabled() {
  return elements.examModeToggle?.checked === true;
}

function labelForFilter(filterValue = currentFilter()) {
  if (filterValue === "ticket") {
    return "Ticket PBQs only";
  }

  if (filterValue === "terminal") {
    return "Terminal PBQs only";
  }

  return "All PBQs";
}

function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "--";
  }

  return `${Math.round(Number(value))}%`;
}

function renderSessionStats() {
  if (!elements.sessionAttempts) {
    return;
  }

  const average = sessionStats.attempts
    ? sessionStats.totalScore / sessionStats.attempts
    : null;

  elements.sessionAttempts.textContent = String(sessionStats.attempts);
  elements.sessionPassed.textContent = String(sessionStats.passed);
  elements.sessionAverage.textContent = formatScore(average);
  elements.sessionBest.textContent = formatScore(sessionStats.bestScore);
}

function resetSessionStats() {
  sessionStats.attempts = 0;
  sessionStats.passed = 0;
  sessionStats.totalScore = 0;
  sessionStats.bestScore = null;
  currentAttemptGraded = false;
  renderSessionStats();
}

function parseReviewResult() {
  const scoreElement = elements.reviewPanel?.querySelector(".review-score");

  if (!scoreElement) {
    return null;
  }

  const text = scoreElement.textContent || "";
  const scoreMatch = text.match(/(\d+(?:\.\d+)?)%/);

  if (!scoreMatch) {
    return null;
  }

  return {
    score: Number(scoreMatch[1]),
    passed: /\bPass\b/i.test(text)
  };
}

function recordGradeFromReview() {
  if (currentAttemptGraded) {
    return;
  }

  const result = parseReviewResult();

  if (!result) {
    return;
  }

  currentAttemptGraded = true;
  sessionStats.attempts += 1;
  sessionStats.passed += result.passed ? 1 : 0;
  sessionStats.totalScore += result.score;
  sessionStats.bestScore = sessionStats.bestScore === null
    ? result.score
    : Math.max(sessionStats.bestScore, result.score);

  renderSessionStats();
}

function gradeCurrentScenario() {
  engine?.grade();
  recordGradeFromReview();
}

function restartCurrentScenario() {
  currentAttemptGraded = false;
  engine?.start();
}

function setCurrentScenarioLabel(scenario) {
  if (!elements.currentScenarioLabel) {
    return;
  }

  if (!scenario) {
    elements.currentScenarioLabel.textContent = "No PBQ loaded yet.";
    return;
  }

  if (examModeEnabled()) {
    elements.currentScenarioLabel.textContent = `Current PBQ: Hidden (${scenario.engine})`;
    return;
  }

  elements.currentScenarioLabel.textContent = `Current PBQ: ${scenario.title} (${scenario.engine})`;
}

function updateLoadStatus() {
  const warningText = validationWarningCount
    ? ` with ${validationWarningCount} validation warning${validationWarningCount === 1 ? "" : "s"}`
    : "";

  setStatus(`Random practice mode loaded ${scenarios.length} ${labelForFilter().toLowerCase()} from ${allScenarios.length} total PBQ scenario${allScenarios.length === 1 ? "" : "s"} across ${loadedSourceCount} data source${loadedSourceCount === 1 ? "" : "s"} for ${registeredEngineCount} registered engine${registeredEngineCount === 1 ? "" : "s"}${warningText}.`);
}

function filterScenarios() {
  const filterValue = currentFilter();

  if (filterValue === "all") {
    scenarios = allScenarios.slice();
  } else {
    scenarios = allScenarios.filter(scenario => scenario.engine === filterValue);
  }

  currentScenarioIndex = -1;
  currentScenario = null;
  currentAttemptGraded = false;
  updateLoadStatus();
}

function pickRandomScenarioIndex() {
  if (scenarios.length <= 1) {
    return 0;
  }

  let nextIndex = currentScenarioIndex;

  while (nextIndex === currentScenarioIndex) {
    nextIndex = Math.floor(Math.random() * scenarios.length);
  }

  return nextIndex;
}

function renderValidationWarnings(warnings) {
  if (!elements.validationPanel) {
    return;
  }

  if (!warnings.length) {
    elements.validationPanel.hidden = true;
    elements.validationPanel.innerHTML = "";
    return;
  }

  elements.validationPanel.hidden = false;
  elements.validationPanel.innerHTML = `
    <h2>Scenario Validation Warnings</h2>
    <p>These warnings are for PBQ authors. The engine will still try to load valid scenarios.</p>
    <ul>
      ${warnings.map(warning => `<li>${escapeHtml(warning)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value ?? "");
  return div.innerHTML;
}

function collectValidationWarnings(loadedScenarios) {
  return loadedScenarios.flatMap((scenario, index) => validateScenario(scenario, index));
}

function clearScenarioPanels(message) {
  setCurrentScenarioLabel(null);
  currentScenario = null;
  currentAttemptGraded = false;
  engine = null;

  elements.ticketMeta.innerHTML = "";
  elements.requirementsPane.className = "requirement-list empty-pane";
  elements.requirementsPane.textContent = message;
  elements.actionMenu.innerHTML = `<p class="empty-pane">${escapeHtml(message)}</p>`;
  elements.evidencePane.className = "evidence-pane empty-pane";
  elements.evidencePane.textContent = "No evidence collected yet.";
  elements.historyPane.className = "history-pane empty-pane";
  elements.historyPane.textContent = "No actions taken yet.";
  elements.documentationPane.innerHTML = "";
  elements.reviewPanel.hidden = true;
  elements.reviewPanel.innerHTML = "";
  elements.learnerNotes.value = "";
}

function loadScenarioAtIndex(index) {
  const scenario = scenarios[index] || scenarios[0];

  if (!scenario) {
    clearScenarioPanels(`No PBQs are available for ${labelForFilter()}.`);
    return;
  }

  currentScenarioIndex = scenarios.indexOf(scenario);
  currentScenario = scenario;
  currentAttemptGraded = false;
  setCurrentScenarioLabel(scenario);

  engine = createEngineInstance({
    scenario,
    elements
  });

  engine.start();
}

function loadRandomScenario() {
  loadScenarioAtIndex(pickRandomScenarioIndex());
}

function changePracticeFilter() {
  filterScenarios();
  loadRandomScenario();
}

function changeExamMode() {
  document.body.classList.toggle("exam-mode", examModeEnabled());
  setCurrentScenarioLabel(currentScenario);
  restartCurrentScenario();
}

async function loadScenarioFile(dataUrl) {
  const response = await fetch(dataUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${dataUrl}`);
  }

  const raw = await response.json();

  if (!Array.isArray(raw)) {
    throw new Error(`${dataUrl} must contain a JSON array.`);
  }

  return raw;
}

async function loadScenarios() {
  try {
    const files = await Promise.all(DATA_URLS.map(loadScenarioFile));
    const raw = files.flat();
    const registeredEngineIds = getRegisteredEngineIds();

    loadedSourceCount = DATA_URLS.length;
    registeredEngineCount = registeredEngineIds.length;
    allScenarios = raw.filter(item => registeredEngineIds.includes(item.engine));

    if (!allScenarios.length) {
      throw new Error(`No scenarios found for registered PBQ engines: ${registeredEngineIds.join(", ")}.`);
    }

    const warnings = collectValidationWarnings(allScenarios);
    validationWarningCount = warnings.length;

    if (warnings.length) {
      console.warn("PBQ scenario validation warnings:", warnings);
    }

    renderValidationWarnings(warnings);
    filterScenarios();
    document.body.classList.toggle("exam-mode", examModeEnabled());
    renderSessionStats();
    loadRandomScenario();
  } catch (error) {
    console.error(error);
    setStatus("PBQ Engine failed to load. Check the scenario data and registered engines.");
    setCurrentScenarioLabel(null);
    renderValidationWarnings([error.message]);
  }
}

elements.practiceFilter?.addEventListener("change", changePracticeFilter);
elements.examModeToggle?.addEventListener("change", changeExamMode);
elements.randomBtn?.addEventListener("click", loadRandomScenario);
elements.restartBtn.addEventListener("click", restartCurrentScenario);
elements.gradeBtn.addEventListener("click", gradeCurrentScenario);
elements.resetSessionBtn?.addEventListener("click", resetSessionStats);

loadScenarios();
