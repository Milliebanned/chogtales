import { DIMS, emptyPersonality, FOODS, TWISTS, WORLD_EVENTS } from "./foods";
import { ARCS, FOOD_SEEDS } from "./plotbank";
import { SEASON_MYSTERIES } from "./lore";
import { CARE_SEEDS, CARE_TWISTS, CARES } from "./care";
import { BEEFS } from "./beef";
import type { BeefKind, CastMember, Care, CareId, ChogMeta, ChogState, Dim, FoodId, Life, Meal, Personality } from "./types";

export const MEALS_PER_DAY = 3;
export const CARES_PER_DAY = 3;

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n * 10) / 10));
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/**
 * Every Chog digests the world differently: its NFT traits give it a hidden
 * sensitivity (0.5x .. 1.6x) per personality dimension.
 */
export function sensitivity(meta: ChogMeta, dim: Dim) {
  const seed = meta.traits.map((t) => `${t.trait_type}:${t.value}`).join("|") + meta.tokenId + dim;
  return 0.5 + (hash(seed) % 1100) / 1000;
}

export function newChogState(key: string, owner: string, meta: ChogMeta): ChogState {
  return {
    key,
    tokenId: meta.tokenId,
    owner,
    meta,
    createdAt: Date.now(),
    day: 1,
    dayDate: todayKey(),
    hunger: 45,
    mood: 60,
    personality: emptyPersonality(),
    meals: [],
    cares: [],
    hygiene: 70,
    energy: 70,
    dirtyStreak: 0,
    neglectStreak: 0,
    role: { title: "The Awakened", alignment: 0 },
    event: pick(WORLD_EVENTS),
    history: [],
    storySoFar: [],
    saga: newSaga(1),
    flags: [],
    usedTwists: [],
    life: emptyLife(),
  };
}

export const emptyLife = (): Life => ({
  identity: "a Chog the city seems to know — though it doesn't know itself",
  motive: "find out why everyone is looking at it",
  bonds: [],
  wounds: [],
  threads: [],
  timeline: [],
});

/** Every Chog gets its own season: a random arc and a random central mystery. */
export function newSaga(startDay: number) {
  return { arc: pick(ARCS).id, mystery: pick(SEASON_MYSTERIES), startDay };
}

/** Fill in fields for states saved by older versions. */
export function migrate(state: ChogState) {
  state.saga ??= newSaga(1);
  state.flags ??= [];
  state.usedTwists ??= [];
  state.life ??= emptyLife();
  state.cares ??= [];
  state.hygiene ??= 70;
  state.energy ??= 70;
  state.dirtyStreak ??= 0;
  for (const h of state.history ?? []) h.seeds ??= [];
  if (state.yesterday) state.yesterday.seeds ??= [];
  return state;
}

/** Feed a food. Effects are hidden, scaled by the Chog's nature, and never certain. */
export function feed(state: ChogState, food: FoodId): string {
  const f = FOODS[food];
  const p = state.personality;
  const pull: Partial<Record<Dim, number>> =
    food === "mystery"
      ? Object.fromEntries([pick(DIMS), pick(DIMS)].map((d) => [d, (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 4)]))
      : f.pull;

  for (const [d, v] of Object.entries(pull) as [Dim, number][]) {
    const luck = 0.3 + Math.random() * 1.5; // same food, different day, different result
    p[d] = clamp(p[d] + v * luck * sensitivity(state.meta, d), -20, 20);
  }

  // every meal secretly plants one concrete story consequence
  const meal: Meal = { food, seed: pick(FOOD_SEEDS[food] ?? FOOD_SEEDS.mystery) };
  // ~1 in 5 meals does something nobody expected
  if (Math.random() < 0.2) {
    const d = pick(DIMS);
    p[d] = clamp(p[d] + (Math.random() < 0.5 ? -3 : 3), -20, 20);
    meal.twist = pick(TWISTS);
  }

  state.hunger = clamp(state.hunger - 28 - Math.random() * 10);
  state.mood = clamp(state.mood + 4 + Math.random() * 8);
  state.meals.push(meal);
  return meal.twist ?? pick(f.reactions);
}

/** A care action. Like food: hidden effects, scaled by the Chog's NFT nature, never certain. */
export function care(state: ChogState, id: CareId): string {
  const c = CARES[id];
  const p = state.personality;
  for (const [d, v] of Object.entries(c.pull) as [Dim, number][]) {
    const luck = 0.3 + Math.random() * 1.5;
    p[d] = clamp(p[d] + v * luck * sensitivity(state.meta, d), -20, 20);
  }
  const act: Care = { care: id, seed: pick(CARE_SEEDS[id]) };
  if (Math.random() < 0.15) act.twist = pick(CARE_TWISTS);
  state.hygiene = clamp(state.hygiene + (c.stats.hygiene ?? 0));
  state.energy = clamp(state.energy + (c.stats.energy ?? 0));
  state.mood = clamp(state.mood + (c.stats.mood ?? 0));
  state.cares.push(act);
  return act.twist ?? pick(c.reactions);
}

/** Start beef with another player's Chog. One a day; it becomes tomorrow's main conflict. */
export function startBeef(state: ChogState, kind: BeefKind, target: CastMember): string {
  const b = BEEFS[kind];
  for (const [d, v] of Object.entries(b.pull) as [Dim, number][]) {
    const luck = 0.3 + Math.random() * 1.5;
    state.personality[d] = clamp(state.personality[d] + v * luck * sensitivity(state.meta, d), -20, 20);
  }
  state.beef = { day: state.day, kind, target };
  state.mood = clamp(state.mood + 5);
  return pick(b.reactions);
}

