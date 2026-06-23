# Knowledge-First Transcript Workflow

## Rule
Do not create assessments during transcript ingestion.

## For each lesson
1. Save raw `.srt` in `data/transcripts/raw/<certification>/`.
2. Clean it into `data/transcripts/cleaned/<certification>/`.
3. Create an import record in `data/imports/<certification>/`.
4. Extract candidate concepts.
5. Check for existing knowledge objects before creating new ones.
6. Merge new facts into the authoritative object.
7. Add transcript references and source video references.
8. Add related concepts.
9. Mark uncertain items in `needsReview`.
10. Only mark the import record `reviewed` after duplicates are checked.

## Merge rules
- Same concept, same tool, or same command: update the existing object.
- New use case for an existing command: add an example or scenario, not a new object.
- Similar term but different meaning: create a separate object and link it with `relatedConcepts`.
- Certification-specific exam wording belongs in `examTips`, not in the engine.

## Naming rules
- Object IDs use lowercase kebab-case.
- Command objects should use the command name where safe: `ipconfig`, `ping`, `netstat`.
- Windows tools should use common display names: `task-manager`, `event-viewer`, `windows-firewall`.
- File paths should follow the domain: `content/knowledge/windows/event-viewer.json`.
