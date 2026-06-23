# Fundamentalstrainer Project Context

## Project Location

- Repository: `charlestisdale/portfolio-site`
- Project folder: `fundamentalstrainer/`
- Default branch: `main`

## Project Identity

This folder contains the IT Learning Platform project, currently named `fundamentalstrainer` in the repository path.

The project is not intended to be a simple quiz app. It is a knowledge-first IT learning platform with a reusable learning engine and certification-specific content packs.

## Core Architecture

The platform should keep the learning engine separate from certification-specific content.

- `engine/` contains reusable platform logic.
- `content/` contains certification-specific data.
- `tools/` should contain import, validation, and maintenance scripts.
- `docs/` should contain architecture and workflow documentation.

The UI should use the Knowledge Engine API instead of reading raw content JSON directly.

## Current Confirmed Entry Points

- `fundamentalstrainer/index.html`
- `fundamentalstrainer/app.js`
- `fundamentalstrainer/engine/knowledge/index.js`
- `fundamentalstrainer/engine/knowledge/knowledge-engine.js`
- `fundamentalstrainer/content/certifications/a-plus-220-1202.json`
- `fundamentalstrainer/content/indexes/knowledge-index.json`

## Current Content Source

Initial knowledge source:

- Professor Messer CompTIA A+ Core 2 220-1202 transcripts

Current ingestion target:

- Continue expanding A+ Core 2 knowledge objects before generating assessments.

## Design Rule

Knowledge objects are the source of truth. Assessments, flashcards, PBQs, study guides, search, analytics, and AI tutoring should be generated from knowledge objects whenever possible.
