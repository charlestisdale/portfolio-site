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
      return [relationship.id || relationship.targetId, relationship.type || "related", relationship.reason || relationship.rationale || ""].filter(Boolean).join(" | ");
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
  return (candidate.evidence || []).map(item => {
    if (typeof item === "string") {
      return {
        lessonId: preview.lessonId || null,
        lessonTitle: preview.lessonTitle || preview.title || null,
        sourceFile: null,
        startTime: null,
        endTime: null,
        quote: item,
        notes: "Imported candidate evidence."
      };
    }

    return {
      lessonId: item.lessonId || preview.lessonId || null,
      lessonTitle: item.lessonTitle || preview.lessonTitle || preview.title || null,
      sourceFile: item.sourceFile || item.file || null,
      startTime: item.startTime || item.start || null,
      endTime: item.endTime || item.end || null,
      quote: item.quote || item.text || item.excerpt || "",
      notes: item.notes || "Imported candidate evidence."
    };
  });
}

export function buildKnowledgeObject(candidate = {}, preview = {}, edits = {}) {
  const id = candidate.proposedKnowledgeId || candidate.id || slugify(edits.title || candidate.title);
  const title = edits.title || candidate.title || id;
  const facts = edits.facts?.length ? edits.facts : (candidate.factsDraft || []).map(fact => typeof fact === "string" ? fact : fact.text).filter(Boolean);
  const relationships = edits.relationships?.length ? edits.relationships : (candidate.suggestedRelationships || []);
  const date = new Date().toISOString().slice(0, 10);

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
      explanation: edits.summary || candidate.explanationDraft || candidate.summaryDraft || "",
      facts: facts.map(text => ({ text, importance: "medium", tags: [] })),
      commands: candidate.commands || [],
      examples: candidate.examples || [],
      tables: [],
      media: [],
      notes: edits.notes ? [{ text: edits.notes, type: "review-note" }] : []
    },
    assessmentSeeds: {
      examTips: [],
      commonMistakes: [],
      scenarios: [],
      pbqIdeas: [],
      questionTargets: []
    },
    relationships: {
      prerequisites: [],
      parents: [],
      children: [],
      related: relationships.map(relationship => {
        if (typeof relationship === "string") return { id: relationship, reason: "Imported relationship suggestion.", strength: "medium" };
        return {
          id: relationship.id || relationship.targetId,
          reason: relationship.reason || relationship.rationale || "Imported relationship suggestion.",
          strength: relationship.strength || "medium"
        };
      }).filter(item => item.id),
      contrastsWith: [],
      replacedBy: []
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
      needsHumanReview: false,
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
