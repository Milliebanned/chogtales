"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Cover, PageGrid } from "./MangaReader";
import { roleColor } from "@/lib/roleStyle";
import type { Chapter } from "@/lib/types";

// every sheet is rendered at this size (the reader's portrait page shape) and saved as one PDF page
const W = 1100;
const H = 1410;

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function fileName(chapters: Chapter[]) {
  if (chapters.length === 1) return `chog-chronicles-ch${chapters[0].day}-${slug(chapters[0].title)}.pdf`;
  const days = chapters.map((c) => c.day);
  const consecutive = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  return `chog-chronicles-${slug(chapters[0].heroName)}-ch${consecutive ? `${days[0]}-${days[days.length - 1]}` : days.join("-")}.pdf`;
}

/**
 * Renders chapters off-screen exactly as the reader shows them (cover, pages
 * with every panel revealed, the ending), snapshots each sheet and saves them
 * all, in order, as ONE PDF.
 */
export default function ChapterPdf({
  chapters,
  decisions = {},
  onDone,
}: {
  chapters: Chapter[];
  decisions?: Record<number, string | undefined>;
  onDone: (error?: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const root = ref.current!;
        await Promise.all(
          [...root.querySelectorAll("img")].map((img) =>
            img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))),
          ),
        );
        await document.fonts.ready;
        await new Promise((r) => setTimeout(r, 1600)); // let panel fade-ins settle
        const [{ toJpeg }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [W, H], hotfixes: ["px_scaling"] });
        const sheets = [...root.querySelectorAll<HTMLElement>("[data-sheet]")];
        for (const [i, el] of sheets.entries()) {
          if (cancelled) return;
          // panel art URLs differ only by query string (/api/img?id=…): without includeQueryParams the library caches them as ONE image
          const url = await toJpeg(el, { quality: 0.88, pixelRatio: 1.5, width: W, height: H, backgroundColor: "#f6f1e7", includeQueryParams: true });
          if (i > 0) pdf.addPage([W, H], "portrait");
          pdf.addImage(url, "JPEG", 0, 0, W, H);
        }
        pdf.save(fileName(chapters));
        onDone();
      } catch (e) {
        console.error(e);
        onDone("Couldn't make the PDF — try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div ref={ref} aria-hidden style={{ position: "fixed", left: -20000, top: 0, width: W, pointerEvents: "none" }}>
      {chapters.map((c) => (
        <ChapterSheets key={c.id} chapter={c} decision={decisions[c.day]} />
      ))}
    </div>,
    document.body,
  );
}

const SHEET = "manga-page relative overflow-hidden p-[1.6%]";

function ChapterSheets({ chapter, decision }: { chapter: Chapter; decision?: string }) {
  const color = roleColor(chapter.role.alignment);
  return (
    <>
      <div data-sheet className={SHEET} style={{ width: W, height: H }}>
        <Cover chapter={chapter} color={color} />
      </div>
      {chapter.pages.map((page, i) => (
        <div data-sheet key={i} className={SHEET} style={{ width: W, height: H }}>
          <PageGrid chapter={chapter} index={i} revealed={page.panels.length} />
          <div className="absolute bottom-[0.6%] left-0 right-0 text-center font-[family-name:var(--font-comic)] text-[12px] font-bold text-black/40">{i + 1}</div>
        </div>
      ))}
      <div data-sheet className={SHEET} style={{ width: W, height: H }}>
        <div className="flex h-full w-full flex-col items-center justify-center border-4 border-[var(--ink)] bg-[var(--paper)] p-[8%] text-center text-black">
          <div className="font-[family-name:var(--font-bangers)] text-[72px] leading-none tracking-wide">TO BE CONTINUED…</div>
          {chapter.nextTime && (
            <p className="mt-6 max-w-[80%] -rotate-1 border-2 border-black bg-[#fffbea] px-4 py-3 font-[family-name:var(--font-comic)] text-xl font-bold uppercase shadow-[3px_3px_0_#111]">
              {chapter.nextTime.replace(/^next time[:…\s-]*/i, "Next time… ")}
            </p>
          )}
          <p className="mt-8 font-[family-name:var(--font-comic)] text-xl font-bold uppercase">
            {chapter.heroName} is now <span style={{ color }} className="title-stroke">{chapter.role.title}</span>
          </p>
          {!!chapter.consequences?.length && (
            <div className="mt-6 w-[80%] rounded-lg border-2 border-black bg-white p-4 text-left">
              <div className="mb-1 font-[family-name:var(--font-bangers)] text-2xl tracking-wide">What your choices did</div>
              {chapter.consequences.map((c, i) => (
                <div key={i} className="flex gap-2 py-0.5 font-[family-name:var(--font-comic)] text-lg font-bold leading-snug">
                  <span>{c.emoji}</span>
                  <span>{c.text}</span>
                </div>
              ))}
            </div>
          )}
          {chapter.choice && (
            <div className="mt-6 w-[80%] rounded-lg border-[3px] border-black bg-black p-4 text-left text-white">
              <div className="font-[family-name:var(--font-bangers)] text-2xl tracking-wide text-amber-300">The decision</div>
              <p className="mt-1 font-[family-name:var(--font-comic)] text-lg font-bold">{chapter.choice.prompt}</p>
              {chapter.choice.options.map((o) => (
                <p key={o.id} className={`mt-2 font-[family-name:var(--font-comic)] text-base font-bold ${decision === o.label ? "text-amber-300" : "text-white/60"}`}>
                  {decision === o.label ? "✓" : o.id}. {o.label}
                </p>
              ))}
            </div>
          )}
          <p className="mt-10 text-sm uppercase tracking-[0.3em] text-black/50">Chog Chronicles · Chapter {chapter.day}</p>
        </div>
      </div>
    </>
  );
}
