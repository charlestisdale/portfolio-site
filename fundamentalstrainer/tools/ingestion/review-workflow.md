# Ingestion Review Workflow

This workflow prevents transcript imports from directly polluting the trusted knowledge base.

The review step is a promotion review, not a raw transcript approval step. The AI may use the transcript as a topic trigger and enrich useful concepts with general IT knowledge. Human review decides whether that enriched draft is accurate, useful, deduplicated, and ready to become canonical platform knowledge.

## 1. Clean the transcript

Place `.srt` files in:

```text
data/transcripts/raw/
```

Then run:

```bash
npm run clean:srt -- data/transcripts/raw/16-example.srt data/transcripts/cleaned/16-example.txt
```

## 2. Generate an AI import prompt

```bash
npm run ai:import:prompt -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
```

The generated prompt treats the transcript as a topic trigger. It asks the AI to return learner-ready Knowledge Object candidates with transcript evidence separated from AI-enriched learning content.

Save the AI JSON response under:

```text
data/ai-imports/responses/
```

Then normalize it:

```bash
npm run ai:import:normalize -- --file=data/ai-imports/responses/16-response.json
```

This creates:

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

Open the pending candidate file or local review UI and set each candidate to one of:

```text
undecided
create-new
merge-existing
ignore
```

Do not merge while anything is still `undecided`.

### What review means

Approve only knowledge decisions, not raw transcript mentions.

For each candidate, check:

- Is this a real reusable Knowledge Object?
- Should it create a new object or merge into an existing object?
- Does transcript evidence show why this topic was triggered by the lesson?
- Are AI-enriched facts accurate and useful?
- Does the candidate meet the minimum knowledge threshold?
- Are relationships useful and not graph pollution?
- Should weak mentions be ignored instead of promoted?

A sentence like `Another popular file system you might run into is ext4.` is only transcript evidence. It should never be approved as the whole learning object. Either approve a useful enriched `filesystems.ext4` draft or reject the item as `mentioned-only`.

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

`create-new` candidates become draft knowledge objects. `merge-existing` candidates are flagged for manual merge because blindly merging can damage high-quality records.

## Browser Review UI

The project includes a local review page:

```text
review.html
engine/review/review-app.js
engine/review/candidate-loader.js
engine/review/duplicate-view.js
engine/review/approval-actions.js
```

### Workflow

1. Generate pending candidate files in `data/imports/pending/`.
2. Build the static manifest:

```bash
npm run review:manifest
```

3. Serve the project locally. A static server is required because browsers usually block `fetch()` from `file://` pages.

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000/review.html
```

5. For each candidate, choose one review decision:

- `create-new`
- `merge-existing`
- `ignore`
- `undecided`

6. Click **Export Review JSON**.
7. Save the exported JSON into `data/imports/approved/`.
8. Run:

```bash
npm run ingest:merge
```

The review UI does not directly write to disk. This keeps the platform static-site friendly and prevents accidental changes to the trusted knowledge base.
