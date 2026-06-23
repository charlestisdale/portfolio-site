const RELATIONSHIP_LABELS = {
  troubleshoots: "troubleshooting",
  troubleshooting: "troubleshooting",
  uses: "uses",
  depends_on: "depends on",
  prerequisite: "prerequisite",
  related_to: "related to",
  command: "command",
  security: "security",
  networking: "networking"
};

export function formatRelationshipLabel(type) {
  const key = String(type || "related_to");
  return RELATIONSHIP_LABELS[key] || key.replaceAll("_", " ");
}
