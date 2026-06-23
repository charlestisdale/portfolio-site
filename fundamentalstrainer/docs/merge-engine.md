# Reviewed Import Merge Engine

## Purpose

The merge engine turns reviewed import decisions into a safe content update plan.

It does not blindly write transcript output into the knowledge base.

The workflow is:

```text
Reviewed Import JSON
  -> Merge Planner
  -> Write Plan
  -> Apply Layer
  -> Filesystem Writer
  -> Validation
  -> Knowledge Base
```

## Location

```text
fundamentalstrainer/tools/merge/
```

Modules:

```text
object-builder.js             Builds or merges canonical knowledge objects.
relationship-builder.js       Converts approved relationship suggestions into graph edges.
merge-planner.js              Produces a non-destructive merge plan.
apply-plan.js                 Applies a merge plan to a virtual file map.
write-plan-files.js           Writes a validated merge plan to the local filesystem.
apply-merge-plan.cli.js       Command-line entry point for local writes.
index.js                      Public exports.
```

## Decisions Supported

Candidates use the Review UI decision field:

```text
create-new       Create a new knowledge object.
merge-existing   Merge candidate facts/evidence into an existing object.
ignore           Skip the candidate.
undecided        Skip until reviewed.
```

## Merge Plan Output

The planner returns:

```text
objectWrites
indexWrite
relationshipGraphWrite
skipped
summary
```

This means the app can show exactly what will change before anything is applied.

## Apply Layer

The apply layer can write to a virtual file map first and then to the real local filesystem.

Exports:

```js
applyMergePlanToVirtualFiles(plan, currentFiles)
buildFileMapFromMergePlan(plan)
validateMergePlan(plan)
writeMergePlanFiles(plan, options)
```

## Filesystem Writer

The filesystem writer is dry-run by default.

From the `fundamentalstrainer/` folder:

```bash
node tools/merge/apply-merge-plan.cli.js --plan content/imports/approved/example-plan.json
```

To actually write files:

```bash
node tools/merge/apply-merge-plan.cli.js --plan content/imports/approved/example-plan.json --write
```

Useful options:

```bash
--project-root <path>  Project root where content/ lives. Defaults to current directory.
--write                Actually write files. Without this, dry-run mode is used.
--no-overwrite         Skip files that already exist.
```

## Safety Rules

1. Reviewed imports create a plan first, not direct writes.
2. Ignored and undecided candidates are skipped.
3. Merges append facts, commands, aliases, transcript evidence, and notes.
4. Existing reviewed content is not overwritten.
5. Relationship suggestions remain draft graph edges.
6. Validation should run after applying a merge plan.
7. Dry-run mode should be used before writing files.
8. The writer refuses to write outside the configured project root.

## Example Usage

```js
import {
  planReviewedImportMerge,
  applyMergePlanToVirtualFiles,
  writeMergePlanFiles
} from "./tools/merge/index.js";

const plan = planReviewedImportMerge({
  reviewedImport,
  existingObjects: knowledge.all(),
  knowledgeIndex,
  relationshipGraph,
  options: {
    certificationId: "a-plus-220-1202",
    examCode: "220-1202"
  }
});

const virtualResult = applyMergePlanToVirtualFiles(plan, {});
console.log(plan.summary);
console.log(virtualResult.summary);

const dryRun = await writeMergePlanFiles(plan, {
  projectRoot: ".",
  dryRun: true
});
console.log(dryRun.summary);
```

## Next Step

The next layer should connect the Review UI export to merge-plan creation so the flow becomes:

```text
Review UI decisions
  -> reviewed import JSON
  -> merge plan JSON
  -> dry-run filesystem writer
  -> write filesystem changes
  -> validation
```
