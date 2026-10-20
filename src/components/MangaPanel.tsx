"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { Panel } from "@/lib/types";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

/**
 * One manga panel. The drawing sits on top; all lettering (caption + bubbles)
 * lives in its own strip underneath, in normal flow, so text can never cover
 * the art or other text. The SFX is the only thing on the art, in one corner.
 */
export default function MangaPanel({
  panel,
  idx,
  visible,
  heroName,
  style,
}: {
  panel: Panel;
  idx: string;
  visible: boolean;
  heroName?: string;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  const h = hash(idx);
  const hasText = !!panel.caption || panel.bubbles.length > 0;
  const speakerName = (s: string) => (s === "hero" ? heroName || "Chog" : s === "narrator" ? "" : s);

  return (
    <motion.div
      className={`panel flex flex-col ${visible && panel.impact ? "shake" : ""}`}
      style={style}
      initial={false}
      animate={visible ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0, scale: 0.97, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="panel-art relative min-h-0 flex-1 overflow-hidden">
        {panel.image ? (
          <motion.img
            src={panel.image}
            alt={panel.action}
            onLoad={() => setLoaded(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={panel.color ? undefined : { filter: "grayscale(1) contrast(1.08)" }}
            initial={false}
            animate={visible && loaded ? { scale: [1.08, 1], opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(45deg,#f2eee6_0_10px,#e9e4da_10px_20px)]">
            <div className="text-center font-[family-name:var(--font-comic)] text-xs font-bold uppercase tracking-widest text-black/40">
              <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
              Inking…
            </div>
          </div>
        )}

        {panel.sfx && (
          <motion.div
            className={`sfx ${h % 2 ? "sfx-tl" : "sfx-tr"}`}
            style={{ rotate: `${(h % 2 ? -1 : 1) * (6 + (h % 8))}deg`, color: panel.color ? "#facc15" : "#fff" }}
            initial={false}
            animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 2.2 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 500, damping: 14 }}
          >
            {panel.sfx}
          </motion.div>
        )}
      </div>

      {hasText && (
        <div className="letter-strip">
          {panel.caption && (
            <motion.div
              className="caption-box"
              initial={false}
              animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              transition={{ delay: 0.25 }}
            >
              {panel.caption}
            </motion.div>
          )}
          {panel.bubbles.map((b, i) => {
            const name = speakerName(b.speaker);
            return (
              <motion.div
                key={i}
                className={`bubble bubble-${b.style} ${i % 2 ? "self-end" : "self-start"}`}
                initial={false}
                animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ delay: 0.5 + i * 0.35, type: "spring", stiffness: 380, damping: 22 }}
              >
                {name && <span className="bubble-speaker">{name}</span>}
                {b.text}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
