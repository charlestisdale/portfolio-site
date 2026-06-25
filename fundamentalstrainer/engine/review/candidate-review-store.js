const STORAGE_KEY = "it-learning-platform.import-review.v1";

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || "knowledge-object")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "knowledge-object";
}

function uniq(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function normalizeTextRecord(item, fallbackImportance = "medium") {
  if (typeof item === "string") return { text: item, importance: fallbackImportance, tags: [] };
  return {
    text: item?.text || item?.situation || item?.task || "",
    importance: item?.importance || fallbackImportance,
    difficulty: item?.difficulty || undefined,
    basis: item?.basis || undefined,
    requiresReview: item?.requiresReview ?? true,
    evidenceIds: asArray(item?.evidenceIds),
    tags: asArray(item?.tags)
  };
}

function normalizeScenario(item) {
  if (typeof item === "string") return { situation: item, expectedAction: "", difficulty: "medium", tags: [] };
  return {
    situation: item?.situation || item?.text || "",
    expectedAction: item?.expectedAction || "",
    difficulty: item?.difficulty || "medium",
    basis: item?.basis || undefined,
    requiresReview: item?.requiresReview ?? true,
    evidenceIds: asArray(item?.evidenceIds),
    tags: asArray(item?.tags)
  };
}

function normalizePbqIdea(item) {
  if (typeof item === "string") return { task: item, skillsTested: [], difficulty: "medium", assetsNeeded: [] };
  return {
    task: item?.task || item?.text || "",
    skillsTested: asArray(item?.skillsTested),
    difficulty: item?.difficulty || "medium",
    basis: item?.basis || undefined,
    requiresReview: item?.requiresReview ?? true,
    evidenceIds: asArray(item?.evidenceIds),
    assetsNeeded: asArray(item?.assetsNeeded)
  };
}

export function readReviewState() {
  if (typeof localStorage === "undefined") return { records: {} };
  const state = safeJsonParse(localStorage.getItem(STORAGE_KEY), { records: {} });
  return { records: state?.records && typeof state.records === "object" ? state.records : {} };
}

export function writeReviewState(state) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: state?.records || {} }));
}

export function candidateReviewKey(preview = {}, candidate = {}) {
  const lesson = preview.lessonId || preview.id || "unknown-lesson";
  const id = candidate.proposedKnowledgeId || candidate.id || candidate.title || "unknown-candidate";
  return `${lesson}:${id}`;
}

export function getReviewRecord(key) {
  return readReviewState().records[key] || null;
}

export function reviewSummary() {
  const records = Object.values(readReviewState().records || {});
  return records.reduce((summary, record) => {
    summary.total += 1;
    summary[record.decision] = (summary[record.decision] || 0) + 1;
    return summary;
  }, { total: 0, approved: 0, rejected: 0, edited: 0, merge: 0 });
}

