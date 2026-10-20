import "server-only";
import { after } from "next/server";
import { kv } from "./store";
import { pickCast, saveState, stateKey } from "./chogs";
import { endDay, migrate, todayKey } from "./game";
import { ink, inkProgress } from "./inker";
import { writeChapter } from "./story";
import type { Chapter, ChogState } from "./types";

const chapterKey = (state: ChogState, day = state.day) => `chapter:${state.key}:${day}`;
const LOCK_MS = 75_000;

/** Chapters this server process is producing right now (checked synchronously, so two requests can't race). */
const producing = new Set<string>();

/** A short lock so the same chapter is never produced twice at once (across instances). */
async function lock(id: string) {
  if (producing.has(id)) return false;
  producing.add(id);
  const held = await kv.get<number>(`lock:${id}`);
  if (held && Date.now() - held < LOCK_MS) {
    producing.delete(id);
    return false;
  }
  await kv.set(`lock:${id}`, Date.now());
  return true;
}
const unlock = (id: string) => {
  producing.delete(id);
  return kv.set(`lock:${id}`, 0);
};

/** Apply a chapter's results to the Chog's life, exactly once. */
export function adopt(state: ChogState, chapter: Chapter) {
  if (state.appliedDay === chapter.day) return;
  state.role = chapter.role;
  state.storySoFar = [...state.storySoFar, `Day ${chapter.day}: ${chapter.summary}`].slice(-8);
  state.flags = [...new Set([...state.flags, ...(chapter.newFlags ?? [])])].slice(-12);
  state.usedTwists = [...new Set([...state.usedTwists, ...(chapter.offeredTwists ?? [])])];

  const u = chapter.lifeUpdate;
  const life = state.life;
  if (u) {
    if (u.identity) life.identity = u.identity;
    if (u.motive) life.motive = u.motive;
    for (const b of u.bonds ?? []) {
      const i = life.bonds.findIndex((x) => x.name.toLowerCase() === b.name.toLowerCase());
      if (i >= 0) life.bonds[i] = { ...life.bonds[i], ...b };
      else life.bonds.push(b);
    }
    life.bonds = life.bonds.slice(-10);
    life.wounds = [...life.wounds, ...(u.newWounds ?? [])].slice(-8);
    const closed = (u.closedThreads ?? []).map((t) => t.toLowerCase());
    life.threads = [...life.threads.filter((t) => !closed.some((c) => t.toLowerCase().includes(c.slice(0, 25)) || c.includes(t.toLowerCase().slice(0, 25)))), ...(u.openThreads ?? [])].slice(-6);
    life.timeline = [...life.timeline, { day: chapter.day, event: u.turningPoint ?? chapter.summary.split(". ")[0] }].slice(-20);
  }
  state.lastChapter = {
    day: chapter.day,
    title: chapter.title,
    beats: chapter.beats ?? [],
    hook: chapter.hook ?? "",
    choice: chapter.choice,
  };
  state.appliedDay = chapter.day;
}

/** Write (if needed) and draw a chapter for this state's current day. */
async function produce(state: ChogState, budgetMs: number) {
  const started = Date.now();
  let chapter = await kv.get<Chapter>(chapterKey(state));
  if (!chapter) {
    try {
      chapter = await writeChapter(state, await pickCast(state));
    } catch (e) {
      // never fake a chapter: wait a bit and let the next poll try again
      await kv.set(`retry:${chapterKey(state)}`, Date.now() + 20_000);
      throw e;
    }
    await kv.set(chapterKey(state), chapter);
  }
  adopt(state, chapter);
  if (chapter.status !== "ready") {
    // keep drawing until done, the quota runs out, or time is up
    while (chapter.status !== "ready" && Date.now() - started < budgetMs - 15_000) {
      const r = await ink(chapter, budgetMs - (Date.now() - started) - 5_000);
      chapter = r.chapter;
      if (r.quotaHit) break;
    }
  }
  return chapter;
}

/** Start producing today's chapter in the background (returns immediately). */
export async function kick(state: ChogState) {
  const id = chapterKey(state);
  const existing = await kv.get<Chapter>(id);
  if (existing?.status === "ready") return;
  const retryAt = await kv.get<number>(`retry:${id}`);
  if (!existing && retryAt && Date.now() < retryAt) return;
  if (!(await lock(id))) return;
  after(async () => {
    try {
      // re-read the newest state so nothing the player did meanwhile is overwritten
      const fresh = migrate((await kv.get<ChogState>(state.key)) ?? state);
      if (fresh.day !== state.day) return;
      const chapter = await produce(fresh, 58_000);
      const latest = await kv.get<ChogState>(state.key);
      if (latest && latest.day === fresh.day) {
        adopt(migrate(latest), chapter);
        await saveState(latest);
      }
    } catch (e) {
      console.error("chapter production failed:", (e as Error).message);
    } finally {
      await unlock(id);
    }
  });
}

/** What the client sees while polling. */
export async function chapterStatus(state: ChogState) {
  const chapter = await kv.get<Chapter>(chapterKey(state));
  const retryAt = chapter ? null : await kv.get<number>(`retry:${chapterKey(state)}`);
  return { chapter, progress: chapter ? inkProgress(chapter) : null, writerBusy: !!retryAt && Date.now() < retryAt + 30_000 };
}

/** The keeper has everything in for today (choice made, meals and care done) → draw tomorrow now. */
export function readyForTomorrow(state: ChogState) {
  const chose = state.decision?.day === state.day || state.day === 0;
  return chose && state.meals.length >= 3 && (state.cares?.length ?? 0) >= 3;
}

/**
 * Draw-ahead: once today's meals are final, simulate tomorrow and produce its
 * chapter right now, so it's ready the moment the player comes back.
 */
export function prepareTomorrow(state: ChogState) {
  after(async () => {
    const nextDay = state.day + 1;
    const id = `chapter:${state.key}:${nextDay}`;
    if (!(await lock(id))) return;
    try {
      const tomorrow: ChogState = structuredClone({ ...state, tomorrow: undefined });
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 1);
      endDay(tomorrow, state.meta.demo ? `demo-${nextDay}` : todayKey(d));
      const chapter = await writeChapter(tomorrow, await pickCast(tomorrow));
      await kv.set(id, chapter);
      adopt(tomorrow, chapter);
      // park the simulated day on the real state; it is swapped in at rollover
      const latest = await kv.get<ChogState>(state.key);
      if (latest && latest.day === state.day) {
        latest.tomorrow = tomorrow;
        await saveState(latest);
      }
      let current: Chapter = chapter;
      const started = Date.now();
      while (current.status !== "ready" && Date.now() - started < 35_000) {
        const r = await ink(current, 40_000 - (Date.now() - started));
        current = r.chapter;
        if (r.quotaHit) break;
      }
    } catch (e) {
      console.error("draw-ahead failed:", (e as Error).message);
    } finally {
      await unlock(id);
    }
  });
}

export { stateKey };
