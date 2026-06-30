import { PBQ_EVENTS } from "../runtime/event-bus.js";

export function createDocumentationComponent({ element, events, onSave }) {
  const state = {
    saved: false,
    values: getEmptyValues()
  };

  function getEmptyValues() {
    return {
      problem: "",
      rootCause: "",
      resolution: "",
      verification: ""
    };
  }

  function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
  }

  function getValues() {
    return {
      problem: element.querySelector('[name="problem"]')?.value.trim() || "",
      rootCause: element.querySelector('[name="rootCause"]')?.value.trim() || "",
      resolution: element.querySelector('[name="resolution"]')?.value.trim() || "",
      verification: element.querySelector('[name="verification"]')?.value.trim() || ""
    };
  }

  function countCompletedFields(values) {
    return Object.values(values).filter(Boolean).length;
  }

  function getState() {
    return {
      saved: state.saved,
      values: { ...state.values },
      completedFields: countCompletedFields(state.values)
    };
  }

  function notifySave(documentationState) {
    if (events && typeof events.emit === "function") {
      events.emit(PBQ_EVENTS.DOCUMENTATION_SAVED, documentationState);
    }

    if (typeof onSave === "function") {
      onSave(documentationState);
    }
  }

  function render({ completed = false } = {}) {
    if (!element) {
      return;
    }

    const values = state.values;
    const savedStatus = state.saved
      ? '<p class="documentation-status complete">Documentation saved.</p>'
      : '<p class="documentation-status">Complete all fields, then save the ticket documentation.</p>';

    element.innerHTML = `
      <div class="documentation-header">
        <div>
          <h2>Ticket Documentation</h2>
          <p class="status-note">This is the formal ticket note, separate from learner scratch notes.</p>
        </div>
        ${savedStatus}
      </div>
      <form id="documentationForm" class="documentation-form">
        <label>
          <span>Problem / Symptom</span>
          <textarea name="problem" ${completed ? "disabled" : ""} placeholder="What did the user report?">${escapeHtml(values.problem)}</textarea>
        </label>
        <label>
          <span>Root Cause</span>
          <textarea name="rootCause" ${completed ? "disabled" : ""} placeholder="What caused the issue?">${escapeHtml(values.rootCause)}</textarea>
        </label>
        <label>
          <span>Resolution</span>
          <textarea name="resolution" ${completed ? "disabled" : ""} placeholder="What did you change or fix?">${escapeHtml(values.resolution)}</textarea>
        </label>
        <label>
          <span>Verification</span>
          <textarea name="verification" ${completed ? "disabled" : ""} placeholder="How did you confirm the fix worked?">${escapeHtml(values.verification)}</textarea>
        </label>
        <button class="engine-button primary" type="submit" ${completed ? "disabled" : ""}>Save Documentation</button>
      </form>
    `;

    element.querySelector("#documentationForm")?.addEventListener("submit", event => {
      event.preventDefault();
      save();
    });
  }

  function save() {
    state.values = getValues();
    state.saved = countCompletedFields(state.values) === 4;
    notifySave(getState());
    render();
  }

  function reset() {
    state.saved = false;
    state.values = getEmptyValues();
    render();
  }

  return {
    render,
    reset,
    getState
  };
}
