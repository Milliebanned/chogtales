import "server-only";
import { z } from "zod";
import { templateFor } from "./art";
import { describePersonality, FOODS } from "./foods";
import { CARES } from "./care";
import { BEEFS } from "./beef";
import { beefSeenKey, unseenIncomingBeef } from "./chogs";
import { kv } from "./store";
import { DISTRICTS, FACTIONS, NPCS } from "./lore";
import { ARCS, ROLES, SET_PIECES, TWISTS, sample } from "./plotbank";
import { CLIFFHANGERS, COLD_OPENS, CRAFT, LETTERING } from "./craft";
import type { CastMember, Chapter, ChogState, IncomingBeef, LifeUpdate, Panel, Role } from "./types";

const DISTRICT_IDS = DISTRICTS.map((d) => d.id) as [string, ...string[]];

/* ------------------------------------------------------------------ */
/* schemas                                                             */
/* ------------------------------------------------------------------ */

const BondSchema = z.object({
  name: z.string().max(60),
  kind: z.string().max(40),
  status: z.string().max(40),
  note: z.string().max(200),
  look: z.string().max(220).nullish().transform((v) => v || undefined).catch(undefined),
});

const PlanSchema = z.object({
  picksUpFrom: z.string().max(400),
  role: z.object({ title: z.string().max(60), alignment: z.number().min(-100).max(100).catch(0) }),
  title: z.string().max(70),
  tagline: z.string().max(180),
  logline: z.string().max(500),
  districts: z.array(z.string()).max(4).catch([]),
  beats: z.array(z.string().max(300)).min(6).max(10),
  twist: z.string().max(300),
  hook: z.string().max(300),
  nextTime: z.string().max(200).nullish().transform((v) => v || undefined).catch(undefined),
  consequences: z.array(z.object({ emoji: z.string().max(8), text: z.string().max(180) })).max(5).catch([]),
  life: z.object({
    identity: z.string().max(100),
    motive: z.string().max(200),
    bonds: z.array(BondSchema).max(6).catch([]),
    newWounds: z.array(z.string().max(200)).max(2).catch([]),
    openThreads: z.array(z.string().max(200)).max(3).catch([]),
    closedThreads: z.array(z.string().max(200)).max(3).catch([]),
    turningPoint: z.string().max(220).nullish().transform((v) => v || undefined).catch(undefined),
  }),
  choice: z.object({
    prompt: z.string().max(260),
    options: z.array(z.object({ id: z.string().max(3), label: z.string().max(140) })).min(2).max(3),
  }),
  summary: z.string().max(600),
});
type Plan = z.infer<typeof PlanSchema>;

const PanelSchema = z.object({
  shot: z.enum(["extreme-closeup", "closeup", "medium", "wide", "establishing", "action"]).catch("medium"),
  setting: z.enum(DISTRICT_IDS).catch("lanternrow"),
  scene: z.string().max(300).catch("a street in Chog City"),
  action: z.string().max(320).catch("standing and looking around"),
  characters: z.array(z.enum(["hero", "cast"])).max(2).catch(["hero"]),
  castIndex: z.number().int().min(0).max(3).optional().catch(0),
  mood: z.enum(["calm", "tense", "action", "comic", "dark", "sad", "triumph"]).catch("calm"),
  caption: z.string().max(220).nullish().transform((v) => v || undefined).catch(undefined),
  bubbles: z
    .array(
      z.object({
        speaker: z.string().catch("hero"),
        text: z.string().max(170),
        style: z.enum(["speech", "thought", "shout", "whisper"]).catch("speech"),
      }),
    )
    .max(2)
    .catch([]),
  sfx: z.string().max(18).nullish().transform((v) => v || undefined).catch(undefined),
  color: z.boolean().optional().catch(false),
  impact: z.boolean().optional().catch(false),
  others: z.array(z.string().max(60)).max(3).catch([]),
});

const ScriptSchema = z.object({
  extras: z.array(z.object({ name: z.string().max(60), look: z.string().max(220) })).max(6).catch([]),
  cover: z.object({ scene: z.string().max(300), action: z.string().max(300) }),
  pages: z
    .array(z.object({ panels: z.array(PanelSchema).min(3).max(4) }))
    .min(2)
    .max(2),
});

