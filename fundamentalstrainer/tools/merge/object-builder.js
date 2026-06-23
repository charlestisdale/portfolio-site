const DEFAULT_SCHEMA_VERSION = "1.0.0";

export function buildKnowledgeObjectFromCandidate(candidate, options = {}) {
  const {
    certificationId = "a-plus-220-1202",
    examCode = "220-1202",
    createdAt = todayIsoDate()
  } = options;

  const id = candidate.proposedKnowledgeId || candidate.id;
  if (!id) throw new Error(`Candidate ${candidate.candidateId || candidate.title || "unknown"} is missing a proposed knowledge ID.`);

  return {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    id,
    slug: candidate.slug || slugFromId(id),
    title: candidate.title || titleFromId(id),
    aliases: unique(candidate.aliases || []),
    type: candidate.type || candidate.category || "concept",
    status: "draft",
    domains: unique(candidate.domains || ["needs-classification"]),
    difficulty: candidate.difficulty || "foundational",
    importance: normalizeImportance(candidate.importance),
    certificationMappings: normalizeCertificationMappings(candidate, { certificationId, examCode }),
    learning: {
      summary: candidate.learning?.summary || candidate.summaryDraft || "Needs human-authored summary.",
      explanation: candidate.learning?.explanation || "Needs human review and expansion.",
      facts: normalizeFacts(candidate),
      commands: normalizeCommands(candidate),
      examples: normalizeExamples(candidate),
      tables: candidate.learning?.tables || [],
      media: candidate.learning?.media || [],
      notes: candidate.learning?.notes || []
    },
    assessmentSeeds: normalizeAssessmentSeeds(candidate),
    relationships: normalizeEmbeddedRelationships(candidate),
    sources: normalizeSources(candidate),
    quality: {
      createdAt,
      updatedAt: createdAt,
      lastReviewedAt: createdAt,
      reviewedBy: "import-review",
      confidence: candidate.quality?.confidence || "low",
      needsHumanReview: true,
      reviewNotes: unique([
        ...(candidate.quality?.reviewNotes || []),
        candidate.reviewNotes,
        "Created from reviewed import candidate."
      ].filter(Boolean))
    }
  };
}

export function mergeCandidateIntoKnowledgeObject(existingObject, candidate, options = {}) {
  const updatedAt = options.updatedAt || todayIsoDate();
  const merged = structuredCloneSafe(existingObject);

  merged.aliases = unique([...(merged.aliases || []), ...(candidate.aliases || [])]);
  merged.domains = unique([...(merged.domains || []), ...(candidate.domains || [])]);
  merged.certificationMappings = mergeCertificationMappings(
    merged.certificationMappings || [],
    normalizeCertificationMappings(candidate, options)
  );

  merged.learning = merged.learning || {};
  merged.learning.facts = mergeUniqueObjects(merged.learning.facts || [], normalizeFacts(candidate), factKey);
  merged.learning.commands = mergeUniqueObjects(merged.learning.commands || [], normalizeCommands(candidate), commandKey);
  merged.learning.examples = mergeUniqueObjects(merged.learning.examples || [], normalizeExamples(candidate), exampleKey);
  merged.learning.notes = unique([...(merged.learning.notes || []), candidate.reviewNotes].filter(Boolean));

  merged.assessmentSeeds = mergeAssessmentSeeds(merged.assessmentSeeds || {}, normalizeAssessmentSeeds(candidate));
  merged.sources = mergeSources(merged.sources || {}, normalizeSources(candidate));

  merged.quality = merged.quality || {};
  merged.quality.updatedAt = updatedAt;
  merged.quality.needsHumanReview = true;
  merged.quality.reviewNotes = unique([
    ...(merged.quality.reviewNotes || []),
    candidate.reviewNotes,
    "Merged reviewed import candidate."
  ].filter(Boolean));

  return merged;
}

function normalizeCertificationMappings(candidate, { certificationId = "a-plus-220-1202", examCode = "220-1202" } = {}) {
  if (candidate.certificationMappings?.length) return candidate.certificationMappings;
  return [
    {
      certification: certificationId,
      examCode,
      objectives: [],
      lessons: []
    }
  ];
}

function normalizeFacts(candidate) {
  const facts = candidate.learning?.facts || (candidate.factsDraft || []).map(text => ({ text }));
  return facts.map(fact => ({
    text: fact.text || String(fact),
    importance: fact.importance || "needs-review",
    tags: unique([...(fact.tags || []), "import-review"])
  })).filter(fact => fact.text);
}

