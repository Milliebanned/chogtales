import "server-only";
import { kv } from "./store";
import { fetchMeta } from "./nft";
import { CHOG_CONTRACT } from "./chain";
import { migrate, newChogState, rollover } from "./game";
import type { CastMember, ChogMeta, ChogState, IncomingBeef } from "./types";

export const incomingBeefKey = (tokenId: string) => `beef:in:${tokenId}`;
export const beefSeenKey = (state: ChogState) => `beef:seen:${state.key}`;

/** Beef other players started with this Chog since its last chapter was written. */
export async function unseenIncomingBeef(state: ChogState): Promise<IncomingBeef[]> {
  const [all, seen] = await Promise.all([kv.get<IncomingBeef[]>(incomingBeefKey(state.tokenId)), kv.get<number>(beefSeenKey(state))]);
  return (all ?? []).filter((b) => b.at > (seen ?? 0) && b.from.tokenId !== state.tokenId);
}

export const stateKey = (tokenId: string, owner: string) => `chog:${tokenId}:${owner}`;

/** Placeholder demo cast used when no collection contract is configured. */
const DEMO_CHOGS: ChogMeta[] = [
  { tokenId: "7", name: "Chog #7", image: "/chogs/chog-1.svg", traits: [{ trait_type: "Fur", value: "Royal Purple" }, { trait_type: "Eyes", value: "Determined" }], demo: true },
  { tokenId: "42", name: "Chog #42", image: "/chogs/chog-2.svg", traits: [{ trait_type: "Fur", value: "Midnight" }, { trait_type: "Eyes", value: "Sleepy" }], demo: true },
  { tokenId: "777", name: "Chog #777", image: "/chogs/chog-3.svg", traits: [{ trait_type: "Fur", value: "Ember" }, { trait_type: "Eyes", value: "Sparkly" }], demo: true },
];

export async function demoChogs(): Promise<ChogMeta[]> {
  const ids = (process.env.DEMO_TOKEN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (CHOG_CONTRACT && ids.length) {
    const metas = await Promise.all(ids.map((id) => fetchMeta(id)));
    return metas.map((m) => ({ ...m, demo: true }));
  }
  return DEMO_CHOGS;
}

export async function loadState(tokenId: string, owner: string): Promise<ChogState | null> {
  const s = await kv.get<ChogState>(stateKey(tokenId, owner));
  if (s) migrate(s);
  if (s && rollover(s)) await saveState(s);
  return s;
}

export async function saveState(s: ChogState) {
  await kv.set(s.key, s);
  await kv.sadd("chogs:index", s.key);
}

/** Get existing state for (token, owner) or start a clean slate. */
export async function loadOrCreate(meta: ChogMeta, owner: string): Promise<ChogState> {
  const key = stateKey(meta.tokenId, owner);
  const existing = await loadState(meta.tokenId, owner);
  if (existing) return existing;
  const s = newChogState(key, owner, meta);
  await saveState(s);
  return s;
}

/** Other Chogs in the shared world, used as supporting cast. */
export async function pickCast(self: ChogState, n = 2): Promise<CastMember[]> {
  const keys = (await kv.smembers("chogs:index")).filter(
    (k) => k !== self.key && !k.startsWith(`chog:${self.tokenId}:`),
  );
  const shuffled = keys.sort(() => Math.random() - 0.5).slice(0, 8);
  const states = (await Promise.all(shuffled.map((k) => kv.get<ChogState>(k)))).filter(
    Boolean,
  ) as ChogState[];
  const seen = new Set<string>();
  const cast: CastMember[] = [];
  // rivals come first: the Chog the keeper started beef with, then anyone who started beef with us
  const rivals = [self.yesterday?.beef?.target, ...(await unseenIncomingBeef(self)).map((b) => b.from)].filter(Boolean) as CastMember[];
  for (const r of rivals) {
    if (seen.has(r.tokenId) || r.tokenId === self.tokenId || cast.length >= n) continue;
    seen.add(r.tokenId);
    cast.push(r);
  }
  for (const s of states) {
    if (cast.length >= n) break;
    if (seen.has(s.tokenId)) continue;
    seen.add(s.tokenId);
    cast.push({ name: s.meta.name, tokenId: s.tokenId, image: s.meta.image, role: s.role.title });
  }
  // pad with demo chogs so every story has a rival
  for (const d of await demoChogs()) {
    if (cast.length >= n) break;
    if (d.tokenId === self.tokenId || seen.has(d.tokenId)) continue;
    seen.add(d.tokenId);
    cast.push({
      name: d.name,
      tokenId: d.tokenId,
      image: d.image,
      role: cast.length === 0 ? "a mysterious rival" : "a wandering stranger",
    });
  }
  return cast;
}

/** Chogs this one can start beef with: other players' Chogs first, then the demo cast. */
export async function beefTargets(self: ChogState, n = 6): Promise<CastMember[]> {
  const keys = (await kv.smembers("chogs:index")).filter((k) => !k.startsWith(`chog:${self.tokenId}:`));
  const states = (await Promise.all(keys.slice(-40).map((k) => kv.get<ChogState>(k)))).filter(Boolean) as ChogState[];
  const out = new Map<string, CastMember>();
  for (const s of states.sort((a, b) => b.day - a.day)) {
    if (!out.has(s.tokenId)) out.set(s.tokenId, { name: s.meta.name, tokenId: s.tokenId, image: s.meta.image, role: s.role.title });
  }
  for (const d of await demoChogs()) {
    if (d.tokenId !== self.tokenId && !out.has(d.tokenId)) out.set(d.tokenId, { name: d.name, tokenId: d.tokenId, image: d.image, role: "a stranger" });
  }
  return [...out.values()].slice(0, n);
}
