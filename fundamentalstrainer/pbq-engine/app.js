import { createTicketEngine } from "./engines/ticket-engine.js";
import { validateTicketScenario } from "./validators/ticket-validator.js";

const DATA_URL = "./data/core2/tickets.json";

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
    option.textContent = scenario.title;
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

function collectValidationWarnings(ticketScenarios) {
  return ticketScenarios.flatMap((scenario, index) => validateTicketScenario(scenario, index));
}

function loadSelectedScenario() {
  const scenario = scenarios[Number(elements.ticketSelect.value)] || scenarios[0];

  engine = createTicketEngine({
    scenario,
    elements
  });

  engine.start();
}

async function loadScenarios() {
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Could not load ${DATA_URL}`);
    }

    const raw = await response.json();

    if (!Array.isArray(raw)) {
      throw new Error("Ticket data must be a JSON array.");
    }

    scenarios = raw.filter(item => item.engine === "ticket");

    if (!scenarios.length) {
      throw new Error("No ticket-engine scenarios found.");
    }

    const warnings = collectValidationWarnings(scenarios);
    if (warnings.length) {
      console.warn("PBQ scenario validation warnings:", warnings);
    }

    populateScenarioSelect();
    renderValidationWarnings(warnings);
    setStatus(`Loaded ${scenarios.length} Ticket Engine v2 scenarios${warnings.length ? ` with ${warnings.length} validation warning${warnings.length === 1 ? "" : "s"}` : ""}.`);
    loadSelectedScenario();
  } catch (error) {
    console.error(error);
    setStatus("Ticket Engine failed to load. Check data/core2/tickets.json.");
    renderValidationWarnings([error.message]);
  }
}

elements.ticketSelect.addEventListener("change", loadSelectedScenario);
elements.restartBtn.addEventListener("click", () => engine?.start());
elements.gradeBtn.addEventListener("click", () => engine?.grade());

loadScenarios();
