#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const certificationId = args.cert || args.certification || "a-plus-220-1202";
const lessonId = args.lesson;
const inputFile = args.file;
const lessonTitle = args.title || "Imported transcript lesson";

if (!lessonId || !inputFile) {
  console.error("Usage: node tools/ingestion/extract-concepts.mjs --lesson=16 --file=data/transcripts/cleaned/16-title.txt [--title=\"Lesson Title\"] [--cert=a-plus-220-1202]");
  process.exit(1);
}

const root = process.cwd();
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) {
  console.error(`Transcript not found: ${inputFile}`);
  process.exit(1);
}

const rawText = fs.readFileSync(sourcePath, "utf8");
const paragraphs = rawText
  .split(/\n{2,}/)
  .map((text, index) => ({ paragraph: index + 1, text: text.replace(/\s+/g, " ").trim() }))
  .filter(item => item.text);

const sentences = paragraphs.flatMap(paragraph => {
  const parts = paragraph.text.match(/[^.!?]+[.!?]*/g) || [paragraph.text];
  return parts
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, index) => ({ paragraph: paragraph.paragraph, sentence: index + 1, text }));
});

const conceptCatalog = [
  // Operating system overview concepts
  { title: "Operating System", id: "operating-systems.operating-system", type: "operating-system", domains: ["operating-systems"], aliases: ["OS", "operating systems"] },
  { title: "Kernel", id: "operating-systems.kernel", type: "concept", domains: ["operating-systems"], aliases: ["OS kernel"] },
  { title: "Application Compatibility", id: "operating-systems.application-compatibility", type: "concept", domains: ["operating-systems", "software"], aliases: ["app compatibility", "software compatibility"] },
  { title: "Open Source Software", id: "software.open-source-software", type: "concept", domains: ["software", "linux"], aliases: ["open-source", "open source"] },
  { title: "App Store", id: "software.app-store", type: "tool", domains: ["software", "macos", "mobile"], aliases: ["Apple App Store"] },
  { title: "Google Play Store", id: "software.google-play-store", type: "tool", domains: ["software", "mobile"], aliases: ["Play Store"] },
  { title: "Software Development Kit", id: "software.software-development-kit", type: "concept", domains: ["software"], aliases: ["SDK", "software developers kit", "software developer kit"] },

  // Operating systems
  { title: "Windows", id: "windows.windows", type: "operating-system", domains: ["windows", "operating-systems"], aliases: ["Microsoft Windows"] },
  { title: "Linux", id: "linux.linux", type: "operating-system", domains: ["linux", "operating-systems"], aliases: [] },
  { title: "macOS", id: "macos.macos", type: "operating-system", domains: ["macos", "operating-systems"], aliases: ["Mac OS", "MacOS", "Mac"] },
  { title: "iOS", id: "mobile.ios", type: "operating-system", domains: ["mobile", "operating-systems"], aliases: ["Apple iOS", "iPhone OS"] },
  { title: "iPadOS", id: "mobile.ipados", type: "operating-system", domains: ["mobile", "operating-systems"], aliases: ["iPad OS"] },
  { title: "Android", id: "mobile.android", type: "operating-system", domains: ["mobile", "operating-systems", "linux"], aliases: ["Google Android"] },
  { title: "ChromeOS", id: "linux.chromeos", type: "operating-system", domains: ["linux", "operating-systems"], aliases: ["Chrome OS"] },

  // Windows tools and commands
  { title: "Task Manager", id: "windows.task-manager", type: "tool", domains: ["windows", "software-troubleshooting"], aliases: ["Windows Task Manager"] },
  { title: "Event Viewer", id: "windows.event-viewer", type: "tool", domains: ["windows", "software-troubleshooting"], aliases: [] },
  { title: "Control Panel", id: "windows.control-panel", type: "tool", domains: ["windows"], aliases: [] },
  { title: "Windows Firewall", id: "windows.windows-firewall", type: "security-control", domains: ["windows", "security", "networking"], aliases: ["Windows Defender Firewall"] },
  { title: "Microsoft Management Console", id: "windows.microsoft-management-console", type: "tool", domains: ["windows"], aliases: ["MMC"] },
  { title: "Computer Management", id: "windows.computer-management", type: "tool", domains: ["windows"], aliases: [] },
  { title: "Device Manager", id: "windows.device-manager", type: "tool", domains: ["windows", "hardware"], aliases: [] },
  { title: "Disk Management", id: "windows.disk-management", type: "tool", domains: ["windows", "hardware"], aliases: [] },
  { title: "Services", id: "windows.services", type: "service", domains: ["windows", "software-troubleshooting"], aliases: ["services.msc"] },
  { title: "Registry Editor", id: "windows.registry-editor", type: "tool", domains: ["windows"], aliases: ["regedit"] },
  { title: "Command Prompt", id: "commands.command-prompt", type: "tool", domains: ["commands", "windows"], aliases: ["cmd"] },
  { title: "PowerShell", id: "commands.powershell", type: "tool", domains: ["commands", "windows"], aliases: [] },
  { title: "Terminal", id: "commands.terminal", type: "tool", domains: ["commands", "windows"], aliases: [] },
  { title: "ipconfig", id: "commands.ipconfig", type: "command", domains: ["commands", "windows", "networking"], aliases: ["ipconfig.exe"] },
  { title: "ping", id: "commands.ping", type: "command", domains: ["commands", "networking"], aliases: [] },
  { title: "tracert", id: "commands.tracert", type: "command", domains: ["commands", "networking"], aliases: ["traceroute"] },
  { title: "nslookup", id: "commands.nslookup", type: "command", domains: ["commands", "networking"], aliases: [] },
  { title: "netstat", id: "commands.netstat", type: "command", domains: ["commands", "networking"], aliases: [] },
  { title: "chkdsk", id: "commands.chkdsk", type: "command", domains: ["commands", "windows", "hardware"], aliases: [] },
  { title: "sfc", id: "commands.sfc", type: "command", domains: ["commands", "windows", "software-troubleshooting"], aliases: ["System File Checker"] },
  { title: "DISM", id: "commands.dism", type: "command", domains: ["commands", "windows", "software-troubleshooting"], aliases: [] },

  // Networking and security foundations
  { title: "DNS", id: "networking.dns", type: "protocol", domains: ["networking"], aliases: ["Domain Name System"] },
  { title: "DHCP", id: "networking.dhcp", type: "protocol", domains: ["networking"], aliases: ["Dynamic Host Configuration Protocol"] },
  { title: "IP Address", id: "networking.ip-address", type: "concept", domains: ["networking"], aliases: ["IPv4 address", "IPv6 address"] },
  { title: "Default Gateway", id: "networking.default-gateway", type: "concept", domains: ["networking"], aliases: [] },
  { title: "ARP", id: "networking.arp", type: "protocol", domains: ["networking"], aliases: ["Address Resolution Protocol"] },
  { title: "TCP/IP", id: "networking.tcp-ip", type: "protocol", domains: ["networking"], aliases: [] },
  { title: "NTFS", id: "windows.ntfs", type: "file-system", domains: ["windows"], aliases: [] },
  { title: "APFS", id: "macos.apfs", type: "file-system", domains: ["macos"], aliases: [] },
  { title: "ext4", id: "linux.ext4", type: "file-system", domains: ["linux"], aliases: [] },
  { title: "BitLocker", id: "security.bitlocker", type: "security-control", domains: ["security", "windows"], aliases: [] }
];