function normalizeCommands(candidate) {
  return (candidate.learning?.commands || []).map(command => ({
    command: command.command,
    purpose: command.purpose || "Purpose needs review.",
    syntaxNotes: command.syntaxNotes,
    tags: unique([...(command.tags || []), "import-review"])
  })).filter(command => command.command);
}

function normalizeExamples(candidate) {
  return (candidate.learning?.examples || []).map(example => ({
    text: example.text || String(example),
    context: example.context || "Imported transcript example",
    tags: unique([...(example.tags || []), "import-review"])
  })).filter(example => example.text);
}

function normalizeAssessmentSeeds(candidate) {
  const seeds = candidate.assessmentSeeds || {};
  return {
    examTips: seeds.examTips || (candidate.examTipsDraft || []).map(text => ({ text, difficulty: "needs-review", tags: ["import-review"] })),
    commonMistakes: seeds.commonMistakes || [],
    scenarios: seeds.scenarios || [],
    pbqIdeas: seeds.pbqIdeas || [],
    questionTargets: seeds.questionTargets || []
  };
}

function normalizeEmbeddedRelationships(candidate) {
  return candidate.relationships || {
    prerequisites: [],
    parents: [],
    children: [],
    related: [],
    contrastsWith: [],
    replacedBy: []
  };
}

function normalizeSources(candidate) {
  if (candidate.sources) return candidate.sources;
  return {
    transcripts: (candidate.evidence || []).map(item => ({
      lessonId: candidate.source?.lessonId || null,
      lessonTitle: candidate.source?.lessonTitle || null,
      sourceFile: candidate.source?.sourceFile || null,
      startTime: item.startTime || null,
      endTime: item.endTime || null,
      quote: item.text || "",
      notes: "Imported from reviewed candidate evidence."
    })),
    videos: [],
    references: []
  };
}

function mergeCertificationMappings(existing, incoming) {
  const map = new Map();
  for (const item of [...existing, ...incoming]) {
    const key = `${item.certification}:${item.examCode || ""}`;
    const current = map.get(key) || { ...item, objectives: [], lessons: [] };
    current.objectives = mergeUniqueObjects(current.objectives || [], item.objectives || [], object => object.id || JSON.stringify(object));
    current.lessons = mergeUniqueObjects(current.lessons || [], item.lessons || [], object => object.lessonId || object.id || JSON.stringify(object));
    map.set(key, current);
  }
  return [...map.values()];
}

function mergeAssessmentSeeds(existing, incoming) {
  return {
    examTips: mergeUniqueObjects(existing.examTips || [], incoming.examTips || [], item => item.text || JSON.stringify(item)),
    commonMistakes: mergeUniqueObjects(existing.commonMistakes || [], incoming.commonMistakes || [], item => item.text || JSON.stringify(item)),
    scenarios: mergeUniqueObjects(existing.scenarios || [], incoming.scenarios || [], item => `${item.situation || ""}|${item.expectedAction || ""}`),
    pbqIdeas: mergeUniqueObjects(existing.pbqIdeas || [], incoming.pbqIdeas || [], item => item.task || JSON.stringify(item)),
    questionTargets: mergeUniqueObjects(existing.questionTargets || [], incoming.questionTargets || [], item => `${item.type || ""}|${item.promptFocus || ""}`)
  };
}

function mergeSources(existing, incoming) {
  return {
    transcripts: mergeUniqueObjects(existing.transcripts || [], incoming.transcripts || [], item => `${item.sourceFile || ""}|${item.startTime || ""}|${item.quote || ""}`),
    videos: mergeUniqueObjects(existing.videos || [], incoming.videos || [], item => `${item.provider || ""}|${item.title || ""}|${item.url || ""}`),
    references: mergeUniqueObjects(existing.references || [], incoming.references || [], item => item.url || item.title || JSON.stringify(item))
  };
}

function mergeUniqueObjects(existing, incoming, getKey) {
  const map = new Map();
  for (const item of [...existing, ...incoming]) {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function factKey(fact) { return fact.text; }
function commandKey(command) { return command.command; }
function exampleKey(example) { return example.text; }

function normalizeImportance(value) {
  if (!value || value === "needs-review") return "needs-review";
  return value;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function slugFromId(id) {
  return String(id).split(".").pop().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function titleFromId(id) {
  return slugFromId(id).split("-").map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
