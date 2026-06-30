import { createDocumentationComponent } from "../components/documentation-component.js";
import { gradeRequiredStateScenario } from "../grading/grader.js";
import { renderPbqReview } from "../grading/review-renderer.js";

export function createTicketEngine({ scenario, elements }) {
  const state = {
    flags: {},
    evidence: [],
    history: [],
    actionsTaken: new Set(),
    penalties: [],
    completed: false,
    documentation: null
  };
  let documentationComponent = null;

  function cloneInitialState() {
    return JSON.parse(JSON.stringify(scenario.initialState || {}));
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function priorityClass(priority) {
    return `priority-${String(priority || "").toLowerCase()}`;
  }

  function actionIsVisible(action) {
    if (!action.requires) {
      return true;
    }

    return Object.entries(action.requires).every(([key, value]) => state.flags[key] === value);
  }

  function actionIsDisabled(action) {
    if (action.repeatable) {
      return false;
    }

    return state.actionsTaken.has(action.id);
  }

  function renderTicket() {
    const ticket = scenario.ticket || {};
    const fields = [
      ["Ticket", ticket.number || scenario.id],
      ["Priority", ticket.priority || "Unspecified", priorityClass(ticket.priority)],
      ["User", ticket.user],
      ["Department", ticket.department],
      ["Device", ticket.device],
      ["Reported Symptom", ticket.description]
    ];

    elements.ticketMeta.innerHTML = fields
      .filter(([, value]) => value)
      .map(([label, value, className]) => `
        <div class="ticket-field">
          <span class="ticket-label">${escapeHtml(label)}</span>
          <span class="ticket-value ${className || ""}">${escapeHtml(value)}</span>
        </div>
      `)
      .join("");
  }

  function renderRequirements() {
    const requiredStates = scenario.grading?.requiredStates || [];

    if (!elements.requirementsPane) {
      return;
    }

    if (!requiredStates.length) {
      elements.requirementsPane.className = "requirement-list empty-pane";
      elements.requirementsPane.textContent = "This ticket has no required outcomes defined.";
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

  function groupActionsByType(actions) {
    return actions.reduce((groups, action) => {
      const key = action.type || "action";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(action);
      return groups;
    }, {});
  }

  function labelForActionType(type) {
    return String(type || "action")
      .replace(/-/g, " ")
      .replace(/\b\w/g, character => character.toUpperCase());
  }

  function renderActions() {
    const visibleActions = (scenario.actions || []).filter(actionIsVisible);

    elements.actionMenu.innerHTML = "";

    if (!visibleActions.length) {
      elements.actionMenu.innerHTML = `<p class="empty-pane">No available actions match the current scenario state.</p>`;
      return;
    }

    const groupedActions = groupActionsByType(visibleActions);

    Object.entries(groupedActions).forEach(([type, actions]) => {
      const group = document.createElement("section");
      group.className = "action-group";

      const heading = document.createElement("h3");
      heading.textContent = labelForActionType(type);
      group.appendChild(heading);

      const list = document.createElement("div");
      list.className = "action-list";

      actions.forEach(action => {
        const button = document.createElement("button");
        button.className = "engine-button action-button";
        button.disabled = actionIsDisabled(action) || state.completed;
        button.innerHTML = `
          <span class="action-type">${escapeHtml(action.type || "action")}</span>
          <span>${escapeHtml(action.label)}</span>
        `;
        button.addEventListener("click", () => runAction(action));
        list.appendChild(button);
      });

      group.appendChild(list);
      elements.actionMenu.appendChild(group);
    });
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
      elements.historyPane.textContent = "No actions taken yet.";
      return;
    }

    elements.historyPane.className = "history-pane";
    elements.historyPane.innerHTML = state.history.map((item, index) => `
      <div class="history-item ${item.penalty ? "penalty" : item.good ? "good" : ""}">
        <strong>${index + 1}. ${escapeHtml(item.label)}</strong>
        <p>${escapeHtml(item.result)}</p>
        ${item.penalty ? `<p><strong>Penalty:</strong> ${escapeHtml(item.penalty.reason || item.penalty.type)}</p>` : ""}
      </div>
    `).join("");
  }

  function renderAll() {
    renderTicket();
    renderRequirements();
    renderActions();
    renderEvidence();
    renderHistory();
  }

  function addEvidenceFromAction(action) {
    if (!action.evidence) {
      return;
    }

    const evidenceItems = Array.isArray(action.evidence) ? action.evidence : [action.evidence];

    evidenceItems.forEach(item => {
      const evidenceId = item.id || `${action.id}-evidence-${state.evidence.length}`;
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

  function applyStateChanges(action) {
    Object.entries(action.sets || {}).forEach(([key, value]) => {
      state.flags[key] = value;
    });
  }

  function applyPenalty(action) {
    if (!action.penalty) {
      return null;
    }

    const penalty = {
      actionId: action.id,
      type: action.penalty.type || "penalty",
      points: Number(action.penalty.points || 0),
      reason: action.penalty.reason || "This action was not appropriate for the scenario."
    };

    state.penalties.push(penalty);
    return penalty;
  }

  function runAction(action) {
    if (state.completed) {
      return;
    }

    state.actionsTaken.add(action.id);
    applyStateChanges(action);
    addEvidenceFromAction(action);
    const penalty = applyPenalty(action);

    state.history.push({
      actionId: action.id,
      label: action.label,
      result: action.result || "Action completed.",
      penalty,
      good: action.good === true
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
      activityLabel: "Actions Taken"
    });

    documentationComponent?.render({ completed: true });
    renderActions();
  }

  function setupDocumentation() {
    documentationComponent = createDocumentationComponent({
      element: elements.documentationPane,
      onSave: documentationState => {
        state.documentation = documentationState;
        state.flags.documented = documentationState.saved;
        elements.reviewPanel.hidden = true;
        renderRequirements();
      }
    });
    documentationComponent.reset();
  }

  function start() {
    state.flags = cloneInitialState();
    state.evidence = [];
    state.history = [];
    state.actionsTaken = new Set();
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
