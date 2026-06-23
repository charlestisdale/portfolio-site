export function buildStudyPath({ certificationState = null, knowledgeEngine = null, progressStore = null } = {}) {
  const lessons = [...(certificationState?.lessons || [])].sort(compareLessonOrder);
  const knowledgeObjects = certificationState?.knowledge || [];
  const progressById = progressStore?.getAll?.() || {};

  const lessonSteps = lessons.map(lesson => buildLessonStep({ lesson, knowledgeEngine, knowledgeObjects, progressById }));
  const unmappedSteps = buildUnmappedSteps({ lessons, knowledgeObjects, progressById });
  const steps = [...lessonSteps, ...unmappedSteps];

  return {
    schemaVersion: "1.0.0",
    id: certificationState?.certification?.id ? `${certificationState.certification.id}.default-path` : "default-study-path",
    title: certificationState?.certification?.name ? `${certificationState.certification.name} Study Path` : "Study Path",
    certification: certificationState?.certification?.id || null,
    summary: summarizeSteps(steps),
    steps
  };
}

function buildLessonStep({ lesson, knowledgeEngine, knowledgeObjects, progressById }) {
  const lessonContext = knowledgeEngine?.lesson?.(lesson.id) || knowledgeEngine?.lesson?.(lesson.lessonId || lesson.order) || { knowledge: [] };
  const explicitKnowledge = (lesson.knowledgeIds || []).map(id => knowledgeObjects.find(object => object.id === id)).filter(Boolean);
  const mappedKnowledge = lessonContext.knowledge || [];
  const knowledge = uniqueById([...explicitKnowledge, ...mappedKnowledge]);

  return {
    id: lesson.id,
    type: "lesson",
    order: lesson.order || null,
    title: lesson.title,
    objectiveIds: lesson.objectiveIds || [],
    status: lesson.status || "draft",
    knowledge: knowledge.map(object => summarizeKnowledgeObject(object, progressById[object.id])),
    progress: summarizeKnowledgeProgress(knowledge, progressById)
  };
}

function buildUnmappedSteps({ lessons, knowledgeObjects, progressById }) {
  const mappedIds = new Set(lessons.flatMap(lesson => lesson.knowledgeIds || []));
  const unmapped = knowledgeObjects.filter(object => !mappedIds.has(object.id));

  if (!unmapped.length) return [];

  return [{
    id: "unmapped-knowledge",
    type: "collection",
    order: null,
    title: "Unmapped knowledge",
    objectiveIds: [],
    status: "needs-review",
    knowledge: unmapped.map(object => summarizeKnowledgeObject(object, progressById[object.id])),
    progress: summarizeKnowledgeProgress(unmapped, progressById)
  }];
}

function summarizeKnowledgeObject(object, progress = null) {
  return {
    id: object.id,
    title: object.title,
    type: object.type,
    domains: object.domains || [],
    difficulty: object.difficulty || null,
    importance: object.importance || null,
    status: progress?.status || "not-started"
  };
}

function summarizeKnowledgeProgress(knowledge, progressById) {
  const summary = {
    total: knowledge.length,
    notStarted: 0,
    learning: 0,
    reviewed: 0,
    mastered: 0,
    percentStarted: 0,
    percentMastered: 0
  };

  for (const object of knowledge) {
    const status = progressById[object.id]?.status || "not-started";
    if (status === "learning") summary.learning += 1;
    else if (status === "reviewed") summary.reviewed += 1;
    else if (status === "mastered") summary.mastered += 1;
    else summary.notStarted += 1;
  }

  const started = summary.learning + summary.reviewed + summary.mastered;
  summary.percentStarted = summary.total ? Math.round((started / summary.total) * 100) : 0;
  summary.percentMastered = summary.total ? Math.round((summary.mastered / summary.total) * 100) : 0;
  return summary;
}

function summarizeSteps(steps) {
  const knowledge = steps.flatMap(step => step.knowledge || []);
  const total = knowledge.length;
  const mastered = knowledge.filter(item => item.status === "mastered").length;
  const started = knowledge.filter(item => item.status !== "not-started").length;

  return {
    steps: steps.length,
    knowledgeObjects: total,
    started,
    mastered,
    percentStarted: total ? Math.round((started / total) * 100) : 0,
    percentMastered: total ? Math.round((mastered / total) * 100) : 0
  };
}

function compareLessonOrder(a, b) {
  return Number(a.order || 0) - Number(b.order || 0) || String(a.title || "").localeCompare(String(b.title || ""));
}

function uniqueById(values) {
  const seen = new Set();
  const unique = [];
  for (const value of values) {
    if (!value?.id || seen.has(value.id)) continue;
    seen.add(value.id);
    unique.push(value);
  }
  return unique;
}
