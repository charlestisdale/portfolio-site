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

## Current active work

- Pausing broad import expansion to stabilize curriculum architecture before processing the remaining video set.
- Testing the resolver and maintainer path against Lesson 04 and the next imported lessons.
- Preserving A+ Core 2 as the immediate learning target while keeping the system certification-agnostic.
- Preventing duplicate canonical concepts across future certifications such as Network+, Security+, CCNA, Linux+, and cloud curricula.
- Keeping AI out of direct canonical writes: AI proposes structured updates; deterministic tools validate, preview, back up, and apply only after explicit human approval.

## Current implemented maintenance pipeline

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
Knowledge Maintainer Prompt
    ↓
Knowledge Update / Update Package
    ↓
validate:updates
    ↓
knowledge:update:preview
    ↓
Human review
    ↓
knowledge:update:apply -- --approve=true
    ↓
validate:all
```

## Near-term structural work

1. Test the deterministic resolver and maintainer workflow against Lessons 01-04 and then the next imported lessons.
2. Review resolver results for false positives and false negatives.
3. Review maintainer output for over-broad updates, weak relationships, duplicate facts, or curriculum-specific language leaking into canonical knowledge.
4. Decide how `expectation-only` work items should generate Curriculum Expectation files.
5. Decide how `relationship-only` work items should enter a relationship review queue.
6. Add batch/queue support for generating all maintainer prompts from a Resolver Work Plan.
7. Insert the resolver stage into the guided import workflow only after manual resolver output is stable.
8. Resume large-scale A+ Core 2 import only after the structure is clear.

## Near-term workflow improvements

1. Improve pipeline status output so the next action is always obvious.
2. Add resolver-aware import reports.
3. Add richer curriculum/expectation reports.
4. Add graph stub reports.
5. Improve relationship type normalization.
6. Add lesson completion reports.
7. Add apply preview summaries to pipeline status output.
8. Remove or archive obsolete old docs.

## Next major milestone

Integrate resolver-aware routing into guided import.

Current guided path:

```text
Discovery Review
    ↓
Knowledge Author
```

Target guided path:

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
    └── defer / reject → Human review
```

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