/** Close the day: archive it, roll tomorrow's world event, apply overnight hunger. */
export function endDay(state: ChogState, nextDate: string, skippedDays = 0) {
  const fed = state.meals.length > 0;
  const seeds = [...state.meals, ...state.cares].map((m) => m.seed).filter(Boolean) as string[];
  if (!fed) seeds.push(pick(FOOD_SEEDS.neglect));
  // skipped baths and sleep leave their own marks on the story
  state.dirtyStreak = state.hygiene < 30 ? state.dirtyStreak + 1 : 0;
  if (state.dirtyStreak >= 2) seeds.push(pick(CARE_SEEDS.filthy));
  if (state.energy < 20) seeds.push(pick(CARE_SEEDS.exhausted));
  const decision = state.decision?.day === state.day ? state.decision : undefined;
  const beef = state.beef?.day === state.day ? state.beef : undefined;
  const record = { day: state.day, meals: [...state.meals], cares: [...state.cares], beef, role: state.role, event: state.event, seeds, decision };
  state.history.push(record);
  state.yesterday = record;
  state.neglectStreak = fed ? 0 : state.neglectStreak + 1 + skippedDays;
  if (!fed) {
    // hunger leaves its own mark — but which mark is never certain
    state.personality.darkness = clamp(state.personality.darkness + 1 + Math.random() * 3 * state.neglectStreak, -20, 20);
    state.personality[pick(DIMS)] += Math.random() < 0.5 ? -2 : 2;
    state.mood = clamp(state.mood - 15 - 10 * skippedDays);
  }
  state.hunger = clamp(state.hunger + 35 + skippedDays * 30);
  state.mood = clamp(state.mood - 5);
  state.meals = [];
  state.cares = [];
  state.beef = undefined;
  // a day in the city: everyone gets grubby and tired
  state.hygiene = clamp(state.hygiene - 22 - skippedDays * 20);
  state.energy = clamp(state.energy - 12 - skippedDays * 10);
  if (state.dirtyStreak >= 3) state.personality.chaos = clamp(state.personality.chaos + 1 + Math.random() * 2, -20, 20);
  state.decision = undefined;
  state.event = pick(WORLD_EVENTS);
  state.day += 1 + skippedDays;
  // a season lasts 7 chapters; then a brand-new arc begins
  if (state.day - state.saga.startDay >= 7) state.saga = newSaga(state.day);
  state.dayDate = nextDate;
}

/**
 * Move to the next day. If tomorrow was already simulated and drawn ahead
 * (draw-ahead after the last meal), swap it in so its chapter matches exactly.
 */
export function advanceDay(state: ChogState, nextDate: string, skippedDays = 0) {
  const t = state.tomorrow;
  if (skippedDays === 0 && t && t.day === state.day + 1) {
    Object.assign(state, t, { dayDate: nextDate, tomorrow: undefined });
  } else {
    state.tomorrow = undefined;
    endDay(state, nextDate, skippedDays);
  }
}

/** Real-time rollover: if the calendar moved on, close out the old day(s). */
export function rollover(state: ChogState): boolean {
  if (state.meta.demo) return false;
  const today = todayKey();
  if (state.dayDate === today) return false;
  const diff = Math.round((Date.parse(today) - Date.parse(state.dayDate)) / 86_400_000);
  advanceDay(state, today, Math.max(0, diff - 1));
  return true;
}

/** A vague, changing hint — never a formula. */
export function omen(state: ChogState): string {
  const p: Personality = state.personality;
  const strongest = DIMS.reduce((a, b) => (Math.abs(p[b]) > Math.abs(p[a]) ? b : a));
  if (state.hygiene < 25) return "It smells… memorable. The neighbours' cat crossed the street to avoid it.";
  if (state.energy < 20) return "It keeps nodding off mid-sentence. Its eyes have dark rings.";
  if (state.meals.length === 0)
    return state.neglectStreak > 0
      ? "Its stomach growls. It has been staring at the neighbours' food for a while…"
      : "It's waiting by its bowl. What will you give it today?";
  if (Math.abs(p[strongest]) < 3) return "Something is changing inside it, but it's too early to tell what.";
  const lines: Record<Dim, string[]> = {
    courage: ["It keeps shadow-boxing in the mirror.", "It growled at a dog twice its size."],
    kindness: ["It left a flower at the neighbour's door.", "It keeps checking on the stray cats."],
    mischief: ["Your socks keep disappearing.", "It's grinning at the market from the window."],
    greed: ["It's counting coins. Where did it get coins?", "It hid something shiny under its bed."],
    chaos: ["It rearranged the furniture. Upside down.", "It laughs at thunder."],
    darkness: ["It's been sitting in the dark, very still.", "The shadows around it look longer than usual."],
    wisdom: ["It's reading. Upside down, but still.", "It answered a question nobody asked."],
    energy: ["It hasn't stopped moving in three hours.", "It ran up the wall. Twice."],
  };
  const flip = p[strongest] < 0 ? "…but something about it feels off." : "";
  return `${lines[strongest][Math.floor(Date.now() / 60000) % 2]} ${flip}`.trim();
}