export function parseLineList(value) {
  return String(value || "")
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

export function parseRelationshipLines(value) {
  return parseLineList(value).map(line => {
    const [id, type = "related", reason = "Human-reviewed relationship."] = line.split("|").map(part => part.trim());
    return { id, type, reason, strength: "medium" };
  }).filter(item => item.id);
}

export function serializeRelationships(candidate = {}) {
  return (candidate.suggestedRelationships || [])
    .map(relationship => {
      if (typeof relationship === "string") return relationship;
      return [relationship.id || relationship.target || relationship.targetId, relationship.type || "related", relationship.reason || relationship.rationale || ""].filter(Boolean).join(" | ");
    })
    .filter(Boolean)
    .join("\n");
}

export function collectCandidateEdits(card) {
  return {
    title: card.querySelector("[data-review-field='title']")?.value || "",
    summary: card.querySelector("[data-review-field='summary']")?.value || "",
    facts: parseLineList(card.querySelector("[data-review-field='facts']")?.value),
    relationships: parseRelationshipLines(card.querySelector("[data-review-field='relationships']")?.value),
    mergeTarget: card.querySelector("[data-review-field='mergeTarget']")?.value?.trim() || "",
    notes: card.querySelector("[data-review-field='notes']")?.value || ""
  };
}

function sourceEvidence(preview = {}, candidate = {}) {
  return (candidate.evidence || candidate.transcriptEvidence || []).map(item => {
    if (typeof item === "string") {
      return {
        lessonId: preview.lessonId || null,
        lessonTitle: preview.lessonTitle || preview.title || null,
        sourceFile: preview.sourceTranscript || null,
        startTime: null,
        endTime: null,
        quote: item,
        notes: "Topic-trigger evidence from reviewed import candidate."
      };
    }

    return {
      lessonId: item.lessonId || preview.lessonId || null,
      lessonTitle: item.lessonTitle || preview.lessonTitle || preview.title || null,
      sourceFile: item.sourceFile || item.file || preview.sourceTranscript || null,
      startTime: item.startTime || item.start || null,
      endTime: item.endTime || item.end || null,
      quote: item.quote || item.text || item.excerpt || "",
      notes: item.notes || item.reason || "Topic-trigger evidence from reviewed import candidate."
    };
  });
}

function relationshipsByType(relationships) {
  const grouped = {
    prerequisites: [],
    parents: [],
    children: [],
    related: [],
    contrastsWith: [],
    replacedBy: []
  };

  for (const relationship of relationships || []) {
    const id = relationship.id || relationship.target || relationship.targetId;
    if (!id) continue;
    const type = relationship.type || "related_to";
    const record = {
      id,
      reason: relationship.reason || relationship.rationale || "Imported relationship suggestion.",
      strength: relationship.strength || "medium"
    };

    if (["depends_on", "prerequisite", "prerequisite_of"].includes(type)) grouped.prerequisites.push(id);
    else if (["part_of", "parent"].includes(type)) grouped.parents.push(id);
    else if (["has_part", "child"].includes(type)) grouped.children.push(id);
    else if (["contrasts_with", "contrastsWith"].includes(type)) grouped.contrastsWith.push(record);
    else if (["replaced_by", "replacedBy"].includes(type)) grouped.replacedBy.push(id);
    else grouped.related.push(record);
  }

  return grouped;
}

export function buildKnowledgeObject(candidate = {}, preview = {}, edits = {}) {
  const id = candidate.proposedKnowledgeId || candidate.id || slugify(edits.title || candidate.title);
  const title = edits.title || candidate.title || id;
  const facts = edits.facts?.length
    ? edits.facts.map(text => ({ text, importance: "medium", tags: [] }))
    : asArray(candidate.factsDraft || candidate.facts).map(item => normalizeTextRecord(item)).filter(item => item.text);
  const relationships = edits.relationships?.length ? edits.relationships : asArray(candidate.suggestedRelationships || []);
  const groupedRelationships = relationshipsByType(relationships);
  const date = new Date().toISOString().slice(0, 10);
  const examTips = asArray(candidate.examTipsDraft).map(item => normalizeTextRecord(item, "exam-critical")).filter(item => item.text);
  const commonMistakes = asArray(candidate.commonMistakesDraft).map(item => normalizeTextRecord(item)).filter(item => item.text);
  const examples = asArray(candidate.examplesDraft).map(item => normalizeTextRecord(item)).filter(item => item.text);
  const scenarios = asArray(candidate.scenariosDraft).map(normalizeScenario).filter(item => item.situation);
  const pbqIdeas = asArray(candidate.pbqIdeasDraft).map(normalizePbqIdea).filter(item => item.task);

  return {
    schemaVersion: "1.0.0",
    id,
    slug: slugify(title),
    title,
    aliases: uniq(candidate.aliases || []),
    type: candidate.type || "concept",
    status: "draft",
    domains: uniq(candidate.domains || []),
    difficulty: candidate.difficulty || "foundational",
    importance: candidate.importance || "medium",
    certificationMappings: [
      {
        certification: "a-plus-220-1202",
        examCode: "220-1202",
        objectives: candidate.objectives || [],
        lessons: [
          {
            lessonId: preview.lessonId || candidate.lessonId || null,
            title: preview.lessonTitle || preview.title || null,
            order: Number(preview.lessonId || candidate.lessonId) || null
          }
        ]
      }
    ],
    learning: {
      summary: edits.summary || candidate.summaryDraft || "",
      explanation: candidate.explanationDraft || edits.summary || candidate.summaryDraft || "",
      facts,
      commands: candidate.commands || [],
      examples,
      tables: [],
      media: [],
      notes: edits.notes ? [{ text: edits.notes, type: "review-note" }] : []
    },
    assessmentSeeds: {
      examTips,
      commonMistakes,
      scenarios,
      pbqIdeas,
      questionTargets: []
    },
    relationships: {
      prerequisites: uniq(groupedRelationships.prerequisites),
      parents: uniq(groupedRelationships.parents),
      children: uniq(groupedRelationships.children),
      related: groupedRelationships.related,
      contrastsWith: groupedRelationships.contrastsWith,
      replacedBy: uniq(groupedRelationships.replacedBy)
    },
    sources: {
      transcripts: sourceEvidence(preview, candidate),
      videos: [],
      references: []
    },
    quality: {
      createdAt: date,
      updatedAt: date,
      lastReviewedAt: date,
      reviewedBy: "local-review-ui",
      confidence: candidate.confidence || "medium",
      needsHumanReview: true,
      reviewNotes: edits.notes ? [edits.notes] : []
    }
  };
}

export function recordCandidateReview({ key, decision, candidate, preview, edits = {} }) {
  const state = readReviewState();
  const previous = state.records[key] || {};
  const approvedObject = decision === "approved" ? buildKnowledgeObject(candidate, preview, edits) : previous.approvedObject || null;

  state.records[key] = {
    ...previous,
    key,
    candidateId: candidate.proposedKnowledgeId || candidate.id || candidate.title,
    title: edits.title || candidate.title,
    lessonId: preview.lessonId || candidate.lessonId || null,
    lessonTitle: preview.lessonTitle || preview.title || null,
    decision,
    edits,
    mergeTarget: edits.mergeTarget || "",
    approvedObject,
    updatedAt: nowIso()
  };

  writeReviewState(state);
  return state.records[key];
}

export function exportApprovedObjects() {
  return Object.values(readReviewState().records || {})
    .filter(record => record.decision === "approved" && record.approvedObject)
    .map(record => record.approvedObject);
}

export function resetCandidateReview(key) {
  const state = readReviewState();
  delete state.records[key];
  writeReviewState(state);
}
