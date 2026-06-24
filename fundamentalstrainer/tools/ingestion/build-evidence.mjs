#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, ...rest] = arg.replace(/^--/, "").split("=");
  return [key, rest.join("=") || true];
}));

const certificationId = args.cert || args.certification || "a-plus-220-1202";
const lessonId = args.lesson;
const lessonTitle = args.title || "Imported transcript lesson";
const inputFile = args.file;

if (!lessonId || !inputFile) {
  console.error("Usage: node tools/ingestion/build-evidence.mjs --lesson=01 --title=\"Lesson Title\" --file=data/transcripts/cleaned/01-title.txt [--cert=a-plus-220-1202]");
  process.exit(1);
}

const root = process.cwd();
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) {
  console.error(`Cleaned transcript not found: ${inputFile}`);
  process.exit(1);
}

const conceptCatalog = [
  { title: "Operating System", id: "operating-systems.operating-system", aliases: ["OS", "operating systems"] },
  { title: "Kernel", id: "operating-systems.kernel", aliases: ["OS kernel"] },
  { title: "Application Compatibility", id: "operating-systems.application-compatibility", aliases: ["app compatibility", "software compatibility"] },
  { title: "Open Source Software", id: "software.open-source-software", aliases: ["open-source", "open source"] },
  { title: "App Store", id: "software.app-store", aliases: ["Apple App Store"] },
  { title: "Google Play Store", id: "software.google-play-store", aliases: ["Play Store"] },
  { title: "Software Development Kit", id: "software.software-development-kit", aliases: ["SDK", "software developers kit", "software developer kit"] },
  { title: "Windows", id: "windows.windows", aliases: ["Microsoft Windows"] },
  { title: "Linux", id: "linux.linux", aliases: [] },
  { title: "macOS", id: "macos.macos", aliases: ["Mac OS", "MacOS", "Mac"] },
  { title: "iOS", id: "mobile.ios", aliases: ["Apple iOS", "iPhone OS"] },
  { title: "iPadOS", id: "mobile.ipados", aliases: ["iPad OS"] },
  { title: "Android", id: "mobile.android", aliases: ["Google Android"] },
  { title: "ChromeOS", id: "linux.chromeos", aliases: ["Chrome OS"] },
  { title: "Task Manager", id: "windows.task-manager", aliases: ["Windows Task Manager"] },
  { title: "Event Viewer", id: "windows.event-viewer", aliases: [] },
  { title: "Control Panel", id: "windows.control-panel", aliases: [] },
  { title: "Windows Firewall", id: "windows.windows-firewall", aliases: ["Windows Defender Firewall"] },
  { title: "Device Manager", id: "windows.device-manager", aliases: [] },
  { title: "Disk Management", id: "windows.disk-management", aliases: [] },
  { title: "Services", id: "windows.services", aliases: ["services.msc"] },
  { title: "Registry Editor", id: "windows.registry-editor", aliases: ["regedit"] },
  { title: "Command Prompt", id: "commands.command-prompt", aliases: ["cmd"] },
  { title: "PowerShell", id: "commands.powershell", aliases: [] },
  { title: "Terminal", id: "commands.terminal", aliases: [] },
  { title: "ipconfig", id: "commands.ipconfig", aliases: ["ipconfig.exe"] },
  { title: "ping", id: "commands.ping", aliases: [] },
  { title: "tracert", id: "commands.tracert", aliases: ["traceroute"] },
  { title: "nslookup", id: "commands.nslookup", aliases: [] },
  { title: "netstat", id: "commands.netstat", aliases: [] },
  { title: "DNS", id: "networking.dns", aliases: ["Domain Name System"] },
  { title: "DHCP", id: "networking.dhcp", aliases: ["Dynamic Host Configuration Protocol"] },
  { title: "IP Address", id: "networking.ip-address", aliases: ["IPv4 address", "IPv6 address"] },
  { title: "Default Gateway", id: "networking.default-gateway", aliases: [] },
  { title: "ARP", id: "networking.arp", aliases: ["Address Resolution Protocol"] },
  { title: "TCP/IP", id: "networking.tcp-ip", aliases: [] },
  { title: "NTFS", id: "windows.ntfs", aliases: [] },
  { title: "APFS", id: "macos.apfs", aliases: [] },
  { title: "ext4", id: "linux.ext4", aliases: [] },
  { title: "BitLocker", id: "security.bitlocker", aliases: [] }
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeSnippet(text, max = 500) {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1).trimEnd() + "…" : cleaned;
}

