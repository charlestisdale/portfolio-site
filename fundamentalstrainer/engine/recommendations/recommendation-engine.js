export function buildRecommendations({ certificationState = null, knowledgeEngine = null, progressStore = null, activeConceptId = null, limit = 5 } = {}) {
  const knowledge = certificationState?.knowledge || knowledgeEngine?.all?.() || [];
  const progressById = progressStore?.getAll?.() || {};
  const lessonOrderByKnowledgeId = buildLessonOrderMap(certificationState?.lessons || []);
  const relatedIds = new Set((activeConceptId && knowledgeEngine?.related)
    ? knowledgeEngine.related(activeConceptId)
      .map(edge => edge.directionFromSource === "outbound" ? edge.target?.id : edge.source?.id)
      .filter(Boolean)
    : []);

  const candidates = knowledge
    .filter(object => object?.id)
    .map(object => scoreCandidate({ object, progress: progressById[object.id], lessonOrder: lessonOrderByKnowledgeId.get(object.id), isRelatedToActive: relatedIds.has(object.id) }))
    .filter(candidate => candidate.score > 0)
    .sort(compareCandidates)
    .slice(0, limit);

  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    activeConceptId,
    summary: {
      totalCandidates: knowledge.length,
      returned: candidates.length
    },
    recommendations: candidates
  };
}

function scoreCandidate({ object, progress, lessonOrder, isRelatedToActive }) {
  const status = progress?.status || "not-started";
  const reasons = [];
  let score = 0;

  if (status === "not-started") {
    score += 50;
    reasons.push("Not started yet");
  } else if (status === "learning") {
    score += 70;
    reasons.push("Currently in progress");
  } else if (status === "reviewed") {
    score += 60;
    reasons.push("Ready to master");
  } else if (status === "mastered") {
    score -= 30;
  }

  if (object.importance === "exam-critical") {
    score += 35;
    reasons.push("Exam-critical");
  } else if (object.importance === "high") {
    score += 20;
    reasons.push("High importance");
  }

  if (object.quality?.needsHumanReview) {
    score -= 5;
    reasons.push("Needs review before final trust");
  }

  if (Number.isFinite(lessonOrder)) {
    score += Math.max(0, 25 - lessonOrder);
    reasons.push(`Lesson ${lessonOrder}`);
  }

  if (isRelatedToActive) {
    score += 25;
    reasons.push("Related to current concept");
  }

  return {
    id: object.id,
    title: object.title,
    summary: object.learning?.summary || object.id,
    type: object.type,
    domains: object.domains || [],
    difficulty: object.difficulty || null,
    importance: object.importance || null,
    status,
    score,
    reasons
  };
}

function buildLessonOrderMap(lessons) {
  const orderMap = new Map();

  for (const lesson of lessons) {
    const order = Number(lesson.order);
    for (const id of lesson.knowledgeIds || []) {
      if (!Number.isFinite(order)) continue;
      const existing = orderMap.get(id);
      if (!Number.isFinite(existing) || order < existing) orderMap.set(id, order);
    }
  }

  return orderMap;
}

function compareCandidates(a, b) {
  return b.score - a.score || statusRank(b.status) - statusRank(a.status) || a.title.localeCompare(b.title);
}

function statusRank(status) {
  if (status === "learning") return 4;
  if (status === "reviewed") return 3;
  if (status === "not-started") return 2;
  return 1;
}
