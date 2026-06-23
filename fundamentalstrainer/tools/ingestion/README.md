# Transcript Ingestion Tools

## 1. Add raw transcript
Put `.srt` files here:

```text
data/transcripts/raw/a-plus-220-1202/
```

Use this naming style:

```text
16-lesson-title.srt
```

## 2. Clean the transcript

```bash
node tools/ingestion/clean-srt.mjs \
  data/transcripts/raw/a-plus-220-1202/16-lesson-title.srt \
  data/transcripts/cleaned/a-plus-220-1202/16-lesson-title.txt
```

## 3. Create an import record

```bash
node tools/ingestion/create-import-record.mjs a-plus-220-1202 16 "Lesson Title"
```

## 4. Extract concepts manually first
For now, read the cleaned transcript and update the import record:

- `conceptsFound`
- `newKnowledgeObjects`
- `updatedKnowledgeObjects`
- `possibleDuplicates`
- `needsReview`

## 5. Merge into knowledge objects
Create or update files under:

```text
content/knowledge/
```

Do not create quiz questions during ingestion.
