export function applyMergePlanToVirtualFiles(plan, currentFiles = {}) {
  assertPlan(plan);

  const files = { ...currentFiles };
  const writes = [];

  for (const write of plan.objectWrites || []) {
    writeJsonFile(files, writes, write.path, write.object, write.action);
  }

  if (plan.indexWrite) {
    writeJsonFile(files, writes, plan.indexWrite.path, plan.indexWrite.object, "update");
  }

  if (plan.relationshipGraphWrite) {
    writeJsonFile(files, writes, plan.relationshipGraphWrite.path, plan.relationshipGraphWrite.object, "update");
  }

  return {
    schemaVersion: "1.0.0",
    resultType: "merge-plan-apply-result",
    appliedAt: new Date().toISOString(),
    sourcePlanType: plan.planType,
    summary: {
      filesWritten: writes.length,
      created: writes.filter(write => write.action === "create").length,
      updated: writes.filter(write => write.action === "update").length,
      skipped: plan.skipped?.length || 0
    },
    writes,
    files
  };
}

export function buildFileMapFromMergePlan(plan) {
  assertPlan(plan);
  const files = {};

  for (const write of plan.objectWrites || []) {
    files[write.path] = stringifyJson(write.object);
  }

  if (plan.indexWrite) files[plan.indexWrite.path] = stringifyJson(plan.indexWrite.object);
  if (plan.relationshipGraphWrite) files[plan.relationshipGraphWrite.path] = stringifyJson(plan.relationshipGraphWrite.object);

  return files;
}

export function validateMergePlan(plan) {
  const errors = [];
  const warnings = [];
  const paths = new Set();

  if (!plan || typeof plan !== "object") errors.push("Plan must be an object.");
  if (plan?.planType !== "reviewed-import-merge-plan") warnings.push("Plan type is not reviewed-import-merge-plan.");

  for (const write of plan?.objectWrites || []) {
    if (!write.path) errors.push(`Object write for ${write.knowledgeId || "unknown"} is missing a path.`);
    if (!write.object?.id) errors.push(`Object write at ${write.path || "unknown path"} is missing object.id.`);
    if (write.path && paths.has(write.path)) warnings.push(`Multiple writes target ${write.path}. Last write wins.`);
    if (write.path) paths.add(write.path);
  }

  if (!plan?.indexWrite?.object?.objects) errors.push("Plan is missing indexWrite.object.objects.");
  if (!plan?.relationshipGraphWrite?.object?.relationships) errors.push("Plan is missing relationshipGraphWrite.object.relationships.");

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function writeJsonFile(files, writes, path, object, action) {
  if (!path) throw new Error("Cannot write JSON file without a path.");
  files[path] = stringifyJson(object);
  writes.push({
    path,
    action,
    bytes: files[path].length
  });
}

function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function assertPlan(plan) {
  const validation = validateMergePlan(plan);
  if (!validation.valid) {
    throw new Error(`Invalid merge plan: ${validation.errors.join(" ")}`);
  }
}