const junkTitlePattern = /^(although|another|because|before|fortunately|generally|here|most|once|one|since|some|sometimes|these|unlike)$/i;

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSnippet(text, max = 260) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1).trimEnd() + "…" : cleaned;
}

function sentenceLooksUseful(text) {
  return /\b(is|are|was|were|runs|based on|allows|provides|uses|used|develop|install|supports|designed|open-source|open source|kernel|operating system|application|app store|play store|compatib)\b/i.test(text);
}

function findConceptMentions(sentence) {
  const matches = [];
  for (const concept of conceptCatalog) {
    const terms = [concept.title, ...(concept.aliases || [])]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);

    for (const term of terms) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i");
      if (pattern.test(sentence.text)) {
        matches.push({ concept, term });
        break;
      }
    }
  }
  return matches;
}

function relationshipType(source, target, text) {
  const lower = text.toLowerCase();
  if (lower.includes("based on") || lower.includes("based off")) return "depends_on";
  if (source.id.includes("app-store") || target.id.includes("app-store") || target.id.includes("google-play-store")) return "related_to";
  if (lower.includes("unlike") || lower.includes("different")) return "contrasts_with";
  return "related_to";
}

const mentions = new Map();
const relationshipMap = new Map();

function addMention(concept, evidence, term, confidence = 0.85) {
  if (junkTitlePattern.test(concept.title)) return;
  if (!mentions.has(concept.id)) {
    mentions.set(concept.id, {
      title: concept.title,
      slug: concept.id.split(".").at(-1),
      proposedKnowledgeId: concept.id,
      type: concept.type,
      domains: concept.domains,
      aliases: concept.aliases || [],
      evidence: [],
      factTexts: new Set(),
      confidence: 0
    });
  }

  const item = mentions.get(concept.id);
  item.confidence = Math.max(item.confidence, confidence);
  if (item.evidence.length < 8) item.evidence.push({ ...evidence, matchedTerm: term });
  if (sentenceLooksUseful(evidence.text)) item.factTexts.add(safeSnippet(evidence.text));
}

