const DEFAULT_STORAGE_KEY = "fundamentalstrainer.assessmentAttempts.v1";

export class LocalAssessmentAttemptStore {
  constructor({ storage = window.localStorage, storageKey = DEFAULT_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  saveAttempt({ assessment, answers, grade, mode = "practice" }) {
    const state = this.readState();
    const attempt = {
      id: createAttemptId(),
      mode,
      createdAt: new Date().toISOString(),
      generator: assessment?.generator || "unknown",
      questionCount: assessment?.questions?.length || 0,
      sourceKnowledgeIds: unique((assessment?.questions || []).map(question => question.sourceKnowledgeId)),
      score: {
        total: grade?.total || 0,
        correct: grade?.correct || 0,
        incorrect: grade?.incorrect || 0,
        percent: grade?.percent || 0
      },
      answers: { ...answers },
      results: grade?.results || []
    };

    state.attempts.unshift(attempt);
    state.attempts = state.attempts.slice(0, 50);
    this.writeState(state);
    return attempt;
  }

  list({ limit = 10 } = {}) {
    return this.readState().attempts.slice(0, limit);
  }

  summarize() {
    const attempts = this.readState().attempts;
    const best = attempts.reduce((currentBest, attempt) => {
      if (!currentBest) return attempt;
      return attempt.score.percent > currentBest.score.percent ? attempt : currentBest;
    }, null);

    return {
      totalAttempts: attempts.length,
      latest: attempts[0] || null,
      best,
      averagePercent: attempts.length
        ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score.percent, 0) / attempts.length)
        : 0
    };
  }

  clear() {
    this.writeState({ schemaVersion: "1.0.0", attempts: [] });
  }

  readState() {
    try {
      const parsed = JSON.parse(this.storage.getItem(this.storageKey) || "{}");
      return {
        schemaVersion: "1.0.0",
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : []
      };
    } catch {
      return { schemaVersion: "1.0.0", attempts: [] };
    }
  }

  writeState(state) {
    this.storage.setItem(this.storageKey, JSON.stringify({
      schemaVersion: "1.0.0",
      attempts: state.attempts || []
    }));
  }
}

function createAttemptId() {
  return `attempt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
