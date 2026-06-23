export const AssessmentQuestionType = Object.freeze({
  MULTIPLE_CHOICE: "multiple-choice",
  TRUE_FALSE: "true-false",
  SCENARIO: "scenario"
});

export function generateAssessmentFromKnowledge(knowledgeObjects = [], options = {}) {
  const {
    limit = 10,
    types = [
      AssessmentQuestionType.MULTIPLE_CHOICE,
      AssessmentQuestionType.SCENARIO,
      AssessmentQuestionType.TRUE_FALSE
    ]
  } = options;

  const availableObjects = knowledgeObjects.filter(object => object?.id && object?.learning);
  const questions = [];
  const usedQuestionIds = new Set();

  for (const object of availableObjects) {
    if (questions.length >= limit) break;

    const candidates = [
      types.includes(AssessmentQuestionType.MULTIPLE_CHOICE) ? generateFactQuestion(object, availableObjects) : null,
      types.includes(AssessmentQuestionType.MULTIPLE_CHOICE) ? generateCommandQuestion(object, availableObjects) : null,
      types.includes(AssessmentQuestionType.SCENARIO) ? generateScenarioQuestion(object, availableObjects) : null,
      types.includes(AssessmentQuestionType.MULTIPLE_CHOICE) ? generateCommonMistakeQuestion(object, availableObjects) : null,
      types.includes(AssessmentQuestionType.TRUE_FALSE) ? generateTrueFalseQuestion(object) : null
    ].filter(Boolean);

    for (const question of candidates) {
      if (questions.length >= limit) break;
      if (usedQuestionIds.has(question.id)) continue;
      usedQuestionIds.add(question.id);
      questions.push(question);
    }
  }

  return {
    schemaVersion: "1.0.0",
    generator: "knowledge-assessment-generator-v2",
    generatedAt: new Date().toISOString(),
    summary: {
      requestedLimit: limit,
      generated: questions.length,
      sourceObjects: availableObjects.length
    },
    questions: questions.slice(0, limit)
  };
}

export function gradeAssessment(questions = [], answers = {}) {
  const results = questions.map(question => {
    const selected = answers[question.id] || null;
    const correct = selected === question.correctAnswerId;

    return {
      questionId: question.id,
      selectedAnswerId: selected,
      correctAnswerId: question.correctAnswerId,
      correct,
      explanation: question.explanation
    };
  });

  const correctCount = results.filter(result => result.correct).length;

  return {
    total: questions.length,
    correct: correctCount,
    incorrect: Math.max(0, questions.length - correctCount),
    percent: questions.length ? Math.round((correctCount / questions.length) * 100) : 0,
    results
  };
}

function generateFactQuestion(object, allObjects) {
  const fact = selectBestFact(object);
  const summary = object.learning?.summary;
  if (!fact && !summary) return null;

  const correctText = fact?.text || summary;
  const distractors = buildDistractors({ sourceObject: object, allObjects, count: 3, prefer: "facts" });
  if (distractors.length < 2) return null;

  return createQuestion({
    id: `${object.id}.fact.1`,
    type: AssessmentQuestionType.MULTIPLE_CHOICE,
    object,
    prompt: `Which statement is true about ${object.title}?`,
    correctText,
    distractors,
    explanation: object.learning?.explanation || correctText,
    tags: ["fact", ...(object.domains || [])]
  });
}

function generateCommandQuestion(object, allObjects) {
  const command = object.learning?.commands?.find(item => item.command && item.purpose);
  if (!command) return null;

  const distractors = allObjects
    .flatMap(item => item.learning?.commands || [])
    .filter(item => item.command !== command.command && item.purpose)
    .map(item => item.purpose)
    .filter(uniqueText)
    .slice(0, 3);

  if (distractors.length < 2) return null;

  return createQuestion({
    id: `${object.id}.command.1`,
    type: AssessmentQuestionType.MULTIPLE_CHOICE,
    object,
    prompt: `What is ${command.command} used for?`,
    correctText: command.purpose,
    distractors,
    explanation: `${command.command}: ${command.purpose}`,
    tags: ["command", ...(object.domains || [])]
  });
}