for (const sentence of sentences) {
  const found = findConceptMentions(sentence);
  for (const { concept, term } of found) {
    const exactTitle = concept.title.toLowerCase() === term.toLowerCase();
    addMention(concept, sentence, term, exactTitle ? 0.9 : 0.82);
  }

  if (found.length >= 2) {
    for (const source of found) {
      for (const target of found) {
        if (source.concept.id === target.concept.id) continue;
        const key = `${source.concept.id}->${target.concept.id}`;
        if (!relationshipMap.has(key)) {
          relationshipMap.set(key, {
            source: source.concept.id,
            target: target.concept.id,
            type: relationshipType(source.concept, target.concept, sentence.text),
            evidence: safeSnippet(sentence.text, 220)
          });
        }
      }
    }
  }
}

function relationshipsFor(id) {
  return [...relationshipMap.values()]
    .filter(item => item.source === id)
    .filter(item => !item.target.startsWith(id + "."))
    .slice(0, 8)
    .map(item => ({ id: item.target, type: item.type, evidence: item.evidence }));
}

const candidates = [...mentions.values()]
  .filter(item => item.evidence.length >= 1)
  .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title))
  .map((item, index) => {
    const factTexts = [...item.factTexts].slice(0, 6);
    const evidence = item.evidence.map(e => ({
      paragraph: e.paragraph,
      sentence: e.sentence,
      matchedTerm: e.matchedTerm,
      text: e.text
    }));

    return {
      candidateId: `CAND-${String(index + 1).padStart(3, "0")}`,
      title: item.title,
      slug: item.slug,
      proposedKnowledgeId: item.proposedKnowledgeId,
      type: item.type,
      category: item.domains[0],
      domains: item.domains,
      aliases: item.aliases,
      confidence: Number(item.confidence.toFixed(2)),
      summaryDraft: factTexts[0] || `${item.title} appears in the transcript and needs human review before becoming trusted learning content.`,
      explanationDraft: factTexts.join(" "),
      factsDraft: factTexts.map(text => ({
        text,
        importance: item.confidence >= 0.85 ? "high" : "medium",
        tags: item.domains
      })),
      examplesDraft: [],
      examTipsDraft: [],
      commonMistakesDraft: [],
      scenariosDraft: [],
      pbqIdeasDraft: [],
      evidence,
      possibleDuplicates: [],
      suggestedRelationships: relationshipsFor(item.proposedKnowledgeId),
      reviewDecision: "undecided",
      reviewNotes: ""
    };
  });

const output = {
  id: `IMPORT-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  lessonId: String(lessonId).padStart(2, "0"),
  lessonTitle,
  sourceTranscript: inputFile,
  status: "pending-review",
  createdAt: new Date().toISOString(),
  metrics: {
    transcriptParagraphs: paragraphs.length,
    transcriptSentences: sentences.length,
    candidates: candidates.length,
    highConfidenceCandidates: candidates.filter(c => c.confidence >= 0.85).length,
    candidatesWithFactDrafts: candidates.filter(c => c.factsDraft.length).length,
    relationshipsSuggested: candidates.reduce((sum, candidate) => sum + candidate.suggestedRelationships.length, 0)
  },
  notes: [
    "Auto-extracted candidates from a controlled concept catalog. Review every candidate before merging into content/knowledge.",
    "This script does not create certification-specific concept IDs.",
    "Evidence belongs in private import records; public knowledge objects should keep only generic source references."
  ],
  candidates
};

const outDir = path.resolve(root, "data/imports/pending");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${String(lessonId).padStart(2, "0")}-candidates.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`Wrote ${candidates.length} candidates to ${path.relative(root, outFile)}`);
console.log(JSON.stringify(output.metrics, null, 2));
