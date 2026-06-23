const COMMAND_PATTERN = /\b(?:ipconfig|ping|tracert|nslookup|netstat|sfc|chkdsk|gpupdate|gpresult|shutdown|tasklist|taskkill|diskpart|format|robocopy|xcopy|copy|net\s+use|net\s+user)\b(?:\s+[-\/\w:.]+)*/gi;
const WINDOWS_TOOL_PATTERN = /\b(?:Task Manager|Event Viewer|Services|Computer Management|Device Manager|Disk Management|Control Panel|Settings|Windows Defender Firewall|Registry Editor|System Configuration|Performance Monitor|Resource Monitor|MMC|Microsoft Management Console)\b/g;

/**
 * Extract candidate knowledge objects from cleaned transcript segments.
 * This is intentionally conservative. It creates review candidates, not approved
 * knowledge objects. Human review remains the gate before content reaches the KB.
 */
export function extractCandidateConcepts(cleanedTranscript, options = {}) {
  const {
    certificationId = "a-plus-220-1202",
    examCode = "220-1202",
    idStyle = "dot",
    domainHints = []
  } = options;

  const candidatesByKey = new Map();

  for (const segment of cleanedTranscript.segments || []) {
    const terms = extractTerms(segment.text);
    const commands = extractCommands(segment.text);

    for (const term of [...terms, ...commands.map(command => command.command)]) {
      const title = titleCaseCommandAware(term);
      const key = normalizeKey(title);
      const existing = candidatesByKey.get(key) || createCandidate({
        title,
        term,
        cleanedTranscript,
        certificationId,
        examCode,
        idStyle,
        domainHints
      });

      existing.evidence.push({
        startTime: segment.startTime,
        endTime: segment.endTime,
        captionSequences: segment.captionSequences,
        text: segment.text
      });

      for (const command of commands) {
        if (normalizeKey(command.command) === key) {
          existing.learning.commands.push(command);
        }
      }

      candidatesByKey.set(key, existing);
    }
  }

  return [...candidatesByKey.values()]
    .map(candidate => normalizeCandidate(candidate))
    .sort((a, b) => b.evidence.length - a.evidence.length || a.title.localeCompare(b.title));
}

function createCandidate({ title, term, cleanedTranscript, certificationId, examCode, idStyle, domainHints }) {
  const slug = slugify(title);
  return {
    candidateId: `candidate.${cleanedTranscript.lessonId || "unknown"}.${slug}`,
    proposedKnowledgeId: buildKnowledgeId({ title, idStyle, domainHints }),
    slug,
    title,
    aliases: unique([term, title]).filter(value => value !== title),
    type: inferType(title),
    status: "import-review",
    domains: inferDomains(title, domainHints),
    difficulty: "foundational",
    importance: "needs-review",
    certificationMappings: [
      {
        certification: certificationId,
        examCode,
        objectives: [],
        lessons: [
          {
            lessonId: cleanedTranscript.lessonId,
            title: cleanedTranscript.lessonTitle,
            order: Number(cleanedTranscript.lessonId) || null
          }
        ].filter(lesson => lesson.lessonId || lesson.title)
      }
    ],
    learning: {
      summary: `Candidate concept extracted from ${cleanedTranscript.lessonTitle || cleanedTranscript.sourceFile || "transcript"}.`,
      explanation: "Needs human review and expansion before approval.",
      facts: [],
      commands: [],
      examples: [],
      tables: [],
      media: [],
      notes: []
    },
    assessmentSeeds: {
      examTips: [],
      commonMistakes: [],
      scenarios: [],
      pbqIdeas: [],
      questionTargets: []
    },
    relationships: {
      prerequisites: [],
      parents: [],
      children: [],
      related: [],
      contrastsWith: [],
      replacedBy: []
    },
    sources: {
      transcripts: [
        {
          lessonId: cleanedTranscript.lessonId,
          lessonTitle: cleanedTranscript.lessonTitle,
          sourceFile: cleanedTranscript.sourceFile,
          startTime: null,
          endTime: null,
          quote: "",
          notes: "Generated as import-review candidate."
        }
      ],
      videos: [],
      references: []
    },
    quality: {
      createdAt: todayIsoDate(),
      updatedAt: todayIsoDate(),
      lastReviewedAt: null,
      reviewedBy: null,
      confidence: "low",
      needsHumanReview: true,
      reviewNotes: [
        "Auto-extracted candidate. Verify title, ID, objectives, facts, and relationships before approving."
      ]
    },
    evidence: []
  };
}

