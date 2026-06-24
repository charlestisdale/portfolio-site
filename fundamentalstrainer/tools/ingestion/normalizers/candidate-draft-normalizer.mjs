function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function sentenceCase(value) {
  const text = normalizeWhitespace(value);
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function removeTrailingPunctuation(value) {
  return normalizeWhitespace(value).replace(/[.!?]+$/g, "");
}

function ensurePeriod(value) {
  const text = normalizeWhitespace(value);
  if (!text) return text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

function includesAny(text, terms) {
  const lower = String(text || "").toLowerCase();
  return terms.some(term => lower.includes(term));
}

function compactFact(text) {
  let cleaned = normalizeWhitespace(text)
    .replace(/^of course,?\s+/i, "")
    .replace(/^and\s+/i, "")
    .replace(/^but\s+/i, "")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\b(Google Androi)\b/gi, "Google Android");

  cleaned = sentenceCase(removeTrailingPunctuation(cleaned));
  return ensurePeriod(cleaned);
}

function isTautology(title, text) {
  const cleaned = removeTrailingPunctuation(normalizeWhitespace(text));
  const pattern = new RegExp(`^${escapeRegex(title)}\\s+is\\s+${escapeRegex(title)}$`, "i");
  return pattern.test(cleaned);
}

function isLowValueFact(title, text) {
  const cleaned = normalizeWhitespace(text);
  if (cleaned.length < 24) return true;
  if (cleaned.length > 220) return true;
  if (isTautology(title, cleaned)) return true;
  if (/appears in the transcript/i.test(cleaned)) return true;
  if (/needs human review/i.test(cleaned)) return true;
  if (/manufacturer of software for mobile manufacturer/i.test(cleaned)) return true;
  return false;
}

function uniqueFacts(title, facts) {
  const seen = new Set();
  const output = [];

  for (const fact of facts.map(compactFact)) {
    const key = fact.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    if (isLowValueFact(title, fact)) continue;
    seen.add(key);
    output.push(fact);
  }

  return output;
}

const conceptProfiles = {
  "mobile.android": {
    summary: "Android is a mobile operating system based on Linux and used across many device manufacturers.",
    facts: [
      { text: "Android is a mobile operating system.", terms: ["android"] },
      { text: "Android is based on Linux.", terms: ["linux", "based on"] },
      { text: "Android is open source.", terms: ["open source", "open-source"] },
      { text: "Android is maintained by the Open Handset Alliance.", terms: ["open handset alliance", "consortium"] },
      { text: "Unlike iOS and iPadOS, Android is supported by many different device manufacturers.", terms: ["unlike ios", "apple hardware", "many different", "manufacturers"] },
      { text: "Android apps can be developed with the Android software development kit.", terms: ["software development kit", "sdk", "develop apps"] }
    ]
  },
  "mobile.ios": {
    summary: "iOS is Apple's mobile operating system for iPhone devices.",
    facts: [
      { text: "iOS is Apple's mobile operating system for iPhone devices.", terms: ["ios", "iphone"] },
      { text: "iOS runs on Apple hardware.", terms: ["apple hardware", "apple"] },
      { text: "iOS uses the Apple App Store as its primary app distribution source.", terms: ["app store"] }
    ]
  },
  "mobile.ipados": {
    summary: "iPadOS is Apple's operating system for iPad devices.",
    facts: [
      { text: "iPadOS is Apple's operating system for iPad devices.", terms: ["ipados", "ipad"] },
      { text: "iPadOS runs on Apple iPad hardware.", terms: ["apple hardware", "ipad"] },
      { text: "iPadOS uses the Apple App Store as its primary app distribution source.", terms: ["app store"] }
    ]
  },
  "linux.linux": {
    summary: "Linux is an open-source operating system family that uses the Linux kernel.",
    facts: [
      { text: "Linux is an open-source operating system family.", terms: ["linux", "open source", "open-source"] },
      { text: "Linux uses the Linux kernel.", terms: ["kernel"] },
      { text: "Some operating systems, including Android and ChromeOS, are based on Linux.", terms: ["android", "chromeos", "based on linux"] }
    ]
  },
  "windows.windows": {
    summary: "Windows is Microsoft's desktop operating system used for running applications and managing hardware and system tools.",
    facts: [
      { text: "Windows is a Microsoft operating system.", terms: ["windows", "microsoft"] },
      { text: "Windows includes graphical tools for managing hardware, storage, services, and system settings.", terms: ["device manager", "disk management", "services", "settings", "control panel"] },
      { text: "Windows can be managed from graphical tools and command-line tools.", terms: ["command prompt", "powershell", "terminal"] }
    ]
  },
  "macos.macos": {
    summary: "macOS is Apple's desktop operating system for Mac computers.",
    facts: [
      { text: "macOS is Apple's desktop operating system for Mac computers.", terms: ["macos", "mac os", "mac"] },
      { text: "macOS runs on Apple Mac hardware.", terms: ["apple", "mac hardware"] },
      { text: "macOS uses APFS as a modern Apple file system.", terms: ["apfs"] }
    ]
  },
  "linux.chromeos": {
    summary: "ChromeOS is a Linux-based operating system used on Chromebook devices.",
    facts: [
      { text: "ChromeOS is based on Linux.", terms: ["chromeos", "chrome os", "linux"] },
      { text: "ChromeOS is commonly used on Chromebook devices.", terms: ["chromebook"] }
    ]
  },
  "operating-systems.operating-system": {
    summary: "An operating system manages hardware, runs applications, and provides the user environment for a computing device.",
    facts: [
      { text: "An operating system manages hardware and software resources.", terms: ["hardware", "software"] },
      { text: "An operating system provides the environment used to run applications.", terms: ["application", "apps"] },
      { text: "Desktop and mobile devices use different operating systems depending on hardware and vendor support.", terms: ["windows", "macos", "linux", "ios", "android"] }
    ]
  },
  "operating-systems.kernel": {
    summary: "A kernel is the core part of an operating system that helps manage hardware and system resources.",
    facts: [
      { text: "A kernel is the core part of an operating system.", terms: ["kernel"] },
      { text: "The kernel helps manage hardware and system resources.", terms: ["hardware", "resources"] }
    ]
  },
  "software.open-source-software": {
    summary: "Open-source software makes source code available so it can be reviewed, modified, and redistributed under its license.",
    facts: [
      { text: "Open-source software makes source code available under its license.", terms: ["open source", "open-source"] },
      { text: "Linux and Android are commonly associated with open-source software.", terms: ["linux", "android"] }
    ]
  },
  "software.google-play-store": {
    summary: "Google Play Store is Google's app store for finding and installing Android applications.",
    facts: [
      { text: "Google Play Store is Google's app store for Android applications.", terms: ["google play", "play store"] },
      { text: "Android users commonly use Google Play Store to find and install apps.", terms: ["install", "apps"] }
    ]
  },
  "software.app-store": {
    summary: "An app store is a vendor-managed source for finding, installing, and updating applications.",
    facts: [
      { text: "An app store is used to find, install, and update applications.", terms: ["app store", "install", "apps"] },
      { text: "Apple devices commonly use the Apple App Store for application distribution.", terms: ["apple", "app store"] }
    ]
  },
  "software.software-development-kit": {
    summary: "A software development kit is a collection of tools used to build applications for a platform.",
    facts: [
      { text: "A software development kit provides tools for building applications for a platform.", terms: ["software development kit", "sdk"] },
      { text: "Android applications can be developed using Android SDK tools.", terms: ["android", "sdk", "develop"] }
    ]
  }
};

function profileFacts(profile, evidenceText) {
  if (!profile) return [];
  return profile.facts
    .filter(fact => includesAny(evidenceText, fact.terms || []))
    .map(fact => fact.text);
}

function genericSummary(item, facts) {
  if (facts.length) return facts[0];
  const domain = item.domains?.[0] ? ` in ${item.domains[0].replaceAll("-", " ")}` : "";
  return `${item.title} is a ${item.type || "concept"}${domain} identified from the lesson transcript for human review.`;
}

function relationshipPriority(relationship) {
  if (relationship.type === "contrasts_with") return 0;
  if (relationship.type === "depends_on") return 1;
  return 2;
}

function normalizeRelationships(relationships = []) {
  const seen = new Set();
  return [...relationships]
    .filter(item => item?.id)
    .sort((a, b) => relationshipPriority(a) - relationshipPriority(b))
    .filter(item => {
      const key = `${item.id}:${item.type || "related_to"}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map(item => ({
      ...item,
      type: item.type || "related_to",
      reason: item.reason || item.evidence || "Suggested from transcript evidence."
    }));
}

export function normalizeCandidateDraft({ item, factTexts = [], relationships = [] }) {
  const profile = conceptProfiles[item.proposedKnowledgeId];
  const evidenceText = (item.evidence || []).map(evidence => evidence.text).join(" ").toLowerCase();
  const facts = uniqueFacts(item.title, [
    ...profileFacts(profile, evidenceText),
    ...factTexts
  ]).slice(0, 6);

  const summaryDraft = profile?.summary || genericSummary(item, facts);

  return {
    summaryDraft,
    explanationDraft: facts.length ? facts.join(" ") : summaryDraft,
    factsDraft: facts.map(text => ({
      text,
      importance: item.confidence >= 0.85 ? "high" : "medium",
      tags: item.domains
    })),
    suggestedRelationships: normalizeRelationships(relationships)
  };
}
