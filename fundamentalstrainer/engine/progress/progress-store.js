export const ProgressStatus = Object.freeze({
  NOT_STARTED: "not-started",
  LEARNING: "learning",
  REVIEWED: "reviewed",
  MASTERED: "mastered"
});

export const ProgressStatusLabels = Object.freeze({
  [ProgressStatus.NOT_STARTED]: "Not Started",
  [ProgressStatus.LEARNING]: "Learning",
  [ProgressStatus.REVIEWED]: "Reviewed",
  [ProgressStatus.MASTERED]: "Mastered"
});

const DEFAULT_STORAGE_KEY = "fundamentalstrainer.learningProgress.v1";

export class LocalProgressStore {
  constructor({ storage = window.localStorage, storageKey = DEFAULT_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  getAll() {
    return this.readState().concepts || {};
  }

  get(knowledgeId) {
    return this.getAll()[knowledgeId] || createProgressRecord(knowledgeId);
  }

  setStatus(knowledgeId, status) {
    const normalizedStatus = normalizeStatus(status);
    const state = this.readState();
    const existing = state.concepts[knowledgeId] || createProgressRecord(knowledgeId);
    const now = new Date().toISOString();

    state.concepts[knowledgeId] = {
      ...existing,
      knowledgeId,
      status: normalizedStatus,
      updatedAt: now,
      firstStartedAt: existing.firstStartedAt || (normalizedStatus !== ProgressStatus.NOT_STARTED ? now : null),
      completedAt: normalizedStatus === ProgressStatus.MASTERED ? now : existing.completedAt || null
    };

    this.writeState(state);
    return state.concepts[knowledgeId];
  }

  cycleStatus(knowledgeId) {
    const current = this.get(knowledgeId).status;
    const next = getNextStatus(current);
    return this.setStatus(knowledgeId, next);
  }

  reset(knowledgeId) {
    const state = this.readState();
    delete state.concepts[knowledgeId];
    this.writeState(state);
    return createProgressRecord(knowledgeId);
  }

  summarize(knowledgeObjects = []) {
    const progress = this.getAll();
    const summary = {
      total: knowledgeObjects.length,
      notStarted: 0,
      learning: 0,
      reviewed: 0,
      mastered: 0,
      percentStarted: 0,
      percentMastered: 0
    };

    for (const object of knowledgeObjects) {
      const status = progress[object.id]?.status || ProgressStatus.NOT_STARTED;
      if (status === ProgressStatus.LEARNING) summary.learning += 1;
      else if (status === ProgressStatus.REVIEWED) summary.reviewed += 1;
      else if (status === ProgressStatus.MASTERED) summary.mastered += 1;
      else summary.notStarted += 1;
    }

    const started = summary.learning + summary.reviewed + summary.mastered;
    summary.percentStarted = summary.total ? Math.round((started / summary.total) * 100) : 0;
    summary.percentMastered = summary.total ? Math.round((summary.mastered / summary.total) * 100) : 0;
    return summary;
  }

  readState() {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.storageKey) || "{}");
      return {
        schemaVersion: "1.0.0",
        concepts: parsed.concepts || {}
      };
    } catch {
      return { schemaVersion: "1.0.0", concepts: {} };
    }
  }

  writeState(state) {
    this.storage.setItem(this.storageKey, JSON.stringify({
      schemaVersion: "1.0.0",
      concepts: state.concepts || {}
    }));
  }
}

function createProgressRecord(knowledgeId) {
  return {
    knowledgeId,
    status: ProgressStatus.NOT_STARTED,
    firstStartedAt: null,
    completedAt: null,
    updatedAt: null
  };
}

function normalizeStatus(status) {
  return Object.values(ProgressStatus).includes(status) ? status : ProgressStatus.NOT_STARTED;
}

function getNextStatus(status) {
  if (status === ProgressStatus.NOT_STARTED) return ProgressStatus.LEARNING;
  if (status === ProgressStatus.LEARNING) return ProgressStatus.REVIEWED;
  if (status === ProgressStatus.REVIEWED) return ProgressStatus.MASTERED;
  return ProgressStatus.NOT_STARTED;
}