/* ------------------------------------------------------------------ */
/* the brief                                                           */
/* ------------------------------------------------------------------ */

function bible() {
  return [
    "WORLD: Chog City, a sprawling manga metropolis of small mascot creatures called Chogs, each cared for by a 'keeper'. Food is power here.",
    "PLACES: " + DISTRICTS.map((d) => `${d.id} = ${d.name} (${d.vibe})`).join("; "),
    "RECURRING CHARACTERS (a secret may be revealed only as a twist): " +
      NPCS.map((n) => `${n.name} — ${n.role} [secret: ${n.secret}]`).join("; "),
    `FACTIONS: ${FACTIONS.join("; ")}.`,
  ].join("\n");
}

function lifeBrief(state: ChogState) {
  const l = state.life;
  return `WHO THE HERO IS NOW: ${l.identity}. Driven by: ${l.motive}.
PEOPLE IN ITS LIFE: ${l.bonds.length ? l.bonds.map((b) => `${b.name} (${b.kind}, ${b.status}) — ${b.note}${b.look ? ` [looks like: ${b.look}]` : ""}`).join("; ") : "nobody yet"}.
WHAT SHAPED IT: ${l.wounds.length ? l.wounds.join("; ") : "nothing yet — a blank slate"}.
OPEN STORY THREADS (pick up at least one): ${l.threads.length ? l.threads.join("; ") : "none yet"}.
LIFE SO FAR: ${l.timeline.length ? l.timeline.map((t) => `Day ${t.day}: ${t.event}`).join(" → ") : "it just woke up"}.
PERMANENT FACTS: ${state.flags.length ? state.flags.join("; ") : "none"}.`;
}

function lastChapterBrief(state: ChogState) {
  const c = state.lastChapter;
  if (!c)
    return `PREVIOUS CHAPTER: none — this is Chapter 1, the pilot. It must hook a brand-new reader in the first panel.
COLD OPEN (start the chapter right here, mid-scene, and build the mystery from it): ${sample(COLD_OPENS, 1)[0]}
The hero doesn't know who it was before today, but NEVER open with it waking up, and never say "no memories" — show the gap through what others know about it.`;
  const d = state.yesterday?.decision;
  return `PREVIOUS CHAPTER (Chapter ${c.day}, "${c.title}") — what happened, in order: ${c.beats.join(" → ")}
IT ENDED ON: ${c.hook}
${
  c.choice
    ? `THE KEEPER WAS ASKED: "${c.choice.prompt}" Options: ${c.choice.options.map((o) => o.label).join(" / ")}.
THE KEEPER CHOSE: ${d ? `"${d.picked}" — this choice is the MAIN driver of today's chapter; show its consequences clearly.` : "nothing — the hero hesitated, and someone else decided for it. Show the cost of indecision."}`
    : ""
}`;
}

function beefBrief(state: ChogState, incoming: IncomingBeef[]) {
  const lines: string[] = [];
  const out = state.yesterday?.beef;
  if (out)
    lines.push(
      `BEEF THE KEEPER STARTED: yesterday the hero ${BEEFS[out.kind].deed} ${out.target.name} (another player's Chog, in the cast list). This rivalry is a MAIN conflict today: ${out.target.name} strikes back, escalates, or turns it into something unexpected. Show it on panel and list it in "consequences".`,
    );
  for (const b of incoming)
    lines.push(
      `BEEF AGAINST THE HERO: ${b.from.name} (another player's Chog, in the cast list) ${BEEFS[b.kind].deed} the hero. The hero must deal with it today — revenge, a showdown, or a surprising truce.`,
    );
  return lines.join("\n");
}

