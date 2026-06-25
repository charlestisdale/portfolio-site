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

function isSrtFile(filePath) {
  return String(filePath || "").toLowerCase().endsWith(".srt");
}

function resolveCleanedTranscript() {
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

function resolveTranscriptSource() {
  if (args.file) return path.resolve(root, args.file);
  const rawFile = lessonId ? findRawTranscriptByLesson({ root, certificationId, lessonId, rawDir: args.raw || `data/transcripts/raw/${certificationId}` }) : null;
  return rawFile || resolveCleanedTranscript();
}

function cleanText(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLine(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCueNumber(line) {
  return /^\d+$/.test(line.trim());
}

function isTimestamp(line) {
  return /^\d{2}:\d{2}:\d{2}[,.]\d{3}\s+-->\s+\d{2}:\d{2}:\d{2}[,.]\d{3}/.test(line.trim());
}

function parseLosslessSrt(raw) {
  const blocks = String(raw || "")
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .split(/\n{2,}/);

  const cues = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
    const textLines = lines
      .filter(line => !isCueNumber(line))
      .filter(line => !isTimestamp(line))
      .map(normalizeLine)
      .filter(Boolean);

    if (textLines.length) cues.push(textLines.join(" "));
  }

  return cues.join("\n").trim();
}

function transcriptTextFromFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (isSrtFile(filePath)) return parseLosslessSrt(raw);
  return cleanText(raw);
}

function trimText(text, maxChars) {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, maxChars).trimEnd()}\n\n[Transcript trimmed at ${maxChars.toLocaleString()} characters for prompt size.]`;
}

const transcriptFile = resolveTranscriptSource();
if (!transcriptFile || !fs.existsSync(transcriptFile)) {
  fail("Transcript not found. Pass --file=<transcript-path>, or use --lesson=<lesson> with a matching raw .srt or cleaned .txt transcript.");
}

const inferred = lessonInfo(transcriptFile);
const resolvedLessonId = lessonId || inferred.lessonId;
const lessonTitle = args.title || inferred.title;
const transcriptInputMode = isSrtFile(transcriptFile) ? "lossless-srt-parse" : "provided-clean-text";
const transcriptText = trimText(transcriptTextFromFile(transcriptFile), maxTranscriptChars);
const outputDir = path.resolve(root, "data", "ai-imports", "prompts");
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${resolvedLessonId}-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-transcript-intelligence-prompt.md`);