function classifyEvidence(text) {
  const lower = text.toLowerCase();
  const labels = [];
  if (/\b(is|are|refers to|known as|defined as)\b/.test(lower)) labels.push("definition");
  if (/\b(based on|built on|uses|runs on|depends on)\b/.test(lower)) labels.push("relationship");
  if (/\b(unlike|different from|compared to|instead of|whereas)\b/.test(lower)) labels.push("comparison");
  if (/\b(for example|such as|you can|allows|used to|use this|use it)\b/.test(lower)) labels.push("example");
  if (/\b(need to|must|should|exam|important|remember)\b/.test(lower)) labels.push("exam-note");
  return labels.length ? labels : ["mention"];
}

function cleanScore(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return 0;
  const bigrams = new Map();
  for (let i = 0; i < words.length - 1; i++) {
    const key = `${words[i].toLowerCase()} ${words[i + 1].toLowerCase()}`;
    bigrams.set(key, (bigrams.get(key) || 0) + 1);
  }
  const repeatedBigrams = [...bigrams.values()].filter(count => count > 1).length;
  const penalty = Math.min(0.7, repeatedBigrams / Math.max(1, words.length / 6));
  return Number(Math.max(0.1, 1 - penalty).toFixed(2));
}

function findMatches(text) {
  const matches = [];
  for (const concept of conceptCatalog) {
    const terms = [concept.title, ...(concept.aliases || [])]
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const term of terms) {
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i");
      if (pattern.test(text)) {
        matches.push({ id: concept.id, title: concept.title, matchedTerm: term });
        break;
      }
    }
  }
  return matches;
}

const rawText = fs.readFileSync(sourcePath, "utf8");
const paragraphs = rawText
  .split(/\n{2,}/)
  .map((text, index) => ({ paragraph: index + 1, text: text.replace(/\s+/g, " ").trim() }))
  .filter(item => item.text);

const evidence = [];
for (const paragraph of paragraphs) {
  const matches = findMatches(paragraph.text);
  if (!matches.length) continue;

  for (const match of matches) {
    evidence.push({
      evidenceId: `EVID-${String(evidence.length + 1).padStart(4, "0")}`,
      conceptId: match.id,
      conceptTitle: match.title,
      matchedTerm: match.matchedTerm,
      certificationId,
      lessonId: String(lessonId).padStart(2, "0"),
      lessonTitle,
      sourceTranscript: inputFile,
      location: {
        paragraph: paragraph.paragraph
      },
      evidenceTypes: classifyEvidence(paragraph.text),
      text: safeSnippet(paragraph.text),
      quality: {
        cleanScore: cleanScore(paragraph.text),
        needsCleanup: cleanScore(paragraph.text) < 0.8,
        needsHumanReview: true
      }
    });
  }
}

const groups = Object.values(evidence.reduce((acc, item) => {
  acc[item.conceptId] ||= {
    conceptId: item.conceptId,
    conceptTitle: item.conceptTitle,
    evidenceIds: [],
    evidenceTypes: new Set(),
    cleanScores: []
  };
  acc[item.conceptId].evidenceIds.push(item.evidenceId);
  item.evidenceTypes.forEach(type => acc[item.conceptId].evidenceTypes.add(type));
  acc[item.conceptId].cleanScores.push(item.quality.cleanScore);
  return acc;
}, {})).map(group => ({
  ...group,
  evidenceTypes: [...group.evidenceTypes].sort(),
  evidenceCount: group.evidenceIds.length,
  averageCleanScore: Number((group.cleanScores.reduce((sum, score) => sum + score, 0) / group.cleanScores.length).toFixed(2)),
  cleanScores: undefined
}));

const output = {
  id: `EVIDENCE-${certificationId}-${String(lessonId).padStart(2, "0")}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  lessonId: String(lessonId).padStart(2, "0"),
  lessonTitle,
  sourceTranscript: inputFile,
  createdAt: new Date().toISOString(),
  metrics: {
    paragraphs: paragraphs.length,
    evidenceRecords: evidence.length,
    conceptGroups: groups.length,
    recordsNeedingCleanup: evidence.filter(item => item.quality.needsCleanup).length
  },
  groups,
  evidence
};

const outDir = path.resolve(root, "data/imports/evidence", certificationId);
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${String(lessonId).padStart(2, "0")}-evidence.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`Wrote ${evidence.length} evidence record(s) across ${groups.length} concept group(s) to ${path.relative(root, outFile)}`);
console.log(JSON.stringify(output.metrics, null, 2));