function heroBrief(state: ChogState, cast: CastMember[]) {
  const traits = state.meta.traits.map((t) => `${t.trait_type}: ${t.value}`).join(", ") || "unknown";
  const y = state.yesterday;
  const meals = !y
    ? "nothing yet"
    : y.meals.length
      ? y.meals.map((m) => `${FOODS[m.food].name}${m.twist ? ` (strange reaction: ${m.twist})` : ""}`).join("; ")
      : `NOTHING — it went hungry (unfed ${state.neglectStreak} day(s) in a row)`;
  const cares = !y?.cares?.length
    ? "nothing — no bath, no bedtime, no attention"
    : y.cares.map((c) => `${CARES[c.care].name}${c.twist ? ` (strange: ${c.twist})` : ""}`).join("; ");
  const seeds = y?.seeds?.length ? y.seeds.map((s) => `- ${s}`).join("\n") : "- none";
  return `HERO: ${state.meta.name}, a Chog. NFT traits: ${traits}. Turn the traits into personality, a signature move and running gags.
HIDDEN TEMPERAMENT (from everything it has eaten): ${describePersonality(state.personality)}. Hunger ${Math.round(state.hunger)}/100.
WHAT IT ATE YESTERDAY: ${meals}
HOW ITS KEEPER CARED FOR IT YESTERDAY: ${cares}. Hygiene ${Math.round(state.hygiene)}/100 (low = filthy, smelly, scruffy — show it), energy ${Math.round(state.energy)}/100 (low = exhausted — show it).
SIDE EFFECTS OF THAT FOOD AND CARE (each must visibly happen today and be listed in "consequences"; none → no such consequences):
${seeds}
TODAY'S CITY EVENT (background pressure): ${state.event}
SEASON MYSTERY (reveal one small new piece): ${state.saga.mystery}
OTHER PLAYERS' CHOGS (cast): ${cast.map((c, i) => `[${i}] ${c.name}, currently "${c.role}"`).join("; ") || "none"}`;
}

const lastOffered = new Map<string, string[]>();

/** Every non-Chog character the artist already has a fixed design for. */
function looksFor(state: ChogState): Record<string, string> {
  const looks: Record<string, string> = {};
  for (const n of NPCS) looks[n.name] = n.look;
  for (const b of state.life.bonds) if (b.look) looks[b.name] = b.look;
  return looks;
}
const knownLooks = (state: ChogState) => Object.keys(looksFor(state)).join(", ");

