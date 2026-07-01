import { createDocumentationComponent } from "../components/documentation-component.js";
import { gradeRequiredStateScenario } from "../grading/grader.js";
import { renderPbqReview } from "../grading/review-renderer.js";
import { createEventBus, PBQ_EVENTS } from "../runtime/event-bus.js";

export function createTicketEngine({ scenario, elements }) {
  const state = {
    flags: {},
    evidence: [],
    history: [],
    actionsTaken: new Set(),
    prematureAttempts: new Set(),
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

  function priorityClass(priority) {
    return `priority-${String(priority || "").toLowerCase()}`;
  }

  function requirementsAreMet(action) {
    if (!action.requires) {
      return true;
    }

    return Object.entries(action.requires).every(([key, value]) => state.flags[key] === value);
  }

  function getUnmetRequirements(action) {
    if (!action.requires) {
      return [];
    }

    return Object.entries(action.requires)
      .filter(([key, value]) => state.flags[key] !== value)
      .map(([key]) => key);
  }

  function actionIsDisabled(action) {
    if (state.completed) {
      return true;
    }

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
      elements.requirementsPane.className = "case-progress empty-pane";
      elements.requirementsPane.textContent = "This case has no graded outcomes defined.";
      return;
    }

    const completedCount = requiredStates.filter(item => state.flags[item.key] === item.value).length;
    const totalCount = requiredStates.length;
    const penaltyCount = state.penalties.length;
    const documentationSaved = state.flags.documented === true;

    elements.requirementsPane.className = "case-progress";
    elements.requirementsPane.innerHTML = `
      <div class="case-progress-card">
        <span class="ticket-label">Case Mode</span>
        <strong>Investigation</strong>
        <p>Choose actions based on the ticket, evidence, and troubleshooting logic. The exact graded checklist is hidden until review.</p>
      </div>
      <div class="case-progress-stats">
        <div>
          <span class="ticket-label">Evidence</span>
          <strong>${state.evidence.length}</strong>
        </div>
        <div>
          <span class="ticket-label">Actions</span>
          <strong>${state.history.length}</strong>
        </div>
        <div>
          <span class="ticket-label">Penalties</span>
          <strong>${penaltyCount}</strong>
        </div>
        <div>
          <span class="ticket-label">Progress</span>
          <strong>${completedCount}/${totalCount}</strong>
        </div>
      </div>
      <p class="status-note">${documentationSaved ? "Documentation saved." : "Document the ticket before grading."}</p>
    `;
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

  function compareActionGroups([leftType], [rightType]) {
    return labelForActionType(leftType).localeCompare(labelForActionType(rightType));
  }

  function compareActions(left, right) {
    return String(left.label || "").localeCompare(String(right.label || ""));
  }

  function renderActions() {
    const actions = scenario.actions || [];

    elements.actionMenu.innerHTML = "";

    if (!actions.length) {
      elements.actionMenu.innerHTML = `<p class="empty-pane">No actions are defined for this scenario.</p>`;
      return;
    }

    const intro = document.createElement("div");
    intro.className = "investigation-note";
    intro.innerHTML = `
      <strong>Investigation mode:</strong>
      Pick the action you would actually take. Some actions are useful, some are irrelevant, and some are unsafe or premature.
    `;
    elements.actionMenu.appendChild(intro);

    const groupedActions = groupActionsByType(actions);

    Object.entries(groupedActions)
      .sort(compareActionGroups)
      .forEach(([type, groupActions]) => {
        const group = document.createElement("section");
        group.className = "action-group";

        const heading = document.createElement("h3");
        heading.textContent = labelForActionType(type);
        group.appendChild(heading);

        const list = document.createElement("div");
        list.className = "action-list";

        groupActions.slice().sort(compareActions).forEach(action => {
          const button = document.createElement("button");
          button.className = "engine-button action-button investigation-action";
          button.disabled = actionIsDisabled(action);
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

  function addPenalty({ action, type, points, reason }) {
    const penalty = {
      actionId: action.id,
      type: type || "penalty",
      points: Number(points || 0),
      reason: reason || "This action was not appropriate for the scenario."
    };

    state.penalties.push(penalty);
    return penalty;
  }

  function applyPenalty(action) {
    if (!action.penalty) {
      return null;
    }

    return addPenalty({
      action,
      type: action.penalty.type,
      points: action.penalty.points,
      reason: action.penalty.reason
    });
  }

  function runPrematureAction(action) {
    const unmetRequirements = getUnmetRequirements(action);
    const attemptKey = `${action.id}:${unmetRequirements.join(",")}`;
    const shouldPenalize = !state.prematureAttempts.has(attemptKey);
    let penalty = null;

    if (shouldPenalize) {
      state.prematureAttempts.add(attemptKey);
      penalty = addPenalty({
        action,
        type: "premature-escalation",
        points: 5,
        reason: "This action was chosen before enough evidence or required conditions supported it."
      });
    }

    state.history.push({
      actionId: action.id,
      label: action.label,
      result: "You do not have enough evidence or required conditions to justify this action yet. Gather more information first.",
      penalty,
      good: false
    });
  }

  function runAction(action) {
    if (state.completed || actionIsDisabled(action)) {
      return;
    }

    if (!requirementsAreMet(action)) {
      runPrematureAction(action);
      elements.reviewPanel.hidden = true;
      renderAll();
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
    state.evidence = [];
    state.history = [];
    state.actionsTaken = new Set();
    state.prematureAttempts = new Set();
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
