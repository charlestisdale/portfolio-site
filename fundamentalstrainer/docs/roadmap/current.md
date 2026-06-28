# Current Roadmap

## Completed foundation

- Knowledge-first platform architecture.
- Engine/content separation.
- Canonical Knowledge Object store.
- Knowledge Engine API.
- Knowledge Graph data layer.
- Graph visualizer mode.
- Curriculum file structure.
- Curriculum mapping command.
- Knowledge validation and architecture validation.
- Transcript Intelligence prompt generation and normalization.
- Discovery Manifest generation.
- Discovery Review prompt generation and normalization.
- Knowledge Author prompt generation.
- Knowledge Author response normalization.
- Safe authored draft promotion.
- AI expansion runner.
- AI staging helper.
- Guided import workflow.
- Curriculum Engine architecture direction.
- Initial schema contracts for fragments, Curriculum Expectations, resolver results, and knowledge update packages.
- Initial templates for Curriculum Plans, Curriculum Expectations, resolver results, knowledge update packages, and fragment-aware Knowledge Objects.
- Curriculum Expectation validator.
- Resolver Result validator.
- Knowledge Update validator.
- Deterministic Knowledge Resolver framework.
- Resolver Summary command.
- Resolver Work Plan command.
- Knowledge Maintainer Prompt Generator.
- Knowledge Update Preview command.
- Guarded Knowledge Update Apply command with explicit approval.
- Missing/planned reference warning summaries for knowledge and architecture validation.
- `validate:all` now validates Knowledge Objects, Curriculum Expectations, Resolver Results, Knowledge Updates, and Architecture.
- Resolver-aware `ai:guided` routing now stages Knowledge Author and Knowledge Maintainer prompts.
- Knowledge Maintainer responses are validated, previewed, and normalized for common AI formatting errors before validation.

## Current active work

- Pausing broad import expansion to finish the import engine before processing the remaining video set.
- Treating Lesson 05 as the integration test for the resolver-aware import engine.
- Preserving A+ Core 2 as the immediate learning target while keeping the system certification-agnostic.
- Preventing duplicate canonical concepts across future certifications such as Network+, Security+, CCNA, Linux+, and cloud curricula.
- Keeping AI out of direct canonical writes: AI proposes structured updates; deterministic tools validate, preview, back up, and apply only after explicit human approval.

## Current implemented import pipeline

```text
Transcript Intelligence
    ↓
Discovery Review
    ↓
Knowledge Resolver
    ↓
Resolver Summary
    ↓
Resolver Work Plan
    ↓
Decision
    ├── create-new-object → Knowledge Author
    ├── create-knowledge-update → Knowledge Maintainer
    ├── create-update-package → Knowledge Maintainer
    ├── create-or-update-expectation → Pending Expectation Writer
    ├── relationship-only → Pending Relationship Queue
    ├── duplicate-no-change → No change / report
    └── defer / reject → Pending Deferred Review Queue
```

## Lesson 05 integration-test result

Lesson 05 validated that the resolver-aware guided path can process existing concepts without creating duplicate canonical Knowledge Objects.

Final verified shape:

```text
workItems: 28
knowledgeUpdates: 4
expectations: 12
newObjects: 0
deferred: 11
queued: 0
completedItemCount: 4
manualItemCount: 24
```

Validation status after maintainer updates and previews:

```text
validate:knowledge      passed
validate:expectations   passed for 0 expectation files
validate:resolver       passed
validate:updates        passed
validate:architecture   passed with planned-reference warnings
```

Interpretation:

- Knowledge Author / Knowledge Maintainer routing is functioning.
- Knowledge Update validation and preview are functioning.
- The resolver correctly avoided duplicate canonical objects.
- The missing stages are now clearly Expectation Writer, Deferred Review Queue, Relationship Queue, and final lesson completion reporting.

## Near-term structural work

1. Implement Curriculum Expectation Writer for `create-or-update-expectation` work items.
2. Implement Deferred Review Queue for `defer-human-review` and `reject` items.
3. Implement Relationship Queue for future `relationship-only` work items.
4. Improve `ai:guided` ending output so completed AI work is reported separately from pending review queues.
5. Add lesson completion reports that summarize new objects, updates, expectations, deferred items, rejected items, validations, previews, and next steps.
6. Re-import or revalidate Lessons 01-05 through the finalized import engine.
7. Resume large-scale A+ Core 2 import only after the finalized pipeline is validated.

## Near-term workflow improvements

1. Improve pipeline status output so the next action is always obvious.
2. Add resolver-aware import reports.
3. Add richer curriculum/expectation reports.
4. Add graph stub reports.
5. Improve relationship type normalization.
6. Add apply preview summaries to pipeline status output.
7. Remove or archive obsolete old docs.
8. Add stale-artifact cleanup or archive behavior for reruns so old resolver/prompt/response files cannot create duplicate-state loops.

## Next major milestone

Complete resolver-aware guided import, not just Knowledge Author / Knowledge Maintainer routing.

Current validated guided path:

```text
Discovery Review
    ↓
Knowledge Resolver
    ↓
Resolver Work Plan
    ↓
Decision
    ├── new-object → Knowledge Author
    └── expand-existing-object → Knowledge Maintainer
```

Target finalized guided path:

```text
Discovery Review
    ↓
Knowledge Resolver
    ↓
Resolver Work Plan
    ↓
Decision
    ├── new-object → Knowledge Author
    ├── expand-existing-object → Knowledge Maintainer
    ├── expectation-only → Curriculum Expectation Writer
    ├── relationship-only → Relationship Queue
    ├── duplicate-no-change → No canonical change
    └── defer / reject → Human review queue
```

## Re-import validation milestone

After the import engine is complete, re-import or revalidate Lessons 01-05 using the finalized workflow.

The goal is to verify the entire import engine before continuing with the remaining lessons:

```text
Source material
    ↓
Transcript Intelligence
    ↓
Discovery Review
    ↓
Resolver
    ↓
Author / Maintainer / Expectation / Relationship / Deferred queues
    ↓
Validation
    ↓
Review reports
```

The first five lessons should become the regression suite for the import engine.

## Future learning features

- Adaptive study paths.
- Flashcard generation from Knowledge Objects and expectations.
- PBQ generation from Knowledge Objects and expectations.
- Assessment generation from Knowledge Objects and expectations.
- Lab generation for curricula that require configuration or troubleshooting depth.
- AI tutor using Knowledge Object, graph, curriculum, expectation, and progress context.
- Recommendation engine.
- Mastery tracking.
- Analytics dashboard.
- Multi-certification support.
