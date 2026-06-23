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

if (!lessonId || !inputFile) {
  console.error("Usage: node tools/ingestion/extract-concepts.mjs --lesson=16 --file=data/transcripts/cleaned/16-title.txt [--cert=a-plus-220-1202]");
  process.exit(1);
}

const root = process.cwd();
const sourcePath = path.resolve(root, inputFile);
if (!fs.existsSync(sourcePath)) {
  console.error(`Transcript not found: ${inputFile}`);
  process.exit(1);
}

const text = fs.readFileSync(sourcePath, "utf8");
const lines = text.split(/\r?\n/).map((text, index) => ({ line: index + 1, text: text.trim() })).filter(item => item.text);

const stopWords = new Set(["the","and","for","with","that","this","from","your","you","are","can","will","have","has","not","but","into","there","their","windows","microsoft","computer","system","systems","operating","using","used","also","then","than","when","what","where","which","would","could","should"]);
const knownPhrases = [
  "Task Manager", "Event Viewer", "Control Panel", "Windows Firewall", "Windows Defender Firewall", "Microsoft Management Console", "MMC",
  "Computer Management", "Device Manager", "Disk Management", "Services", "Registry Editor", "Command Prompt", "PowerShell", "Terminal",
  "ipconfig", "ping", "tracert", "nslookup", "netstat", "net use", "net user", "chkdsk", "sfc", "DISM", "gpupdate",
  "DNS", "DHCP", "IP address", "subnet mask", "default gateway", "ARP", "TCP/IP", "IPv4", "IPv6", "network adapter",
  "NTFS", "FAT32", "exFAT", "APFS", "ext4", "BitLocker", "EFS", "permissions", "share permissions",
  "Windows Update", "Settings", "UAC", "Remote Desktop", "Safe Mode", "System Restore"
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function categoryFor(title) {
  const t = title.toLowerCase();
  if (["ipconfig","ping","tracert","nslookup","netstat","net use","net user","chkdsk","sfc","dism","gpupdate","command prompt","powershell","terminal"].some(x => t.includes(x))) return "commands";
  if (["dns","dhcp","gateway","arp","tcp/ip","ipv4","ipv6","network"].some(x => t.includes(x))) return "networking";
  if (["ntfs","fat32","exfat","apfs","ext4","disk","partition","file system"].some(x => t.includes(x))) return "storage";
  if (["firewall","defender","bitlocker","efs","uac","permissions"].some(x => t.includes(x))) return "security";
  return "windows";
}

function makeKnowledgeId(cert, category, slug) {
  const certPart = cert.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  const categoryPart = category.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  const slugPart = slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
  return `${certPart}-${categoryPart}-${slugPart}`;
}

const mentions = new Map();
function addMention(title, evidence, confidence = 0.65) {
  const slug = slugify(title);
  if (!mentions.has(slug)) mentions.set(slug, { title, slug, evidence: [], confidence });
  const item = mentions.get(slug);
  item.confidence = Math.max(item.confidence, confidence);
  if (item.evidence.length < 5) item.evidence.push(evidence);
}

for (const item of lines) {
  for (const phrase of knownPhrases) {
    const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (pattern.test(item.text)) addMention(phrase, item, 0.85);
  }
  const caps = item.text.match(/\b[A-Z][A-Za-z0-9+/#.-]{2,}(?:\s+[A-Z][A-Za-z0-9+/#.-]{2,}){0,3}\b/g) || [];
  for (const phrase of caps) {
    const cleaned = phrase.trim();
    const first = cleaned.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(first) && cleaned.length <= 60) addMention(cleaned, item, 0.45);
  }
}

const candidates = [...mentions.values()]
  .filter(item => item.evidence.length >= 1)
  .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title))
  .map((item, index) => {
    const category = categoryFor(item.title);
    return {
      candidateId: `CAND-${String(index + 1).padStart(3, "0")}`,
      title: item.title,
      slug: item.slug,
      proposedKnowledgeId: makeKnowledgeId(certificationId, category, item.slug),
      category,
      aliases: [],
      confidence: Number(item.confidence.toFixed(2)),
      summaryDraft: "",
      factsDraft: [],
      examTipsDraft: [],
      evidence: item.evidence,
      possibleDuplicates: [],
      suggestedRelationships: [],
      reviewDecision: "undecided",
      reviewNotes: ""
    };
  });

const output = {
  id: `IMPORT-${certificationId}-${lessonId}`.toUpperCase().replace(/[^A-Z0-9-]+/g, "-"),
  certificationId,
  lessonId: String(lessonId),
  sourceTranscript: inputFile,
  status: "pending-review",
  createdAt: new Date().toISOString(),
  notes: [
    "Auto-extracted candidates. Review every candidate before merging into content/knowledge.",
    "This script is intentionally conservative and does not edit trusted knowledge objects."
  ],
  candidates
};

const outDir = path.resolve(root, "data/imports/pending");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${String(lessonId).padStart(2, "0")}-candidates.json`);
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`Wrote ${candidates.length} candidates to ${path.relative(root, outFile)}`);
