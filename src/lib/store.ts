import "server-only";
import { Redis } from "@upstash/redis";
import { createClient } from "redis";
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

/**
 * Find the Redis connection however the host named it: UPSTASH_REDIS_REST_*,
 * KV_REST_API_*, the same with a custom prefix (Vercel lets you add one, e.g.
 * STORAGE_KV_REST_API_URL), or only a redis:// URL (REDIS_URL / KV_URL).
 */
function findRedis(): { url?: string; token?: string; tcpUrl?: string; via?: string } {
  const env = process.env;
  for (const [u, t] of [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ]) {
    const key = Object.keys(env).find((k) => k === u || k.endsWith(`_${u}`));
    const tok = key && env[key.slice(0, key.length - u.length) + t];
    if (key && env[key] && tok) return { url: env[key], token: tok, via: key };
  }
  // rediss://default:<token>@<host>:6379 → REST endpoint https://<host> with the same token
  const urlKey = Object.keys(env).find((k) => /(^|_)(REDIS_URL|KV_URL)$/.test(k) && /^rediss?:\/\//.test(env[k] ?? ""));
  if (urlKey) {
    const m = env[urlKey]!.match(/^rediss?:\/\/[^:]*:([^@]+)@([^:/]+)/);
    if (m && /upstash\.io$/.test(m[2])) return { url: `https://${m[2]}`, token: decodeURIComponent(m[1]), via: urlKey };
    // any other Redis (e.g. Vercel's Redis Cloud integration): talk to it over TCP
    return { tcpUrl: env[urlKey], via: urlKey };
  }
  return {};
}

const redis = findRedis();
const url = redis.url;
const token = redis.token;
/** Which env var the storage came from, and the NAMES of storage-looking vars present (never values). */
export const storeInfo = {
  via: redis.via ?? null,
  candidates: Object.keys(process.env).filter((k) => /REDIS|KV_|UPSTASH/.test(k)),
};

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

/** Plain Redis over TCP. One connection per server instance, reused across requests. */
function tcpKV(redisUrl: string): KV {
  let client: ReturnType<typeof createClient> | null = null;
  let ready: Promise<unknown> | null = null;
  async function conn() {
    if (!client) {
      client = createClient({ url: redisUrl, socket: { connectTimeout: 10_000, reconnectStrategy: (n) => Math.min(n * 200, 2000) } });
      client.on("error", (e) => console.error("redis:", (e as Error).message));
      ready = client.connect();
    }
    await ready;
    return client;
  }
  // values are stored as JSON, like the Upstash client does
  return {
    async get<T>(key: string) {
      const v = await (await conn()).get(key);
      return v == null ? null : (JSON.parse(v) as T);
    },
    async set<T>(key: string, value: T) {
      await (await conn()).set(key, JSON.stringify(value));
    },
    async sadd(key, member) {
      await (await conn()).sAdd(key, member);
    },
    async smembers(key) {
      return (await conn()).sMembers(key);
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

// a serverless host has no writable disk: fail loudly instead of losing every save
if (!(url && token) && !redis.tcpUrl && process.env.VERCEL)
  console.error("No Redis configured: add Upstash Redis (UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN) to the Vercel project");
export const kv: KV = url && token ? redisKV() : redis.tcpUrl ? tcpKV(redis.tcpUrl) : process.env.VERCEL ? missingKV() : fileKV();

function missingKV(): KV {
  const fail = async (): Promise<never> => {
    throw new Error("Storage isn't set up yet: connect Upstash Redis to this Vercel project and redeploy.");
  };
  return { get: fail, set: fail, sadd: fail, smembers: fail };
}
export const storeKind = url && token ? "upstash" : redis.tcpUrl ? "redis" : "file";
