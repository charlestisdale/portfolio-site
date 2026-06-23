export const AssessmentQuestionType = Object.freeze({
  MULTIPLE_CHOICE: "multiple-choice",
  TRUE_FALSE: "true-false"
});

export function generateAssessmentFromKnowledge(knowledgeObjects = [], options = {}) {
  const {
    limit = 10,
    types = [AssessmentQuestionType.MULTIPLE_CHOICE, AssessmentQuestionType.TRUE_FALSE]
  } = options;

  const availableObjects = knowledgeObjects.filter(object => object?.id && object?.learning);
  const questions = [];

  for (const object of availableObjects) {
    if (questions.length >= limit) break;

    if (types.includes(AssessmentQuestionType.MULTIPLE_CHOICE)) {
      const question = generateMultipleChoiceQuestion(object, availableObjects);
      if (question) questions.push(question);
      if (questions.length >= limit) break;
    }

    if (types.includes(AssessmentQuestionType.TRUE_FALSE)) {
      const question = generateTrueFalseQuestion(object);
      if (question) questions.push(question);
    }
  }

  return {
    schemaVersion: "1.0.0",
    generator: "knowledge-assessment-generator",
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

function generateMultipleChoiceQuestion(object, allObjects) {
  const facts = object.learning?.facts || [];
  const primaryFact = facts.find(fact => fact.text) || null;
  const summary = object.learning?.summary;

  if (!primaryFact && !summary) return null;

  const correctText = primaryFact?.text || summary;
  const distractors = buildDistractors(object, allObjects, 3);
  if (distractors.length < 2) return null;

  const answers = shuffle([
    createAnswer("correct", correctText),
    ...distractors.map((text, index) => createAnswer(`distractor-${index + 1}`, text))
  ]);

  return {
    id: `${object.id}.mcq.1`,
    type: AssessmentQuestionType.MULTIPLE_CHOICE,
    sourceKnowledgeId: object.id,
    prompt: `Which statement best describes ${object.title}?`,
    answers,
    correctAnswerId: answers.find(answer => answer.source === "correct")?.id,
    explanation: object.learning?.explanation || object.learning?.summary || correctText,
    difficulty: object.difficulty || "foundational",
    tags: object.domains || []
  };
}

function generateTrueFalseQuestion(object) {
  const fact = (object.learning?.facts || []).find(item => item.text);
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
    tags: object.domains || []
  };
}

function buildDistractors(sourceObject, allObjects, count) {
  return allObjects
    .filter(object => object.id !== sourceObject.id)
    .map(object => object.learning?.summary || object.learning?.facts?.[0]?.text || object.title)
    .filter(Boolean)
    .filter(text => text !== sourceObject.learning?.summary)
    .slice(0, count);
}

function createAnswer(idSuffix, text) {
  return {
    id: `answer-${idSuffix}-${hashText(text)}`,
    text,
    source: idSuffix === "correct" ? "correct" : "distractor"
  };
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
