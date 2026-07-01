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
  randomBtn: document.getElementById("randomBtn"),
  restartBtn: document.getElementById("restartBtn"),
  gradeBtn: document.getElementById("gradeBtn"),
  ticketMeta: document.getElementById("ticketMeta"),
  requirementsPane: document.getElementById("requirementsPane"),
  actionMenu: document.getElementById("actionMenu"),
  evidencePane: document.getElementById("evidencePane"),
  historyPane: document.getElementById("historyPane"),
  learnerNotes: document.getElementById("learnerNotes"),
  documentationPane: document.getElementById("documentationPane"),
  reviewPanel: document.getElementById("reviewPanel")
};

let scenarios = [];
let currentScenarioIndex = -1;
let engine = null;

function setStatus(message) {
  elements.loadStatus.textContent = message;
}

function setCurrentScenarioLabel(scenario) {
  if (!elements.currentScenarioLabel) {
    return;
  }

  if (!scenario) {
    elements.currentScenarioLabel.textContent = "No PBQ loaded yet.";
    return;
  }

  elements.currentScenarioLabel.textContent = `Current PBQ: ${scenario.title} (${scenario.engine})`;
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

function loadScenarioAtIndex(index) {
  const scenario = scenarios[index] || scenarios[0];

  if (!scenario) {
    return;
  }

  currentScenarioIndex = scenarios.indexOf(scenario);
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
    scenarios = raw.filter(item => registeredEngineIds.includes(item.engine));

    if (!scenarios.length) {
      throw new Error(`No scenarios found for registered PBQ engines: ${registeredEngineIds.join(", ")}.`);
    }

    const warnings = collectValidationWarnings(scenarios);
    if (warnings.length) {
      console.warn("PBQ scenario validation warnings:", warnings);
    }

    renderValidationWarnings(warnings);
    setStatus(`Random practice mode loaded ${scenarios.length} PBQ scenario${scenarios.length === 1 ? "" : "s"} from ${DATA_URLS.length} data source${DATA_URLS.length === 1 ? "" : "s"} for ${registeredEngineIds.length} registered engine${registeredEngineIds.length === 1 ? "" : "s"}${warnings.length ? ` with ${warnings.length} validation warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
    loadRandomScenario();
  } catch (error) {
    console.error(error);
    setStatus("PBQ Engine failed to load. Check the scenario data and registered engines.");
    setCurrentScenarioLabel(null);
    renderValidationWarnings([error.message]);
  }
}

elements.randomBtn?.addEventListener("click", loadRandomScenario);
elements.restartBtn.addEventListener("click", () => engine?.start());
elements.gradeBtn.addEventListener("click", () => engine?.grade());

loadScenarios();
