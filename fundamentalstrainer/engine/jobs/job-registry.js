export class JobRegistry {
  constructor() {
    this.handlers = new Map();
  }

  register(type, handler, options = {}) {
    if (!type) throw new Error("Job type is required.");
    if (typeof handler !== "function") throw new Error(`Job handler for ${type} must be a function.`);

    this.handlers.set(type, {
      type,
      handler,
      description: options.description || "",
      defaultMaxAttempts: options.defaultMaxAttempts || 1,
      payloadSchema: options.payloadSchema || null
    });

    return this;
  }

  has(type) {
    return this.handlers.has(type);
  }

  get(type) {
    const entry = this.handlers.get(type);
    if (!entry) throw new Error(`No job handler registered for type: ${type}`);
    return entry;
  }

  list() {
    return [...this.handlers.values()].map(({ handler, ...metadata }) => metadata);
  }
}
