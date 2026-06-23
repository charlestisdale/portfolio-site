# IT Learning Platform Starter

This project is organized as a reusable learning platform instead of a single quiz app.

## Core rule
The `engine/` folder must not contain certification-specific content. All certification-specific data belongs in `content/`.

## Workflow
1. Add raw `.srt` files to `data/transcripts/raw/`.
2. Clean transcripts into `data/transcripts/cleaned/`.
3. Extract or merge concepts into `content/knowledge/`.
4. Review knowledge objects for duplicates and relationships.
5. Generate assessments later from knowledge objects.

## Current phase
Knowledge ingestion only. Do not generate questions yet.
