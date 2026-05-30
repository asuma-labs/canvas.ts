import NodeCache from "node-cache";
import { createHash } from "crypto";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export function createCacheKey(template: string, params: Record<string, unknown>): string {
  const raw = JSON.stringify({ template, params });
  return createHash("sha256").update(raw).digest("hex");
}

export function getCachedCanvas(key: string): string | undefined {
  return cache.get<string>(key);
}

export function setCachedCanvas(key: string, id: string): void {
  cache.set(key, id);
}
