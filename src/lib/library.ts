import "server-only";
import { createPublicClient, decodeEventLog, http, parseAbi, parseUnits } from "viem";
import { monad } from "./chain";
import { kv } from "./store";
import type { Session } from "./session";
import type { Chapter } from "./types";
import seeds from "./librarySeed.json";

/** $CHOG on Monad mainnet (verified on-chain: "Chog" / CHOG / 18 decimals). */
export const CHOG_TOKEN = (process.env.NEXT_PUBLIC_CHOG_TOKEN || "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777").toLowerCase() as `0x${string}`;
export const CHOG_DECIMALS = 18;
export const MAX_PRICE = 1_000_000;

/** A chapter someone made public in the Library. */
export interface Published {
  id: string;
  chapterKey?: string; // where the full chapter lives (absent for built-in seed chapters)
  tokenId?: string;
  author: string; // wallet that publishes and gets paid, "demo:…" for demo keepers, "ChogTales" for seeds
  price: string; // whole $CHOG; "0" = free
  publishedAt: number;
  reads: number;
  seed?: boolean;
  title: string;
  tagline: string;
  heroName: string;
  heroImage: string;
  cover: string | null;
  role: Chapter["role"];
  day: number;
}

interface Seed {
  id: string;
  author: string;
  price: string;
  publishedAt: number;
  reads: number;
  seed: boolean;
  chapter: Chapter;
}
const SEEDS = seeds as unknown as Seed[];

export const pubKey = (chapterId: string) => `pub:${chapterId}`;
const unlockKey = (pubId: string, wallet: string) => `unlock:${pubId}:${wallet.toLowerCase()}`;
const readsKey = (pubId: string) => `reads:${pubId}`;

/**
 * Who gets paid for the built-in paid chapters: the ChogTales wallet set in
 * LIBRARY_PAYOUT_WALLET. Until it's set those chapters are listed but can't be bought.
 */
export const PAYOUT_WALLET = (process.env.LIBRARY_PAYOUT_WALLET || "").toLowerCase();
const isWallet = (a: string) => /^0x[0-9a-f]{40}$/i.test(a);

function seedEntry(s: Seed): Published {
  const c = s.chapter;
  return {
    id: s.id,
    author: s.price === "0" ? s.author : isWallet(PAYOUT_WALLET) ? PAYOUT_WALLET : "ChogTales",
    price: s.price,
    publishedAt: s.publishedAt,
    reads: s.reads,
    seed: true,
    title: c.title,
    tagline: c.tagline,
    heroName: c.heroName,
    heroImage: c.heroImage,
    cover: c.cover.image ?? null,
    role: c.role,
    day: c.day,
  };
}

