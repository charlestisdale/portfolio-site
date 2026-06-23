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

const stopWords = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "can", "will", "have", "has", "not", "but", "into", "there", "their", "windows", "microsoft", "computer", "system", "systems", "operating", "using", "used", "also", "then", "than", "when", "what", "where", "which", "would", "could", "should", "lets", "because", "about", "these", "those"
]);

const knownConcepts = [
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
  { title: "net use", id: "commands.net-use", type: "command", domains: ["commands", "networking"], aliases: [] },
  { title: "net user", id: "commands.net-user", type: "command", domains: ["commands", "windows", "security"], aliases: [] },
  { title: "chkdsk", id: "commands.chkdsk", type: "command", domains: ["commands", "windows", "hardware"], aliases: [] },
  { title: "sfc", id: "commands.sfc", type: "command", domains: ["commands", "windows", "software-troubleshooting"], aliases: ["System File Checker"] },
  { title: "DISM", id: "commands.dism", type: "command", domains: ["commands", "windows", "software-troubleshooting"], aliases: [] },
  { title: "gpupdate", id: "commands.gpupdate", type: "command", domains: ["commands", "windows"], aliases: [] },
  { title: "DNS", id: "networking.dns", type: "protocol", domains: ["networking"], aliases: ["Domain Name System"] },
  { title: "DHCP", id: "networking.dhcp", type: "protocol", domains: ["networking"], aliases: ["Dynamic Host Configuration Protocol"] },
  { title: "IP address", id: "networking.ip-address", type: "concept", domains: ["networking"], aliases: ["IPv4 address", "IPv6 address"] },
  { title: "subnet mask", id: "networking.subnet-mask", type: "concept", domains: ["networking"], aliases: [] },
  { title: "default gateway", id: "networking.default-gateway", type: "concept", domains: ["networking"], aliases: [] },
  { title: "ARP", id: "networking.arp", type: "protocol", domains: ["networking"], aliases: ["Address Resolution Protocol"] },
  { title: "TCP/IP", id: "networking.tcp-ip", type: "protocol", domains: ["networking"], aliases: [] },
  { title: "IPv4", id: "networking.ipv4", type: "protocol", domains: ["networking"], aliases: [] },
  { title: "IPv6", id: "networking.ipv6", type: "protocol", domains: ["networking"], aliases: [] },
  { title: "network adapter", id: "networking.network-adapter", type: "hardware", domains: ["networking", "hardware"], aliases: ["NIC"] },
  { title: "NTFS", id: "windows.ntfs", type: "file-system", domains: ["windows"], aliases: [] },
  { title: "FAT32", id: "storage.fat32", type: "file-system", domains: ["hardware"], aliases: [] },
  { title: "exFAT", id: "storage.exfat", type: "file-system", domains: ["hardware"], aliases: [] },
  { title: "APFS", id: "macos.apfs", type: "file-system", domains: ["macos"], aliases: [] },
  { title: "ext4", id: "linux.ext4", type: "file-system", domains: ["linux"], aliases: [] },
  { title: "BitLocker", id: "security.bitlocker", type: "security-control", domains: ["security", "windows"], aliases: [] },
  { title: "EFS", id: "security.efs", type: "security-control", domains: ["security", "windows"], aliases: ["Encrypting File System"] },
  { title: "permissions", id: "security.permissions", type: "security-control", domains: ["security"], aliases: [] },
  { title: "share permissions", id: "security.share-permissions", type: "security-control", domains: ["security", "networking"], aliases: [] },
  { title: "Windows Update", id: "windows.windows-update", type: "tool", domains: ["windows"], aliases: [] },
  { title: "Settings", id: "windows.settings", type: "tool", domains: ["windows"], aliases: ["Windows Settings"] },
  { title: "UAC", id: "security.user-account-control", type: "security-control", domains: ["security", "windows"], aliases: ["User Account Control"] },
  { title: "Remote Desktop", id: "windows.remote-desktop", type: "tool", domains: ["windows", "networking"], aliases: ["RDP"] },
  { title: "Safe Mode", id: "windows.safe-mode", type: "procedure", domains: ["windows", "software-troubleshooting"], aliases: [] },
  { title: "System Restore", id: "windows.system-restore", type: "tool", domains: ["windows", "software-troubleshooting"], aliases: [] }
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function sentenceLooksUseful(text) {
  return /\b(is|are|shows|displays|uses|used|allows|provides|configures|enables|disables|troubleshoot|troubleshooting|command|tool|service|protocol|address|permission|firewall|network|error|issue|problem)\b/i.test(text);
}

function safeSnippet(text, max = 220) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max - 1).trimEnd() + "…" : cleaned;
}

