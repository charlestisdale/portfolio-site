import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, normalize, relative, resolve } from "node:path";
import { applyMergePlanToVirtualFiles, validateMergePlan } from "./apply-plan.js";

/**
 * Write a reviewed import merge plan to the local filesystem.
 *
 * Dry-run mode is enabled by default. Pass { dryRun: false } to write files.
 */
export async function writeMergePlanFiles(plan, options = {}) {
  const {
    projectRoot = process.cwd(),
    dryRun = true,
    currentFiles = {},
    allowOverwrite = true
  } = options;

  const validation = validateMergePlan(plan);
  if (!validation.valid) {
    throw new Error(`Invalid merge plan: ${validation.errors.join(" ")}`);
  }

  const applyResult = applyMergePlanToVirtualFiles(plan, currentFiles);
  const root = resolve(projectRoot);
  const writes = [];

  for (const write of applyResult.writes) {
    const absolutePath = safeResolve(root, write.path);
    const content = applyResult.files[write.path];
    const existed = await fileExists(absolutePath);

    if (existed && !allowOverwrite) {
      writes.push({ ...write, absolutePath, status: "skipped-existing" });
      continue;
    }

    if (!dryRun) {
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, content, "utf8");
    }

    writes.push({
      ...write,
      absolutePath,
      status: dryRun ? "dry-run" : existed ? "updated" : "created"
    });
  }

  return {
    schemaVersion: "1.0.0",
    resultType: "filesystem-merge-plan-write-result",
    dryRun,
    projectRoot: root,
    validation,
    summary: {
      filesPlanned: applyResult.writes.length,
      filesWritten: dryRun ? 0 : writes.filter(write => write.status === "created" || write.status === "updated").length,
      dryRunWrites: writes.filter(write => write.status === "dry-run").length,
      skipped: writes.filter(write => write.status.startsWith("skipped")).length
    },
    writes
  };
}

export async function loadJsonFile(path) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export function safeResolve(root, filePath) {
  const absoluteRoot = resolve(root);
  const target = resolve(join(absoluteRoot, normalize(filePath)));
  const rel = relative(absoluteRoot, target);

  if (rel.startsWith("..") || rel === "" && target !== absoluteRoot) {
    throw new Error(`Refusing to write outside project root: ${filePath}`);
  }

  return target;
}

async function fileExists(path) {
  try {
    await readFile(path, "utf8");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
