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
  ticketSelect: document.getElementById("ticketSelect"),
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
let engine = null;

function setStatus(message) {
  elements.loadStatus.textContent = message;
}

function populateScenarioSelect() {
  elements.ticketSelect.innerHTML = "";

  scenarios.forEach((scenario, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${scenario.title} (${scenario.engine})`;
    elements.ticketSelect.appendChild(option);
  });
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

function loadSelectedScenario() {
  const scenario = scenarios[Number(elements.ticketSelect.value)] || scenarios[0];

  engine = createEngineInstance({
    scenario,
    elements
  });

  engine.start();
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

    populateScenarioSelect();
    renderValidationWarnings(warnings);
    setStatus(`Loaded ${scenarios.length} PBQ scenario${scenarios.length === 1 ? "" : "s"} from ${DATA_URLS.length} data source${DATA_URLS.length === 1 ? "" : "s"} for ${registeredEngineIds.length} registered engine${registeredEngineIds.length === 1 ? "" : "s"}${warnings.length ? ` with ${warnings.length} validation warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
    loadSelectedScenario();
  } catch (error) {
    console.error(error);
    setStatus("PBQ Engine failed to load. Check the scenario data and registered engines.");
    renderValidationWarnings([error.message]);
  }
}

elements.ticketSelect.addEventListener("change", loadSelectedScenario);
elements.restartBtn.addEventListener("click", () => engine?.start());
elements.gradeBtn.addEventListener("click", () => engine?.grade());

loadScenarios();
