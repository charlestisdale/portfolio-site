export class InMemoryJobStore {
  constructor() {
    this.jobs = new Map();
  }

  save(job) {
    this.jobs.set(job.id, structuredCloneSafe(job));
    return this.get(job.id);
  }

  get(id) {
    const job = this.jobs.get(id);
    return job ? structuredCloneSafe(job) : null;
  }

  update(id, updater) {
    const job = this.get(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    const updated = updater(job) || job;
    return this.save(updated);
  }

  list(filters = {}) {
    let jobs = [...this.jobs.values()].map(structuredCloneSafe);

    if (filters.status) jobs = jobs.filter(job => job.status === filters.status);
    if (filters.type) jobs = jobs.filter(job => job.type === filters.type);

    return jobs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  clear() {
    this.jobs.clear();
  }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}
