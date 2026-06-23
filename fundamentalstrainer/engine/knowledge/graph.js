export class KnowledgeGraph {
  constructor({ objects = [], relationships = [] } = {}) {
    this.objects = new Map(objects.map(object => [object.id, object]));
    this.edges = relationships;
  }

  setObjects(objects = []) {
    this.objects = new Map(objects.map(object => [object.id, object]));
    return this;
  }

  setRelationships(relationships = []) {
    this.edges = relationships;
    return this;
  }

  all() {
    return this.edges;
  }

  outbound(id, filters = {}) {
    return this.edges.filter(edge => edge.sourceId === id && matchesFilters(edge, filters));
  }

  inbound(id, filters = {}) {
    return this.edges.filter(edge => edge.targetId === id && matchesFilters(edge, filters));
  }

  related(id, filters = {}) {
    const outbound = this.outbound(id, filters).map(edge => this.enrich(edge, "outbound"));
    const inbound = this.inbound(id, filters).map(edge => this.enrich(edge, "inbound"));
    return [...outbound, ...inbound];
  }

  neighbors(id, filters = {}) {
    return this.related(id, filters)
      .map(edge => edge.directionFromSource === "outbound" ? edge.target : edge.source)
      .filter(Boolean);
  }

  enrich(edge, directionFromSource) {
    return {
      ...edge,
      directionFromSource,
      source: this.objects.get(edge.sourceId) || null,
      target: this.objects.get(edge.targetId) || null
    };
  }

  missingTargets() {
    const missing = [];
    for (const edge of this.edges) {
      if (!this.objects.has(edge.sourceId)) missing.push({ edgeId: edge.id, role: "source", id: edge.sourceId });
      if (!this.objects.has(edge.targetId)) missing.push({ edgeId: edge.id, role: "target", id: edge.targetId });
    }
    return missing;
  }
}

function matchesFilters(edge, filters) {
  if (filters.type && edge.type !== filters.type) return false;
  if (filters.status && edge.status !== filters.status) return false;
  if (filters.strength && edge.strength !== filters.strength) return false;
  return true;
}
