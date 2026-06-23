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
  -> Validation
  -> Knowledge Base
```

## Location

```text
fundamentalstrainer/tools/merge/
```

Modules:

```text
object-builder.js        Builds or merges canonical knowledge objects.
relationship-builder.js  Converts approved relationship suggestions into graph edges.
merge-planner.js         Produces a non-destructive merge plan.
apply-plan.js            Applies a merge plan to a virtual file map.
index.js                 Public exports.
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

The apply layer currently writes to a virtual file map instead of the real repository filesystem.

Exports:

```js
applyMergePlanToVirtualFiles(plan, currentFiles)
buildFileMapFromMergePlan(plan)
validateMergePlan(plan)
```

This gives us a safe checkpoint before adding a Node.js filesystem writer.

## Safety Rules

1. Reviewed imports create a plan first, not direct writes.
2. Ignored and undecided candidates are skipped.
3. Merges append facts, commands, aliases, transcript evidence, and notes.
4. Existing reviewed content is not overwritten.
5. Relationship suggestions remain draft graph edges.
6. Validation should run after applying a merge plan.
7. The first apply layer writes virtually before writing to disk.

## Example Usage

```js
import {
  planReviewedImportMerge,
  applyMergePlanToVirtualFiles
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

const result = applyMergePlanToVirtualFiles(plan, {});
console.log(plan.summary);
console.log(result.summary);
```

## Next Step

The next layer should be a Node.js filesystem script that takes a merge plan and writes:

- New or updated knowledge object JSON files
- `content/indexes/knowledge-index.json`
- `content/relationships/<certification>.graph.json`

After writing, validation should run before merging into `main`.
