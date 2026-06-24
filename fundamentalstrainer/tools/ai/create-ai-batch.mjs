#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const root = process.cwd();
const certificationId = args.cert || args.certification || "a-plus-220-1202";
const lessonId = args.lesson ? String(args.lesson).padStart(2, "0") : null;
const maxTranscriptChars = args["max-transcript-chars"] ? Number.parseInt(args["max-transcript-chars"], 10) : 18000;
const maxEvidencePerCandidate = args["max-evidence"] ? Number.parseInt(args["max-evidence"], 10) : 5;

if (!lessonId) {
  console.error("Usage: node tools/ai/create-ai-batch.mjs --lesson=09 [--cert=a-plus-220-1202]");
  process.exit(1);
}

function toProjectPath(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function findCleanedTranscript() {
  const cleanedDir = path.resolve(root, "data", "transcripts", "cleaned", certificationId);
  if (!fs.existsSync(cleanedDir)) return null;
  const match = fs.readdirSync(cleanedDir)
    .filter(name => name.startsWith(`${lessonId}-`) && name.endsWith(".txt"))
    .sort()[0];
  return match ? path.join(cleanedDir, match) : null;
}

function trimText(text, maxChars) {
  const clean = String(text || "").trim();
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}\n\n[Transcript trimmed at ${maxChars.toLocaleString()} characters for prompt size.]`;
}

function candidateBlock(candidate) {
  const facts = (candidate.factsDraft || [])
    .map(fact => typeof fact === "string" ? fact : fact.text)
    .filter(Boolean);
  const evidence = (candidate.evidence || [])
    .slice(0, maxEvidencePerCandidate)
    .map(item => `- ${item.text || item.quote || item.excerpt || ""}`)
    .join("\n");
  const relationships = (candidate.suggestedRelationships || [])
    .map(item => `- ${item.id} | ${item.type || "related_to"} | ${item.reason || item.evidence || ""}`)
    .join("\n");
  const flags = candidate.quality?.flags?.map(flag => `${flag.code}: ${flag.message}`).join("; ") || "none";

  return `## ${candidate.title}\n- proposedKnowledgeId: ${candidate.proposedKnowledgeId}\n- type: ${candidate.type}\n- domains: ${(candidate.domains || []).join(", ")}\n- quality: ${candidate.quality?.band || "unknown"} (${candidate.quality?.score ?? "n/a"})\n- qualityFlags: ${flags}\n- currentSummary: ${candidate.summaryDraft || ""}\n\nCurrent facts:\n${facts.map(fact => `- ${fact}`).join("\n") || "- none"}\n\nEvidence snippets:\n${evidence || "- none"}\n\nSuggested relationships:\n${relationships || "- none"}`;
}

const candidatesFile = path.resolve(root, "data", "imports", "pending", `${lessonId}-candidates.json`);
if (!fs.existsSync(candidatesFile)) {
  console.error(`Candidate file not found: ${toProjectPath(candidatesFile)}. Run npm run ingest:folder first.`);
  process.exit(1);
}

const cleanedTranscriptFile = findCleanedTranscript();
if (!cleanedTranscriptFile) {
  console.error(`Cleaned transcript not found for lesson ${lessonId}. Run npm run ingest:folder first.`);
  process.exit(1);
}

const candidateData = readJson(candidatesFile);
const transcriptText = trimText(fs.readFileSync(cleanedTranscriptFile, "utf8"), maxTranscriptChars);
const candidates = [...(candidateData.candidates || [])]
  .sort((a, b) => (a.quality?.score ?? 0) - (b.quality?.score ?? 0));

const outputDir = path.resolve(root, "data", "ai-batches");
fs.mkdirSync(outputDir, { recursive: true });
const outputFile = path.join(outputDir, `${lessonId}-${(candidateData.lessonTitle || "lesson").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-ai-prompt.md`);

const prompt = `# AI Knowledge Object Batch\n\nLesson: ${candidateData.lessonTitle || `Lesson ${lessonId}`}\nLesson ID: ${lessonId}\nCertification: ${certificationId}\nSource transcript: ${toProjectPath(cleanedTranscriptFile)}\nCandidate file: ${toProjectPath(candidatesFile)}\n\n## Mission\nGenerate clean, reviewable Knowledge Object drafts from the transcript and candidate evidence. The output should be useful for an IT learning platform, not a quiz-only app.\n\n## Rules\n- Use the transcript as evidence, but do not copy messy transcript narration.\n- Prefer concise learning language.\n- Keep the concept IDs stable unless a candidate is clearly wrong.\n- Do not invent unsupported facts.\n- Avoid duplicate objects.\n- If a candidate is too broad, mark it as rejectCandidate instead of forcing content.\n- Return JSON only. No markdown around the JSON.\n\n## Required JSON Output Shape\n{\n  "lessonId": "${lessonId}",\n  "lessonTitle": "${candidateData.lessonTitle || ""}",\n  "objects": [\n    {\n      "id": "domain.slug",\n      "title": "Human readable title",\n      "type": "concept | tool | command | protocol | operating-system | service | security-control | file-system",\n      "status": "draft",\n      "domains": ["domain"],\n      "summary": "One or two sentence learning summary.",\n      "explanation": "Short explanation focused on what a learner must understand.",\n      "facts": [\n        { "text": "Exam-useful fact.", "importance": "exam-critical | high | medium | low", "tags": ["tag"] }\n      ],\n      "examples": [\n        { "text": "Concrete example.", "context": "When this matters", "tags": ["tag"] }\n      ],\n      "relationships": {\n        "related": [\n          { "id": "other.knowledge-id", "reason": "Why related", "strength": "strong | medium | weak" }\n        ],\n        "contrastsWith": [\n          { "id": "other.knowledge-id", "reason": "What differs", "strength": "strong | medium | weak" }\n        ],\n        "prerequisites": [],\n        "parents": [],\n        "children": [],\n        "replacedBy": []\n      },\n      "assessmentSeeds": {\n        "examTips": [\n          { "text": "What the exam may test.", "difficulty": "easy | medium | hard", "tags": ["tag"] }\n        ],\n        "commonMistakes": [\n          { "text": "Common learner mistake.", "difficulty": "easy | medium | hard", "tags": ["tag"] }\n        ],\n        "scenarios": [\n          { "situation": "Scenario prompt.", "expectedAction": "Correct action or answer.", "difficulty": "easy | medium | hard", "tags": ["tag"] }\n        ],\n        "pbqIdeas": [\n          { "task": "Possible PBQ task.", "skillsTested": ["skill"], "difficulty": "easy | medium | hard", "assetsNeeded": [] }\n        ]\n      },\n      "sourceCandidateIds": ["CAND-001"],\n      "sourceEvidenceNotes": ["Short note describing the transcript support."]\n    }\n  ],\n  "rejectCandidates": [\n    { "candidateId": "CAND-000", "title": "Title", "reason": "Why it should not become a Knowledge Object." }\n  ]\n}\n\n## Candidate Concepts\n${candidates.map(candidateBlock).join("\n\n")}\n\n## Cleaned Transcript\n${transcriptText}\n`;

fs.writeFileSync(outputFile, prompt, "utf8");
console.log(JSON.stringify({ output: toProjectPath(outputFile), candidates: candidates.length, transcriptChars: transcriptText.length }, null, 2));