const prompt = `# AI Transcript Intelligence Import

You are analyzing instructional IT source text for a knowledge-first learning platform.

This is not a quiz generator, not a transcript summarizer, and not a Knowledge Object authoring step. The source text is evidence. Your job is to act as a curriculum analyst and produce a reviewable discovery package that explains what concepts exist, which ones deserve authoring, which should merge, which are only mentioned, which prerequisites and relationships matter, where concepts belong in the curriculum, and what gaps the lesson reveals.

## Source Metadata
- certificationId: ${certificationId}
- lessonId: ${resolvedLessonId}
- lessonTitle: ${lessonTitle}
- sourceTranscript: ${toProjectPath(transcriptFile, root)}
- transcriptInputMode: ${transcriptInputMode}

## Required Pipeline
Source text
  ↓
Identify source evidence
  ↓
Discover concepts
  ↓
Classify concepts
  ↓
Identify prerequisites and relationships
  ↓
Suggest curriculum placement
  ↓
Detect merge candidates and duplicate risks
  ↓
Detect knowledge gaps
  ↓
Return Transcript Intelligence JSON
  ↓
Review decides what goes to Knowledge Authoring

## Critical Rules
- Return JSON only. No markdown around the JSON.
- Do not return draft Knowledge Objects in this stage.
- Do not write full learner explanations, full fact lists, flashcards, or quiz questions.
- Do not create concepts merely to satisfy a target count.
- Return every concept that exceeds the minimum teaching threshold.
- Weak mentions should be included in rejectedMentions or classified as mentioned-only.
- Use stable proposed IDs like "windows.task-manager", "networking.dhcp", "security.firewall", "filesystems.ext4".
- Keep curriculum placement separate from graph relationships.
- Mark review-required items clearly.
- Split confidence into topicConfidence, evidenceStrength, enrichmentLevel, and reviewPriority.
- Use basis labels: source-supported, ai-inference, general-it-knowledge, common-practice, exam-knowledge.

## Concept Classification
Use one of:
- teachable
- merge-existing
- mentioned-only
- ignore
- needs-enrichment

## Minimum Teaching Threshold
A concept should move forward when it supports at least two of:
- definition
- purpose
- how it is used
- comparison
- exam relevance
- procedure
- example
- common mistake
- relationship to another taught concept
- curriculum relevance
- prerequisite value
- troubleshooting value

## Curriculum Placement Guidance
Use the current curriculum layer. Suggested sections/modules may include:
- sectionId: "1.0", moduleId: "operating-system-foundations"
- sectionId: "1.0", moduleId: "desktop-operating-systems"
- sectionId: "1.0", moduleId: "mobile-operating-systems"
- sectionId: "1.0", moduleId: "file-systems"
- sectionId: "1.0", moduleId: "os-maintenance-and-lifecycle"
- sectionId: "2.0", moduleId: "security-foundations"
- sectionId: "3.0", moduleId: "software-troubleshooting-foundations"
- sectionId: "4.0", moduleId: "operational-procedures-foundations"

If no existing module fits, propose a new module with proposedModuleTitle and reason. Do not force a bad fit.

## Required JSON Shape
{
  "schemaVersion": "transcript-intelligence.v1",
  "certificationId": "${certificationId}",
  "lessonId": "${resolvedLessonId}",
  "lessonTitle": "${lessonTitle}",
  "sourceTranscript": "${toProjectPath(transcriptFile, root)}",
  "transcriptInputMode": "${transcriptInputMode}",
  "analysisQuality": {
    "isStarterAnalysis": false,
    "fixedCandidateTargetUsed": false,
    "conceptCountPolicy": "Return every concept above the minimum teaching threshold. Do not invent concepts to hit a number.",
    "gapsIncluded": true,
    "mergeDetectionIncluded": true,
    "curriculumPlacementIncluded": true,
    "relationshipDiscoveryIncluded": true,
    "richnessNotes": "Explain source limitations, uncertainty, or unusual concept counts."
  },
  "conceptsDiscovered": [
    {
      "conceptId": "DISC-001",
      "title": "Human readable concept title",
      "proposedKnowledgeId": "domain.stable-slug",
      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system | hardware | troubleshooting-step",
      "domains": ["domain"],
      "aliases": ["optional alias"],
      "classification": "teachable | merge-existing | mentioned-only | ignore | needs-enrichment",
      "teachingValue": "high | medium | low",
      "topicConfidence": 0.0,
      "evidenceStrength": "strong | medium | weak",
      "enrichmentLevel": "none | low | medium | high",
      "reviewPriority": "low | normal | high",
      "sourceEvidence": [
        {
          "evidenceId": "EVID-001",
          "quote": "Short source quote or close excerpt that triggered this topic.",
          "reason": "Why this quote makes the topic relevant.",
          "evidenceType": "definition | example | comparison | relationship | procedure | exam-note | mention",
          "supports": "topic-trigger | prerequisite | relationship | curriculum-placement | gap"
        }
      ],
      "prerequisites": [
        {
          "proposedKnowledgeId": "domain.prerequisite-id",
          "reason": "Why this should be understood first.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true
        }
      ],
      "relationshipSuggestions": [
        {
          "targetKnowledgeId": "domain.related-id",
          "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
          "reason": "Why these concepts are related.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true,
          "evidenceIds": ["EVID-001"]
        }
      ],
      "curriculumPlacementSuggestions": [
        {
          "curriculumId": "${certificationId}",
          "sectionId": "1.0",
          "moduleId": "operating-system-foundations",
          "proposedModuleTitle": "Optional only when proposing a new module",
          "reason": "Why this concept belongs in this curriculum location.",
          "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
          "requiresReview": true,
          "evidenceIds": ["EVID-001"]
        }
      ],
      "mergeRecommendation": {
        "shouldMerge": false,
        "targetKnowledgeId": "existing.id-if-known",
        "reason": "Why this should merge instead of becoming a new object.",
        "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
        "requiresReview": true
      },
      "authoringGuidance": {
        "shouldAuthor": true,
        "recommendedDepth": "brief | normal | deep",
        "mustCover": ["Important points the Knowledge Author should cover later."],
        "niceToCover": ["Optional points."],
        "avoidCreatingDuplicateOf": ["existing.knowledge-id"],
        "notes": ["Authoring warnings or enrichment needs."]
      },
      "reviewNotes": ""
    }
  ],
  "mergeRecommendations": [
    {
      "sourceConceptId": "DISC-001",
      "targetKnowledgeId": "existing.knowledge-id",
      "reason": "Why these should merge.",
      "basis": "ai-inference",
      "requiresReview": true
    }
  ],
  "relationshipSuggestions": [
    {
      "sourceConceptId": "DISC-001",
      "sourceKnowledgeId": "domain.source-id",
      "targetKnowledgeId": "domain.target-id",
      "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
      "reason": "Relationship reason.",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "curriculumPlacementSuggestions": [
    {
      "conceptId": "DISC-001",
      "proposedKnowledgeId": "domain.stable-slug",
      "curriculumId": "${certificationId}",
      "sectionId": "1.0",
      "moduleId": "operating-system-foundations",
      "proposedModuleTitle": "Optional only when proposing a new module",
      "reason": "Top-level curriculum placement suggestion.",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "knowledgeGaps": [
    {
      "gapId": "GAP-001",
      "title": "Missing prerequisite or assumed knowledge",
      "description": "What the lesson assumes, skips, or mentions too weakly.",
      "relatedConceptIds": ["domain.related-id"],
      "recommendation": "Create, enrich, or link a supporting concept/module.",
      "severity": "low | medium | high",
      "basis": "source-supported | ai-inference | general-it-knowledge | common-practice | exam-knowledge",
      "requiresReview": true,
      "evidenceIds": ["EVID-001"]
    }
  ],
  "rejectedMentions": [
    {
      "title": "Mentioned but not imported",
      "classification": "mentioned-only | too-vague | duplicate | out-of-scope | not-technical",
      "reason": "Why this should not become a Knowledge Object.",
      "basis": "source-supported | ai-inference",
      "sourceEvidence": "Optional short quote or phrase that triggered rejection."
    }
  ],
  "importNotes": ["Any uncertainty, source limitation, duplicate concern, enrichment warning, or curriculum-placement warning."]
}

## Source Text
${transcriptText}
`;

fs.writeFileSync(outputFile, prompt, "utf8");
console.log(JSON.stringify({
  output: toProjectPath(outputFile, root),
  lessonId: resolvedLessonId,
  lessonTitle,
  sourceTranscript: toProjectPath(transcriptFile, root),
  transcriptInputMode,
  transcriptChars: transcriptText.length,
  schemaVersion: "transcript-intelligence.v1",
  next: [
    "Paste this prompt into your AI tool and save the JSON response under data/ai-imports/responses/.",
    "Then run npm run ai:import:normalize -- --file=data/ai-imports/responses/<response>.json."
  ]
}, null, 2));
