"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import ChapterPdf from "./ChapterPdf";
import MangaReader from "./MangaReader";
import { FOODS } from "@/lib/foods";
import { CARES } from "@/lib/care";
import { BEEFS } from "@/lib/beef";
import { roleColor, roleLean } from "@/lib/roleStyle";
import { sfx } from "@/lib/sound";
import type { Beef, BeefKind, CastMember, Care, CareId, Chapter, ChogMeta, Decision, FoodId, Life, Meal, Role } from "@/lib/types";

interface PublicState {
  tokenId: string;
  meta: ChogMeta;
  day: number;
  hunger: number;
  mood: number;
  aura: string;
  role: Role;
  event: string;
  meals: Meal[];
  mealsLeft: number;
  cares: Care[];
  caresLeft: number;
  beef: Beef | null;
  hygiene: number;
  energy: number;
  neglectStreak: number;
  omen: string;
  life: Life;
  decision: Decision | null;
  decisions: Record<number, string>;
  chapters: { id: string; day: number; title: string; role: Role; tagline: string; cover: string | null; status: string; published: string | null }[];
  demo: boolean;
}

interface ChapterResponse {
  chapter: Chapter | null;
  progress: { done: number; total: number } | null;
  writing: boolean;
  writerBusy: boolean;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Request failed");
  return j as T;
}

const WRITING_LINES = [
  "The writer is reading what your Chog ate…",
  "Deciding who your Chog becomes…",
  "Plotting a twist nobody expects…",
  "Writing the dialogue…",
];

