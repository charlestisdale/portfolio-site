import { createDocumentationComponent } from "../components/documentation-component.js";
import { gradeRequiredStateScenario } from "../grading/grader.js";
import { renderPbqReview } from "../grading/review-renderer.js";
import { createEventBus, PBQ_EVENTS } from "../runtime/event-bus.js";

const HINT_THRESHOLDS = [3, 5, 8];

const COMMAND_HINTS = [
  {
    pattern: /^net use$/,
    hint: "You may need to list the current mapped drives before changing anything.",
    strongerHint: "For mapped drive issues, start by running net use to see existing drive mappings."
  },
  {
    pattern: /^net use .+ \/delete$/,
    hint: "After identifying a stale mapped drive, remove only that affected drive mapping.",
    strongerHint: "Use net use with the drive letter and /delete to remove the stale mapping."
  },
  {
    pattern: /^net use .+ \\\\.+/,
    hint: "After removing a stale mapping, recreate the drive mapping to the correct share path.",
    strongerHint: "Use net use with the drive letter, UNC share path, and /persistent:yes when the mapping should remain."
  },
  {
    pattern: /^ipconfig/,
    hint: "This scenario may require checking Windows IP or DNS settings.",
    strongerHint: "Use ipconfig commands when the symptoms point to IP configuration or DNS resolver cache problems."
  },
  {
    pattern: /^ping/,
    hint: "A connectivity test can help confirm whether a host is reachable.",
    strongerHint: "Use ping when you need to test basic reachability before moving deeper."
  },
  {
    pattern: /^nslookup/,
    hint: "A DNS lookup can help confirm whether a hostname resolves correctly.",
    strongerHint: "Use nslookup when the issue sounds like name resolution rather than the service itself."
  },
  {
    pattern: /^sfc/,
    hint: "This scenario may involve checking Windows system file integrity.",
    strongerHint: "Use sfc /scannow when symptoms point to corrupted Windows system files."
  },
  {
    pattern: /^dism/,
    hint: "If system file repair needs a healthy component store, DISM may be part of the workflow.",
    strongerHint: "Use DISM restore health before rerunning SFC when the component store needs repair."
  },
  {
    pattern: /^gpupdate/,
    hint: "This scenario may involve refreshing Group Policy.",
    strongerHint: "Use gpupdate /force when a policy change needs to be applied immediately."
  },
  {
    pattern: /^gpresult/,
    hint: "This scenario may require verifying which policies applied.",
    strongerHint: "Use gpresult when you need evidence of applied user or computer policy."
  },
  {
    pattern: /^netstat/,
    hint: "This scenario may require checking active network connections or listening ports.",
    strongerHint: "Use netstat with options that show listening ports and process IDs."
  },
  {
    pattern: /^tasklist/,
    hint: "After finding a process ID, identify which process owns it.",
    strongerHint: "Use tasklist when you need to match a PID to a process name."
  },
  {
    pattern: /^taskkill/,
    hint: "After identifying a suspicious process, you may need to stop that process.",
    strongerHint: "Use taskkill with the PID when the scenario supports terminating the suspicious process."
  },
  {
    pattern: /^bootrec/,
    hint: "This scenario may involve Windows Recovery boot repair commands.",
    strongerHint: "Use bootrec commands when Windows will not boot and the boot records or BCD may be damaged."
  },
  {
    pattern: /^chkdsk/,
    hint: "This scenario may involve checking or repairing file-system errors.",
    strongerHint: "Use chkdsk first to inspect the volume, then add repair options when evidence supports it."
  },
  {
    pattern: /^ls /,
    hint: "On Linux, inspect the file before changing ownership or permissions.",
    strongerHint: "Use ls -l to view Linux ownership and permission bits."
  },
  {
    pattern: /^sudo chown/,
    hint: "The group owner may need to match the team that should access the file.",
    strongerHint: "Use chown when ownership or group ownership is wrong."
  },
  {
    pattern: /^sudo chmod/,
    hint: "Apply least-privilege permissions after confirming ownership.",
    strongerHint: "Use chmod to grant only the needed read/write/execute permissions."
  }
];

