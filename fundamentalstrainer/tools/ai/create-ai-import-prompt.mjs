#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { findRawTranscriptByLesson, lessonInfo, parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";
const lessonId = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const maxTranscriptChars = args["max-transcript-chars"] ? Number.parseInt(args["max-transcript-chars"], 10) : 28000;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function resolveCleanedTranscript() {
  if (args.file) return path.resolve(root, args.file);

  if (!lessonId) return null;
  const cleanedDir = path.resolve(root, args.cleaned || `data/transcripts/cleaned/${certificationId}`);
  if (!fs.existsSync(cleanedDir)) return null;

  const matches = fs.readdirSync(cleanedDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .filter(entry => lessonInfo(entry.name).lessonId === lessonId)
    .map(entry => path.join(cleanedDir, entry.name))
    .sort();

  if (matches.length > 1) fail(`Multiple cleaned transcripts matched lesson ${lessonId}: ${matches.map(file => toProjectPath(file, root)).join(", ")}`);
  return matches[0] || null;
}

function resolveRawTranscriptFallback() {
  if (!lessonId) return null;
  return findRawTranscriptByLesson({ root, certificationId, lessonId, rawDir: args.raw || `data/transcripts/raw/${certificationId}` });
}

function cleanText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function trimText(text, maxChars) {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars).trimEnd()}\n\n[Transcript trimmed at ${maxChars.toLocaleString()} characters for prompt size.]`;
}

const transcriptFile = resolveCleanedTranscript() || resolveRawTranscriptFallback();
if (!transcriptFile || !fs.existsSync(transcriptFile)) {
  fail("Transcript not found. Run npm run ingest:transcript -- --lesson=<lesson> first, or pass --file=<cleaned-transcript-path>.");
}

const inferred = lessonInfo(transcriptFile);
const resolvedLessonId = lessonId || inferred.lessonId;
const lessonTitle = args.title || inferred.title;
const transcriptText = trimText(fs.readFileSync(transcriptFile, "utf8"), maxTranscriptChars);
const outputDir = path.resolve(root, "data", "ai-imports", "prompts");
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${resolvedLessonId}-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-ai-import-prompt.md`);

const prompt = `# AI Transcript Import

You are converting an instructional IT lesson transcript into reviewable Knowledge Object candidates for a knowledge-first learning platform.

This is not a quiz generator. The goal is to identify durable concepts, evidence, and relationships that can later power study paths, flashcards, PBQs, assessments, tutoring, recommendations, and analytics.

## Source Metadata
- certificationId: ${certificationId}
- lessonId: ${resolvedLessonId}
- lessonTitle: ${lessonTitle}
- sourceTranscript: ${toProjectPath(transcriptFile, root)}

## Required Pipeline
Transcript
  ↓
AI identifies concepts
  ↓
AI identifies relationships
  ↓
AI identifies evidence
  ↓
Candidate Knowledge Objects

## Critical Rules
- Return JSON only. No markdown around the JSON.
- Do not invent facts that are not supported by the transcript.
- Every candidate must include evidence from the transcript.
- Prefer reusable Knowledge Objects over certification-only facts.
- Avoid making one object for every sentence. Create objects only for concepts worth teaching or testing.
- Prefer stable IDs like "windows.task-manager", "networking.dhcp", "security.firewall".
- If a concept is only mentioned in passing and not taught, put it in rejectedConcepts.
- Relationships must be supported by transcript evidence or obvious learning structure.
- Keep explanations concise and learner-focused.
- Mark uncertainty explicitly with confidence below 0.7.

## Required JSON Shape
{
  "schemaVersion": "ai-transcript-import.v1",
  "certificationId": "${certificationId}",
  "lessonId": "${resolvedLessonId}",
  "lessonTitle": "${lessonTitle}",
  "sourceTranscript": "${toProjectPath(transcriptFile, root)}",
  "concepts": [
    {
      "candidateId": "AI-CAND-001",
      "title": "Human readable concept title",
      "proposedKnowledgeId": "domain.stable-slug",
      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system | hardware | troubleshooting-step",
      "domains": ["domain"],
      "aliases": ["optional alias"],
      "confidence": 0.0,
      "summaryDraft": "One or two sentence learning summary.",
      "explanationDraft": "Short explanation of what the learner should understand.",
      "factsDraft": [
        {
          "text": "Supported fact from the lesson.",
          "importance": "exam-critical | high | medium | low",
          "tags": ["tag"]
        }
      ],
      "examplesDraft": [
        {
          "text": "Concrete example if supported.",
          "context": "When this matters.",
          "tags": ["tag"]
        }
      ],
      "examTipsDraft": [
        {
          "text": "Exam-useful lesson if supported.",
          "difficulty": "easy | medium | hard",
          "tags": ["tag"]
        }
      ],
      "commonMistakesDraft": [
        {
          "text": "Common learner mistake if supported.",
          "difficulty": "easy | medium | hard",
          "tags": ["tag"]
        }
      ],
      "scenariosDraft": [
        {
          "situation": "Scenario if supported.",
          "expectedAction": "Correct action or answer.",
          "difficulty": "easy | medium | hard",
          "tags": ["tag"]
        }
      ],
      "pbqIdeasDraft": [
        {
          "task": "Possible hands-on task if appropriate.",
          "skillsTested": ["skill"],
          "difficulty": "easy | medium | hard",
          "assetsNeeded": []
        }
      ],
      "evidence": [
        {
          "evidenceId": "AI-EVID-001",
          "quote": "Short quote or close transcript excerpt.",
          "reason": "Why this supports the candidate.",
          "evidenceType": "definition | example | comparison | relationship | procedure | exam-note | mention"
        }
      ],
      "suggestedRelationships": [
        {
          "id": "other.knowledge-id",
          "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
          "reason": "Why these concepts are related.",
          "evidence": "Transcript support for the relationship."
        }
      ],
      "reviewDecision": "undecided",
      "reviewNotes": ""
    }
  ],
  "relationships": [
    {
      "source": "domain.source-id",
      "target": "domain.target-id",
      "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
      "reason": "Relationship reason.",
      "evidence": "Transcript support."
    }
  ],
  "rejectedConcepts": [
    {
      "title": "Mentioned but not imported",
      "reason": "Why this should not become a Knowledge Object."
    }
  ],
  "importNotes": ["Any uncertainty or cleanup warnings."]
}

## Transcript
${transcriptText}
`;

fs.writeFileSync(outputFile, prompt, "utf8");
console.log(JSON.stringify({
  output: toProjectPath(outputFile, root),
  lessonId: resolvedLessonId,
  lessonTitle,
  sourceTranscript: toProjectPath(transcriptFile, root),
  transcriptChars: transcriptText.length,
  next: [
    "Paste this prompt into your AI tool and save the JSON response under data/ai-imports/responses/.",
    "Then run npm run ai:import:normalize -- --file=data/ai-imports/responses/<response>.json."
  ]
}, null, 2));