/** Local time when the free art quota resets (00:00 UTC). */
function resetTime() {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function Dashboard({ tokenId, onBack }: { tokenId: string; onBack: () => void }) {
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState("");
  const [reaction, setReaction] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<Chapter | null>(null);
  // PDF export: a queue of files; each file holds one or more chapters
  const [pdfQueue, setPdfQueue] = useState<Chapter[][]>([]);
  const [pdfTotal, setPdfTotal] = useState(0);
  const [picker, setPicker] = useState(false);
  const [picked, setPicked] = useState<number[]>([]);
  const [combine, setCombine] = useState(true);
  const [rivals, setRivals] = useState<CastMember[]>([]);
  const [rival, setRival] = useState<string | null>(null);
  const [readingToday, setReadingToday] = useState(false);
  const [tab, setTab] = useState<"today" | "life" | "saga">("today");
  const [actTab, setActTab] = useState<"feed" | "care" | "beef">("feed");
  const [hint, setHint] = useState("");
  const [publishing, setPublishing] = useState<number | null>(null);
  const [price, setPrice] = useState("0");
  const [today, setToday] = useState<ChapterResponse | null>(null);
  const [phase, setPhase] = useState<"idle" | "writing" | "inking" | "resting">("idle");
  const [line, setLine] = useState(0);
  const [bump, setBump] = useState(0);
  const [reveal, setReveal] = useState<{ role: Role; day: number } | null>(null);
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; y: number; tx: number; ty: number; delay: number }[]>([]);
  const artRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealNext = useRef(false);
  const seenKey = `cc_seen_day_${tokenId}`;

  const load = useCallback(async () => {
    try {
      const s = await api<PublicState>(`/api/chog/state?tokenId=${tokenId}`);
      setState(s);
      return s;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [tokenId]);

  /**
   * Today's chapter is produced in the background on the server; this just
   * polls (cheap, instant responses) and updates the UI as panels arrive.
   */
  const runChapter = useCallback(async () => {
    if (pollRef.current) clearTimeout(pollRef.current);
    try {
      const r = await api<ChapterResponse>("/api/chog/chapter", { method: "POST", body: JSON.stringify({ tokenId }) });
      setToday(r);
      const ch = r.chapter;
      if (ch && revealNext.current) {
        revealNext.current = false;
        setReveal({ role: ch.role, day: ch.day });
        sfx("impact");
      }
      if (!ch) {
        setPhase("writing");
      } else if (ch.status === "ready") {
        setPhase((p) => {
          if (p !== "idle") sfx("chime");
          return "idle";
        });
        load();
        return;
      } else if (ch.quotaHitAt && Date.now() - ch.quotaHitAt < 10 * 60_000) {
        setPhase("resting");
        pollRef.current = setTimeout(runChapter, 60_000);
        return;
      } else {
        setPhase("inking");
      }
      pollRef.current = setTimeout(runChapter, 2500);
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }, [tokenId, load]);

  useEffect(() => {
    (async () => {
      const s = await load();
      if (!s) return;
      let seen = 0;
      try {
        seen = Number(localStorage.getItem(seenKey) || 0);
        localStorage.setItem(seenKey, String(s.day));
      } catch {}
      if (seen && s.day > seen) revealNext.current = true; // a real day passed
      runChapter(); // always: makes sure today's chapter is being produced right away
    })();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  useEffect(() => {
    if (phase !== "writing") return;
    const t = setInterval(() => setLine((l) => (l + 1) % WRITING_LINES.length), 1800);
    return () => clearInterval(t);
  }, [phase]);

  async function give(food: FoodId, e: React.MouseEvent) {
    if (busy || !state || state.mealsLeft <= 0) return;
    act("/api/chog/feed", { food }, FOODS[food].emoji, e);
  }

  async function tend(action: CareId, e: React.MouseEvent) {
    if (busy || !state || state.caresLeft <= 0) return;
    act("/api/chog/care", { action }, CARES[action].emoji, e);
  }

  async function act(url: string, body: Record<string, string>, emoji: string, e: React.MouseEvent) {
    if (!state) return;
    setBusy(true);
    sfx("feed");
    const id = Date.now();
    const from = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const to = artRef.current?.getBoundingClientRect();
    if (to) {
      setParticles((p) => [
        ...p,
        ...Array.from({ length: 5 }, (_, i) => ({
          id: id + i,
          emoji,
          x: from.left + from.width / 2,
          y: from.top + from.height / 2,
          tx: to.left + to.width / 2 + (Math.random() - 0.5) * 90,
          ty: to.top + to.height / 2 + (Math.random() - 0.5) * 90,
          delay: i * 0.07,
        })),
      ]);
      setTimeout(() => setParticles((p) => p.filter((x) => x.id < id || x.id > id + 10)), 1500);
    }
    try {
      const r = await api<{ reaction: string; state: PublicState }>(url, {
        method: "POST",
        body: JSON.stringify({ tokenId, ...body }),
      });
      setState(r.state);
      setReaction(r.reaction);
      setBump((b) => b + 1);
    } catch (err) {
      setReaction((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function choose(option: string) {
    try {
      const r = await api<{ state: PublicState }>("/api/chog/choose", { method: "POST", body: JSON.stringify({ tokenId, option }) });
      setState(r.state);
      sfx("impact");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function nextDay() {
    setBusy(true);
    try {
      const r = await api<{ state: PublicState }>("/api/chog/next-day", { method: "POST", body: JSON.stringify({ tokenId }) });
      sfx("turn");
      setState(r.state);
      setToday(null);
      try {
        localStorage.setItem(seenKey, String(r.state.day));
      } catch {}
      revealNext.current = true;
      runChapter();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    api<{ targets: CastMember[] }>(`/api/chog/beef?tokenId=${tokenId}`)
      .then((r) => setRivals(r.targets))
      .catch(() => {});
  }, [tokenId]);

  async function beef(kind: BeefKind, e: React.MouseEvent) {
    if (busy || !state || state.beef || !rival) return;
    act("/api/chog/beef", { kind, target: rival }, BEEFS[kind].emoji, e);
  }

  /** Download chapters as one combined PDF, or one PDF per chapter. */
  async function downloadPdfs(days: number[], together: boolean) {
    if (pdfQueue.length || !days.length) return;
    try {
      const chapters = (
        await Promise.all([...days].sort((a, b) => a - b).map((d) => api<{ chapter: Chapter }>(`/api/chog/chapter?tokenId=${tokenId}&day=${d}`)))
      )
        .map((r) => r.chapter)
        .filter((c) => c.status === "ready");
      const files = together ? [chapters] : chapters.map((c) => [c]);
      setPdfTotal(files.length);
      setPdfQueue(files);
      setPicker(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Put a chapter in the public Library, free or for $CHOG paid straight to this wallet. */
  async function publish(day: number, p: string | null) {
    setBusy(true);
    try {
      await api("/api/library/publish", { method: p === null ? "DELETE" : "POST", body: JSON.stringify({ tokenId, day, price: p ?? "0" }) });
      setPublishing(null);
      await load();
      sfx("chime");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function readOld(day: number) {
    try {
      const r = await api<{ chapter: Chapter }>(`/api/chog/chapter?tokenId=${tokenId}&day=${day}`);
      if (r.chapter.status === "ready") setReading(r.chapter);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !state)
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <p className="text-red-300">{error}</p>
        <button onClick={onBack} className="mt-6 underline">Back</button>
      </div>
    );
  if (!state) return <div className="p-20 text-center text-white/50">Waking your Chog…</div>;

  const todayChapter = today?.chapter && today.chapter.day === state.day ? today.chapter : null;
  const readyChapters = state.chapters.filter((c) => c.status === "ready");
  const ready = todayChapter?.status === "ready";
  const role = todayChapter?.role ?? state.role;
  const color = roleColor(role.alignment);
  const moodFace = state.hunger > 75 ? "😾" : state.mood > 75 ? "😸" : state.mood < 30 ? "😿" : "🙂";

  const steps = [
    { t: "Read", done: ready },
    { t: "Decide", done: !!state.decision },
    { t: `Meals ${3 - state.mealsLeft}/3`, done: state.mealsLeft === 0 },
    { t: `Care ${3 - state.caresLeft}/3`, done: state.caresLeft === 0 },
    { t: state.beef ? "Beef started" : "Beef (optional)", done: !!state.beef },
  ];
  const actTabs = [
    { id: "feed" as const, label: "Feed", emoji: "🍙", left: state.mealsLeft, max: 3 },
    { id: "care" as const, label: "Care", emoji: "🛁", left: state.caresLeft, max: 3 },
    { id: "beef" as const, label: "Beef", emoji: "🔥", left: state.beef ? 0 : 1, max: 1 },
  ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col px-4 pb-6 sm:px-6 lg:h-[calc(100vh-76px)]">
      {/* header: who, which day, where to go */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 pb-3">
        <button onClick={onBack} className="text-sm text-white/50 transition hover:text-white">← My Chogs</button>
        <div className="flex min-w-0 items-baseline gap-3">
          <h2 className="truncate font-[family-name:var(--font-dela)] text-2xl text-white">{state.meta.name}</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">Day {state.day}</span>
          <span className="hidden max-w-[260px] truncate rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-black sm:inline" style={{ background: color }}>
            {role.title}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="seg">
            {(["today", "life", "saga"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} data-on={tab === t}>
                {t === "today" ? "Today" : t === "life" ? "Life story" : `My Saga · ${state.chapters.length}`}
              </button>
            ))}
          </div>
          {state.demo && (
            <button
              onClick={nextDay}
              disabled={busy || phase === "writing"}
              title="Demo mode: jump to the next day"
              className="rounded-full border border-amber-300/40 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-40"
            >
              ⏭ Next day
            </button>
          )}
        </div>
      </div>

      {/* today's checklist */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {steps.map((st) => (
          <span key={st.t} className={`chip ${st.done ? "chip-done" : ""}`}>
            {st.done ? "✓" : "○"} {st.t}
          </span>
        ))}
        {state.demo && <span className="chip border-amber-300/30 text-amber-200/80">Demo mode</span>}
      </div>

      {tab === "today" && (
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(250px,300px)_minmax(0,1fr)_minmax(340px,400px)]">
          {/* ---------------- the Chog ---------------- */}
          <div className="card relative flex min-h-0 flex-col overflow-hidden p-4">
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{ background: `radial-gradient(420px 280px at 50% 25%, ${state.aura}40, transparent 70%)` }}
              transition={{ duration: 1.2 }}
            />
            <div ref={artRef} className="relative mx-auto aspect-square w-full max-w-[240px] lg:max-w-[min(240px,30vh)]">
              <motion.div
                className="absolute -inset-3 rounded-[28px] blur-2xl"
                animate={{ background: state.aura, opacity: [0.35, 0.6, 0.35] }}
                transition={{ opacity: { duration: 3, repeat: Infinity } }}
              />
              <motion.div
                key={bump}
                className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15"
                animate={{ y: [0, -6, 0], scale: bump ? [1, 1.06, 0.97, 1] : 1 }}
                transition={{ y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.5 } }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.meta.image} alt={state.meta.name} className="h-full w-full object-cover" />
              </motion.div>
              <div className="absolute -right-2 -top-2 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-2xl shadow-lg">{moodFace}</div>
            </div>
            <div className="relative mt-4 min-h-[56px]">
              <AnimatePresence mode="wait">
                {reaction ? (
                  <motion.p
                    key={reaction + bump}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl bg-white px-3 py-2 text-center font-[family-name:var(--font-comic)] text-sm font-bold text-black"
                    onAnimationComplete={() => setTimeout(() => setReaction(""), 4500)}
                  >
                    {reaction}
                  </motion.p>
                ) : (
                  <motion.p key="omen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="line-clamp-3 text-center text-sm italic text-white/70">
                    {state.omen}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="relative mt-auto grid grid-cols-2 gap-x-4 gap-y-3 pt-4">
              <Meter label="Hunger" value={state.hunger} color="#fb7185" warn={state.hunger > 75} />
              <Meter label="Mood" value={state.mood} color="#facc15" warn={state.mood < 25} />
              <Meter label="Hygiene" value={state.hygiene} color="#38bdf8" warn={state.hygiene < 25} />
              <Meter label="Energy" value={state.energy} color="#a3e635" warn={state.energy < 20} />
            </div>
            {(state.meals.length > 0 || state.cares.length > 0) && (
              <div className="relative mt-3 flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
                Today:
                {state.meals.map((m, i) => (
                  <span key={`m${i}`} className="text-base" title={FOODS[m.food].name}>{FOODS[m.food].emoji}</span>
                ))}
                {state.cares.map((c, i) => (
                  <span key={`c${i}`} className="text-base" title={CARES[c.care].name}>{CARES[c.care].emoji}</span>
                ))}
                {state.beef && <span className="text-base" title={BEEFS[state.beef.kind].name}>{BEEFS[state.beef.kind].emoji}</span>}
              </div>
            )}
          </div>

          {/* ---------------- today's chapter + decision ---------------- */}
          <div className="flex min-h-0 flex-col gap-4">
            <ChapterCard
              state={state}
              phase={phase}
              line={WRITING_LINES[line]}
              today={todayChapter}
              progress={today?.progress ?? undefined}
              writerBusy={today?.writerBusy}
              color={color}
              onRead={() => {
                if (ready) setReadingToday(true);
                else runChapter();
              }}
            />
            <div className="card flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              {todayChapter?.choice ? (
                <>
                  <div className="text-[11px] text-white/45 font-bold uppercase tracking-[0.25em]">Your decision · shapes the next chapter</div>
                  <p className="mt-2 text-sm font-semibold text-white">{todayChapter.choice.prompt}</p>
                  <div className="mt-3 grid min-h-0 gap-2 overflow-y-auto pr-1">
                    {todayChapter.choice.options.map((o) => {
                      const picked = state.decision?.picked === o.label;
                      return (
                        <button
                          key={o.id}
                          disabled={!!state.decision || !ready}
                          onClick={() => choose(o.id)}
                          className={`flex items-start gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                            picked ? "border-amber-300 bg-amber-300 font-semibold text-black" : state.decision || !ready ? "border-white/10 text-white/35" : "border-white/15 hover:border-amber-300 hover:bg-white/5"
                          }`}
                        >
                          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${picked ? "bg-black text-amber-300" : "bg-white/10 text-amber-300"}`}>{picked ? "✓" : o.id}</span>
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                  {!state.decision && <p className="mt-2 text-[11px] text-white/40">{ready ? "Read the chapter first. Once you choose, there's no going back." : "Unlocks when the chapter is drawn."}</p>}
                </>
              ) : (
                <div className="grid flex-1 place-items-center text-center text-sm text-white/40">The decision appears at the end of today&apos;s chapter.</div>
              )}
              <div className="mt-3 border-t border-white/10 pt-3 text-xs text-white/55">
                <span className="font-bold uppercase tracking-[0.2em] text-white/40">Today in Chog City</span> · {state.event}
              </div>
            </div>
          </div>

          {/* ---------------- one action panel: feed / care / beef ---------------- */}
          <div className="card flex min-h-0 flex-col p-4">
            <div className="seg seg-full">
              {actTabs.map((t) => (
                <button key={t.id} onClick={() => setActTab(t.id)} data-on={actTab === t.id}>
                  {t.emoji} {t.label} <span className="opacity-60">{t.left}/{t.max}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-white/45">
              {actTab === "feed" && "Every food changes your Chog in its own secret way, and no two Chogs react the same."}
              {actTab === "care" && "How you raise it shapes who it becomes. Skipped baths and late nights show up in the story too."}
              {actTab === "beef" && "Pick another keeper's Chog and start something. It becomes the main fight of your next chapter, and lands in theirs."}
            </p>

            <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
              {actTab === "feed" && (
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(FOODS).map((f) => (
                    <Tile key={f.id} emoji={f.emoji} name={f.name} blurb={f.blurb} disabled={busy || state.mealsLeft <= 0} onHint={setHint} onClick={(e) => give(f.id, e)} />
                  ))}
                </div>
              )}
              {actTab === "care" && (
                <div className="grid grid-cols-4 gap-2">
                  {Object.values(CARES).map((c) => (
                    <Tile key={c.id} emoji={c.emoji} name={c.name} blurb={c.blurb} disabled={busy || state.caresLeft <= 0} onHint={setHint} onClick={(e) => tend(c.id, e)} />
                  ))}
                </div>
              )}
              {actTab === "beef" &&
                (state.beef ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={state.beef.target.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                    <p className="text-sm text-white/85">
                      {BEEFS[state.beef.kind].emoji} You chose <b>{BEEFS[state.beef.kind].name.toLowerCase()}</b> against <b>{state.beef.target.name}</b>. It&apos;s in tomorrow&apos;s chapter, and in theirs.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">1. Pick a rival</div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {rivals.map((r) => (
                        <button
                          key={r.tokenId}
                          onClick={() => setRival(r.tokenId)}
                          className={`flex w-[68px] shrink-0 flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] transition ${rival === r.tokenId ? "border-orange-300 bg-orange-400/20" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={r.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          <span className="w-full truncate text-center">{r.name}</span>
                        </button>
                      ))}
                      {!rivals.length && <p className="text-xs text-white/40">No other Chogs around yet.</p>}
                    </div>
                    <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">2. Make your move</div>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {Object.values(BEEFS).map((b) => (
                        <Tile key={b.id} emoji={b.emoji} name={b.name} blurb={b.blurb} disabled={busy || !rival} onHint={setHint} onClick={(e) => beef(b.id, e)} hot />
                      ))}
                    </div>
                  </>
                ))}
            </div>
            <div className="mt-3 min-h-[36px] rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs text-white/60">
              {hint ||
                (actTab === "feed" && state.mealsLeft <= 0
                  ? "It's full for today. What will it become tomorrow?"
                  : actTab === "care" && state.caresLeft <= 0
                    ? "That's enough fussing for today."
                    : actTab === "beef" && !rival && !state.beef
                      ? "Pick a rival first."
                      : "Hover a tile to see what it is.")}
            </div>
          </div>
        </div>
      )}

      {tab === "life" && (
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[1.3fr_1fr]">
          <LifePanel life={state.life} />
          <div className="card p-5">
            <div className="text-[11px] text-white/45 font-bold uppercase tracking-[0.25em]">Today in Chog City</div>
            <p className="mt-2 text-white/85">📰 {state.event}</p>
            <div className="mt-6 text-[11px] text-white/45 font-bold uppercase tracking-[0.25em]">What you notice</div>
            <p className="mt-2 italic text-white/75">{state.omen}</p>
          </div>
        </div>
      )}

      {tab === "saga" && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h3 className="font-[family-name:var(--font-dela)] text-2xl text-white">My Saga</h3>
              <a href="/library" className="text-xs text-violet-300 hover:text-white">Browse the Library →</a>
            </div>
            {readyChapters.length > 0 && (
              <button
                onClick={() => {
                  setPicker((p) => !p);
                  setPicked(readyChapters.map((c) => c.day));
                }}
                disabled={pdfQueue.length > 0}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
              >
                {pdfQueue.length ? `Saving PDF ${pdfTotal - pdfQueue.length + 1} of ${pdfTotal}…` : "⬇ Download chapters"}
              </button>
            )}
          </div>
          {picker && (
            <div className="card mb-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold">Which chapters?</div>
                <div className="flex gap-3 text-xs text-white/60">
                  <button onClick={() => setPicked(readyChapters.map((c) => c.day))} className="hover:text-white">Select all</button>
                  <button onClick={() => setPicked([])} className="hover:text-white">Clear</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {readyChapters.map((c) => {
                  const on = picked.includes(c.day);
                  return (
                    <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm ${on ? "border-[var(--chog)] bg-[var(--chog)]/15" : "border-white/10 bg-white/5"}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => setPicked((p) => (on ? p.filter((d) => d !== c.day) : [...p, c.day]))}
                        className="accent-[var(--chog)]"
                      />
                      <span className="min-w-0 truncate">
                        <b>Ch.{c.day}</b> · {c.title}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {[
                  { v: true, t: "One PDF", d: "all chapters in a single book" },
                  { v: false, t: "Separate PDFs", d: "one file per chapter" },
                ].map((o) => (
                  <button
                    key={o.t}
                    onClick={() => setCombine(o.v)}
                    className={`rounded-xl border px-3 py-2 text-left ${combine === o.v ? "border-[var(--chog)] bg-[var(--chog)]/15" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                  >
                    <span className="block font-semibold">{o.t}</span>
                    <span className="block text-xs text-white/50">{o.d}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => downloadPdfs(picked, combine || picked.length === 1)}
                disabled={!picked.length}
                className="btn-primary mt-4 w-full py-3 text-sm"
              >
                {picked.length ? `⬇ Download ${picked.length} chapter${picked.length === 1 ? "" : "s"}${combine || picked.length === 1 ? "" : ` as ${picked.length} PDFs`}` : "Pick at least one chapter"}
              </button>
              {!combine && picked.length > 1 && <p className="mt-2 text-center text-xs text-white/40">Your browser may ask once to allow multiple downloads.</p>}
            </div>
          )}
          {state.chapters.length === 0 ? (
            <p className="text-white/40">No chapters yet. Read today&apos;s chapter to begin your story.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {[...state.chapters].reverse().map((c) => (
                <div key={c.id} className="flex flex-col gap-2">
                  <motion.button
                    whileHover={{ y: -6, rotate: -1 }}
                    onClick={() => readOld(c.day)}
                    className="relative aspect-[0.68] w-full overflow-hidden rounded-lg border-2 border-black bg-[#1a1626] text-left shadow-xl"
                  >
                    {c.cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute left-2 top-2 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-black" style={{ background: roleColor(c.role.alignment) }}>
                      Ch.{c.day}
                    </div>
                    <div className="absolute bottom-0 p-3">
                      <div className="line-clamp-2 text-[10px] uppercase tracking-widest" style={{ color: roleColor(c.role.alignment) }}>{c.role.title}</div>
                      <div className="font-[family-name:var(--font-dela)] text-base leading-tight">{c.title}</div>
                      {c.status !== "ready" && <div className="mt-1 text-[10px] text-white/50">Still inking…</div>}
                    </div>
                  </motion.button>
                  {c.status === "ready" && (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => downloadPdfs([c.day], true)}
                        disabled={pdfQueue.length > 0}
                        className="rounded-lg border border-white/15 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                      >
                        ⬇ PDF
                      </button>
                      {c.published !== null ? (
                        <button
                          onClick={() => publish(c.day, null)}
                          disabled={busy}
                          title="Remove from the Library"
                          className="rounded-lg border border-violet-400/40 bg-violet-500/15 py-1.5 text-xs text-violet-100 hover:bg-violet-500/25"
                        >
                          {c.published === "0" ? "📚 Free" : `📚 ${Number(c.published).toLocaleString()} $CHOG`}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPublishing(publishing === c.day ? null : c.day);
                            setPrice("0");
                          }}
                          className="btn-primary py-1.5 text-xs"
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  )}
                  {publishing === c.day && (
                    <div className="card space-y-2 p-2.5">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Publish to the Library</div>
                      <div className="grid grid-cols-2 gap-1">
                        {(state.demo ? ["0"] : ["0", "50", "100", "500"]).map((v) => (
                          <button
                            key={v}
                            onClick={() => setPrice(v)}
                            className={`rounded-md border px-1 py-1 text-[11px] ${price === v ? "border-violet-400 bg-violet-500/25 text-white" : "border-white/10 text-white/60 hover:border-white/30"}`}
                          >
                            {v === "0" ? "Free" : `${v} $CHOG`}
                          </button>
                        ))}
                      </div>
                      {!state.demo && (
                        <input
                          value={price}
                          onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                          placeholder="Custom $CHOG"
                          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs outline-none focus:border-violet-400"
                        />
                      )}
                      <p className="text-[10px] leading-snug text-white/40">
                        {state.demo ? "Demo keepers publish for free. Connect a wallet to sell for $CHOG." : "Readers pay $CHOG straight to your wallet. Page 1 stays free as a preview."}
                      </p>
                      <button onClick={() => publish(c.day, price || "0")} disabled={busy} className="btn-primary w-full py-1.5 text-xs">
                        {busy ? "Publishing…" : `Publish · ${price === "0" || !price ? "Free" : `${price} $CHOG`}`}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-center text-sm text-red-300">{error}</p>}

      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none fixed z-40 text-3xl"
          initial={{ left: p.x, top: p.y, scale: 0.6, opacity: 1 }}
          animate={{ left: p.tx, top: [p.y, Math.min(p.y, p.ty) - 120, p.ty], scale: [0.6, 1.4, 0.4], opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, delay: p.delay, ease: "easeInOut" }}
          style={{ translate: "-50% -50%" }}
        >
          {p.emoji}
        </motion.span>
      ))}

      <AnimatePresence>
        {reveal && (
          <RoleReveal
            role={reveal.role}
            day={reveal.day}
            image={todayChapter?.cover.image ?? state.meta.image}
            ready={ready}
            onDone={() => setReveal(null)}
            onRead={() => {
              if (!ready) return;
              setReveal(null);
              setReadingToday(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {readingToday && todayChapter && (
          <MangaReader chapter={todayChapter} onClose={() => setReadingToday(false)} decision={state.decision?.picked ?? null} onChoose={choose} />
        )}
        {reading && <MangaReader chapter={reading} onClose={() => setReading(null)} />}
      </AnimatePresence>
      {pdfQueue.length > 0 && (
        <ChapterPdf
          key={pdfTotal - pdfQueue.length}
          chapters={pdfQueue[0]}
          decisions={{ ...state.decisions, ...(state.decision ? { [state.day]: state.decision.picked } : {}) }}
          onDone={(err) => {
            if (err) setError(err);
            setPdfQueue((q) => (err ? [] : q.slice(1)));
          }}
        />
      )}
    </div>
  );
}

function ChapterCard({
  state,
  phase,
  line,
  today,
  progress,
  color,
  onRead,
  writerBusy,
}: {
  writerBusy?: boolean;
  state: PublicState;
  phase: "idle" | "writing" | "inking" | "resting";
  line: string;
  today: Chapter | null;
  progress?: { done: number; total: number };
  color: string;
  onRead: () => void;
}) {
  const ready = today?.status === "ready";
  const pct = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  // never open a half-drawn chapter: reading unlocks once every panel is in
  const working = phase === "writing" || phase === "inking";
  return (
    <motion.button
      whileHover={{ scale: working ? 1 : 1.015 }}
      whileTap={{ scale: working ? 1 : 0.98 }}
      onClick={onRead}
      disabled={working}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 text-left ${ready ? "shimmer" : ""}`}
      style={{ background: `linear-gradient(135deg, ${color}, #6d28d9 60%, #1e1b4b)` }}
    >
      <div className="fx fx-focuslines opacity-20" />
      <div className="relative flex items-center gap-4 p-5">
        <div className="relative h-32 w-[88px] shrink-0 overflow-hidden rounded-md border-2 border-black bg-black/60 shadow-xl lg:h-40 lg:w-28">
          {today?.cover.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={today.cover.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-3xl">{working ? "✒️" : "📖"}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-black/60">Chapter {state.day}</div>
          <div className="font-[family-name:var(--font-dela)] text-2xl leading-tight text-white title-stroke sm:text-[28px]">
            {phase === "writing"
              ? line
              : phase === "inking"
                ? today?.title ?? "Your chapter is being drawn…"
                : phase === "resting"
                  ? "The artist is resting"
                  : ready
                    ? today!.title
                    : "Read today's chapter"}
          </div>
          <div className="mt-1 text-sm text-white/85">
            {phase === "inking" && `Drawing your chapter — ${progress?.done ?? 0} of ${progress?.total ?? 9} panels done. It unlocks the moment the last one is in.`}
            {phase === "resting" &&
              `Today's free drawing budget is used up. ${progress?.done ?? 0}/${progress?.total ?? 9} panels done — the rest finish after ${resetTime()}. Tap to retry.`}
            {phase === "writing" && (writerBusy ? "The writer is finishing other chapters — yours is next, about a minute" : "Your Chog's story is being written…")}
            {phase === "idle" && (ready ? `Starring ${state.meta.name} as ${today!.role.title} (${roleLean(today!.role.alignment)})` : "Tap to see who your Chog became")}
          </div>
          {(phase === "inking" || phase === "resting") && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
              <motion.div className="h-full rounded-full bg-white" animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

const BOND_ICON: Record<string, string> = { dead: "🕯️", missing: "❓", betrayed: "🗡️", imprisoned: "⛓️", estranged: "💔" };

/** Who the Chog has become, the people in its life, and how it got here. */
function LifePanel({ life }: { life: Life }) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">Life story</div>
      <p className="mt-1 font-[family-name:var(--font-dela)] text-xl leading-tight">{life.identity}</p>
      <p className="mt-1 text-sm italic text-white/60">Driven by: {life.motive}</p>
      {life.bonds.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {life.bonds.map((b) => {
            const st = b.status.toLowerCase();
            const icon = Object.entries(BOND_ICON).find(([k]) => st.includes(k))?.[1] ?? (/(lover|love|partner)/i.test(b.kind) ? "❤️" : /(nemesis|enemy|rival)/i.test(b.kind) ? "⚔️" : "🤝");
            return (
              <span key={b.name} title={b.note} className={`rounded-full border px-3 py-1 text-xs ${st.includes("dead") ? "border-white/10 text-white/40 line-through" : "border-white/15 text-white/80"}`}>
                {icon} {b.name} · <span className="text-white/50">{b.kind}</span>
              </span>
            );
          })}
        </div>
      )}
      {life.timeline.length > 0 && (
        <ol className="mt-4 space-y-1.5 border-l border-white/15 pl-4">
          {life.timeline.slice(-5).map((t, i) => (
            <li key={i} className="relative text-xs text-white/70">
              <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-[var(--chog)]" />
              <b className="text-white/90">Day {t.day}</b> — {t.event}
            </li>
          ))}
        </ol>
      )}
      {life.threads.length > 0 && (
        <div className="mt-4 text-xs text-white/50">
          Unfinished business: {life.threads.slice(-3).join(" · ")}
        </div>
      )}
    </div>
  );
}

/** One action: same size everywhere, so every grid lines up. Details show in the hint bar. */
function Tile({
  emoji,
  name,
  blurb,
  disabled,
  hot,
  onClick,
  onHint,
}: {
  emoji: string;
  name: string;
  blurb: string;
  disabled: boolean;
  hot?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onHint: (s: string) => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -2 }}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => onHint(`${emoji} ${name} — ${blurb}`)}
      onMouseLeave={() => onHint("")}
      onFocus={() => onHint(`${emoji} ${name} — ${blurb}`)}
      title={blurb}
      className={`tile ${hot ? "tile-hot" : ""}`}
    >
      <span className="text-2xl leading-none">{emoji}</span>
      <span className="line-clamp-2 text-center text-[10.5px] font-semibold leading-tight">{name}</span>
    </motion.button>
  );
}

function Meter({ label, value, color, warn }: { label: string; value: number; color: string; warn?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className={warn ? "text-red-300" : "text-white/40"}>{Math.round(value)}</span>
      </div>
      <div className="bar">
        <div style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

/** Full-screen manga "stamp" announcing who the Chog became overnight. */
function RoleReveal({ role, day, image, ready, onDone, onRead }: { role: Role; day: number; image: string; ready: boolean; onDone: () => void; onRead: () => void }) {
  const color = roleColor(role.alignment);
  return (
    <motion.div className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-black/90 px-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onDone}>
      <div className="fx fx-focuslines opacity-60" />
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 45%, ${color}55, transparent 60%)` }} />
      <div className="relative text-center">
        <motion.div className="text-xs uppercase tracking-[0.5em] text-white/60" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          Day {day} · overnight, your Chog became…
        </motion.div>
        <motion.div
          className="mx-auto mt-6 h-48 w-36 overflow-hidden rounded-lg border-4 sm:h-60 sm:w-44"
          style={{ borderColor: color, boxShadow: `0 0 80px ${color}88` }}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="h-full w-full object-cover" />
        </motion.div>
        <motion.div
          className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-bangers)] text-[clamp(40px,9vw,104px)] leading-none title-stroke"
          style={{ color }}
          initial={{ scale: 3, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: -3 }}
          transition={{ delay: 0.75, type: "spring", stiffness: 400, damping: 15 }}
        >
          {role.title.toUpperCase()}!
        </motion.div>
        <motion.div className="mt-8 flex justify-center gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRead();
            }}
            className="rounded-full px-6 py-3 font-bold uppercase tracking-widest text-black"
            style={{ background: color }}
          >
            {ready ? `📖 Read Chapter ${day}` : "✒️ Chapter is being drawn…"}
          </button>
          <button onClick={onDone} className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/70">
            Close
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
