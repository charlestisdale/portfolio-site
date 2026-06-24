function textOfFact(fact) {
  return typeof fact === "string" ? fact : fact?.text || "";
}

function normalize(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function hasRepeatedPhrase(text) {
  const words = normalize(text).toLowerCase().split(" ").filter(Boolean);
  for (let i = 0; i < words.length; i++) {
    for (let size = 3; size <= 8 && i + size * 2 <= words.length; size++) {
      const first = words.slice(i, i + size).join(" ");
      const second = words.slice(i + size, i + size * 2).join(" ");
      if (first && first === second) return true;
    }
  }
  return false;
}

function isGenericFallback(text) {
  return /identified from the lesson transcript|appears in the transcript|needs human review/i.test(text || "");
}

function isTooTranscriptLike(text) {
  return /\b(of course|as you can see|we can see|you'll notice|let's|we're going to|in this video)\b/i.test(text || "");
}

function scoreFromFlags(flags) {
  const severityPenalty = flags.reduce((sum, flag) => {
    if (flag.severity === "high") return sum + 35;
    if (flag.severity === "medium") return sum + 20;
    return sum + 10;
  }, 0);
  return Math.max(0, 100 - severityPenalty);
}

function bandFromScore(score) {
  if (score >= 80) return "high";
  if (score >= 55) return "needs-edit";
  return "low";
}

export function auditCandidateQuality(candidate = {}) {
  const flags = [];
  const summary = normalize(candidate.summaryDraft);
  const facts = (candidate.factsDraft || []).map(textOfFact).map(normalize).filter(Boolean);
  const relationships = candidate.suggestedRelationships || [];

  if (!summary) {
    flags.push({ code: "missing-summary", severity: "high", message: "Summary is missing." });
  } else {
    if (summary.length < 35) flags.push({ code: "summary-too-short", severity: "medium", message: "Summary is too short to review confidently." });
    if (summary.length > 260) flags.push({ code: "summary-too-long", severity: "medium", message: "Summary is too long and may still be transcript text." });
    if (hasRepeatedPhrase(summary)) flags.push({ code: "repeated-summary", severity: "high", message: "Summary contains repeated phrase fragments." });
    if (isGenericFallback(summary)) flags.push({ code: "generic-summary", severity: "medium", message: "Summary is a generic fallback instead of a real learning statement." });
    if (isTooTranscriptLike(summary)) flags.push({ code: "transcript-like-summary", severity: "medium", message: "Summary sounds like transcript narration." });
  }

  if (!facts.length) {
    flags.push({ code: "missing-facts", severity: "high", message: "No facts were generated." });
  }

  for (const fact of facts) {
    if (fact.length > 240) flags.push({ code: "fact-too-long", severity: "medium", message: "A fact is too long and may need editing." });
    if (hasRepeatedPhrase(fact)) flags.push({ code: "repeated-fact", severity: "high", message: "A fact contains repeated phrase fragments." });
    if (isGenericFallback(fact)) flags.push({ code: "generic-fact", severity: "medium", message: "A fact is generic fallback text." });
    if (isTooTranscriptLike(fact)) flags.push({ code: "transcript-like-fact", severity: "medium", message: "A fact sounds like transcript narration." });
  }

  if (relationships.length > 5) {
    flags.push({ code: "too-many-relationships", severity: "low", message: "Too many relationships may make review slower." });
  }

  const uniqueFlagCodes = new Set();
  const uniqueFlags = flags.filter(flag => {
    if (uniqueFlagCodes.has(flag.code)) return false;
    uniqueFlagCodes.add(flag.code);
    return true;
  });
  const score = scoreFromFlags(uniqueFlags);

  return {
    score,
    band: bandFromScore(score),
    flags: uniqueFlags
  };
}

export function summarizeCandidateQuality(candidates = []) {
  return candidates.reduce((summary, candidate) => {
    const band = candidate.quality?.band || "unknown";
    summary.total += 1;
    summary[band] = (summary[band] || 0) + 1;
    return summary;
  }, { total: 0, high: 0, "needs-edit": 0, low: 0, unknown: 0 });
}