function planPrompt(state: ChogState, cast: CastMember[], incoming: IncomingBeef[] = []) {
  const arc = ARCS.find((a) => a.id === state.saga.arc) ?? ARCS[0];
  const twists = sample(TWISTS, 3, state.usedTwists);
  const beatNo = (state.day - state.saga.startDay) % arc.beats.length;
  // seasons after the first don't restart the hero's life: reword "awakening" openers
  const beat = arc.beats[beatNo].replace(/^Awakening: the hero wakes with a clean slate( and)?/i, "Opening:").replace(/^Cold open:/i, "Opening:");
  lastOffered.set(state.key, twists);
  return `You are the head writer of a hit weekly manga, "Chog Chronicles". This is a SERIALIZED LIFE STORY: one Chog whose fate keeps changing because of its keeper's decisions. Think of arcs like: a Chog feeds the poor because a politician is hoarding food → is forced to steal from the rich to keep feeding them → becomes sheriff when theft spreads and the city needs order → falls in love → loses that love to violence → becomes an avenger. Every change of identity is CAUSED by what happened and what the keeper chose. Nothing resets.

${bible()}

${lifeBrief(state)}

${lastChapterBrief(state)}

${heroBrief(state, cast)}
${beefBrief(state, incoming)}

WRITE CHAPTER ${state.day}.
HARD RULES:
1. Continuity: open by picking up exactly where the previous chapter ended ("picksUpFrom"). Same people, same places, same consequences. Never restart or repeat the previous chapter.
2. The keeper's decision drives the plot. Make its consequence big and visible — good and bad.
3. The hero's identity may evolve today if the story earns it (thief → sheriff, rebel → mayor, lover → avenger…). If it changes, explain why in "turningPoint". It doesn't have to change every day.
4. Relationships matter: bring back people from its life, deepen them, put them in danger. Love, loyalty, betrayal, loss. If someone dies, it must matter.
5. A clear plot: goal → obstacle → escalation → twist → cliffhanger. 8 beats, each causing the next. At least one clear action scene (chase, fight, standoff, shootout with blasters, heist).
6. Specific places (2–3 PLACES), named characters, concrete objects. Funny and emotional.
8. FOCUS: one central conflict per chapter. Use at most 3 named characters besides the hero. Don't cram every thread in — advance one or two properly; the rest can wait. A reader must be able to retell the chapter in two sentences.
9. The keeper is the READER, never a character in the story: never show or mention the keeper on panel. The keeper's choices show up only through what the hero does and what happens.
10. ${state.day === 1 ? 'This is Chapter 1: "consequences" must be an empty list.' : "Only list consequences that really come from the keeper's decision or yesterday's food and care."}
7. End with a hard moral DECISION for the keeper — 2 or 3 options, each leading somewhere very different (e.g. who to save, whether to betray, whether to take power, steal, forgive, kill or spare). No obviously "right" option.
11. The LAST beat is a cliffhanger. Use one of these: ${sample(CLIFFHANGERS, 3).join(" | ")}
12. "nextTime": a one-line teaser for the next chapter, like the "Next time…" box at the end of a manga chapter. Tease, don't spoil (e.g. "Next time: Vex finally takes off her goggles — and Pip screams.").

${CRAFT}

THIS SEASON'S STORY ENGINE: "${arc.name}" — ${arc.premise}
This is chapter ${beatNo + 1} of 7 in the season. Its beat (adapt it to everything that already happened): ${beat}
Tools you may use (adapt freely): twist ideas: ${twists.join(" | ")}. Action ideas: ${sample(SET_PIECES, 3).join(" | ")}. Possible callings: ${sample(ROLES, 6).join(", ")}.

Return ONLY JSON:
{"picksUpFrom":string,"role":{"title":"what the hero is in THIS chapter, vivid and specific","alignment":-100..100},"title":string (short, no "Chapter N"),"tagline":string,"logline":string,"districts":[2-3 place ids],"beats":[8 strings, one per panel],"twist":string,"hook":string,"nextTime":string,"consequences":[{"emoji":string,"text":"<keeper's decision, food or care> → <what it caused>"}],"life":{"identity":string,"motive":string,"bonds":[{"name":string,"kind":string,"status":string,"note":string,"look":string}] (only people new or changed today; "look" = a distinctive visual design for anyone NEW — a different animal/creature, outfit, colours; they must NOT look like the hero),"newWounds":[string],"openThreads":[string],"closedThreads":[string],"turningPoint":string or null},"choice":{"prompt":string,"options":[{"id":"A","label":string},{"id":"B","label":string},{"id":"C","label":string}]},"summary":string (3 sentences)}`;
}

function scriptPrompt(state: ChogState, cast: CastMember[], plan: Plan) {
  return `You are the storyboard artist of the manga "Chog Chronicles". Turn this chapter plan into 8 panels.

Title: ${plan.title}
Hero: ${state.meta.name}, today "${plan.role.title}"
Opens with: ${plan.picksUpFrom}
Beats (one per panel, in order): ${plan.beats.map((b, i) => `${i + 1}. ${b}`).join(" ")}
Twist: ${plan.twist}
Final hook (last panel): ${plan.hook}
Cast Chogs: ${cast.map((c, i) => `[${i}] ${c.name}`).join("; ") || "none"}. Recurring characters appear by name.
PLACES (use only these ids): ${(plan.districts.length ? plan.districts : ["lanternrow"]).join(", ")}. Stay in one place for several panels; when moving, caption it ("Meanwhile, at…").

RULES:
- Exactly 2 pages × 4 panels. Panel 1 opens mid-action. Page 1 ends on a question; page 2's last panel IS the cliffhanger.
- The illustrator has pictures of the Chogs. Per panel:
  - "scene": the environment (max 20 words).
  - "action": what the characters physically do — pose, motion, expression, props (max 30 words). Name objects (never "it"/"he"). Call the main Chog "the hero", the cast Chog "the rival"; other characters by name. Don't describe the Chogs' looks.
  - "characters": which CHOGS from the players' NFT pictures are in frame: ["hero"], ["hero","cast"] (+castIndex), ["cast"], or [] if neither is visible. Only include "hero" if the hero is actually visible in that panel.
  - "others": names of any OTHER characters visible in the panel (recurring characters, people from the hero's life, or extras). They are drawn from their written look — never like the hero.
- "extras": give a short distinctive look (creature type, outfit, colours) for every named character in this chapter who is NOT in this list of known looks: ${knownLooks(state)}.
- In "scene", "action" and looks, never use these words (the illustrator can't draw them): baby, child, kid, toddler, chibi, body, naked. Say "small", "young", or the character's name.
- Vary shots. "impact": true on hits, blasts, crashes. Action is intense but all-ages (energy blasters, kicks, sparks, dust — no wounds or blood).
- Dialogue: max 15 words per bubble, max 2 bubbles per panel. Speakers: "hero", a character's exact name, or "narrator". Each character sounds different.
- "caption" for narration (max 18 words), on at most half the panels. "sfx" (one short word, max 8 letters) only on action panels — never on quiet ones.

${LETTERING}
- Exactly ONE climax panel has "color": true.
- "cover": a striking scene and pose for the hero capturing today's chapter.

Return ONLY JSON:
{"extras":[{"name":string,"look":string}],"cover":{"scene":string,"action":string},"pages":[{"panels":[{"shot":"extreme-closeup|closeup|medium|wide|establishing|action","setting":"<place id>","scene":string,"action":string,"characters":["hero"],"castIndex":0,"others":[string],"mood":"calm|tense|action|comic|dark|sad|triumph","caption":string,"bubbles":[{"speaker":string,"text":string,"style":"speech|thought|shout|whisper"}],"sfx":string,"color":boolean,"impact":boolean}]},{"panels":[…]}]}`;
}

