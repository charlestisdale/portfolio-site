import { createDocumentationComponent } from "../components/documentation-component.js";
import { gradeRequiredStateScenario } from "../grading/grader.js";
import { renderPbqReview } from "../grading/review-renderer.js";
import { createEventBus, PBQ_EVENTS } from "../runtime/event-bus.js";

const HINT_PROMPT_THRESHOLD = 3;

const COMMAND_HINTS = [
  {
    pattern: /^net use$/,
    hints: [
      "Think about how Windows shows existing mapped network drives.",
      "For mapped drive issues, first list the current drive mappings.",
      "Try the command that lists current network drive mappings: net use"
    ]
  },
  {
    pattern: /^net use .+ \/delete$/,
    hints: [
      "You found a stale mapping. Think about removing only the affected drive mapping.",
      "Do not delete every mapped drive. Target the disconnected drive letter.",
      "Use net use with the affected drive letter and /delete."
    ]
  },
  {
    pattern: /^net use .+ \\\\.+/,
    hints: [
      "After removing the stale mapping, recreate the mapping to the correct share path.",
      "Mapped drives use a drive letter and a UNC path that starts with two backslashes.",
      "Use net use with the drive letter, the correct UNC share, and /persistent:yes if it should remain."
    ]
  },
  {
    pattern: /^ipconfig/,
    hints: [
      "Think about a command that displays Windows IP configuration.",
      "If the issue involves IP settings or DNS cache, ipconfig is usually involved.",
      "Use the ipconfig option that matches the task: view settings, show all details, or flush DNS."
    ]
  },
  {
    pattern: /^ping/,
    hints: [
      "You may need to test whether another host is reachable.",
      "A basic ICMP reachability test can separate connectivity from name resolution.",
      "Use ping with the host or address you need to test."
    ]
  },
  {
    pattern: /^nslookup/,
    hints: [
      "Think about a command that checks DNS name resolution.",
      "If the hostname is suspicious, test DNS resolution directly.",
      "Use nslookup with the hostname."
    ]
  },
  {
    pattern: /^sfc/,
    hints: [
      "This scenario may involve corrupted Windows system files.",
      "Think about the Windows command that scans protected system files.",
      "Use sfc /scannow when system file corruption is suspected."
    ]
  },
  {
    pattern: /^dism/,
    hints: [
      "If SFC cannot repair files, the Windows component store may need repair.",
      "DISM can repair the Windows image that SFC relies on.",
      "Use the DISM restore health workflow before rerunning SFC when the component store is damaged."
    ]
  },
  {
    pattern: /^gpupdate/,
    hints: [
      "This scenario may involve applying Group Policy immediately.",
      "Think about the command that refreshes Group Policy.",
      "Use gpupdate /force when a policy change needs to apply now."
    ]
  },
  {
    pattern: /^gpresult/,
    hints: [
      "After applying policy, you may need evidence of what actually applied.",
      "Think about the command that reports Resultant Set of Policy.",
      "Use gpresult to verify applied user or computer policy."
    ]
  },
  {
    pattern: /^netstat/,
    hints: [
      "This scenario may involve checking listening ports or active connections.",
      "You may need a command that can show ports and process IDs.",
      "Use netstat with options that show listening ports and PIDs."
    ]
  },
  {
    pattern: /^tasklist/,
    hints: [
      "After finding a PID, identify which process owns it.",
      "Think about the command that lists running processes.",
      "Use tasklist when you need to match a PID to a process name."
    ]
  },
  {
    pattern: /^taskkill/,
    hints: [
      "After identifying a suspicious process, the next step may be stopping it.",
      "Use the process ID rather than guessing by name when the evidence gives you a PID.",
      "Use taskkill with the PID when the scenario supports terminating the suspicious process."
    ]
  },
  {
    pattern: /^bootrec/,
    hints: [
      "This scenario is in Windows Recovery, so normal in-OS repair tools may not be the first step.",
      "Think about the Windows Recovery command that repairs boot records and BCD.",
      "Use bootrec commands when Windows will not boot and the boot records or BCD may be damaged."
    ]
  },
  {
    pattern: /^chkdsk\s+c:$/,
    hints: [
      "Think about the Windows utility that checks a disk volume for file-system problems.",
      "The command begins with chk and checks the disk.",
      "Try chkdsk first to inspect the volume before repairing it."
    ]
  },
  {
    pattern: /^chkdsk\s+c:\s+\/f$/,
    hints: [
      "The disk has been checked. Now think about the switch that fixes file-system errors.",
      "CHKDSK repair uses the /f switch.",
      "Use chkdsk with the target volume and /f to schedule or perform repair."
    ]
  },
  {
    pattern: /^ls /,
    hints: [
      "On Linux, inspect the file before changing ownership or permissions.",
      "You need to see ownership and permission bits.",
      "Use ls -l to view Linux ownership and permissions."
    ]
  },
  {
    pattern: /^sudo chown/,
    hints: [
      "The group owner may need to match the team that should access the file.",
      "Think about the command that changes owner or group ownership.",
      "Use chown when ownership or group ownership is wrong."
    ]
  },
  {
    pattern: /^sudo chmod/,
    hints: [
      "After ownership is correct, apply least-privilege permissions.",
      "Think about the command that changes Linux permission bits.",
      "Use chmod to grant only the needed read, write, and execute permissions."
    ]
  }
];

