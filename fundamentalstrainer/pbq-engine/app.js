import { createTicketEngine } from "./engines/ticket-engine.js";

const DATA_URL = "./data/core2/tickets.json";

const elements = {
  loadStatus: document.getElementById("loadStatus"),
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
    scenarios = raw.filter(item => item.engine === "ticket");

    if (!scenarios.length) {
      throw new Error("No ticket-engine scenarios found.");
    }

    populateScenarioSelect();
    setStatus(`Loaded ${scenarios.length} Ticket Engine v2 scenarios.`);
    loadSelectedScenario();
  } catch (error) {
    console.error(error);
    setStatus("Ticket Engine failed to load. Check data/core2/tickets.json.");
  }
}

elements.ticketSelect.addEventListener("change", loadSelectedScenario);
elements.restartBtn.addEventListener("click", () => engine?.start());
elements.gradeBtn.addEventListener("click", () => engine?.grade());

loadScenarios();
