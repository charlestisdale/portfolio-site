export function flattenObjectives(objectives = [], parentId = null) {
  const rows = [];

  for (const objective of objectives) {
    rows.push({ ...objective, parentId, children: objective.children || [] });
    rows.push(...flattenObjectives(objective.children || [], objective.id));
  }

  return rows;
}

export function lessonKey(lesson) {
  return lesson.id || lesson.lessonId || String(lesson.order || lesson.number || "");
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function objectText(object) {
  const facts = object.learning?.facts?.map(fact => fact.text) || [];
  const commands = object.learning?.commands?.map(command => `${command.command} ${command.purpose} ${command.syntax}`) || [];
  const examples = object.learning?.examples?.map(example => `${example.text} ${example.context}`) || [];
  const tips = object.assessmentSeeds?.examTips?.map(tip => tip.text) || [];
  const mistakes = object.assessmentSeeds?.commonMistakes?.map(mistake => mistake.text) || [];
  const scenarios = object.assessmentSeeds?.scenarios?.map(scenario => `${scenario.situation} ${scenario.expectedAction}`) || [];
  const pbqs = object.assessmentSeeds?.pbqIdeas?.map(pbq => `${pbq.task} ${(pbq.skillsTested || []).join(" ")}`) || [];

  return [
    object.id,
    object.slug,
    object.title,
    ...(object.aliases || []),
    object.type,
    ...(object.domains || []),
    object.difficulty,
    object.importance,
    object.learning?.summary,
    object.learning?.explanation,
    ...facts,
    ...commands,
    ...examples,
    ...tips,
    ...mistakes,
    ...scenarios,
    ...pbqs
  ].filter(Boolean).join(" ");
}

export function hasObjectiveMapping(object, objectiveId) {
  return (object.certificationMappings || []).some(mapping =>
    (mapping.objectives || []).some(objective => {
      const normalized = objectiveId.split(".").slice(-2).join(".");
      return objective.id === objectiveId || objective.id === normalized || objectiveId.endsWith(`.${objective.id}`);
    })
  );
}

export function hasLessonMapping(object, lessonId) {
  return (object.certificationMappings || []).some(mapping =>
    (mapping.lessons || []).some(lesson => String(lesson.lessonId || lesson.id) === String(lessonId))
  );
}