export function createTerminalEngine({ scenario, elements }) {
  const state = {
    flags: {},
    history: [],
    evidence: [],
    penalties: [],
    failedAttemptsSinceHintPrompt: 0,
    totalFailedAttempts: 0,
    hintPromptsShown: 0,
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

  function baseCommand(value) {
    return normalizeCommand(value).split(" ")[0] || "command";
  }

  function terminalIsWindows() {
    const environment = `${scenario.terminal?.environment || ""} ${scenario.terminal?.prompt || ""}`.toLowerCase();
    return !environment.includes("linux") && !environment.includes("bash");
  }

  function commandIsAvailable(command) {
    if (!command.requires) {
      return true;
    }

    return Object.entries(command.requires).every(([key, value]) => state.flags[key] === value);
  }

  function implicitAliases(commandText) {
    const normalized = normalizeCommand(commandText);
    const aliases = [];

    if (normalized === "chkdsk c:") {
      aliases.push("chkdsk");
    }

    if (normalized === "chkdsk c: /f") {
      aliases.push("chkdsk /f");
    }

    if (normalized === "gpupdate /force") {
      aliases.push("gpupdate");
    }

    if (normalized === "sfc /scannow") {
      aliases.push("sfc");
    }

    if (normalized.includes("dism") && normalized.includes("restorehealth")) {
      aliases.push("dism /restorehealth");
    }

    if (normalized === "shutdown /r /t 0") {
      aliases.push("shutdown /r");
    }

    return aliases;
  }

  function acceptedCommands(command) {
    return [
      command.command,
      ...(command.aliases || []),
      ...implicitAliases(command.command)
    ].map(normalizeCommand);
  }

  function commandMatches(command, input) {
    const normalizedInput = normalizeCommand(input);
    return acceptedCommands(command).includes(normalizedInput);
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
      return "Review the scenario and start with a command that gathers evidence before trying to fix anything.";
    }

    if (command.hint) {
      return command.hint;
    }

    const normalizedCommand = normalizeCommand(command.command);
    const matchedHint = COMMAND_HINTS.find(item => item.pattern.test(normalizedCommand));

    if (!matchedHint) {
      return `Think about what evidence you still need. The next useful command is related to: ${command.summary || command.command}`;
    }

    const hintIndex = Math.min(state.hintsShown, matchedHint.hints.length - 1);
    return matchedHint.hints[hintIndex];
  }

  function addHintOutput(message) {
    state.history.push({
      input: "hint",
      output: `Hint: ${message}`,
      summary: message,
      hint: true,
      good: false
    });
  }

  function showHint() {
    const command = nextAvailableGoodCommand();
    const hint = hintForCommand(command);
    addHintOutput(hint);
    state.failedAttemptsSinceHintPrompt = 0;
    state.hintPromptsShown = 0;
    state.hintsShown += 1;
  }

  function maybePromptForHint() {
    if (state.failedAttemptsSinceHintPrompt < HINT_PROMPT_THRESHOLD || state.hintPromptsShown > 0) {
      return;
    }

    state.history.push({
      input: "notice",
      output: "Need a hint? Type: hint",
      summary: "Need a hint? Type: hint",
      hint: true,
      good: false
    });

    state.hintPromptsShown += 1;
  }

  function recordFailedAttempt() {
    state.failedAttemptsSinceHintPrompt += 1;
    state.totalFailedAttempts += 1;
    maybePromptForHint();
  }

  function unknownCommandOutput(input) {
    const commandName = baseCommand(input);

    if (terminalIsWindows()) {
      return `'${commandName}' is not recognized as an internal or external command,\noperable program or batch file.`;
    }

    return `${commandName}: command not found`;
  }

  function unavailableCommandOutput() {
    return "That command may be useful later, but the current evidence does not support running it yet. Gather or verify the required information first.";
  }

  function helpOutput() {
    const environment = scenario.terminal?.environment || "Terminal";
    return [
      `${environment} help`,
      "",
      "This is a simulated PBQ terminal. Use real troubleshooting commands for the scenario.",
      "Type hint for progressive study help.",
      "Unknown commands return normal terminal-style errors instead of PBQ answer text.",
      "The scenario tracks evidence, command history, verification, documentation, and grading in the background."
    ].join("\n");
  }

  function commandOutput(command, input) {
    const normalizedInput = normalizeCommand(input);

    if (normalizeCommand(command.command) === "chkdsk c:" && normalizedInput === "chkdsk") {
      return command.output || "The type of the file system is NTFS.\nWindows has scanned the file system.";
    }

    if (normalizeCommand(command.command) === "chkdsk c: /f" && normalizedInput === "chkdsk /f") {
      return command.output || "Cannot lock current drive.\nChkdsk cannot run because the volume is in use by another process.";
    }

    return command.output || "Command completed.";
  }

  function runCommand(rawInput) {
    if (state.completed) {
      return;
    }

    const input = String(rawInput || "").trim();
    if (!input) {
      return;
    }

    const normalizedInput = normalizeCommand(input);

    if (["hint", "hints"].includes(normalizedInput)) {
      showHint();
      renderAll();
      return;
    }

    if (["help", "/?", "?"].includes(normalizedInput)) {
      state.history.push({
        input,
        output: helpOutput(),
        summary: "Displayed terminal help.",
        good: false
      });
      renderAll();
      return;
    }

    const command = findCommand(input);

    if (!command) {
      const unavailableCommand = findKnownUnavailableCommand(input);

      state.history.push({
        input,
        output: unavailableCommand ? unavailableCommandOutput() : unknownCommandOutput(input),
        summary: unavailableCommand ? "Recognized command, but not justified yet." : "Unrecognized command.",
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
      output: commandOutput(command, input),
      summary: command.summary || command.output || "Command completed.",
      good: command.good === true,
      penalty
    });

    if (penalty || command.good !== true) {
      recordFailedAttempt();
    } else {
      state.failedAttemptsSinceHintPrompt = 0;
      state.hintPromptsShown = 0;
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
    state.failedAttemptsSinceHintPrompt = 0;
    state.totalFailedAttempts = 0;
    state.hintPromptsShown = 0;
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
