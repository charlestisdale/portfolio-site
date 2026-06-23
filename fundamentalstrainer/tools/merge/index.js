export {
  buildKnowledgeObjectFromCandidate,
  mergeCandidateIntoKnowledgeObject
} from "./object-builder.js";

export {
  buildRelationshipsFromCandidate,
  mergeRelationships
} from "./relationship-builder.js";

export {
  planReviewedImportMerge,
  getMergeTargetId,
  rebuildKnowledgeIndex,
  knowledgePathForObject
} from "./merge-planner.js";

export {
  applyMergePlanToVirtualFiles,
  buildFileMapFromMergePlan,
  validateMergePlan
} from "./apply-plan.js";
