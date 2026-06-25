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
const outputFile = path.join(outputDir, `${resolvedLessonId}-${lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-ai-import-prompt.md`);

const prompt = `# AI Transcript-Triggered Rich Knowledge Import

You are converting instructional IT source text into reviewable, learner-ready Knowledge Object candidates for a knowledge-first learning platform.

This is not a quiz generator, not a transcript summarizer, and not a starter schema. The source text is a topic trigger: it tells you which concepts matter in this lesson. Your job is to build rich draft knowledge for those concepts so they can later power Learn mode, flashcards, PBQs, assessments, tutoring, recommendations, analytics, and the Knowledge Graph.

## Source Metadata
- certificationId: ${certificationId}
- lessonId: ${resolvedLessonId}
- lessonTitle: ${lessonTitle}
- sourceTranscript: ${toProjectPath(transcriptFile, root)}
- transcriptInputMode: ${transcriptInputMode}

## Required Pipeline
Source text
  ↓
AI discovers technical topics mentioned or taught
  ↓
AI classifies each topic as teachable, merge-existing, mentioned-only, ignore, or needs-enrichment
  ↓
AI enriches teachable topics with general IT knowledge when the source text is incomplete
  ↓
AI clearly separates source evidence from enriched learning content
  ↓
AI returns a rich review package, not a bare starter import
  ↓
Reviewable Knowledge Object candidates

## Critical Rules
- Return JSON only. No markdown around the JSON.
- Do not return a starter import, sample schema, representative subset, outline, or bare list of concepts.
- Do not merely repeat weak source wording. If a topic is worth importing, explain what a learner needs to know about it.
- Use the source text to decide which topics are relevant, but do not limit useful learning facts to source wording.
- Separate source-supported facts from AI-enriched facts.
- Mark AI-enriched facts as requiring human review.
- Every candidate must include at least one transcriptEvidence entry showing why the topic was triggered by this source.
- Every fact, example, exam tip, common mistake, scenario, PBQ idea, and relationship should include evidenceIds when source evidence exists.
- A source quote can prove that a topic was mentioned; it does not need to prove every enriched fact.
- Prefer reusable Knowledge Objects over certification-only facts.
- Avoid one object per sentence. Create objects only for concepts worth teaching, testing, linking, or reviewing.
- Prefer stable IDs like "windows.task-manager", "networking.dhcp", "security.firewall", "filesystems.ext4".
- If a concept is mentioned but not worth a Knowledge Object yet, put it in rejectedConcepts with classification "mentioned-only".
- Relationships may use general IT knowledge, but mark whether they are transcript-supported or AI-enriched.
- Keep explanations learner-focused, not transcript-focused.
- Mark uncertainty explicitly with confidence below 0.7.

## Richness Requirements
For a normal lesson, return 25–40 Knowledge Object candidates. If the lesson genuinely contains fewer than 25 useful concepts, explain why in importNotes and still make the candidates rich.

Each teachable or merge-existing candidate should include:
- summaryDraft: 2–3 useful sentences.
- explanationDraft: 1–3 short paragraphs that teach the concept.
- factsDraft: at least 4 atomic facts.
- transcriptEvidence: at least 1 evidence item, preferably 2–4 when the source supports it.
- suggestedRelationships: at least 2 useful relationships when applicable.
- examTipsDraft: at least 1 item when the concept is exam-relevant.
- commonMistakesDraft: at least 1 item when learners commonly confuse it with another concept.
- examplesDraft or scenariosDraft when the concept benefits from an example.
- pbqIdeasDraft when the concept can support hands-on, matching, ordering, configuration, troubleshooting, or identification tasks.

The top-level relationships array should include meaningful cross-candidate graph edges such as prerequisite_of, depends_on, related_to, contrasts_with, part_of, and used_for.

A candidate with zero facts is incomplete. A candidate with only one sentence of summary and no facts is incomplete. A candidate that simply repeats the transcript is incomplete.

## Minimum Knowledge Threshold
Do not promote a topic into concepts unless the candidate teaches something useful. A valid candidate should include at least two of these: definition, purpose, how it is used, comparison, exam relevance, procedure, example, common mistake, relationship to another taught concept.

If the source only says something like "Another popular file system is ext4", do not return that sentence as the summary. Either enrich it into a useful file-system Knowledge Object or reject it as mentioned-only if it is not relevant enough for this lesson.

## Required JSON Shape
{
  "schemaVersion": "ai-transcript-import.v3",
  "certificationId": "${certificationId}",
  "lessonId": "${resolvedLessonId}",
  "lessonTitle": "${lessonTitle}",
  "sourceTranscript": "${toProjectPath(transcriptFile, root)}",
  "transcriptInputMode": "${transcriptInputMode}",
  "importQuality": {
    "isStarterImport": false,
    "candidateTarget": "25-40 for normal lessons",
    "richnessNotes": "Explain any unavoidable shortage or uncertainty."
  },
  "concepts": [
    {
      "candidateId": "AI-CAND-001",
      "title": "Human readable concept title",
      "proposedKnowledgeId": "domain.stable-slug",
      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system | hardware | troubleshooting-step",
      "domains": ["domain"],
      "aliases": ["optional alias"],
      "classification": "teachable | merge-existing | mentioned-only | ignore | needs-enrichment",
      "confidence": 0.0,
      "difficulty": "foundational | intermediate | advanced",
      "importance": "exam-critical | high | medium | low",
      "summaryDraft": "Learner-ready summary. Do not merely repeat the transcript.",
      "explanationDraft": "Complete explanation of what the learner should understand.",
      "transcriptEvidence": [
        {
          "evidenceId": "AI-EVID-001",
          "quote": "Short source quote or close excerpt that triggered this topic.",
          "reason": "Why this quote makes the topic relevant.",
          "evidenceType": "definition | example | comparison | relationship | procedure | exam-note | mention",
          "supports": "topic-trigger | fact | relationship"
        }
      ],
      "factsDraft": [
        {
          "text": "Useful learner fact. This may be enriched beyond the source text.",
          "importance": "exam-critical | high | medium | low",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "tags": ["tag"]
        }
      ],
      "examplesDraft": [
        {
          "text": "Concrete example when useful.",
          "context": "When this matters.",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "tags": ["tag"]
        }
      ],
      "examTipsDraft": [
        {
          "text": "Exam-useful lesson.",
          "difficulty": "easy | medium | hard",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "tags": ["tag"]
        }
      ],
      "commonMistakesDraft": [
        {
          "text": "Common learner mistake.",
          "difficulty": "easy | medium | hard",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "tags": ["tag"]
        }
      ],
      "scenariosDraft": [
        {
          "situation": "Scenario if useful.",
          "expectedAction": "Correct action or answer.",
          "difficulty": "easy | medium | hard",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "tags": ["tag"]
        }
      ],
      "pbqIdeasDraft": [
        {
          "task": "Possible hands-on task if appropriate.",
          "skillsTested": ["skill"],
          "difficulty": "easy | medium | hard",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"],
          "assetsNeeded": []
        }
      ],
      "suggestedRelationships": [
        {
          "id": "other.knowledge-id",
          "type": "related_to | depends_on | prerequisite_of | contrasts_with | part_of | used_for",
          "reason": "Why these concepts are related.",
          "basis": "transcript-supported | ai-enriched",
          "requiresReview": true,
          "evidenceIds": ["AI-EVID-001"]
        }
      ],
      "sourceQuality": {
        "transcriptSupport": "strong | medium | weak",
        "aiEnrichmentUsed": true,
        "enrichmentReason": "Why enrichment was needed.",
        "minimumKnowledgeThresholdMet": true,
        "richnessLevel": "rich | acceptable | thin | incomplete"
      },
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
      "basis": "transcript-supported | ai-enriched",
      "requiresReview": true,
      "evidenceIds": ["AI-EVID-001"]
    }
  ],
  "rejectedConcepts": [
    {
      "title": "Mentioned but not imported",
      "classification": "mentioned-only | too-vague | duplicate | out-of-scope | not-technical",
      "reason": "Why this should not become a Knowledge Object.",
      "transcriptEvidence": "Optional short quote or phrase that triggered rejection."
    }
  ],
  "importNotes": ["Any uncertainty, shortage, source limitation, duplicate concern, or enrichment warning."]
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
  next: [
    "Paste this prompt into your AI tool and save the JSON response under data/ai-imports/responses/.",
    "Then run npm run ai:import:normalize -- --file=data/ai-imports/responses/<response>.json."
  ]
}, null, 2));
