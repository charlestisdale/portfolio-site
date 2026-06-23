# Knowledge Engine

The Knowledge Engine is the internal API used by the platform UI and future study modes. UI code should not fetch knowledge object JSON directly. It should call this module so the storage layer can later move from static JSON to IndexedDB, SQLite, PostgreSQL, or a hosted API without rewriting every feature.

## Location

```text
engine/knowledge/
  content-source.js
  graph.js
  knowledge-engine.js
  resolver.js
  search.js
  index.js
```

## Core API

```js
import { KnowledgeEngine } from "./engine/knowledge/index.js";

const knowledge = new KnowledgeEngine();
await knowledge.loadCertification("a-plus-220-1202");

knowledge.get("commands.ipconfig");
knowledge.search("dns troubleshooting");
knowledge.related("commands.ipconfig");
knowledge.objective("a-plus-220-1202.1.5");
knowledge.lesson("11");
knowledge.certification("a-plus-220-1202");
knowledge.commands();
knowledge.scenarios();
knowledge.examTips();
knowledge.pbqIdeas();
knowledge.statistics();
knowledge.graph();
```

## Design Rules

- The UI talks to the Knowledge Engine, not raw JSON files.
- Content remains certification-specific; engine code remains certification-neutral.
- Relationship graph edges are first-class records.
- Missing graph targets are allowed during early ingestion, but reported by `knowledge.statistics().missingRelationshipTargets`.
- Assessment generation should consume `assessmentSeeds` through this engine instead of duplicating concept content.

## Why This Matters

The same API can power:

- Learn mode
- Search
- Flashcards
- PBQs
- Exam mode
- Weak area review
- Analytics
- AI tutor context
- Knowledge graph explorer