/* ------------------------------------------------------------------ */
/* providers                                                           */
/* ------------------------------------------------------------------ */

export class WriterBusy extends Error {}

function extractJson(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("no json");
  return JSON.parse(text.slice(start, end + 1));
}

/**
 * Groq's free tier limits tokens per minute PER MODEL, so planning and
 * storyboarding use different models to double the budget.
 */
async function groq<T>(prompt: string, schema: z.ZodType<T>, model: string, effort: "low" | "medium", maxTokens: number): Promise<T> {
  let lastErr = "";
  for (const jsonMode of [true, true, false]) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.95,
        max_tokens: maxTokens,
        ...(model.includes("gpt-oss") ? { reasoning_effort: effort } : {}),
        ...(model.includes("qwen") ? { reasoning_format: "hidden" } : {}),
        ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (res.status === 429) {
      const wait = Math.min(25, parseFloat(res.headers.get("retry-after") ?? "10") || 10);
      lastErr = "429 rate limited";
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (!res.ok) {
      lastErr = `${res.status}: ${(await res.text()).slice(0, 160)}`;
      continue;
    }
    try {
      return schema.parse(extractJson((await res.json()).choices?.[0]?.message?.content ?? ""));
    } catch (e) {
      lastErr = `invalid output: ${(e as Error).message.slice(0, 160)}`;
    }
  }
  throw new WriterBusy(`groq ${model}: ${lastErr}`);
}

async function gemini<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(60_000),
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 1 },
    }),
  });
  if (!res.ok) throw new WriterBusy(`gemini ${res.status}`);
  const j = await res.json();
  return schema.parse(extractJson(j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? ""));
}

