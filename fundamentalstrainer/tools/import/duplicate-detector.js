/**
 * Duplicate detection compares import-review candidates against existing
 * knowledge objects. It does not merge automatically; it only gives the review
 * UI enough information to approve, reject, or merge safely.
 */
export function detectDuplicateCandidates(candidates, existingObjects = [], options = {}) {
  const { strongThreshold = 0.86, possibleThreshold = 0.62 } = options;

  return candidates.map(candidate => {
    const matches = existingObjects
      .map(object => scoreCandidateAgainstObject(candidate, object))
      .filter(match => match.score >= possibleThreshold)
      .sort((a, b) => b.score - a.score);

    return {
      ...candidate,
      duplicateReview: {
        status: matches[0]?.score >= strongThreshold ? "likely-duplicate" : matches.length ? "possible-duplicate" : "no-match",
        matches
      }
    };
  });
}

export function scoreCandidateAgainstObject(candidate, object) {
  const candidateTerms = termsFor(candidate);
  const objectTerms = termsFor(object);
  const titleScore = similarity(candidate.title, object.title);
  const aliasScore = bestPairScore(candidateTerms, objectTerms);
  const idScore = candidate.proposedKnowledgeId === object.id ? 1 : similarity(candidate.proposedKnowledgeId, object.id);
  const domainScore = overlap(candidate.domains || [], object.domains || []);

  const score = round((titleScore * 0.45) + (aliasScore * 0.35) + (idScore * 0.1) + (domainScore * 0.1));

  return {
    knowledgeId: object.id,
    title: object.title,
    score,
    reasons: explainScore({ titleScore, aliasScore, idScore, domainScore })
  };
}

function termsFor(item) {
  return [
    item.id,
    item.proposedKnowledgeId,
    item.title,
    item.slug,
    ...(item.aliases || [])
  ].filter(Boolean).map(normalize);
}

function bestPairScore(leftTerms, rightTerms) {
  let best = 0;
  for (const left of leftTerms) {
    for (const right of rightTerms) {
      best = Math.max(best, similarity(left, right));
    }
  }
  return best;
}

function explainScore(parts) {
  const reasons = [];
  if (parts.titleScore >= 0.9) reasons.push("Title is nearly identical.");
  if (parts.aliasScore >= 0.9) reasons.push("Alias or slug strongly matches.");
  if (parts.idScore >= 0.9) reasons.push("Proposed ID strongly matches existing ID.");
  if (parts.domainScore > 0) reasons.push("Domains overlap.");
  if (!reasons.length) reasons.push("Weak lexical similarity only.");
  return reasons;
}

function overlap(left, right) {
  const rightSet = new Set(right.map(normalize));
  const shared = left.map(normalize).filter(value => rightSet.has(value)).length;
  return left.length || right.length ? shared / Math.max(left.length, right.length) : 0;
}

function similarity(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.82;

  const distance = levenshtein(a, b);
  return Math.max(0, 1 - distance / Math.max(a.length, b.length));
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function round(value) {
  return Math.round(value * 100) / 100;
}
