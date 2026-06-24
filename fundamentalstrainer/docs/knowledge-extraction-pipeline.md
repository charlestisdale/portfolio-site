# Evidence-First Knowledge Extraction Pipeline

The platform is not a transcript viewer and not a quiz generator. It is a knowledge-first learning system.

Raw instructional material should never become trusted learning content directly. Transcripts are noisy evidence. Knowledge Objects are reviewed, reusable learning records.

## Core model

```text
source material
  -> raw transcript
  -> cleaned transcript
  -> evidence records
  -> concept evidence groups
  -> knowledge candidates
  -> duplicate / merge review
  -> reviewed Knowledge Objects
  -> graph / search / learn / assessments / flashcards / PBQs
```

## Why this layer exists

A transcript may contain repeated captions, filler, examples, video-specific phrasing, transitions, or source-specific wording. That material can be useful as evidence, but it should not be copied directly into the public knowledge base.

Incorrect flow:

```text
transcript sentence -> Knowledge Object fact
```

Correct flow:

```text
transcript sentence -> evidence -> reviewed fact draft -> Knowledge Object fact
```

## Layer responsibilities

### 1. Raw transcript

Location:

```text
data/transcripts/raw/<certification>/
```

Purpose:

- Preserve the original local/private `.srt` file.
- Do not expose this in the public learner UI.
- Do not treat this as knowledge.

### 2. Cleaned transcript

Location:

```text
data/transcripts/cleaned/<certification>/
```

Purpose:

- Remove SRT numbering and timestamps.
- Collapse repeated caption fragments.
- Preserve readable instructional text.
- Still not trusted learning content.

### 3. Evidence records

Location:

```text
data/imports/evidence/
```

Purpose:

- Store candidate-supporting excerpts from cleaned transcripts.
- Keep source-specific details out of public `content/knowledge` JSON.
- Allow review and audit before content promotion.

Evidence records should answer:

- Which concept appears?
- Where did it appear?
- What source text supports it?
- Is the text definition-like, comparison-like, example-like, warning-like, or relationship-like?
- How clean is the evidence?

### 4. Concept evidence groups

Location:

```text
data/imports/evidence-groups/
```

Purpose:

- Group evidence by reusable concept ID.
- Combine evidence from multiple transcripts and sources.
- Avoid creating duplicate Knowledge Objects per video.

Example:

```text
mobile.android
  <- lesson 01 evidence
  <- future mobile lesson evidence
  <- future security lesson evidence
```

### 5. Knowledge candidates

Location:

```text
data/imports/pending/
```

Purpose:

- Create reviewable candidate objects from grouped evidence.
- Draft summaries and facts should be synthesized from evidence, not blindly copied.
- Every candidate starts as `undecided`.

A pending candidate is not canonical content.

### 6. Duplicate / merge review

Location:

```text
data/imports/reports/
```

Purpose:

- Detect existing matching Knowledge Objects.
- Decide whether to create a new object or merge into an existing one.
- Keep merge writes dry-run-first.

### 7. Reviewed Knowledge Objects

Location:

```text
content/knowledge/
```

Purpose:

- Store canonical learning content.
- Power graph, search, learn mode, assessments, PBQs, recommendations, analytics, and future tutoring.
- Public files should not expose raw transcript evidence or provider-specific provenance.

## Design rules

1. Knowledge Objects are canonical.
2. Transcripts are evidence, not knowledge.
3. Evidence is private/admin-side by default.
4. Public content should keep generic `sources.references` only.
5. Do not create certification-specific IDs unless the concept truly only exists in that certification.
6. Do not write quiz questions during ingestion.
7. Import should be dry-run-first and review-first.
8. Extraction quality should be measured before expanding to all 74 transcripts.

## Minimum useful local test

```bash
node tools/ingestion/clean-srt.mjs \
  "data/transcripts/raw/a-plus-220-1202/01-Operating Systems Overview - CompTIA A+ 220-1202 - 1.1.en.srt" \
  "data/transcripts/cleaned/a-plus-220-1202/01-Operating Systems Overview.txt"

npm run ingest:extract -- \
  --lesson=01 \
  --title="Operating Systems Overview" \
  --cert=a-plus-220-1202 \
  --file="data/transcripts/cleaned/a-plus-220-1202/01-Operating Systems Overview.txt"

npm run ingest:duplicates -- --file="data/imports/pending/01-candidates.json"
npm run ingest:report -- --file="data/imports/pending/01-candidates.json"
```

Success criteria:

- No junk candidates like `Although`, `Because`, or `Here`.
- No certification-prefixed concept IDs.
- Candidate IDs use reusable shapes like `mobile.android` and `operating-systems.kernel`.
- Evidence is retained in pending/import files, not public Knowledge Objects.
- Every candidate remains reviewable before merge.

## Next milestone

The next major ingestion milestone should add a formal evidence builder:

```text
cleaned transcript -> data/imports/evidence/<lesson>-evidence.json
```

Then candidate generation should consume evidence records instead of reading transcript text directly.