async function ask<T>(prompt: string, schema: z.ZodType<T>, stage: "plan" | "script"): Promise<{ value: T; engine: string }> {
  const errors: string[] = [];
  if (process.env.GROQ_API_KEY) {
    const model =
      stage === "plan"
        ? process.env.GROQ_PLAN_MODEL || "openai/gpt-oss-120b"
        : process.env.GROQ_SCRIPT_MODEL || "qwen/qwen3.8-27b";
    try {
      return {
        value: await groq(prompt, schema, model, "medium", stage === "plan" ? 6000 : 8000),
        engine: model,
      };
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  if (process.env.GEMINI_API_KEY) {
    try {
      return { value: await gemini(prompt, schema), engine: "gemini" };
    } catch (e) {
      errors.push((e as Error).message);
    }
  }
  throw new WriterBusy(errors.join(" | ") || "no story writer configured");
}

/* ------------------------------------------------------------------ */
/* writeChapter — throws WriterBusy instead of ever faking a chapter   */
/* ------------------------------------------------------------------ */

export async function writeChapter(state: ChogState, cast: CastMember[]): Promise<Chapter> {
  const t0 = Date.now();
  const incoming = await unseenIncomingBeef(state);
  const plan = (await ask(planPrompt(state, cast, incoming), PlanSchema, "plan")).value;
  const t1 = Date.now();
  const { value: script, engine } = await ask(scriptPrompt(state, cast, plan), ScriptSchema, "script");
  if (incoming.length) await kv.set(beefSeenKey(state), Math.max(...incoming.map((b) => b.at)));
  console.log(`[write] ${state.key} day ${state.day}: plan ${((t1 - t0) / 1000).toFixed(1)}s, script ${((Date.now() - t1) / 1000).toFixed(1)}s`);

  const pages = script.pages.map((pg, i) => {
    const page = { template: state.day + i, panels: pg.panels.slice(0, 4) as Panel[] };
    const t = templateFor(page);
    page.panels = page.panels.map((pn, j) => {
      // trust the action text over the tags: draw whoever the panel is actually about
      const a = pn.action.toLowerCase();
      const hasRival = /\brival\b/.test(a);
      const hasHero = /\bhero\b/.test(a);
      let characters = pn.characters;
      if (characters.length && hasRival) characters = hasHero ? ["hero", "cast"] : ["cast"];
      // never put the hero's NFT into a panel the hero isn't in
      if (characters.includes("hero") && !hasHero) characters = characters.filter((c) => c !== "hero");
      characters = characters.filter((c) => c !== "cast" || cast.length > 0);
      // bubbles may name the rival generically; show the actual Chog's name
      const rivalName = cast[Math.min(pn.castIndex ?? 0, Math.max(0, cast.length - 1))]?.name;
      const bubbles = pn.bubbles.map((b) =>
        /^(cast|rival|the rival)$/i.test(b.speaker.trim()) && rivalName ? { ...b, speaker: rivalName } : b,
      );
      return {
        ...pn,
        bubbles,
        characters,
        castIndex: characters.includes("cast") ? Math.min(pn.castIndex ?? 0, Math.max(0, cast.length - 1)) : undefined,
        shape: t.shapes[j],
      };
    });
    return page;
  });
  const all = pages.flatMap((p) => p.panels);
  // sound effects are punctuation: only on real action, at most three a chapter
  let sfxLeft = 3;
  for (const p of all) {
    if (!p.sfx) continue;
    if ((p.impact || p.mood === "action") && sfxLeft > 0) sfxLeft--;
    else p.sfx = undefined;
  }
  all.forEach((p, i) => (p.color = !!p.color && all.findIndex((x) => x.color) === i));
  if (!all.some((p) => p.color)) all[all.length - 2].color = true;

  const role: Role = { title: plan.role.title.replace(/^the\s+/i, "The "), alignment: plan.role.alignment };
  const lifeUpdate: LifeUpdate = {
    identity: plan.life.identity,
    motive: plan.life.motive,
    bonds: plan.life.bonds,
    newWounds: plan.life.newWounds,
    openThreads: plan.life.openThreads,
    closedThreads: plan.life.closedThreads,
    turningPoint: plan.life.turningPoint,
  };
  return {
    id: `${state.key}:${state.day}`,
    chogKey: state.key,
    day: state.day,
    role,
    title: plan.title.replace(/^.*?(chapter|day)\s*\d+\s*[:\-–—]\s*/i, "").trim() || plan.title,
    tagline: plan.tagline,
    summary: plan.summary,
    heroName: state.meta.name,
    heroImage: state.meta.image,
    cast,
    pages,
    cover: script.cover,
    createdAt: Date.now(),
    engine,
    status: "inking",
    consequences: plan.consequences,
    twistUsed: plan.twist,
    offeredTwists: lastOffered.get(state.key) ?? [],
    choice: { prompt: plan.choice.prompt, options: plan.choice.options.map((o, i) => ({ id: "ABC"[i], label: o.label })) },
    beats: plan.beats,
    hook: plan.hook,
    nextTime: plan.nextTime,
    lifeUpdate,
    looks: {
      ...looksFor(state),
      ...Object.fromEntries(plan.life.bonds.filter((b) => b.look).map((b) => [b.name, b.look!])),
      ...Object.fromEntries(script.extras.map((e) => [e.name, e.look])),
    },
  };
}
