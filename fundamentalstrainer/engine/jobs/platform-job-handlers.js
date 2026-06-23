import { runTranscriptImportPipeline } from "../../tools/import/index.js";
import { planReviewedImportMerge } from "../../tools/merge/index.js";
import { writeMergePlanFiles } from "../../tools/merge/write-plan-files.js";
import { JobType } from "./job-types.js";

export function registerPlatformJobHandlers(runner, dependencies = {}) {
  registerImportTranscriptJob(runner, dependencies);
  registerMergePlanCreateJob(runner, dependencies);
  registerMergePlanApplyJob(runner, dependencies);
  registerValidationJob(runner, dependencies);
  return runner;
}

export function registerImportTranscriptJob(runner, dependencies = {}) {
  runner.register(JobType.IMPORT_TRANSCRIPT, async (payload, job) => {
    job.progress({ current: 1, total: 4, label: "Loading transcript" });
    const srtText = payload.srtText || await dependencies.readText?.(payload.sourcePath);
    if (!srtText) throw new Error("IMPORT_TRANSCRIPT requires srtText or sourcePath with readText dependency.");

    job.progress({ current: 2, total: 4, label: "Loading existing knowledge" });
    const existingObjects = payload.existingObjects || await dependencies.getExistingObjects?.() || [];

    job.progress({ current: 3, total: 4, label: "Running import pipeline" });
    const report = runTranscriptImportPipeline({
      srtText,
      existingObjects,
      sourceFile: payload.sourceFile || payload.sourcePath || null,
      lessonId: payload.lessonId || null,
      lessonTitle: payload.lessonTitle || null,
      certificationId: payload.certificationId || "a-plus-220-1202",
      examCode: payload.examCode || "220-1202",
      domainHints: payload.domainHints || [],
      idStyle: payload.idStyle || "dot"
    });

    job.progress({ current: 4, total: 4, label: "Import report ready" });
    job.log("info", "Transcript import report generated.", report.summary);

    if (payload.outputPath && dependencies.writeJson) {
      await dependencies.writeJson(payload.outputPath, report);
      job.log("info", "Import report written.", { outputPath: payload.outputPath });
    }

    return {
      report,
      outputPath: payload.outputPath || null
    };
  }, {
    description: "Run transcript import pipeline and create a reviewable import report.",
    defaultMaxAttempts: 1
  });
}

export function registerMergePlanCreateJob(runner, dependencies = {}) {
  runner.register(JobType.MERGE_PLAN_CREATE, async (payload, job) => {
    job.progress({ current: 1, total: 4, label: "Loading reviewed import" });
    const reviewedImport = payload.reviewedImport || await dependencies.readJson?.(payload.reviewedImportPath);
    if (!reviewedImport) throw new Error("MERGE_PLAN_CREATE requires reviewedImport or reviewedImportPath with readJson dependency.");

    job.progress({ current: 2, total: 4, label: "Loading knowledge state" });
    const existingObjects = payload.existingObjects || await dependencies.getExistingObjects?.() || [];
    const knowledgeIndex = payload.knowledgeIndex || await dependencies.getKnowledgeIndex?.() || { objects: [] };
    const relationshipGraph = payload.relationshipGraph || await dependencies.getRelationshipGraph?.(payload.certificationId) || {
      schemaVersion: "1.0.0",
      certification: payload.certificationId || "a-plus-220-1202",
      relationships: []
    };

    job.progress({ current: 3, total: 4, label: "Planning merge" });
    const plan = planReviewedImportMerge({
      reviewedImport,
      existingObjects,
      knowledgeIndex,
      relationshipGraph,
      options: {
        certificationId: payload.certificationId || "a-plus-220-1202",
        examCode: payload.examCode || "220-1202"
      }
    });

    job.progress({ current: 4, total: 4, label: "Merge plan ready" });
    job.log("info", "Reviewed import merge plan created.", plan.summary);

    if (payload.outputPath && dependencies.writeJson) {
      await dependencies.writeJson(payload.outputPath, plan);
      job.log("info", "Merge plan written.", { outputPath: payload.outputPath });
    }

    return {
      plan,
      outputPath: payload.outputPath || null
    };
  }, {
    description: "Create a merge plan from reviewed import decisions.",
    defaultMaxAttempts: 1
  });
}

export function registerMergePlanApplyJob(runner, dependencies = {}) {
  runner.register(JobType.MERGE_PLAN_APPLY, async (payload, job) => {
    job.progress({ current: 1, total: 3, label: "Loading merge plan" });
    const plan = payload.plan || await dependencies.readJson?.(payload.planPath);
    if (!plan) throw new Error("MERGE_PLAN_APPLY requires plan or planPath with readJson dependency.");

    job.progress({ current: 2, total: 3, label: payload.dryRun === false ? "Writing files" : "Dry-running writes" });
    const result = await writeMergePlanFiles(plan, {
      projectRoot: payload.projectRoot || dependencies.projectRoot || ".",
      dryRun: payload.dryRun !== false,
      allowOverwrite: payload.allowOverwrite !== false
    });

    job.progress({ current: 3, total: 3, label: "Merge plan apply complete" });
    job.log("info", "Merge plan apply completed.", result.summary);

    return result;
  }, {
    description: "Apply a merge plan through dry-run or filesystem writes.",
    defaultMaxAttempts: 1
  });
}

export function registerValidationJob(runner, dependencies = {}) {
  runner.register(JobType.VALIDATION_RUN, async (payload, job) => {
    job.progress({ current: 1, total: 2, label: "Running validation" });

    if (!dependencies.validate) {
      job.log("warn", "No validation dependency was provided. Returning placeholder validation result.");
      return {
        valid: true,
        warnings: ["Validation job handler is registered, but no validator dependency was provided."],
        errors: []
      };
    }

    const result = await dependencies.validate(payload);
    job.progress({ current: 2, total: 2, label: "Validation complete" });
    job.log(result.valid ? "info" : "error", "Validation completed.", result);
    return result;
  }, {
    description: "Run platform validation checks.",
    defaultMaxAttempts: 1
  });
}
