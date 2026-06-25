# Ingestion Review Workflow

This workflow prevents transcript imports from directly polluting the trusted knowledge base.

The review step is a promotion review, not a raw transcript approval step. The AI may use the source as a topic trigger and enrich useful concepts with general IT knowledge. Human review decides whether that enriched draft is accurate, useful, deduplicated, and ready to become canonical platform knowledge.

## Review state rule

Review state belongs in the existing pending candidate file under `data/imports/pending/`.

Do not manually download an approved JSON file and re-upload or copy it into another folder. If a candidate is already in the review queue, it is already in the local/admin system. Approval should update that existing record in place. Rejected candidates remain marked as `ignore` and are excluded from promotion.

## 1. Prepare source text

For `.srt` files, place raw files in:

```text
data/transcripts/raw/
```

Then run:

```bash
npm run clean:srt -- data/transcripts/raw/16-example.srt data/transcripts/cleaned/16-example.txt
```

This creates a lossless readable transcript view. It removes SRT cue numbers, timestamps, and markup only. It must not remove repeated phrases or overlapping cues before AI sees the source.

If the source is already clean text or another document converted to text, use that directly.

## 2. Generate an AI import prompt

Prefer lesson-based raw/lossless source lookup:

```bash
npm run ai:import:prompt -- --lesson=16
```

Or pass an already-clean source file:

```bash
npm run ai:import:prompt -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
```

The generated prompt treats the source as a topic trigger. It asks the AI to return learner-ready Knowledge Object candidates with source evidence separated from AI-enriched learning content.

Save the AI JSON response under:

```text
data/ai-imports/responses/
```

Then normalize it:

```bash
npm run ai:import:normalize -- --file=data/ai-imports/responses/16-response.json
```

This creates or updates:

```text
data/imports/pending/16-ai-candidates.json
```

## 3. Detect possible duplicates

```bash
npm run ingest:duplicates -- --file=data/imports/pending/16-ai-candidates.json
```

This updates the pending candidate file and writes a report to:

```text
data/imports/reports/
```

## 4. Human review

Update each candidate in place with one of:

```text
undecided
create-new
merge-existing
ignore
```

List candidates:

```bash
npm run review:candidates -- --file=data/imports/pending/16-ai-candidates.json --list=true
```

Approve a candidate as a new Knowledge Object:

```bash
npm run review:candidates -- --file=data/imports/pending/16-ai-candidates.json --candidate=AI-CAND-001 --decision=create-new --notes="Accurate and useful draft."
```

Mark a candidate for merge:

```bash
npm run review:candidates -- --file=data/imports/pending/16-ai-candidates.json --candidate=AI-CAND-002 --decision=merge-existing --notes="Merge into existing networking.dhcp object."
```

Reject a candidate:

```bash
npm run review:candidates -- --file=data/imports/pending/16-ai-candidates.json --candidate=AI-CAND-003 --decision=ignore --notes="Mentioned only; not worth promotion."
```

Do not merge while anything is still `undecided`.

### What review means

Approve only knowledge decisions, not raw transcript mentions.

For each candidate, check:

- Is this a real reusable Knowledge Object?
- Should it create a new object or merge into an existing object?
- Does source evidence show why this topic was triggered by the lesson/source?
- Are AI-enriched facts accurate and useful?
- Does the candidate meet the minimum knowledge threshold?
- Are relationships useful and not graph pollution?
- Should weak mentions be ignored instead of promoted?

A sentence like `Another popular file system you might run into is ext4.` is only source evidence. It should never be approved as the whole learning object. Either approve a useful enriched `filesystems.ext4` draft or reject the item as `mentioned-only`.

## 5. Build an import report

```bash
npm run ingest:report -- --file=data/imports/pending/16-ai-candidates.json
```

## 6. Dry-run merge

```bash
npm run ingest:merge -- --file=data/imports/pending/16-ai-candidates.json
```

By default this is a dry run.

## 7. Real merge

```bash
npm run ingest:merge -- --file=data/imports/pending/16-ai-candidates.json --dry-run=false
```

`create-new` candidates become draft Knowledge Objects. `merge-existing` candidates are flagged for manual merge because blindly merging can damage high-quality records. `ignore` candidates are retained in the import record as rejected review decisions and are excluded from promotion.

The merge command updates the original pending candidate file with merge metadata. It does not require a separate approved JSON upload/copy step.

## Browser Review UI

The project includes a local review page:

```text
review.html
engine/review/review-app.js
engine/review/candidate-loader.js
engine/review/duplicate-view.js
engine/review/approval-actions.js
```

The current browser review UI is static-site friendly. It can inspect candidates and download a backup snapshot, but it cannot safely write to local files by itself. Canonical review state should be saved in the original pending candidate file by `npm run review:candidates` or by a future authenticated local/admin backend.

### Static UI workflow

1. Generate pending candidate files in `data/imports/pending/`.
2. Build the static manifest:

```bash
npm run review:manifest
```

3. Serve the project locally:

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000/review.html
```

5. Inspect candidates and decide what each should become.
6. Save final decisions in place with `npm run review:candidates`.
7. Run the dry-run merge, then real merge when ready.
