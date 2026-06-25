# Knowledge-First Transcript Workflow

## Rule
Do not create assessments during transcript ingestion.

The transcript is a topic trigger, not the full source of knowledge. If a transcript mentions an important technical concept but does not teach it deeply enough, AI may enrich the draft with general IT knowledge. Enriched facts must be clearly marked for human review before promotion.

## For each lesson
1. Save raw `.srt` in `data/transcripts/raw/<certification>/`.
2. Clean it into `data/transcripts/cleaned/<certification>/`.
3. Create an import record in `data/imports/<certification>/`.
4. Discover candidate topics from the transcript.
5. Classify each topic as teachable, merge-existing, mentioned-only, ignore, or needs-enrichment.
6. Enrich teachable topics into learner-ready Knowledge Object drafts when the transcript is incomplete.
7. Check for existing knowledge objects before creating new ones.
8. Merge new facts into the authoritative object.
9. Add transcript references as topic triggers and mark AI-enriched facts separately.
10. Add related concepts.
11. Mark uncertain items in `needsReview`.
12. Only mark the import record `reviewed` after duplicates, enrichment, and objective mapping are checked.

## Merge rules
- Same concept, same tool, or same command: update the existing object.
- New use case for an existing command: add an example or scenario, not a new object.
- Similar term but different meaning: create a separate object and link it with `relatedConcepts`.
- Certification-specific exam wording belongs in `examTips`, not in the engine.
- A weak transcript mention should not be promoted as a weak Knowledge Object. Either enrich it into useful learner content or reject it as `mentioned-only`.

## Minimum knowledge threshold
A candidate must teach something useful before review/promotion. It should include at least two of:

- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept

Example: `Another popular file system you might run into is ext4.` is only a topic trigger. It is not a valid Knowledge Object summary. The AI should either enrich `filesystems.ext4` into a useful learner-ready draft or reject it as `mentioned-only`.

## Naming rules
- Object IDs use lowercase kebab-case.
- Command objects should use the command name where safe: `ipconfig`, `ping`, `netstat`.
- Windows tools should use common display names: `task-manager`, `event-viewer`, `windows-firewall`.
- File paths should follow the domain: `content/knowledge/windows/event-viewer.json`.
