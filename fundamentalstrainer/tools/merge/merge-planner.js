import { buildKnowledgeObjectFromCandidate, mergeCandidateIntoKnowledgeObject } from "./object-builder.js";
import { buildRelationshipsFromCandidate, mergeRelationships } from "./relationship-builder.js";

export function planReviewedImportMerge({
  reviewedImport,
  existingObjects = [],
  knowledgeIndex = { objects: [] },
  relationshipGraph = { schemaVersion: "1.0.0", certification: "a-plus-220-1202", relationships: [] },
  options = {}
}) {
  if (!reviewedImport?.candidates) {
    throw new Error("Reviewed import must contain a candidates array.");
  }

  const objectMap = new Map(existingObjects.map(object => [object.id, object]));
  const outputObjects = new Map(existingObjects.map(object => [object.id, structuredCloneSafe(object)]));
  const objectWrites = [];
  const skipped = [];
  const relationshipsToAdd = [];

  for (const candidate of reviewedImport.candidates) {
    const decision = candidate.reviewDecision || "undecided";

    if (decision === "ignore" || decision === "undecided") {
      skipped.push({
        candidateId: candidate.candidateId,
        title: candidate.title,
        decision,
        reason: candidate.reviewNotes || "Not selected for merge."
      });
      continue;
    }

    if (decision === "create-new") {
      const created = buildKnowledgeObjectFromCandidate(candidate, options);
      outputObjects.set(created.id, created);
      objectWrites.push({
        action: "create",
        knowledgeId: created.id,
        path: knowledgePathForObject(created),
        object: created
      });
      relationshipsToAdd.push(...buildRelationshipsFromCandidate(candidate, options));
      continue;
    }

    if (decision === "merge-existing") {
      const targetId = getMergeTargetId(candidate);
      const existing = objectMap.get(targetId) || outputObjects.get(targetId);
      if (!targetId || !existing) {
        skipped.push({
          candidateId: candidate.candidateId,
          title: candidate.title,
          decision,
          reason: `Merge target not found: ${targetId || "none"}.`
        });
        continue;
      }

      const merged = mergeCandidateIntoKnowledgeObject(existing, candidate, options);
      outputObjects.set(merged.id, merged);
      objectWrites.push({
        action: "update",
        knowledgeId: merged.id,
        path: knowledgePathForObject(merged),
        object: merged
      });
      relationshipsToAdd.push(...buildRelationshipsFromCandidate({ ...candidate, proposedKnowledgeId: merged.id }, options));
      continue;
    }

    skipped.push({
      candidateId: candidate.candidateId,
      title: candidate.title,
      decision,
      reason: `Unknown decision: ${decision}.`
    });
  }

  const updatedKnowledgeIndex = rebuildKnowledgeIndex(knowledgeIndex, [...outputObjects.values()]);
  const updatedRelationshipGraph = {
    ...relationshipGraph,
    relationships: mergeRelationships(relationshipGraph.relationships || [], relationshipsToAdd)
  };

  return {
    schemaVersion: "1.0.0",
    planType: "reviewed-import-merge-plan",
    generatedAt: new Date().toISOString(),
    sourceImportId: reviewedImport.id || null,
    summary: {
      candidatesReviewed: reviewedImport.candidates.length,
      objectsToCreate: objectWrites.filter(write => write.action === "create").length,
      objectsToUpdate: objectWrites.filter(write => write.action === "update").length,
      relationshipsToAdd: relationshipsToAdd.length,
      skipped: skipped.length,
      knowledgeIndexObjectCount: updatedKnowledgeIndex.objects.length,
      relationshipCount: updatedRelationshipGraph.relationships.length
    },
    objectWrites,
    indexWrite: {
      path: "content/indexes/knowledge-index.json",
      object: updatedKnowledgeIndex
    },
    relationshipGraphWrite: {
      path: `content/relationships/${updatedRelationshipGraph.certification || options.certificationId || "a-plus-220-1202"}.graph.json`,
      object: updatedRelationshipGraph
    },
    skipped
  };
}

export function getMergeTargetId(candidate) {
  return candidate.mergeTargetId
    || candidate.targetKnowledgeId
    || candidate.duplicateReview?.matches?.[0]?.knowledgeId
    || candidate.possibleDuplicates?.[0]?.knowledgeId
    || null;
}

export function rebuildKnowledgeIndex(index, objects) {
  const paths = new Set(index.objects || []);
  for (const object of objects) paths.add(knowledgePathForObject(object));

  return {
    ...index,
    generatedBy: "reviewed-import-merge-planner",
    updatedAt: new Date().toISOString(),
    objects: [...paths].sort()
  };
}

export function knowledgePathForObject(object) {
  const domains = object.domains || [];
  const namespace = object.id.includes(".") ? object.id.split(".")[0] : domains[0] || "general";
  const slug = object.slug || object.id.split(".").pop().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `content/knowledge/${namespace}/${slug}.json`;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