export async function listPublished(): Promise<Published[]> {
  const ids = await kv.smembers("pub:index");
  const live = (await Promise.all(ids.map((id) => kv.get<Published>(pubKey(id))))).filter(Boolean) as Published[];
  const all = [...live, ...SEEDS.map(seedEntry)];
  const reads = await Promise.all(all.map((p) => kv.get<number>(readsKey(p.id))));
  return all.map((p, i) => ({ ...p, reads: reads[i] ?? p.reads })).sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getPublished(id: string): Promise<{ pub: Published; chapter: Chapter } | null> {
  const seed = SEEDS.find((s) => s.id === id);
  if (seed) return { pub: seedEntry(seed), chapter: seed.chapter };
  const pub = await kv.get<Published>(pubKey(id));
  if (!pub?.chapterKey) return null;
  const chapter = await kv.get<Chapter>(pub.chapterKey);
  return chapter ? { pub, chapter } : null;
}

export async function canRead(pub: Published, session: Session | null) {
  if (pub.price === "0") return true;
  if (!session) return false;
  if (session.owner === pub.author) return true;
  return !!(await kv.get<string>(unlockKey(pub.id, session.owner)));
}

/** What a reader who hasn't paid sees: the cover and the first page. */
export function preview(chapter: Chapter): Chapter {
  return { ...chapter, pages: chapter.pages.slice(0, 1), choice: undefined, consequences: undefined, nextTime: undefined };
}

export async function countRead(pubId: string) {
  await kv.set(readsKey(pubId), ((await kv.get<number>(readsKey(pubId))) ?? 0) + 1);
}

/** Is this AI image part of a paid chapter the viewer hasn't unlocked? (cover and page 1 stay free as the preview) */
export async function imageLocked(imgId: string, session: Session | null) {
  const slot = imgId.slice(imgId.lastIndexOf(":") + 1);
  if (slot === "cover" || slot.startsWith("p0-")) return false;
  const chapterId = imgId.slice(4, imgId.lastIndexOf(":"));
  const pub = await kv.get<Published>(pubKey(chapterId));
  if (!pub || pub.price === "0") return false;
  // the Chog's own keeper can always see their art
  if (session && pub.chapterKey?.includes(`:${session.owner}:`)) return false;
  return !(await canRead(pub, session));
}

const client = createPublicClient({ chain: monad, transport: http() });
const erc20 = parseAbi(["event Transfer(address indexed from, address indexed to, uint256 value)"]);

/**
 * Check a $CHOG payment on-chain: the transaction succeeded and moved at least
 * the price in $CHOG from the buyer to the author. Each transaction unlocks once.
 */
export async function verifyAndUnlock(pub: Published, buyer: string, txHash: `0x${string}`) {
  if (!isWallet(pub.author)) throw new Error("This chapter can't be bought yet: its payout wallet isn't set");
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) throw new Error("That doesn't look like a transaction hash");
  if (await kv.get(`paytx:${txHash.toLowerCase()}`)) throw new Error("That payment was already used to unlock a chapter");
  let receipt;
  for (let i = 0; i < 10; i++) {
    try {
      receipt = await client.getTransactionReceipt({ hash: txHash });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 1500)); // not indexed yet
    }
  }
  if (!receipt) throw new Error("Couldn't find that transaction on Monad yet. Try again in a few seconds.");
  if (receipt.status !== "success") throw new Error("That transaction failed on-chain");
  const need = parseUnits(pub.price, CHOG_DECIMALS);
  let paid = BigInt(0);
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== CHOG_TOKEN) continue;
    try {
      const ev = decodeEventLog({ abi: erc20, data: log.data, topics: log.topics });
      if (ev.args.from.toLowerCase() === buyer.toLowerCase() && ev.args.to.toLowerCase() === pub.author.toLowerCase()) paid += ev.args.value;
    } catch {}
  }
  if (paid < need) throw new Error("That transaction didn't send enough $CHOG to the author");
  await kv.set(`paytx:${txHash.toLowerCase()}`, { pub: pub.id, buyer: buyer.toLowerCase(), at: Date.now() });
  await kv.set(unlockKey(pub.id, buyer), txHash);
}

/** Which built-in seed a /api/library/art file belongs to, and whether this viewer may see it. */
export async function seedArtLocked(file: string, session: Session | null) {
  const [slug, name] = file.split("/");
  const seed = SEEDS.find((x) => x.id === `seed-${slug}`);
  if (!seed) return true;
  if (seed.price === "0" || name === "cover.webp" || name.startsWith("p0-")) return false;
  return !(await canRead(seedEntry(seed), session));
}

let priceCache: { at: number; usd: number | null } = { at: 0, usd: null };
/** Live $CHOG price in USD from DexScreener (most liquid Monad pair), cached 10 minutes. */
export async function chogUsd(): Promise<number | null> {
  if (Date.now() - priceCache.at < 10 * 60_000) return priceCache.usd;
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CHOG_TOKEN}`, { signal: AbortSignal.timeout(6000) });
    const j = (await r.json()) as { pairs?: { chainId: string; priceUsd?: string; liquidity?: { usd?: number }; baseToken: { address: string } }[] };
    const best = (j.pairs ?? [])
      .filter((p) => p.chainId === "monad" && p.baseToken.address.toLowerCase() === CHOG_TOKEN && p.priceUsd)
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    priceCache = { at: Date.now(), usd: best ? Number(best.priceUsd) : null };
  } catch {
    priceCache = { at: Date.now() - 8 * 60_000, usd: priceCache.usd }; // retry soon
  }
  return priceCache.usd;
}
