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
  chapters: { id: string; day: number; title: string; role: Role; tagline: string; cover: string | null; status: string }[];
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

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-white/50 hover:text-white">← My Chogs</button>
        {state.demo && <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">Demo mode</span>}
      </div>

      {/* the daily loop, always visible */}
      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { n: 1, t: "Read today's chapter", d: "See what happened", done: ready },
          { n: 2, t: "Make your decision", d: "At the end of the chapter", done: !!state.decision },
          { n: 3, t: "Feed & care", d: `${state.mealsLeft} meal${state.mealsLeft === 1 ? "" : "s"}, ${state.caresLeft} care left today`, done: state.mealsLeft === 0 && state.caresLeft === 0 },
          { n: 4, t: state.demo ? "Skip to tomorrow" : "Come back tomorrow", d: "The next chapter is drawn from your choices", done: false },
        ].map((s) => (
          <div key={s.n} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${s.done ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${s.done ? "bg-emerald-400 text-black" : "bg-white/10 text-white/70"}`}>
              {s.done ? "✓" : s.n}
            </span>
            <span>
              <span className="block text-sm font-semibold">{s.t}</span>
              <span className="block text-xs text-white/45">{s.d}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* ---------------- the Chog ---------------- */}
        <div className="glass relative overflow-hidden rounded-3xl p-5">
          <motion.div
            className="absolute inset-0"
            animate={{ background: `radial-gradient(520px 320px at 50% 30%, ${state.aura}40, transparent 70%)` }}
            transition={{ duration: 1.2 }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40">Day {state.day}</div>
              <h2 className="truncate font-[family-name:var(--font-dela)] text-3xl">{state.meta.name}</h2>
            </div>
            <span className="max-w-[55%] truncate rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-black" style={{ background: color }}>
              {role.title}
            </span>
          </div>

          <div ref={artRef} className="relative mx-auto mt-5 aspect-square w-full max-w-[400px]">
            <motion.div
              className="absolute -inset-3 rounded-[28px] blur-2xl"
              animate={{ background: state.aura, opacity: [0.35, 0.6, 0.35] }}
              transition={{ opacity: { duration: 3, repeat: Infinity } }}
            />
            <motion.div
              key={bump}
              className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15"
              animate={{ y: [0, -8, 0], scale: bump ? [1, 1.06, 0.97, 1] : 1 }}
              transition={{ y: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.5 } }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={state.meta.image} alt={state.meta.name} className="h-full w-full object-cover" />
            </motion.div>
            <div className="absolute -right-2 -top-2 grid h-14 w-14 place-items-center rounded-full border-2 border-black bg-white text-3xl shadow-lg">{moodFace}</div>
            <AnimatePresence>
              {reaction && (
                <motion.div
                  key={reaction + bump}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bubble bubble-tail bottom-[-14px] left-1/2 w-[86%] -translate-x-1/2 text-sm normal-case"
                  style={{ position: "absolute", maxWidth: "86%" }}
                  onAnimationComplete={() => setTimeout(() => setReaction(""), 4500)}
                >
                  {reaction}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative mt-9 rounded-2xl border border-white/10 bg-black/30 p-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">What you notice</div>
            <p className="mt-1 italic text-white/80">{state.omen}</p>
            {(state.meals.length > 0 || state.cares.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
                Today:
                {state.meals.map((m, i) => (
                  <span key={`m${i}`} className="text-lg" title={FOODS[m.food].name}>{FOODS[m.food].emoji}</span>
                ))}
                {state.cares.map((c, i) => (
                  <span key={`c${i}`} className="text-lg" title={CARES[c.care].name}>{CARES[c.care].emoji}</span>
                ))}
              </div>
            )}
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-4">
            <Meter label="Hunger" value={state.hunger} color="#fb7185" warn={state.hunger > 75} />
            <Meter label="Mood" value={state.mood} color="#facc15" warn={state.mood < 25} />
            <Meter label="Hygiene" value={state.hygiene} color="#38bdf8" warn={state.hygiene < 25} />
            <Meter label="Energy" value={state.energy} color="#a3e635" warn={state.energy < 20} />
          </div>
        </div>

        {/* ---------------- right column ---------------- */}
        <div className="flex flex-col gap-5">
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

          {todayChapter?.choice && (
            <div className="rounded-3xl border border-amber-300/30 bg-amber-300/[0.07] p-5">
              <div className="text-[11px] uppercase tracking-[0.25em] text-amber-200/80">Your decision · shapes the next chapter</div>
              <p className="mt-2 font-semibold text-white">{todayChapter.choice.prompt}</p>
              <div className="mt-3 flex flex-col gap-2">
                {todayChapter.choice.options.map((o) => {
                  const picked = state.decision?.picked === o.label;
                  return (
                    <button
                      key={o.id}
                      disabled={!!state.decision}
                      onClick={() => choose(o.id)}
                      className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                        picked ? "border-amber-300 bg-amber-300 font-semibold text-black" : state.decision ? "border-white/10 text-white/35" : "border-white/20 hover:border-amber-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="mr-2 font-bold text-amber-300">{picked ? "✓" : o.id}</span>
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {!state.decision && <p className="mt-2 text-xs text-white/45">Read the chapter first. Once you choose, there&apos;s no going back.</p>}
            </div>
          )}

          <LifePanel life={state.life} />

          <div className="glass rounded-3xl p-4">
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/40">Today in Chog City</div>
            <p className="mt-1 text-white/85">📰 {state.event}</p>
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">Feed your Chog</h3>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{state.mealsLeft}/3 meals left</span>
            </div>
            <p className="mb-4 text-xs text-white/45">
              Every food changes your Chog in its own secret way — and no two Chogs react the same. Choose carefully… or don&apos;t.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.values(FOODS).map((f) => (
                <motion.button
                  key={f.id}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ y: -3 }}
                  disabled={busy || state.mealsLeft <= 0}
                  onClick={(e) => give(f.id, e)}
                  className={`group flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 ${f.id === "mystery" ? "col-span-2 sm:col-span-3 border-fuchsia-300/30 bg-fuchsia-400/10" : ""}`}
                >
                  <span className="text-3xl transition group-hover:scale-110">{f.emoji}</span>
                  <span className="mt-1 text-sm font-semibold">{f.name}</span>
                  <span className="text-[11px] leading-snug text-white/45">{f.blurb}</span>
                </motion.button>
              ))}
            </div>
            {state.mealsLeft <= 0 && <p className="mt-3 text-center text-sm text-white/60">It&apos;s full for today. What will it become tomorrow?</p>}
          </div>

          <div className="glass rounded-3xl p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">Care for your Chog</h3>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{state.caresLeft}/3 left</span>
            </div>
            <p className="mb-4 text-xs text-white/45">
              How you raise it shapes who it becomes. A bath, a bedtime, a hard word — it all shows up in the story. Skip them and that shows too.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.values(CARES).map((c) => (
                <motion.button
                  key={c.id}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ y: -3 }}
                  disabled={busy || state.caresLeft <= 0}
                  onClick={(e) => tend(c.id, e)}
                  className="group flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="text-3xl transition group-hover:scale-110">{c.emoji}</span>
                  <span className="mt-1 text-sm font-semibold">{c.name}</span>
                  <span className="text-[11px] leading-snug text-white/45">{c.blurb}</span>
                </motion.button>
              ))}
            </div>
            {state.caresLeft <= 0 && <p className="mt-3 text-center text-sm text-white/60">That&apos;s enough fussing for today.</p>}
          </div>

          <div className="glass rounded-3xl border border-orange-400/20 p-5">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-200/80">🔥 Start beef</h3>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">{state.beef ? "0/1 left" : "1/1 left"}</span>
            </div>
            {state.beef ? (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-orange-400/30 bg-orange-400/10 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={state.beef.target.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <p className="text-sm text-white/85">
                  {BEEFS[state.beef.kind].emoji} You chose <b>{BEEFS[state.beef.kind].name.toLowerCase()}</b> against <b>{state.beef.target.name}</b>. It&apos;s in tomorrow&apos;s chapter — and in theirs.
                </p>
              </div>
            ) : (
              <>
                <p className="mb-3 text-xs text-white/45">
                  Pick another keeper&apos;s Chog and start something. Your rivalry becomes the main fight of your next chapter — and lands in their story too.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {rivals.map((r) => (
                    <button
                      key={r.tokenId}
                      onClick={() => setRival(r.tokenId)}
                      className={`flex w-20 shrink-0 flex-col items-center gap-1 rounded-xl border p-1.5 text-[10px] ${rival === r.tokenId ? "border-orange-300 bg-orange-400/20" : "border-white/10 bg-white/5 hover:border-white/30"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                      <span className="w-full truncate text-center">{r.name}</span>
                    </button>
                  ))}
                  {!rivals.length && <p className="text-xs text-white/40">No other Chogs around yet.</p>}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.values(BEEFS).map((b) => (
                    <motion.button
                      key={b.id}
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ y: -3 }}
                      disabled={busy || !rival}
                      onClick={(e) => beef(b.id, e)}
                      className="group flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:border-orange-300/50 hover:bg-orange-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span className="text-2xl transition group-hover:scale-110">{b.emoji}</span>
                      <span className="mt-1 text-sm font-semibold">{b.name}</span>
                      <span className="text-[11px] leading-snug text-white/45">{b.blurb}</span>
                    </motion.button>
                  ))}
                </div>
                {!rival && rivals.length > 0 && <p className="mt-2 text-xs text-white/40">Pick a rival first.</p>}
              </>
            )}
            {state.demo && (
              <button
                onClick={nextDay}
                disabled={busy || phase === "writing"}
                className="mt-4 w-full rounded-2xl border border-amber-300/30 bg-amber-300/10 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-300/20 disabled:opacity-50"
              >
                ⏭ Skip to tomorrow (demo)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* saga shelf */}
      <div className="mt-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-[family-name:var(--font-dela)] text-2xl">My Saga</h3>
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
          <div className="glass mb-5 rounded-3xl p-5">
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
              className="mt-4 w-full rounded-2xl bg-[var(--chog)] py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {picked.length ? `⬇ Download ${picked.length} chapter${picked.length === 1 ? "" : "s"}${combine || picked.length === 1 ? "" : ` as ${picked.length} PDFs`}` : "Pick at least one chapter"}
            </button>
            {!combine && picked.length > 1 && (
              <p className="mt-2 text-center text-xs text-white/40">Your browser may ask once to allow multiple downloads.</p>
            )}
          </div>
        )}
        {state.chapters.length === 0 ? (
          <p className="text-white/40">No chapters yet. Read today&apos;s chapter to begin your story.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3">
            {[...state.chapters].reverse().map((c) => (
              <div key={c.id} className="flex shrink-0 flex-col gap-2">
              <motion.button
                whileHover={{ y: -6, rotate: -1 }}
                onClick={() => readOld(c.day)}
                className="relative h-64 w-44 shrink-0 overflow-hidden rounded-lg border-2 border-black bg-[#1a1626] text-left shadow-xl"
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
                  <div className="text-[10px] uppercase tracking-widest" style={{ color: roleColor(c.role.alignment) }}>{c.role.title}</div>
                  <div className="font-[family-name:var(--font-dela)] text-lg leading-tight">{c.title}</div>
                  {c.status !== "ready" && <div className="mt-1 text-[10px] text-white/50">Still inking…</div>}
                </div>
              </motion.button>
              {c.status === "ready" && (
                <button
                  onClick={() => downloadPdfs([c.day], true)}
                  disabled={pdfQueue.length > 0}
                  className="rounded-lg border border-white/15 py-1.5 text-xs text-white/70 hover:bg-white/10 disabled:opacity-50"
                >
                  ⬇ Download PDF
                </button>
              )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mt-6 text-center text-sm text-red-300">{error}</p>}

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
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border-2 border-black bg-black/60 shadow-xl">
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