function normalizeCandidate(candidate) {
  candidate.learning.commands = uniqueBy(candidate.learning.commands, command => command.command.toLowerCase());
  const strongestEvidence = candidate.evidence.slice(0, 3);
  candidate.learning.facts = strongestEvidence.map(item => ({
    text: summarizeEvidence(item.text, candidate.title),
    importance: "needs-review",
    tags: ["transcript-evidence"]
  }));

  const first = candidate.evidence[0];
  if (candidate.sources.transcripts[0] && first) {
    candidate.sources.transcripts[0].startTime = first.startTime;
    candidate.sources.transcripts[0].endTime = first.endTime;
    candidate.sources.transcripts[0].quote = first.text.slice(0, 240);
  }

  return candidate;
}

function extractTerms(text) {
  const terms = [];
  for (const match of text.matchAll(WINDOWS_TOOL_PATTERN)) terms.push(match[0]);
  return unique(terms);
}

function extractCommands(text) {
  const matches = [];
  for (const match of text.matchAll(COMMAND_PATTERN)) {
    matches.push({
      command: match[0].trim(),
      purpose: "Command mentioned in transcript; purpose needs review.",
      syntaxNotes: "Verify exact syntax before approval.",
      tags: ["transcript-command"]
    });
  }
  return uniqueBy(matches, command => command.command.toLowerCase());
}

function buildKnowledgeId({ title, idStyle, domainHints }) {
  const slug = slugify(title);
  if (idStyle === "meaningful") {
    const prefix = domainHints.includes("commands") || isCommandTitle(title) ? "APLUS-1202-CMD" : "APLUS-1202-CONCEPT";
    return `${prefix}-${slug.replace(/-/g, "-").toUpperCase()}`;
  }
  const namespace = domainHints.includes("commands") || isCommandTitle(title) ? "commands" : "windows";
  return `${namespace}.${slug}`;
}

function inferType(title) {
  if (isCommandTitle(title)) return "command";
  if (/manager|viewer|services|control panel|settings|firewall|console|monitor/i.test(title)) return "tool";
  return "concept";
}

function inferDomains(title, hints) {
  const domains = new Set(hints);
  if (/ipconfig|ping|tracert|nslookup|netstat/i.test(title)) domains.add("networking");
  if (/task manager|event viewer|services|control panel|settings|firewall|mmc|monitor/i.test(title)) domains.add("windows");
  if (!domains.size) domains.add("needs-classification");
  return [...domains];
}

function summarizeEvidence(text, title) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.toLowerCase().includes(title.toLowerCase())
    ? clean.slice(0, 220)
    : `${title} is mentioned in this transcript segment: ${clean.slice(0, 180)}`;
}

function isCommandTitle(title) {
  return /^(?:ipconfig|ping|tracert|nslookup|netstat|sfc|chkdsk|gpupdate|gpresult|shutdown|tasklist|taskkill|diskpart|format|robocopy|xcopy|copy|net\s+use|net\s+user)/i.test(title);
}

function titleCaseCommandAware(value) {
  if (isCommandTitle(value)) return value.trim().replace(/\s+/g, " ");
  return value.trim();
}

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function slugify(value) {
  return normalizeKey(value).replace(/\s+/g, "-");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueBy(values, getKey) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const key = getKey(value);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
