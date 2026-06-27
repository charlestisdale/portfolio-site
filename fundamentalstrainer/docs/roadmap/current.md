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
- Deterministic Knowledge Resolver framework.
- Missing/planned reference warning summaries for knowledge and architecture validation.

## Current active work

- Pausing broad import expansion to stabilize curriculum architecture before processing the remaining video set.
- Defining the Curriculum Engine as a first-class structural layer.
- Separating Curriculum Plans from Curriculum Expectations.
- Designing the Knowledge Resolver so AI receives existing-platform context before authoring.
- Preserving A+ Core 2 as the immediate learning target while keeping the system certification-agnostic.
- Preventing duplicate canonical concepts across future certifications such as Network+, Security+, CCNA, Linux+, and cloud curricula.

## Near-term structural work

1. Test the deterministic resolver against the first imported lessons.
2. Review resolver results for false positives and false negatives.
3. Decide when a resolver result should route to Knowledge Author versus Knowledge Maintainer.
4. Add duplicate-risk reporting from resolver results into pipeline status output.
5. Decide how existing imported A+ objects should migrate into the resolver/expectation model.
6. Insert the resolver stage into the guided import workflow only after manual resolver output is stable.
7. Resume large-scale A+ Core 2 import only after the structure is clear.

## Near-term workflow improvements

1. Improve pipeline status output so the next action is always obvious.
2. Add resolver-aware import reports.
3. Add richer curriculum/expectation reports.
4. Add graph stub reports.
5. Improve relationship type normalization.
6. Add lesson completion reports.
7. Remove or archive obsolete old docs.

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
