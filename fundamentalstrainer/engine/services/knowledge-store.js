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
      const haystack = [
        item.id,
        item.title,
        item.summary,
        ...(item.facts || []),
        ...(item.relatedConcepts || []),
        ...(item.examTips || [])
      ].join(" ").toLowerCase();

      return haystack.includes(q);
    });
  }
}
