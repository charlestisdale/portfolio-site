# Ingestion Review Workflow

This workflow prevents transcript imports from directly polluting the trusted knowledge base.

## 1. Clean the transcript

Place `.srt` files in:

```text
data/transcripts/raw/
```

Then run:

```bash
npm run clean:srt -- data/transcripts/raw/16-example.srt data/transcripts/cleaned/16-example.txt
```

## 2. Extract candidate concepts

```bash
npm run ingest:extract -- --lesson=16 --file=data/transcripts/cleaned/16-example.txt
```

This creates:

```text
data/imports/pending/16-candidates.json
```

## 3. Detect possible duplicates

```bash
npm run ingest:duplicates -- --file=data/imports/pending/16-candidates.json
```

This updates the pending candidate file and writes a report to:

```text
data/imports/reports/
```

## 4. Human review

Open the pending candidate file and set each candidate to one of:

```text
undecided
create-new
merge-existing
ignore
```

Do not merge while anything is still `undecided`.

## 5. Build an import report

```bash
npm run ingest:report -- --file=data/imports/pending/16-candidates.json
```

## 6. Dry-run merge

```bash
npm run ingest:merge -- --file=data/imports/pending/16-candidates.json
```

By default this is a dry run.

## 7. Real merge

```bash
npm run ingest:merge -- --file=data/imports/pending/16-candidates.json --dry-run=false
```

`create-new` candidates become draft knowledge objects. `merge-existing` candidates are flagged for manual merge because blindly merging can damage high-quality records.

## Browser Review UI

The project now includes a local review page:

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