function inferDomainFromText(value) {
  const t = value.toLowerCase();
  if (/\b(dns|dhcp|gateway|arp|tcp|ip|ipv4|ipv6|subnet|network|adapter|wireless|wifi|wi-fi)\b/.test(t)) return "networking";
  if (/\b(firewall|bitlocker|efs|uac|permission|authentication|encryption|malware|defender)\b/.test(t)) return "security";
  if (/\b(command|powershell|terminal|cmd|ipconfig|ping|tracert|nslookup|netstat|chkdsk|sfc|dism)\b/.test(t)) return "commands";
  if (/\b(disk|partition|ntfs|fat32|exfat|drive|storage|volume)\b/.test(t)) return "hardware";
  if (/\b(linux|ext4|bash|apt|systemd)\b/.test(t)) return "linux";
  if (/\b(macos|apfs|finder|keychain)\b/.test(t)) return "macos";
  return "windows";
}

function inferTypeFromTitle(title, domain) {
  const t = title.toLowerCase();
  if (/\b(ipconfig|ping|tracert|nslookup|netstat|net use|net user|chkdsk|sfc|dism|gpupdate)\b/i.test(title)) return "command";
  if (/\b(dns|dhcp|arp|tcp\/ip|ipv4|ipv6|imap|pop3|smtp|http|https|ssh|rdp)\b/.test(t)) return "protocol";
  if (/\b(ntfs|fat32|exfat|apfs|ext4)\b/.test(t)) return "file-system";
  if (/\b(firewall|bitlocker|uac|permission|encryption)\b/.test(t)) return "security-control";
  if (/\b(manager|viewer|panel|settings|console|editor|monitor|desktop|restore)\b/.test(t)) return "tool";
  if (domain === "hardware") return "hardware";
  return "concept";
}

function canonicalIdFor(title, domains) {
  const primary = domains[0] || inferDomainFromText(title);
  return `${primary}.${slugify(title)}`;
}

const mentions = new Map();
function addMention(concept, evidence, confidence = 0.65) {
  const slug = slugify(concept.title);
  const id = concept.id || canonicalIdFor(concept.title, concept.domains || [inferDomainFromText(concept.title)]);
  if (!mentions.has(id)) {
    const domains = concept.domains || [inferDomainFromText(concept.title)];
    mentions.set(id, {
      title: concept.title,
      slug,
      proposedKnowledgeId: id,
      type: concept.type || inferTypeFromTitle(concept.title, domains[0]),
      domains,
      aliases: concept.aliases || [],
      evidence: [],
      factTexts: new Set(),
      confidence
    });
  }

  const item = mentions.get(id);
  item.confidence = Math.max(item.confidence, confidence);
  if (item.evidence.length < 6) item.evidence.push(evidence);
  if (sentenceLooksUseful(evidence.text)) item.factTexts.add(safeSnippet(evidence.text));
}

for (const item of sentences) {
  for (const concept of knownConcepts) {
    const searchable = [concept.title, ...(concept.aliases || [])];
    for (const phrase of searchable) {
      const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      if (pattern.test(item.text)) {
        addMention(concept, item, phrase === concept.title ? 0.9 : 0.82);
        break;
      }
    }
  }

  const commandMatches = item.text.match(/\b(ipconfig|ping|tracert|nslookup|netstat|chkdsk|sfc|DISM|gpupdate)(?:\s+\/[a-z]+)?\b/gi) || [];
  for (const command of commandMatches) {
    const base = command.split(/\s+/)[0];
    const known = knownConcepts.find(c => c.title.toLowerCase() === base.toLowerCase());
    if (known) addMention(known, item, 0.9);
  }

  const caps = item.text.match(/\b[A-Z][A-Za-z0-9+/#.-]{2,}(?:\s+[A-Z][A-Za-z0-9+/#.-]{2,}){0,3}\b/g) || [];
  for (const phrase of caps) {
    const cleaned = phrase.trim();
    const first = cleaned.split(/\s+/)[0].toLowerCase();
    if (!stopWords.has(first) && cleaned.length <= 60) {
      const domain = inferDomainFromText(cleaned);
      addMention({ title: cleaned, domains: [domain], type: inferTypeFromTitle(cleaned, domain), aliases: [] }, item, 0.45);
    }
  }
}

const candidates = [...mentions.values()]
  .filter(item => item.evidence.length >= 1)
  .sort((a, b) => b.confidence - a.confidence || a.title.localeCompare(b.title))
  .map((item, index) => {
    const factTexts = [...item.factTexts].slice(0, 5);
    const bestEvidence = item.evidence[0]?.text || "";
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
      explanationDraft: bestEvidence ? safeSnippet(bestEvidence, 500) : "",
      factsDraft: factTexts.map(text => ({
        text,
        importance: item.confidence >= 0.85 ? "high" : "medium",
        tags: [item.domains[0]]
      })),
      examplesDraft: [],
      examTipsDraft: [],
      commonMistakesDraft: [],
      scenariosDraft: [],
      pbqIdeasDraft: [],
      evidence: item.evidence.map(e => ({ paragraph: e.paragraph, sentence: e.sentence, text: e.text })),
      possibleDuplicates: [],
      suggestedRelationships: [],
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
    candidatesWithFactDrafts: candidates.filter(c => c.factsDraft.length).length
  },
  notes: [
    "Auto-extracted candidates. Review every candidate before merging into content/knowledge.",
    "This script is intentionally conservative and does not edit trusted knowledge objects.",
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
