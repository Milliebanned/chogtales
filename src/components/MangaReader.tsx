"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import ChapterPdf from "./ChapterPdf";
import MangaPanel from "./MangaPanel";
import { AREAS, templateFor } from "@/lib/art";
import { roleColor } from "@/lib/roleStyle";
import { sfx } from "@/lib/sound";
import type { Chapter } from "@/lib/types";

type Sheet = { kind: "cover" } | { kind: "page"; index: number } | { kind: "end" };

export default function MangaReader({
  chapter,
  onClose,
  decision,
  onChoose,
}: {
  chapter: Chapter;
  onClose: () => void;
  decision?: string | null;
  onChoose?: (id: string) => Promise<void>;
}) {
  const sheets: Sheet[] = useMemo(
    () => [{ kind: "cover" }, ...chapter.pages.map((_, i) => ({ kind: "page" as const, index: i })), { kind: "end" }],
    [chapter],
  );
  const [sheet, setSheet] = useState(0);
  const [revealed, setRevealed] = useState(0);
  const [dir, setDir] = useState(1);
  const [auto, setAuto] = useState(false);
  const [pdf, setPdf] = useState<"idle" | "busy" | string>("idle");
  const color = roleColor(chapter.role.alignment);
  const cur = sheets[sheet];
  const panelCount = cur.kind === "page" ? chapter.pages[cur.index].panels.length : 0;

  // preload every drawn image so pages feel instant
  useEffect(() => {
    [chapter.cover.image, ...chapter.pages.flatMap((p) => p.panels.map((pn) => pn.image))]
      .filter(Boolean)
      .forEach((u) => {
        const img = new Image();
        img.src = u!;
      });
  }, [chapter]);

  const next = useCallback(() => {
    if (cur.kind === "page" && revealed < panelCount) {
      const pn = chapter.pages[cur.index].panels[revealed];
      sfx(pn.impact ? "impact" : "pop");
      setRevealed((r) => r + 1);
      return;
    }
    if (sheet < sheets.length - 1) {
      sfx("turn");
      setDir(1);
      setSheet((s) => s + 1);
      setRevealed(0);
    }
  }, [cur, revealed, panelCount, sheet, sheets.length, chapter]);

  const prev = useCallback(() => {
    if (sheet === 0) return;
    sfx("turn");
    setDir(-1);
    const target = sheets[sheet - 1];
    setSheet((s) => s - 1);
    setRevealed(target.kind === "page" ? chapter.pages[target.index].panels.length : 0);
  }, [sheet, sheets, chapter]);

  useEffect(() => {
    if (cur.kind === "page" && revealed === 0) {
      const t = setTimeout(() => setRevealed(1), 350);
      return () => clearTimeout(t);
    }
  }, [cur, revealed]);

  useEffect(() => {
    if (!auto || sheet === sheets.length - 1) return;
    const t = setTimeout(next, cur.kind === "cover" ? 3200 : 2800);
    return () => clearTimeout(t);
  }, [auto, next, sheet, revealed, cur.kind, sheets.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col bg-[#07060a]/95 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs uppercase tracking-[0.25em] text-white/50 sm:px-6">
        <span className="truncate">
          Chog Chronicles · Ch.{chapter.day} · <span style={{ color }}>{chapter.role.title}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setAuto((a) => !a)}
            className={`rounded-full border px-3 py-1.5 ${auto ? "border-[var(--chog)] bg-[var(--chog)]/20 text-white" : "border-white/15 text-white/70 hover:bg-white/10"}`}
          >
            {auto ? "❚❚ Pause" : "▶ Auto-play"}
          </button>
          {chapter.status === "ready" && (
            <button
              onClick={() => setPdf("busy")}
              disabled={pdf === "busy"}
              title={pdf !== "idle" && pdf !== "busy" ? pdf : "Save this chapter as a PDF"}
              className="rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:bg-white/10 disabled:opacity-50"
            >
              {pdf === "busy" ? "Saving…" : "⬇ PDF"}
            </button>
          )}
          <button onClick={onClose} className="rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:bg-white/10">
            Close ✕
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-1 [perspective:2000px]">
        <AnimatePresence mode="popLayout" custom={dir} initial={false}>
          <motion.div
            key={sheet}
            className="manga-page relative aspect-[0.78] landscape:aspect-[1.08] h-full max-h-[calc(100vh-112px)] max-w-[min(100%,1100px)] cursor-pointer select-none p-[1.6%]"
            style={{ transformOrigin: dir > 0 ? "left center" : "right center" }}
            initial={{ rotateY: dir > 0 ? 70 : -70, opacity: 0, x: dir > 0 ? 80 : -80 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: dir > 0 ? -70 : 70, opacity: 0, x: dir > 0 ? -80 : 80 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => {
              const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
              if (e.clientX - r.left < r.width * 0.25) prev();
              else next();
            }}
          >
            {cur.kind === "cover" && <Cover chapter={chapter} color={color} />}
            {cur.kind === "end" && <EndPage chapter={chapter} color={color} onClose={onClose} decision={decision} onChoose={onChoose} />}
            {cur.kind === "page" && <PageGrid chapter={chapter} index={cur.index} revealed={revealed} />}
            {cur.kind === "page" && (
              <div className="absolute bottom-[0.6%] left-0 right-0 text-center font-[family-name:var(--font-comic)] text-[10px] font-bold text-black/40">
                {cur.index + 1}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {pdf === "busy" && <ChapterPdf chapters={[chapter]} decisions={{ [chapter.day]: decision ?? undefined }} onDone={(err) => setPdf(err ?? "idle")} />}
      <div className="flex items-center justify-center gap-4 pb-2 pt-1 text-white/60">
        <button onClick={prev} disabled={sheet === 0} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-30">
          ← Back
        </button>
        <div className="flex gap-1.5">
          {sheets.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === sheet ? "w-6 bg-[var(--chog)]" : "w-1.5 bg-white/25"}`} />
          ))}
        </div>
        <button onClick={next} disabled={sheet === sheets.length - 1} className="rounded-full bg-[var(--chog)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-30">
          {cur.kind === "page" && revealed < panelCount ? "Next panel →" : "Turn page →"}
        </button>
      </div>
    </motion.div>
  );
}

export function PageGrid({ chapter, index, revealed }: { chapter: Chapter; index: number; revealed: number }) {
  const page = chapter.pages[index];
  const t = templateFor(page);
  return (
    <div className="grid h-full w-full gap-[1.2%]" style={{ gridTemplateAreas: t.areas, gridTemplateRows: t.rows, gridTemplateColumns: t.cols }}>
      {page.panels.map((p, i) => (
        <MangaPanel key={i} panel={p} idx={`${chapter.id}-${index}-${i}`} visible={i < revealed} heroName={chapter.heroName} style={{ gridArea: AREAS[i] }} />
      ))}
    </div>
  );
}

export function Cover({ chapter, color }: { chapter: Chapter; color: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden border-4 border-[var(--ink)] bg-black">
      {!chapter.cover.image && (
        <div className="absolute inset-0 grid place-items-center" style={{ background: `radial-gradient(circle at 50% 40%, ${color}55, #0b0910 70%)` }}>
          <div className="text-center text-xs font-bold uppercase tracking-[0.3em] text-white/50">
            <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            Inking the cover…
          </div>
        </div>
      )}
      {chapter.cover.image && (
         
        <motion.img
          src={chapter.cover.image}
          alt={chapter.cover.action}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ scale: 1.2 }}
          animate={{ scale: 1.02 }}
          transition={{ duration: 8, ease: "easeOut" }}
        />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,.55) 0%, transparent 25%, transparent 55%, rgba(0,0,0,.92) 100%)" }} />
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-[5%]">
        <div>
          <div className="font-[family-name:var(--font-dela)] text-[clamp(18px,3.6vw,40px)] leading-none text-white title-stroke">
            CHOG
            <br />
            CHRONICLES
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/70">Chog City Saga</div>
        </div>
        <div className="font-[family-name:var(--font-dela)] text-[clamp(14px,2.2vw,24px)] leading-tight text-white/90 [writing-mode:vertical-rl]">チョグ物語</div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-[6%]">
        <span className="inline-block rounded-sm px-2 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-black" style={{ background: color }}>
          Chapter {chapter.day} · {chapter.role.title}
        </span>
        {chapter.arc && <div className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/60">{chapter.arc}</div>}
        <motion.h1
          className="mt-3 font-[family-name:var(--font-dela)] text-[clamp(26px,5.2vw,62px)] leading-[0.95] text-white title-stroke"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {chapter.title}
        </motion.h1>
        <p className="mt-3 max-w-[85%] text-[clamp(11px,1.5vw,16px)] text-white/85">{chapter.tagline}</p>
        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-white/50">Starring {chapter.heroName} · tap to read →</p>
      </div>
    </div>
  );
}

function EndPage({
  chapter,
  color,
  onClose,
  decision,
  onChoose,
}: {
  chapter: Chapter;
  color: string;
  onClose: () => void;
  decision?: string | null;
  onChoose?: (id: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  return (
    <div
      className="relative flex h-full w-full cursor-default flex-col items-center overflow-y-auto border-4 border-[var(--ink)] bg-[var(--paper)] p-[6%] text-center text-black"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="fx fx-focuslines opacity-20" />
      <div className="relative my-auto w-full">
        <div className="font-[family-name:var(--font-bangers)] text-[clamp(30px,6vw,64px)] leading-none tracking-wide">TO BE CONTINUED…</div>
        {chapter.nextTime && (
          <p className="mx-auto mt-3 max-w-md -rotate-1 border-2 border-black bg-[#fffbea] px-3 py-2 font-[family-name:var(--font-comic)] text-sm font-bold uppercase shadow-[3px_3px_0_#111]">
            {chapter.nextTime.replace(/^next time[:…\s-]*/i, "Next time… ")}
          </p>
        )}
        <p className="mt-3 font-[family-name:var(--font-comic)] text-sm font-bold uppercase">
          {chapter.heroName} is now <span style={{ color }} className="title-stroke">{chapter.role.title}</span>
        </p>
        {!!chapter.consequences?.length && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border-2 border-black bg-white p-3 text-left">
            <div className="mb-1 font-[family-name:var(--font-bangers)] text-lg tracking-wide">What your choices did</div>
            {chapter.consequences.map((c, i) => (
              <div key={i} className="flex gap-2 py-0.5 font-[family-name:var(--font-comic)] text-[13px] font-bold leading-snug">
                <span>{c.emoji}</span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        )}
        {chapter.choice && (
          <div className="mx-auto mt-4 max-w-md rounded-lg border-[3px] border-black bg-black p-3 text-left text-white shadow-[4px_4px_0_#8b5cf6]">
            <div className="font-[family-name:var(--font-bangers)] text-xl tracking-wide text-amber-300">Your decision</div>
            <p className="mt-1 font-[family-name:var(--font-comic)] text-sm font-bold">{chapter.choice.prompt}</p>
            <div className="mt-3 flex flex-col gap-2">
              {chapter.choice.options.map((o) => {
                const picked = decision === o.label;
                const locked = !!decision || !onChoose;
                return (
                  <button
                    key={o.id}
                    disabled={locked || !!busy}
                    onClick={async () => {
                      if (!onChoose) return;
                      setBusy(o.id);
                      await onChoose(o.id);
                      setBusy(null);
                    }}
                    className={`rounded-md border-2 px-3 py-2 text-left font-[family-name:var(--font-comic)] text-sm font-bold transition ${
                      picked
                        ? "border-amber-300 bg-amber-300 text-black"
                        : locked
                          ? "border-white/15 text-white/35"
                          : "border-white/40 hover:border-amber-300 hover:bg-white/10"
                    }`}
                  >
                    <span className="mr-2 text-amber-300">{picked ? "✓" : o.id}</span>
                    {busy === o.id ? "Deciding…" : o.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-white/50">
              {decision ? "Your choice is final. It will shape the next chapter." : onChoose ? "Choose carefully — there's no going back." : "This decision was made in the past."}
            </p>
          </div>
        )}
        <button onClick={onClose} className="mt-5 rounded-full bg-black px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-[var(--chog)]">
          Back to my Chog
        </button>
      </div>
    </div>
  );
}
