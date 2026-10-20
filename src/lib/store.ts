import "server-only";
import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";

/**
 * Tiny key-value store. Uses Upstash Redis (free tier) when configured,
 * otherwise a local JSON file — handy for development.
 */
interface KV {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
}

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

function redisKV(): KV {
  const r = new Redis({ url: url!, token: token! });
  return {
    async get<T>(key: string) {
      return ((await r.get<T>(key)) ?? null) as T | null;
    },
    async set<T>(key: string, value: T) {
      await r.set(key, value);
    },
    async sadd(key, member) {
      await r.sadd(key, member);
    },
    async smembers(key) {
      return r.smembers(key);
    },
  };
}

function fileKV(): KV {
  const file = path.join(process.cwd(), ".data", "db.json");
  let cache: Record<string, unknown> | null = null;
  let writing: Promise<void> = Promise.resolve();

  async function load() {
    if (cache) return cache;
    try {
      cache = JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      cache = {};
    }
    return cache!;
  }
  async function persist() {
    const data = JSON.stringify(cache);
    writing = writing.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, data);
    });
    await writing;
  }
  return {
    async get<T>(key: string) {
      return ((await load())[key] ?? null) as T | null;
    },
    async set<T>(key: string, value: T) {
      (await load())[key] = value;
      await persist();
    },
    async sadd(key, member) {
      const db = await load();
      const set = new Set((db[key] as string[]) ?? []);
      set.add(member);
      db[key] = [...set];
      await persist();
    },
    async smembers(key) {
      return ((await load())[key] as string[]) ?? [];
    },
  };
}

export const kv: KV = url && token ? redisKV() : fileKV();
export const storeKind = url && token ? "upstash" : "file";
