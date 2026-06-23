export const JobType = Object.freeze({
  IMPORT_TRANSCRIPT: "import.transcript",
  REVIEW_PACKAGE_CREATE: "review.package.create",
  MERGE_PLAN_CREATE: "merge.plan.create",
  MERGE_PLAN_APPLY: "merge.plan.apply",
  VALIDATION_RUN: "validation.run",
  SEARCH_INDEX_REBUILD: "search.index.rebuild",
  GRAPH_REBUILD: "graph.rebuild",
  ASSESSMENT_GENERATE: "assessment.generate"
});

export const JobTypeLabels = Object.freeze({
  [JobType.IMPORT_TRANSCRIPT]: "Import transcript",
  [JobType.REVIEW_PACKAGE_CREATE]: "Create review package",
  [JobType.MERGE_PLAN_CREATE]: "Create merge plan",
  [JobType.MERGE_PLAN_APPLY]: "Apply merge plan",
  [JobType.VALIDATION_RUN]: "Run validation",
  [JobType.SEARCH_INDEX_REBUILD]: "Rebuild search index",
  [JobType.GRAPH_REBUILD]: "Rebuild knowledge graph",
  [JobType.ASSESSMENT_GENERATE]: "Generate assessments"
});
