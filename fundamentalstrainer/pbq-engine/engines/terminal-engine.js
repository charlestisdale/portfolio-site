import { createDocumentationComponent } from "../components/documentation-component.js";
import { gradeRequiredStateScenario } from "../grading/grader.js";
import { renderPbqReview } from "../grading/review-renderer.js";
import { createEventBus, PBQ_EVENTS } from "../runtime/event-bus.js";

export function createTerminalEngine({ scenario, elements }) {
  const state = {
    flags: {},
    history: [],
    evidence: [],
    penalties: [],
    completed: false,
    documentation: null
  };
  const events = createEventBus();
  let documentationComponent = null;
  let unsubscribeDocumentationSaved = null;

  function cloneInitialState() {
    return JSON.parse(JSON.stringify(scenario.initialState || {}));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function normalizeCommand(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function commandIsAvailable(command) {
    if (!command.requires) {
      return true;
    }

    return Object.entries(command.requires).every(([key, value]) => state.flags[key] === value);
  }

  function commandMatches(command, input) {
    const normalizedInput = normalizeCommand(input);
    const accepted = [command.command, ...(command.aliases || [])].map(normalizeCommand);
    return accepted.includes(normalizedInput);
  }

  function renderScenarioMeta() {
    const terminal = scenario.terminal || {};
    const fields = [
      ["Scenario", scenario.title],
      ["Engine", "Terminal"],
      ["Objective", scenario.objective],
      ["Environment", terminal.environment || terminal.prompt || "Simulated terminal"],
      ["Task", scenario.description || terminal.task]
    ];

    elements.ticketMeta.innerHTML = fields
      .filter(([, value]) => value)
      .map(([label, value]) => `
        <div class="ticket-field">
          <span class="ticket-label">${escapeHtml(label)}</span>
          <span class="ticket-value">${escapeHtml(value)}</span>
        </div>
      `)
      .join("");
  }

  function renderRequirements() {
    const requiredStates = scenario.grading?.requiredStates || [];

    if (!requiredStates.length) {
      elements.requirementsPane.className = "requirement-list empty-pane";
      elements.requirementsPane.textContent = "This terminal scenario has no required outcomes defined.";
      return;
    }

    elements.requirementsPane.className = "requirement-list";
    elements.requirementsPane.innerHTML = requiredStates.map(item => {
      const complete = state.flags[item.key] === item.value;
      return `
        <div class="requirement-item ${complete ? "complete" : "missing"}">
          <span class="state-pill ${complete ? "complete" : "missing"}">${complete ? "Complete" : "Missing"}</span>
          <span>${escapeHtml(item.label || item.key)}</span>
        </div>
      `;
    }).join("");
  }

  function renderTerminal() {
    const prompt = scenario.terminal?.prompt || "C:\\>";
    const welcome = scenario.terminal?.welcome || "Type a command to begin.";

    elements.actionMenu.innerHTML = `
      <div class="terminal-shell">
        <div class="terminal-output" id="terminalOutput">
          <div class="terminal-line muted">${escapeHtml(welcome)}</div>
          ${state.history.map(item => `
            <div class="terminal-command-line"><span class="terminal-prompt">${escapeHtml(prompt)}</span> ${escapeHtml(item.input)}</div>
            <pre class="terminal-result ${item.penalty ? "penalty" : item.good ? "good" : ""}">${escapeHtml(item.output)}</pre>
          `).join("")}
        </div>
        <form class="terminal-form" id="terminalForm">
          <span class="terminal-prompt">${escapeHtml(prompt)}</span>
          <input id="terminalInput" class="terminal-input" autocomplete="off" spellcheck="false" ${state.completed ? "disabled" : ""} />
          <button class="engine-button" type="submit" ${state.completed ? "disabled" : ""}>Run</button>
        </form>
        <p class="status-note">Use commands to gather evidence, identify the issue, verify the fix, then save formal ticket documentation below.</p>
      </div>
    `;

    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");

    form?.addEventListener("submit", event => {
      event.preventDefault();
      runCommand(input.value);
    });

    input?.focus();
  }

  function renderEvidence() {
    if (!state.evidence.length) {
      elements.evidencePane.className = "evidence-pane empty-pane";
      elements.evidencePane.textContent = "No evidence collected yet.";
      return;
    }

    elements.evidencePane.className = "evidence-pane";
    elements.evidencePane.innerHTML = state.evidence.map(item => `
      <div class="evidence-item">
        <strong>${escapeHtml(item.title || "Evidence")}</strong>
        <p>${escapeHtml(item.body || item.result || "")}</p>
      </div>
    `).join("");
  }

  function renderHistory() {
    if (!state.history.length) {
      elements.historyPane.className = "history-pane empty-pane";
      elements.historyPane.textContent = "No commands run yet.";
      return;
    }

    elements.historyPane.className = "history-pane";
    elements.historyPane.innerHTML = state.history.map((item, index) => `
      <div class="history-item ${item.penalty ? "penalty" : item.good ? "good" : ""}">
        <strong>${index + 1}. ${escapeHtml(item.input)}</strong>
        <p>${escapeHtml(item.summary || item.output)}</p>
        ${item.penalty ? `<p><strong>Penalty:</strong> ${escapeHtml(item.penalty.reason || item.penalty.type)}</p>` : ""}
      </div>
    `).join("");
  }

  function renderAll() {
    renderScenarioMeta();
    renderRequirements();
    renderTerminal();
    renderEvidence();
    renderHistory();
  }

  function addEvidence(command) {
    if (!command.evidence) {
      return;
    }

    const evidenceItems = Array.isArray(command.evidence) ? command.evidence : [command.evidence];

    evidenceItems.forEach(item => {
      const evidenceId = item.id || `${command.command}-evidence-${state.evidence.length}`;
      const alreadyExists = state.evidence.some(existing => existing.id === evidenceId);

      if (!alreadyExists) {
        state.evidence.push({
          id: evidenceId,
          title: item.title,
          body: item.body || item.result
        });
      }
    });
  }

  function applyState(command) {
    Object.entries(command.sets || {}).forEach(([key, value]) => {
      state.flags[key] = value;
    });
  }

  function applyPenalty(command) {
    if (!command.penalty) {
      return null;
    }

    const penalty = {
      command: command.command,
      type: command.penalty.type || "penalty",
      points: Number(command.penalty.points || 0),
      reason: command.penalty.reason || "This command was not appropriate for the scenario."
    };

    state.penalties.push(penalty);
    return penalty;
  }

  function findCommand(input) {
    return (scenario.commands || []).find(command => commandIsAvailable(command) && commandMatches(command, input));
  }

  function runCommand(rawInput) {
    if (state.completed) {
      return;
    }

    const input = String(rawInput || "").trim();
    if (!input) {
      return;
    }

    const command = findCommand(input);

    if (!command) {
      state.history.push({
        input,
        output: scenario.terminal?.unknownCommandOutput || "The command is not recognized in this simulation.",
        summary: "Unrecognized or unavailable command.",
        good: false
      });
      renderAll();
      return;
    }

    applyState(command);
    addEvidence(command);
    const penalty = applyPenalty(command);

    state.history.push({
      input,
      output: command.output || "Command completed.",
      summary: command.summary || command.output || "Command completed.",
      good: command.good === true,
      penalty
    });

    elements.reviewPanel.hidden = true;
    renderAll();
  }

  function getReviewState() {
    return {
      ...state,
      learnerNotes: elements.learnerNotes.value || "",
      documentation: documentationComponent?.getState() || state.documentation
    };
  }

  function grade() {
    const reviewState = getReviewState();
    const gradeResult = gradeRequiredStateScenario({ scenario, state: reviewState });

    state.completed = true;

    elements.reviewPanel.hidden = false;
    elements.reviewPanel.innerHTML = renderPbqReview({
      scenario,
      state: reviewState,
      gradeResult,
      activityLabel: "Commands Run"
    });

    documentationComponent?.render({ completed: true });
    renderAll();
  }

  function handleDocumentationSaved(documentationState) {
    state.documentation = documentationState;
    state.flags.documented = documentationState.saved;
    elements.reviewPanel.hidden = true;
    renderRequirements();
  }

  function setupDocumentation() {
    unsubscribeDocumentationSaved?.();
    unsubscribeDocumentationSaved = events.on(PBQ_EVENTS.DOCUMENTATION_SAVED, handleDocumentationSaved);

    documentationComponent = createDocumentationComponent({
      element: elements.documentationPane,
      events
    });
    documentationComponent.reset();
  }

  function start() {
    state.flags = cloneInitialState();
    state.history = [];
    state.evidence = [];
    state.penalties = [];
    state.completed = false;
    state.documentation = null;
    elements.learnerNotes.value = "";
    elements.reviewPanel.hidden = true;
    elements.reviewPanel.innerHTML = "";
    setupDocumentation();
    renderAll();
  }

  return {
    start,
    grade
  };
}
