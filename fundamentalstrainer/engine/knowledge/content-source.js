import { loadJson } from "../core/content-loader.js";

export class JsonContentSource {
  constructor({ root = "." } = {}) {
    this.root = root.replace(/\/$/, "");
    this.cache = new Map();
  }

  resolve(path) {
    if (!path) throw new Error("Missing content path.");
    if (/^https?:\/\//.test(path) || path.startsWith("/")) return path;
    return this.root === "." ? path : `${this.root}/${path}`;
  }

  async json(path) {
    const resolved = this.resolve(path);
    if (!this.cache.has(resolved)) {
      this.cache.set(resolved, loadJson(resolved));
    }
    return this.cache.get(resolved);
  }
}
