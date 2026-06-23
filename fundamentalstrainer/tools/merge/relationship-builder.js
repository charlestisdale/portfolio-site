const DEFAULT_SCHEMA_VERSION = "1.0.0";

export function buildRelationshipsFromCandidate(candidate, options = {}) {
  const {
    certificationId = "a-plus-220-1202",
    evidencePrefix = "a-plus-220-1202.lesson",
    createdAt = todayIsoDate()
  } = options;

  const sourceId = candidate.proposedKnowledgeId || candidate.id;
  const lessonId = firstLessonId(candidate);
  const evidence = lessonId ? [`${evidencePrefix}-${String(lessonId).padStart(2, "0")}`] : [];

  return (candidate.relationshipReview || candidate.suggestedRelationships || [])
    .filter(item => item.reviewStatus !== "rejected")
    .map(item => {
      const targetId = item.targetId || item.target || item.targetKnowledgeId;
      if (!sourceId || !targetId) return null;

      return {
        schemaVersion: DEFAULT_SCHEMA_VERSION,
        id: relationshipId(sourceId, item.type || "related_to", targetId),
        sourceId,
        targetId,
        type: normalizeRelationshipType(item.type || "related_to"),
        strength: item.strength || strengthFromConfidence(item.confidence),
        direction: "outbound",
        status: "draft",
        certification: certificationId,
        evidence,
        notes: item.notes || item.reason || "Imported relationship suggestion needs review.",
        createdAt,
        updatedAt: createdAt
      };
    })
    .filter(Boolean);
}

export function mergeRelationships(existingRelationships = [], incomingRelationships = []) {
  const map = new Map();
  for (const relationship of [...existingRelationships, ...incomingRelationships]) {
    const key = relationship.id || relationshipId(relationship.sourceId, relationship.type, relationship.targetId);
    if (!map.has(key)) {
      map.set(key, relationship);
      continue;
    }

    const current = map.get(key);
    map.set(key, {
      ...current,
      evidence: unique([...(current.evidence || []), ...(relationship.evidence || [])]),
      notes: unique([current.notes, relationship.notes].filter(Boolean)).join(" | "),
      updatedAt: relationship.updatedAt || current.updatedAt
    });
  }
  return [...map.values()].sort((a, b) => a.id.localeCompare(b.id));
}

function relationshipId(sourceId, type, targetId) {
  return `rel.${sourceId}.${normalizeRelationshipType(type)}.${targetId}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function normalizeRelationshipType(type) {
  if (type === "related_to") return "related";
  if (type === "contrasts_with") return "contrasts_with";
  return type;
}

function strengthFromConfidence(confidence) {
  if (confidence >= 0.8) return "strong";
  if (confidence >= 0.5) return "medium";
  return "weak";
}

function firstLessonId(candidate) {
  return candidate.certificationMappings?.[0]?.lessons?.[0]?.lessonId || candidate.sources?.transcripts?.[0]?.lessonId || null;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
