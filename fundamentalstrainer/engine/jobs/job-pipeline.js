export function createJobPipeline({ id, title, steps = [], metadata = {} }) {
  if (!id) throw new Error("Pipeline id is required.");
  if (!steps.length) throw new Error("Pipeline must include at least one step.");

  return {
    schemaVersion: "1.0.0",
    id,
    title: title || id,
    metadata,
    steps: steps.map((step, index) => ({
      id: step.id || `${id}.step-${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      type: step.type,
      title: step.title || step.type,
      payload: step.payload || {},
      dependsOn: step.dependsOn || [],
      maxAttempts: step.maxAttempts || 1
    }))
  };
}

export function enqueuePipeline(runner, pipeline) {
  const jobs = [];

  for (const step of pipeline.steps) {
    jobs.push(runner.enqueue({
      type: step.type,
      title: step.title,
      payload: {
        ...step.payload,
        pipeline: {
          id: pipeline.id,
          stepId: step.id,
          order: step.order,
          dependsOn: step.dependsOn
        }
      },
      metadata: {
        ...pipeline.metadata,
        pipelineId: pipeline.id,
        pipelineTitle: pipeline.title,
        stepId: step.id,
        stepOrder: step.order
      },
      maxAttempts: step.maxAttempts
    }));
  }

  return jobs;
}

export function summarizePipelineJobs(jobs) {
  const counts = jobs.reduce((summary, job) => {
    summary[job.status] = (summary[job.status] || 0) + 1;
    return summary;
  }, {});

  return {
    total: jobs.length,
    counts,
    complete: jobs.every(job => job.status === "succeeded"),
    failed: jobs.some(job => job.status === "failed")
  };
}
