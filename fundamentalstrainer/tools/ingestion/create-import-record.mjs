#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const [, , certification, lesson, ...titleParts] = process.argv;
const title = titleParts.join(" ").trim();

if (!certification || !lesson || !title) {
  console.error("Usage: node tools/ingestion/create-import-record.mjs <certification> <lesson> <lesson title>");
  process.exit(1);
}

const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const id = `${certification}-lesson-${lesson}-import`;
const record = {
  id,
  certification,
  lesson,
  title,
  sourceFile: `data/transcripts/raw/${certification}/${lesson}-${slug}.srt`,
  cleanedFile: `data/transcripts/cleaned/${certification}/${lesson}-${slug}.txt`,
  conceptsFound: [],
  newKnowledgeObjects: [],
  updatedKnowledgeObjects: [],
  possibleDuplicates: [],
  needsReview: [],
  notes: [],
  status: "not-started"
};

const outPath = `data/imports/${certification}/${lesson}-${slug}.import.json`;
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(record, null, 2) + "\n");
console.log(`Created ${outPath}`);
