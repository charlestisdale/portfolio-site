export function buildStudyPath({ certificationState = null, knowledgeEngine = null, progressStore = null } = {}) {
  const knowledgeObjects = certificationState?.knowledge || [];
  const progressById = progressStore?.getAll?.() || {};
  const curriculum = certificationState?.curriculum || null;

  if (curriculum) {
    return buildCurriculumStudyPath({ curriculum, knowledgeObjects, progressById });
  }

  const lessons = [...(certificationState?.lessons || [])].sort(compareLessonOrder);
  const lessonSteps = lessons.map(lesson => buildLessonStep({ lesson, knowledgeEngine, knowledgeObjects, progressById }));
  const unmappedSteps = buildUnmappedSteps({ mappedIds: new Set(), knowledgeObjects, progressById });
  const steps = [...lessonSteps, ...unmappedSteps];

  return {
    schemaVersion: "1.0.0",
    id: certificationState?.certification?.id ? `${certificationState.certification.id}.default-path` : "default-study-path",
    title: certificationState?.certification?.name ? `${certificationState.certification.name} Study Path` : "Study Path",
    certification: certificationState?.certification?.id || null,
    source: "lesson-fallback",
    summary: summarizeSteps(steps),
    steps
  };
}

function buildCurriculumStudyPath({ curriculum, knowledgeObjects, progressById }) {
  const mappedIds = new Set();
  const steps = [];

  for (const section of [...(curriculum.sections || [])].sort(compareOrder)) {
    for (const module of [...(section.modules || [])].sort(compareOrder)) {
      const knowledge = resolveModuleKnowledge({ module, knowledgeObjects, mappedIds });
      knowledge.forEach(object => mappedIds.add(object.id));
      steps.push({
        id: `${section.id}.${module.id}`,
        type: "module",
        order: module.order || null,
        sectionId: section.id,
        sectionTitle: section.title,
        title: module.title,
        description: module.description || "",
        outcomes: module.outcomes || [],
        objectiveIds: uniqueStrings([...(section.objectiveIds || []), ...(module.objectiveIds || [])]),
        status: module.status || "draft",
        knowledge: knowledge.map(object => summarizeKnowledgeObject(object, progressById[object.id])),
        progress: summarizeKnowledgeProgress(knowledge, progressById)
      });
    }
  }

  const unmappedSteps = buildUnmappedSteps({ mappedIds, knowledgeObjects, progressById });
  const allSteps = [...steps, ...unmappedSteps];

  return {
    schemaVersion: "1.0.0",
    id: `${curriculum.id}.curriculum-path`,
    title: `${curriculum.title} Study Path`,
    certification: curriculum.certificationId || curriculum.id || null,
    source: "curriculum",
    summary: summarizeSteps(allSteps),
    sections: curriculum.sections?.map(section => ({ id: section.id, title: section.title, order: section.order })) || [],
    steps: allSteps
  };
}

function resolveModuleKnowledge({ module, knowledgeObjects, mappedIds }) {
  const explicit = (module.knowledge || [])
    .map(id => knowledgeObjects.find(object => object.id === id))
    .filter(Boolean);
  const autoMapped = knowledgeObjects.filter(object => !mappedIds.has(object.id) && matchesAutoMap(object, module.autoMap));
  return uniqueById([...explicit, ...autoMapped]);
}

function matchesAutoMap(object, autoMap) {
  if (!autoMap) return false;

  const domainMatch = !autoMap.domains?.length || (object.domains || []).some(domain => autoMap.domains.includes(domain));
  const typeMatch = !autoMap.types?.length || autoMap.types.includes(object.type);
  const prefixMatch = !autoMap.idPrefixes?.length || autoMap.idPrefixes.some(prefix => object.id.startsWith(prefix));
  const idExactMatch = !autoMap.idExact?.length || autoMap.idExact.includes(object.id);
  const idIncludeMatch = !autoMap.idIncludes?.length || autoMap.idIncludes.some(value => object.id.toLowerCase().includes(String(value).toLowerCase()));
  const title = String(object.title || "").toLowerCase();
  const id = String(object.id || "").toLowerCase();
  const titleMatch = !autoMap.titleIncludes?.length || autoMap.titleIncludes.some(value => title.includes(String(value).toLowerCase()) || id.includes(String(value).toLowerCase().replaceAll(" ", "-")));
  const tagMatch = !autoMap.tags?.length || collectObjectTags(object).some(tag => autoMap.tags.includes(tag));

  return domainMatch && typeMatch && prefixMatch && idExactMatch && idIncludeMatch && titleMatch && tagMatch;
}

function collectObjectTags(object) {
  return uniqueStrings([
    ...(object.domains || []),
    ...((object.learning?.facts || []).flatMap(fact => fact.tags || [])),
    ...((object.assessmentSeeds?.examTips || []).flatMap(tip => tip.tags || []))
  ]);
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

function buildUnmappedSteps({ mappedIds, knowledgeObjects, progressById }) {
  const unmapped = knowledgeObjects.filter(object => !mappedIds.has(object.id));

  if (!unmapped.length) return [];

  return [{
    id: "unmapped-knowledge",
    type: "collection",
    order: null,
    title: "Unmapped knowledge",
    objectiveIds: [],
    status: "needs-curriculum-review",
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

function compareOrder(a, b) {
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

function uniqueStrings(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}
