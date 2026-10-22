"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export interface NavLink {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean; // highlighted (purple) link
  download?: boolean;
}

/**
 * The top bar on every page. On wide screens every link is visible; on phones
 * the links fold into a menu so nothing collides with the logo or overflows.
 * `action` (e.g. the wallet button) always stays visible.
 */
export default function SiteNav({ links, action, tag, onLogo }: { links: NavLink[]; action?: React.ReactNode; tag?: string; onLogo?: () => void }) {
  const [open, setOpen] = useState(false);
  const item = (l: NavLink, mobile = false) => {
    const cls = mobile
      ? `block rounded-xl px-4 py-3 text-sm ${l.primary ? "bg-violet-600 font-semibold text-white" : "text-white/80 hover:bg-white/5"}`
      : `rounded-full px-3 py-1.5 text-xs uppercase tracking-widest transition ${
          l.primary ? "border border-violet-400/50 bg-violet-500/15 font-semibold text-violet-100 hover:bg-violet-500/30" : "text-white/65 hover:text-white"
        }`;
    const click = () => {
      setOpen(false);
      l.onClick?.();
    };
    return l.href ? (
      <a key={l.label} href={l.href} download={l.download} onClick={click} className={cls}>
        {l.label}
      </a>
    ) : (
      <button key={l.label} onClick={click} className={`${cls} text-left`}>
        {l.label}
      </button>
    );
  };
  return (
    <nav className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <Link
        href="/"
        onClick={(e) => {
          if (onLogo) {
            e.preventDefault();
            onLogo();
          }
        }}
        className="flex min-w-0 items-center gap-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/chogs/chog-1.svg" alt="" className="h-9 w-9 shrink-0 rounded-lg border border-white/20" />
        <span className="font-[family-name:var(--font-dela)] text-base tracking-wide sm:text-lg">CHOGTALES</span>
        {tag && <span className="accent hidden text-lg sm:inline">{tag}</span>}
      </Link>
      <div className="hidden items-center gap-1.5 md:flex">
        {links.map((l) => item(l))}
        {action}
      </div>
      <div className="flex shrink-0 items-center gap-2 md:hidden">
        {action}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/[0.04]"
        >
          <span className="relative block h-3 w-4">
            <span className={`absolute left-0 h-[2px] w-4 rounded bg-white transition ${open ? "top-[5px] rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 top-[5px] h-[2px] w-4 rounded bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`absolute left-0 h-[2px] w-4 rounded bg-white transition ${open ? "top-[5px] -rotate-45" : "top-[10px]"}`} />
          </span>
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute inset-x-4 top-full z-40 rounded-2xl border border-white/10 bg-[#120f1a]/95 p-2 shadow-2xl backdrop-blur md:hidden"
          >
            {links.map((l) => item(l, true))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
