#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { findRawTranscriptByLesson, lessonInfo, parseImportArgs, toProjectPath } from "../ingestion/import-transcript.mjs";

const args = parseImportArgs();
const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";
const lessonId = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const maxTranscriptChars = args["max-transcript-chars"] ? Number.parseInt(args["max-transcript-chars"], 10) : 32000;

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
  return String(text || "").replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function trimText(text, maxChars) {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars).trimEnd()}\n\n[Transcript trimmed at ${maxChars.toLocaleString()} characters for prompt size.]`;
}

const transcriptFile = resolveCleanedTranscript() || resolveRawTranscriptFallback();
if (!transcriptFile || !fs.existsSync(transcriptFile)) fail("Transcript not found. Run ingest:transcript first or pass --file=<cleaned-transcript-path>.");

const inferred = lessonInfo(transcriptFile);
const resolvedLessonId = lessonId || inferred.lessonId;
const lessonTitle = args.title || inferred.title;
const transcriptText = trimText(fs.readFileSync(transcriptFile, "utf8"), maxTranscriptChars);
const outputDir = path.resolve(root, "data", "ai-discovery", "prompts");
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${resolvedLessonId}-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-discovery-prompt.md`);

const prompt = `# Knowledge Discovery Task\n\nAnalyze this lesson transcript for a knowledge-first learning platform.\n\nDo discovery only. Do not write final Knowledge Objects. Do not create quizzes, PBQs, flashcards, study guides, or polished explanations.\n\nReturn JSON only.\n\nMetadata:\ncertificationId: ${certificationId}\nlessonId: ${resolvedLessonId}\nlessonTitle: ${lessonTitle}\nsourceTranscript: ${toProjectPath(transcriptFile, root)}\n\nRequired JSON keys:\nschemaVersion, certificationId, lessonId, lessonTitle, sourceTranscript, concepts, evidence, relationships, definitions, examples, comparisons, procedures, rejectedMentions, importNotes\n\nUse schemaVersion: ai-discovery.v1\n\nConcept fields:\ndiscoveryId, name, proposedKnowledgeId, type, domains, aliases, confidence, evidenceIds, notes\n\nEvidence fields:\nevidenceId, quote, type, supports, notes\n\nRelationship fields:\nrelationshipId, sourceDiscoveryId, targetDiscoveryId, type, evidenceIds, reason, confidence\n\nRules:\n- Every concept must have at least one evidenceIds entry.\n- Every relationship must have at least one evidenceIds entry.\n- Use short transcript quotes as evidence.\n- Prefer reusable technical concepts over one-off lesson wording.\n- Put terms that are only mentioned but not taught in rejectedMentions.\n- Mark uncertainty with lower confidence instead of inventing details.\n\nTranscript:\n${transcriptText}\n`;

fs.writeFileSync(outputFile, prompt, "utf8");
console.log(JSON.stringify({
  output: toProjectPath(outputFile, root),
  lessonId: resolvedLessonId,
  lessonTitle,
  sourceTranscript: toProjectPath(transcriptFile, root),
  transcriptChars: transcriptText.length,
  next: [
    "Paste this prompt into your AI tool and save the JSON response under data/ai-discovery/responses/.",
    "Then run npm run discovery:normalize -- --file=data/ai-discovery/responses/<response>.json."
  ]
}, null, 2));
