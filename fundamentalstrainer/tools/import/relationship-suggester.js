const RELATION_RULES = [
  {
    type: "uses",
    source: /task manager/i,
    target: /services/i,
    notes: "Task Manager can display services and open the full Services console."
  },
  {
    type: "contrasts_with",
    source: /task manager/i,
    target: /event viewer/i,
    notes: "Task Manager shows live activity; Event Viewer shows historical logs."
  },
  {
    type: "troubleshoots",
    source: /ipconfig/i,
    target: /dns|dhcp|network/i,
    notes: "ipconfig is commonly used while troubleshooting IP configuration, DHCP, and DNS problems."
  },
  {
    type: "uses",
    source: /ping/i,
    target: /icmp|connectivity|network/i,
    notes: "ping uses ICMP echo traffic to test basic connectivity."
  },
  {
    type: "uses",
    source: /tracert/i,
    target: /routing|hop|network/i,
    notes: "tracert shows the path traffic takes through routers."
  },
  {
    type: "uses",
    source: /nslookup/i,
    target: /dns/i,
    notes: "nslookup queries DNS records."
  },
  {
    type: "manages",
    source: /windows defender firewall|firewall/i,
    target: /port|rule|network/i,
    notes: "Windows Firewall controls inbound and outbound rules."
  }
];

/**
 * Suggest graph relationships between candidates and known objects.
 * Suggestions are intentionally non-authoritative and must go through review.
 */
export function suggestRelationships(candidates, existingObjects = []) {
  const nodes = [
    ...existingObjects.map(object => ({ ...object, nodeKind: "existing", key: object.id })),
    ...candidates.map(candidate => ({ ...candidate, nodeKind: "candidate", key: candidate.candidateId }))
  ];

  return candidates.map(candidate => {
    const suggestions = [];
    for (const node of nodes) {
      if (node.key === candidate.candidateId) continue;
      const ruleMatch = matchRule(candidate, node);
      if (ruleMatch) suggestions.push(ruleMatch);

      const lexical = lexicalSuggestion(candidate, node);
      if (lexical) suggestions.push(lexical);
    }

    return {
      ...candidate,
      relationshipReview: uniqueRelationships(suggestions)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 12)
    };
  });
}

function matchRule(source, target) {
  for (const rule of RELATION_RULES) {
    const sourceText = searchableText(source);
    const targetText = searchableText(target);

    if (rule.source.test(sourceText) && rule.target.test(targetText)) {
      return makeRelationship(source, target, rule.type, rule.notes, 0.82, "rule");
    }
  }
  return null;
}

function lexicalSuggestion(source, target) {
  const sourceDomains = source.domains || [];
  const targetDomains = target.domains || [];
  const sharedDomains = sourceDomains.filter(domain => targetDomains.includes(domain));
  if (!sharedDomains.length) return null;

  const sourceTokens = tokenSet(searchableText(source));
  const targetTokens = tokenSet(searchableText(target));
  const sharedTokens = [...sourceTokens].filter(token => targetTokens.has(token) && token.length > 3);

  if (sharedTokens.length < 2) return null;

  return makeRelationship(
    source,
    target,
    "related_to",
    `Shares domain(s): ${sharedDomains.join(", ")} and term(s): ${sharedTokens.slice(0, 5).join(", ")}.`,
    Math.min(0.75, 0.45 + sharedTokens.length * 0.05),
    "lexical"
  );
}

function makeRelationship(source, target, type, notes, confidence, method) {
  return {
    sourceId: source.proposedKnowledgeId || source.id,
    targetId: target.proposedKnowledgeId || target.id,
    targetTitle: target.title,
    targetKind: target.nodeKind || "existing",
    type,
    strength: confidence >= 0.8 ? "strong" : "medium",
    confidence: Math.round(confidence * 100) / 100,
    method,
    notes,
    reviewStatus: "needs-review"
  };
}

function searchableText(item) {
  return [
    item.id,
    item.proposedKnowledgeId,
    item.title,
    item.slug,
    ...(item.aliases || []),
    ...(item.domains || []),
    item.learning?.summary,
    item.learning?.explanation
  ].filter(Boolean).join(" ");
}

function tokenSet(value) {
  return new Set(String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean));
}

function uniqueRelationships(relationships) {
  const seen = new Set();
  const output = [];
  for (const relationship of relationships) {
    const key = `${relationship.sourceId}|${relationship.type}|${relationship.targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(relationship);
  }
  return output;
}