export function createTerminalEngine({ scenario, elements }) {
  const state = {
    flags: {},
    history: [],
    evidence: [],
    penalties: [],
    failedAttemptsSinceHint: 0,
    totalFailedAttempts: 0,
    hintsShown: 0,
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

  function examModeEnabled() {
    return elements.examModeToggle?.checked === true;
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
      ["Scenario", examModeEnabled() ? "Hidden in Exam Mode" : scenario.title],
      ["Engine", "Terminal"],
      ["Objective", scenario.objective],
      ["Environment", terminal.environment || terminal.prompt || "Simulated terminal"],
      ["Task", scenario.description || terminal.task]
    ];

    elements.ticketMeta.innerHTML = fields
      .filter(([, value]) => value)
      .map(([label, value]) => `
        <div class="ticket-field ${label === "Scenario" && examModeEnabled() ? "exam-hidden-field" : ""}">
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
            <pre class="terminal-result ${item.hint ? "hint" : item.penalty ? "penalty" : item.good ? "good" : ""}">${escapeHtml(item.output)}</pre>
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

    const terminalOutput = document.getElementById("terminalOutput");
    const form = document.getElementById("terminalForm");
    const input = document.getElementById("terminalInput");

    terminalOutput?.scrollTo({ top: terminalOutput.scrollHeight });

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
      <div class="history-item ${item.hint ? "hint" : item.penalty ? "penalty" : item.good ? "good" : ""}">
        <strong>${index + 1}. ${escapeHtml(item.hint ? "Hint" : item.input)}</strong>
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

  function findKnownUnavailableCommand(input) {
    return (scenario.commands || []).find(command => !commandIsAvailable(command) && commandMatches(command, input));
  }

  function nextIncompleteRequiredState() {
    return (scenario.grading?.requiredStates || []).find(item => state.flags[item.key] !== item.value);
  }

  function nextAvailableGoodCommand() {
    const requiredState = nextIncompleteRequiredState();
    const commands = scenario.commands || [];

    if (requiredState) {
      const commandForRequiredState = commands.find(command => (
        command.good === true
        && commandIsAvailable(command)
        && command.sets
        && command.sets[requiredState.key] === requiredState.value
      ));

      if (commandForRequiredState) {
        return commandForRequiredState;
      }
    }

    return commands.find(command => command.good === true && commandIsAvailable(command));
  }

  function hintForCommand(command) {
    if (!command) {
      return "Review the scenario, then start with an information-gathering command before trying to fix anything.";
    }

    if (command.hint) {
      return command.hint;
    }

    const normalizedCommand = normalizeCommand(command.command);
    const matchedHint = COMMAND_HINTS.find(item => item.pattern.test(normalizedCommand));

    if (!matchedHint) {
      return `Think about what evidence you still need before running a repair command. The next useful command is related to: ${command.summary || command.command}`;
    }

    if (state.hintsShown >= 1 && matchedHint.strongerHint) {
      return matchedHint.strongerHint;
    }

    return matchedHint.hint;
  }

  function maybeAddHint() {
    const nextThreshold = HINT_THRESHOLDS[state.hintsShown];

    if (!nextThreshold || state.failedAttemptsSinceHint < nextThreshold) {
      return;
    }

    const command = nextAvailableGoodCommand();
    const hint = hintForCommand(command);

    state.history.push({
      input: "hint",
      output: `Hint: ${hint}`,
      summary: hint,
      hint: true,
      good: false
    });

    state.failedAttemptsSinceHint = 0;
    state.hintsShown += 1;
  }

  function recordFailedAttempt() {
    state.failedAttemptsSinceHint += 1;
    state.totalFailedAttempts += 1;
    maybeAddHint();
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
      const unavailableCommand = findKnownUnavailableCommand(input);
      const output = unavailableCommand
        ? "That command may be useful later, but the current evidence does not support running it yet. Gather or verify the required information first."
        : scenario.terminal?.unknownCommandOutput || "The command is not recognized in this simulation.";

      state.history.push({
        input,
        output,
        summary: unavailableCommand ? "Recognized command, but not justified yet." : "Unrecognized or unavailable command.",
        good: false
      });
      recordFailedAttempt();
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

    if (penalty || command.good !== true) {
      recordFailedAttempt();
    } else {
      state.failedAttemptsSinceHint = 0;
    }

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
    state.failedAttemptsSinceHint = 0;
    state.totalFailedAttempts = 0;
    state.hintsShown = 0;
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
