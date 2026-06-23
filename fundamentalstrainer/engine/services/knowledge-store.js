export class KnowledgeStore {
  constructor() {
    this.items = new Map();
  }

  add(item) {
    if (!item?.id) throw new Error("Knowledge object is missing an id.");
    this.items.set(item.id, item);
  }

  all() {
    return [...this.items.values()];
  }

  findById(id) {
    return this.items.get(id) || null;
  }

  search(query) {
    const q = String(query).toLowerCase().trim();
    if (!q) return this.all();

    return this.all().filter(item => {
      const facts = item.learning?.facts?.map(fact => fact.text) || [];
      const commands = item.learning?.commands?.map(command => `${command.command} ${command.purpose}`) || [];
      const tips = item.assessmentSeeds?.examTips?.map(tip => tip.text) || [];
      const mistakes = item.assessmentSeeds?.commonMistakes?.map(mistake => mistake.text) || [];
      const relationships = [
        ...(item.relationships?.prerequisites || []),
        ...(item.relationships?.parents || []),
        ...(item.relationships?.children || []),
        ...((item.relationships?.related || []).map(relationship => relationship.id)),
        ...((item.relationships?.contrastsWith || []).map(relationship => relationship.id))
      ];

      const haystack = [
        item.id,
        item.slug,
        item.title,
        ...(item.aliases || []),
        ...(item.domains || []),
        item.learning?.summary,
        item.learning?.explanation,
        ...facts,
        ...commands,
        ...tips,
        ...mistakes,
        ...relationships
      ].join(" ").toLowerCase();

      return haystack.includes(q);
    });
  }
}