function generateScenarioQuestion(object, allObjects) {
  const scenario = object.assessmentSeeds?.scenarios?.find(item => item.situation && item.expectedAction);
  if (!scenario) return null;

  const distractors = allObjects
    .flatMap(item => item.assessmentSeeds?.scenarios || [])
    .filter(item => item.expectedAction && item.expectedAction !== scenario.expectedAction)
    .map(item => item.expectedAction)
    .filter(uniqueText)
    .slice(0, 3);

  if (distractors.length < 2) {
    distractors.push(...buildDistractors({ sourceObject: object, allObjects, count: 3 - distractors.length, prefer: "summaries" }));
  }

  if (distractors.length < 2) return null;

  return createQuestion({
    id: `${object.id}.scenario.1`,
    type: AssessmentQuestionType.SCENARIO,
    object,
    prompt: scenario.situation,
    correctText: scenario.expectedAction,
    distractors,
    explanation: scenario.expectedAction,
    tags: ["scenario", ...(scenario.tags || []), ...(object.domains || [])]
  });
}

function generateCommonMistakeQuestion(object, allObjects) {
  const mistake = object.assessmentSeeds?.commonMistakes?.find(item => item.text);
  if (!mistake) return null;

  const correctText = mistake.text;
  const distractors = buildDistractors({ sourceObject: object, allObjects, count: 3, prefer: "facts" });
  if (distractors.length < 2) return null;

  return createQuestion({
    id: `${object.id}.mistake.1`,
    type: AssessmentQuestionType.MULTIPLE_CHOICE,
    object,
    prompt: `Which is a common mistake involving ${object.title}?`,
    correctText,
    distractors,
    explanation: correctText,
    tags: ["common-mistake", ...(object.domains || [])]
  });
}

function generateTrueFalseQuestion(object) {
  const fact = selectBestFact(object);
  const statement = fact?.text || object.learning?.summary;
  if (!statement) return null;

  return {
    id: `${object.id}.tf.1`,
    type: AssessmentQuestionType.TRUE_FALSE,
    sourceKnowledgeId: object.id,
    prompt: statement,
    answers: [
      { id: `${object.id}.tf.1.true`, text: "True" },
      { id: `${object.id}.tf.1.false`, text: "False" }
    ],
    correctAnswerId: `${object.id}.tf.1.true`,
    explanation: object.learning?.explanation || object.learning?.summary || statement,
    difficulty: object.difficulty || "foundational",
    tags: ["true-false", ...(object.domains || [])]
  };
}

function createQuestion({ id, type, object, prompt, correctText, distractors, explanation, tags = [] }) {
  const answers = shuffle([
    createAnswer("correct", correctText),
    ...distractors.slice(0, 3).map((text, index) => createAnswer(`distractor-${index + 1}`, text))
  ]);

  return {
    id,
    type,
    sourceKnowledgeId: object.id,
    prompt,
    answers,
    correctAnswerId: answers.find(answer => answer.source === "correct")?.id,
    explanation,
    difficulty: object.difficulty || "foundational",
    tags
  };
}

function selectBestFact(object) {
  const facts = object.learning?.facts || [];
  return facts.find(fact => fact.importance === "exam-critical" && fact.text)
    || facts.find(fact => fact.importance === "high" && fact.text)
    || facts.find(fact => fact.text)
    || null;
}

function buildDistractors({ sourceObject, allObjects, count, prefer = "summaries" }) {
  const values = allObjects
    .filter(object => object.id !== sourceObject.id)
    .flatMap(object => {
      if (prefer === "facts") return (object.learning?.facts || []).map(fact => fact.text);
      return [object.learning?.summary, object.learning?.facts?.[0]?.text, object.title];
    })
    .filter(Boolean)
    .filter(text => text !== sourceObject.learning?.summary)
    .filter(uniqueText);

  return values.slice(0, count);
}

function createAnswer(idSuffix, text) {
  return {
    id: `answer-${idSuffix}-${hashText(text)}`,
    text,
    source: idSuffix === "correct" ? "correct" : "distractor"
  };
}

function uniqueText(value, index, values) {
  return values.indexOf(value) === index;
}

function shuffle(values) {
  return values
    .map(value => ({ value, sort: hashText(value.id) }))
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .map(item => item.value);
}

function hashText(value) {
  let hash = 0;
  const text = String(value || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}
