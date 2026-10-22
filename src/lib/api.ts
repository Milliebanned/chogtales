import "server-only";
import { NextResponse } from "next/server";
import { getSession } from "./session";
import { demoChogs, loadOrCreate } from "./chogs";
import { fetchMeta, ownerOf } from "./nft";
import { CARES_PER_DAY, MEALS_PER_DAY, omen } from "./game";
import { auraColor } from "./foods";
import { kv } from "./store";
import type { Chapter, ChogState } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function handle(fn: () => Promise<unknown>) {
  return fn()
    .then((data) => NextResponse.json(data))
    .catch((e) => {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e);
      return NextResponse.json({ error: (e as Error).message }, { status });
    });
}

/** Resolve the session's Chog, enforcing real on-chain ownership. */
export async function resolveChog(tokenId: string): Promise<ChogState> {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Not signed in");
  if (!/^\d{1,10}$/.test(tokenId)) throw new HttpError(400, "Bad token id");

  if (session.demo) {
    const meta = (await demoChogs()).find((c) => c.tokenId === tokenId);
    if (!meta) throw new HttpError(404, "Unknown demo Chog");
    return loadOrCreate(meta, session.owner);
  }

  let owner: string;
  try {
    owner = await ownerOf(tokenId);
  } catch {
    throw new HttpError(404, "That Chog doesn't exist");
  }
  if (owner !== session.owner) throw new HttpError(403, "You don't own this Chog");
  return loadOrCreate(await fetchMeta(tokenId), session.owner);
}

export async function chapterList(state: ChogState) {
  const days = Array.from({ length: state.day }, (_, i) => i + 1).slice(-60);
  const chapters = await Promise.all(days.map((d) => kv.get<Chapter>(`chapter:${state.key}:${d}`)));
  return chapters.filter(Boolean).map((c) => ({
    id: c!.id,
    day: c!.day,
    title: c!.title,
    role: c!.role,
    tagline: c!.tagline,
    cover: c!.cover.image ?? null,
    status: c!.status,
  }));
}

/** What the player may see. The personality itself stays secret. */
export async function publicState(state: ChogState) {
  return {
    tokenId: state.tokenId,
    meta: state.meta,
    day: state.day,
    hunger: state.hunger,
    mood: state.mood,
    aura: auraColor(state.personality),
    role: state.role,
    event: state.event,
    meals: state.meals,
    mealsLeft: MEALS_PER_DAY - state.meals.length,
    cares: state.cares,
    caresLeft: CARES_PER_DAY - state.cares.length,
    beef: state.beef?.day === state.day ? state.beef : null,
    hygiene: state.hygiene,
    energy: state.energy,
    neglectStreak: state.neglectStreak,
    omen: omen(state),
    life: state.life,
    decision: state.decision?.day === state.day ? state.decision : null,
    // what the keeper chose at the end of each past chapter (shown in PDFs)
    decisions: Object.fromEntries(state.history.filter((h) => h.decision).map((h) => [h.day, h.decision!.picked])),
    chapters: await chapterList(state),
    demo: !!state.meta.demo,
  };
}
