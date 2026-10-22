"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { OPENSEA_URL, OpenSeaLogo } from "./OpenSeaLogo";
import showcase from "@/lib/showcase.json";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false, loading: () => <div className="h-full w-full" /> });

const REPO = "https://github.com/Milliebanned/chogtales";

const rise = {
  hidden: { opacity: 0, y: 40 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.8, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] as const } }),
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-200">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-400" />
      {children}
    </span>
  );
}

function CTAs({ isConnected, onSign, onDemo, loading, center }: { isConnected: boolean; onSign: () => void; onDemo: () => void; loading: boolean; center?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${center ? "justify-center" : ""}`}>
      {!isConnected ? (
        <ConnectButton.Custom>
          {({ openConnectModal, mounted }) => (
            <button onClick={openConnectModal} disabled={!mounted} className="btn-primary px-7 py-3.5 text-base">
              Connect wallet
            </button>
          )}
        </ConnectButton.Custom>
      ) : (
        <button onClick={onSign} disabled={loading} className="btn-primary px-7 py-3.5 text-base">
          {loading ? "Check your wallet…" : "Sign in · free, no gas"}
        </button>
      )}
      <button onClick={onDemo} disabled={loading} className="btn-ghost px-7 py-3.5 text-base">
        Try the demo →
      </button>
    </div>
  );
}

/** The way into the Manga Library: obvious, right under the main buttons. */
function LibraryCTA() {
  const covers = ["/library/chog-1463-grey-harvest/cover.webp", "/library/chog-1464-soup-shadows/cover.webp", "/showcase/p13.webp"];
  return (
    <a
      href="/library"
      className="group mt-5 flex max-w-[520px] items-center gap-4 rounded-2xl border border-violet-400/40 bg-violet-500/[0.12] p-3 pr-5 shadow-[0_10px_40px_-15px_rgba(124,58,237,0.9)] transition hover:border-violet-300 hover:bg-violet-500/20"
    >
      <span className="flex shrink-0 -space-x-5">
        {covers.map((c, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c}
            src={c}
            alt=""
            className="h-16 w-12 rounded-md border-2 border-[#0b0910] object-cover shadow-lg transition duration-300 group-hover:translate-y-[-2px]"
            style={{ transform: `rotate(${(i - 1) * 8}deg)`, transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-base font-semibold text-white">
          📚 Manga Library
          <span className="rounded-full bg-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New</span>
        </span>
        <span className="mt-0.5 block text-sm text-white/65">Read other keepers&apos; manga, or buy one with $CHOG</span>
      </span>
      <span className="ml-auto text-xl text-violet-200 transition group-hover:translate-x-1">→</span>
    </a>
  );
}

/* ---------------------------------------------------------------- */
/* 1 · hero                                                          */
/* ---------------------------------------------------------------- */

function Hero(props: { isConnected: boolean; onSign: () => void; onDemo: () => void; loading: boolean; error: string }) {
  const stats = [
    { n: "1,969", t: "Chogs that can star" },
    { n: "19", t: "story arcs" },
    { n: "1", t: "new chapter a day" },
  ];
  return (
    <section className="relative min-h-[calc(100vh-76px)]">
      {/* the 3D scene is a full-width layer behind the text, fading into the page on every side */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.2 }}
        className="hero-3d pointer-events-none absolute inset-x-0 -top-[76px] bottom-0"
      >
        <Hero3D />
      </motion.div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-center px-4 sm:px-6">
      <motion.div initial="hidden" animate="show" className="max-w-[640px] pb-[38vh] lg:pb-0">
        <motion.div variants={rise} custom={0}>
          <Eyebrow>Chogathon 2026 · Monad</Eyebrow>
        </motion.div>
        <motion.h1 variants={rise} custom={1} className="mt-6 font-[family-name:var(--font-dela)] sm:whitespace-nowrap text-[clamp(38px,4.6vw,72px)] leading-[0.98]">
          <span>Your Chog.</span>
          <br />
          <span>Your <span className="accent text-[1.12em]">choices.</span></span>
          <br />
          <span>Your manga.</span>
        </motion.h1>
        <motion.p variants={rise} custom={2} className="mt-6 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
          Your Chog NFT is the hero of a manga that is written and drawn fresh every single day. Feed it, raise it, start beef with other Chogs, and make one
          choice a day that you can never take back. Tomorrow, find out who it became.
        </motion.p>
        <motion.div variants={rise} custom={3} className="mt-8">
          <CTAs {...props} />
          {props.error && <p className="mt-4 text-sm text-red-300">{props.error}</p>}
        </motion.div>
        <motion.div variants={rise} custom={4}>
          <LibraryCTA />
        </motion.div>
        <motion.div variants={rise} custom={5} className="mt-8 flex flex-wrap gap-8">
          {stats.map((s) => (
            <div key={s.t}>
              <div className="text-white font-[family-name:var(--font-dela)] text-3xl">{s.n}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">{s.t}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
      </div>
      <motion.div
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 text-[11px] uppercase tracking-[0.4em] text-white/35 lg:block"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      >
        Scroll ↓
      </motion.div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 2 · your Chog is the hero                                         */
/* ---------------------------------------------------------------- */

const TRAITS = [
  { trait: "Eyes · BTC Glass", becomes: "flashes a hidden code only a dying stranger understood" },
  { trait: "Head · MCGA cap", becomes: "a symbol the Food Baron's enforcers fear on sight" },
  { trait: "Body · 143 Jersey", becomes: "the number of a crate that washed up at the Docks" },
  { trait: "Accessory · Fwog", becomes: "its only friend when the whole city turns on it" },
];

function HeroIsYou() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [-14, 0, 10]);
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  return (
    <section ref={ref} className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="max-w-2xl">
        <motion.div variants={rise}>
          <Eyebrow>The NFT is the story</Eyebrow>
        </motion.div>
        <motion.h2 variants={rise} custom={1} className="text-white mt-5 font-[family-name:var(--font-dela)] text-[clamp(34px,5vw,60px)] leading-[0.95]">
          Your Chog isn&apos;t a profile picture here. It&apos;s the main <span className="accent">character.</span>
        </motion.h2>
        <motion.p variants={rise} custom={2} className="mt-5 text-white/60">
          The artist draws <i>your</i> Chog into every panel, from its exact NFT image. Its on-chain traits decide how it reacts to everything you do, and the
          writer turns them into its legend.
        </motion.p>
      </motion.div>

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[320px_1fr_380px]">
        <motion.div style={{ rotate, y }} className="relative mx-auto w-[280px]">
          <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-violet-500/50 via-fuchsia-500/40 to-amber-400/40 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-black p-2 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/chog-1.webp" alt="Chog #1462" className="aspect-square w-full rounded-2xl object-cover" />
            <div className="flex items-center justify-between px-2 pb-1 pt-3 text-sm">
              <span className="font-semibold">Chog #1462</span>
              <span className="text-xs text-white/50">Chog Genesis · Monad</span>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          {TRAITS.map((t, i) => (
            <motion.div
              key={t.trait}
              initial={{ opacity: 0, x: -60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ delay: i * 0.18, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
              className="grid grid-cols-[auto_1fr] items-center gap-3 sm:grid-cols-[180px_60px_1fr]"
            >
              <span className="rounded-full border border-violet-300/30 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100">{t.trait}</span>
              <svg viewBox="0 0 60 12" className="hidden h-3 w-full sm:block">
                <motion.path
                  d="M2 6 H52 M46 1 L54 6 L46 11"
                  fill="none"
                  stroke="url(#arrowGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.18, duration: 0.6 }}
                />
                <defs>
                  <linearGradient id="arrowGrad">
                    <stop offset="0" stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#fcd34d" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="col-span-2 text-sm text-white/80 sm:col-span-1">{t.becomes}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, rotateY: -35, x: 60 }}
          whileInView={{ opacity: 1, rotateY: 0, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ transformPerspective: 1200 }}
          className="manga-page relative mx-auto w-full max-w-[380px] p-2"
        >
          <div className="panel aspect-[1.3] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/showcase/p1.webp" alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="letter-strip border-x-4 border-b-4 border-[var(--ink)]" style={{ fontSize: 13 }}>
            <div className="caption-box">The glasses flashed. Three people in the crowd stopped breathing.</div>
            <div className="bubble self-start">
              <span className="bubble-speaker">Vex</span>
              Where did you get those, kid?
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 3 · the daily loop                                                */
/* ---------------------------------------------------------------- */

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 200, damping: 18 });
  const glowX = useTransform(mx, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(my, [-0.5, 0.5], ["0%", "100%"]);
  const glow = useTransform([glowX, glowY], ([x, y]) => `radial-gradient(300px circle at ${x} ${y}, rgba(240,171,252,0.18), transparent 60%)`);
  return (
    <motion.div
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className={`card relative overflow-hidden p-6 ${className}`}
    >
      <motion.div className="pointer-events-none absolute inset-0" style={{ background: glow }} />
      <div style={{ transform: "translateZ(40px)" }} className="relative">
        {children}
      </div>
    </motion.div>
  );
}

const LOOP = [
  { n: "01", icon: "📖", t: "Read", d: "A cover and two fully drawn pages with your Chog as the hero, picking up exactly where yesterday ended." },
  { n: "02", icon: "⚖️", t: "Decide", d: "Every chapter ends on a hard choice with no right answer. Pick once. There's no going back." },
  { n: "03", icon: "🍙🛁🔥", t: "Raise", d: "Feed it, bathe it, train it, scold it, or start beef. Every action secretly shapes who it becomes." },
  { n: "04", icon: "🌙", t: "Return", d: "Overnight the next chapter is drawn from everything you did. Thief, sheriff, prophet, avenger?" },
];

function Loop() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="text-center">
        <motion.div variants={rise}>
          <Eyebrow>Every day</Eyebrow>
        </motion.div>
        <motion.h2 variants={rise} custom={1} className="text-white mx-auto mt-5 max-w-3xl font-[family-name:var(--font-dela)] text-[clamp(34px,5vw,60px)] leading-[0.95]">
          Four moves. One life that <span className="accent">never resets.</span>
        </motion.h2>
      </motion.div>
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {LOOP.map((s, i) => (
          <motion.div key={s.n} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} variants={rise} custom={i}>
            <TiltCard className="h-full min-h-[260px]">
              <div className="flex items-start justify-between">
                <span className="font-[family-name:var(--font-bangers)] text-5xl text-white/25">{s.n}</span>
                <span className="text-3xl">{s.icon}</span>
              </div>
              <div className="accent mt-8 text-3xl text-white">{s.t}</div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{s.d}</p>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 4 · gallery of real panels                                        */
/* ---------------------------------------------------------------- */

function Gallery() {
  const rowA = showcase.slice(0, 7);
  const rowB = showcase.slice(7);
  const Row = ({ items, reverse }: { items: typeof showcase; reverse?: boolean }) => (
    <div className={`marquee ${reverse ? "marquee-rev" : ""}`}>
      {[...items, ...items].map((p, i) => (
        <div key={i} className="manga-page w-[300px] shrink-0 p-1.5 sm:w-[360px]">
          <div className="panel aspect-[1.45] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.f} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={p.color ? undefined : { filter: "grayscale(1) contrast(1.08)" }} />
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <section className="relative overflow-hidden py-20">
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="mx-auto max-w-7xl px-4 text-center sm:px-6">
        <motion.div variants={rise}>
          <Eyebrow>Drawn by ChogTales</Eyebrow>
        </motion.div>
        <motion.h2 variants={rise} custom={1} className="text-white mx-auto mt-5 max-w-3xl font-[family-name:var(--font-dela)] text-[clamp(34px,5vw,60px)] leading-[0.95]">
          Real panels. Real Chogs. Nobody drew these <span className="accent">by hand.</span>
        </motion.h2>
        <motion.p variants={rise} custom={2} className="mx-auto mt-5 max-w-xl text-white/60">
          Every image below came out of a real chapter, generated for real Chog Genesis NFTs during testing.
        </motion.p>
      </motion.div>
      <div className="gallery-3d mt-16">
        <Row items={rowA} />
        <Row items={rowB} reverse />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 5 · beef: stories cross                                           */
/* ---------------------------------------------------------------- */

function Beef() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }}>
          <motion.div variants={rise}>
            <Eyebrow>Multiplayer story</Eyebrow>
          </motion.div>
          <motion.h2 variants={rise} custom={1} className="text-white mt-5 font-[family-name:var(--font-dela)] text-[clamp(34px,5vw,60px)] leading-[0.95]">
            Start beef. Both stories <span className="accent">feel it.</span>
          </motion.h2>
          <motion.p variants={rise} custom={2} className="mt-5 text-white/60">
            Challenge another keeper&apos;s Chog to a duel, steal its lunch, or spread a rumor. Your rivalry becomes the main fight of your next chapter, and it
            lands in <i>their</i> next chapter too. Chog City is shared, and the Chogs in it remember.
          </motion.p>
          <motion.div variants={rise} custom={3} className="mt-6 flex flex-wrap gap-2">
            {["⚔️ Duel", "🗯️ Trash-talk", "🍱 Steal its food", "🤫 Spread a rumor", "🎭 Prank it"].map((b) => (
              <span key={b} className="chip border-orange-300/25 text-orange-100/80">
                {b}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <div className="relative h-[380px]">
          <svg viewBox="0 0 600 380" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="beefA" x1="0" x2="1">
                <stop offset="0" stopColor="#a78bfa" />
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="beefB" x1="1" x2="0">
                <stop offset="0" stopColor="#f472b6" />
                <stop offset="1" stopColor="#fcd34d" />
              </linearGradient>
            </defs>
            {[
              { d: "M90 110 C 260 110, 340 270, 510 270", s: "url(#beefA)" },
              { d: "M510 110 C 340 110, 260 270, 90 270", s: "url(#beefB)" },
            ].map((p, i) => (
              <motion.path
                key={i}
                d={p.d}
                fill="none"
                stroke={p.s}
                strokeWidth="4"
                strokeDasharray="1 0"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.6, delay: 0.3 + i * 0.25, ease: "easeInOut" }}
              />
            ))}
          </svg>
          {[
            { src: "/hero/chog-1.webp", name: "Your Chog", side: "left-0", rot: -6, label: "Your chapter 8" },
            { src: "/hero/chog-3.webp", name: "Their Chog", side: "right-0", rot: 6, label: "Their chapter 3" },
          ].map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, x: i ? 80 : -80, rotate: 0 }}
              whileInView={{ opacity: 1, x: 0, rotate: c.rot }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: "spring", stiffness: 90, damping: 14, delay: 0.1 }}
              className={`absolute top-6 ${c.side} w-[170px]`}
            >
              <div className="overflow-hidden rounded-2xl border-2 border-white/20 bg-black p-1.5 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.src} alt="" className="aspect-square w-full rounded-xl object-cover" />
              </div>
              <div className="mt-2 text-center text-sm font-semibold">{c.name}</div>
              <div className="mt-28 text-center text-[11px] uppercase tracking-[0.2em] text-white/45">{c.label}</div>
            </motion.div>
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            whileInView={{ scale: 1, rotate: -8 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 1.2 }}
            className="sfx absolute left-1/2 top-[150px] -translate-x-1/2 text-[72px]"
            style={{ color: "#fb923c", maxWidth: "none" }}
          >
            VS!
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */
/* 6 · final call                                                    */
/* ---------------------------------------------------------------- */

function FinalCall(props: { isConnected: boolean; onSign: () => void; onDemo: () => void; loading: boolean }) {
  return (
    <section className="relative mx-auto max-w-5xl px-4 pb-16 pt-24 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-3xl rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.35),transparent_65%)] blur-3xl" />
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.4 }} className="relative">
        <motion.h2 variants={rise} className="text-white font-[family-name:var(--font-dela)] text-[clamp(40px,7vw,88px)] leading-[0.9]">
          Chapter 1 is <span className="accent">waiting.</span>
        </motion.h2>
        <motion.p variants={rise} custom={1} className="mx-auto mt-6 max-w-xl text-lg text-white/60">
          Connect a wallet with a Chog Genesis NFT, or try it right now with three real Chogs in demo mode.
        </motion.p>
        <motion.div variants={rise} custom={2} className="mt-10">
          <CTAs {...props} center />
        </motion.div>
        <motion.div variants={rise} custom={3} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/55">
          <a href="/library" className="transition hover:text-white">📚 Read the Library</a>
          <a href={OPENSEA_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition hover:text-white">
            <OpenSeaLogo className="h-6 w-6" /> No Chog yet? Get one on OpenSea ↗
          </a>
        </motion.div>
      </motion.div>
      <footer className="relative mt-24 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40">
        <span>
          <span className="font-bold text-white/80">ChogTales</span> · The Daily Manga · built for Chogathon 2026
        </span>
        <span className="flex gap-5">
          <a href="/docs" className="hover:text-white">Docs</a>
          <a href="/library" className="hover:text-white">Library</a>
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub</a>
          <a href={OPENSEA_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">Chog Genesis on OpenSea</a>
        </span>
      </footer>
    </section>
  );
}

export default function Landing(props: { isConnected: boolean; onSign: () => void; onDemo: () => void; loading: boolean; error: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative overflow-x-hidden">
      <Hero {...props} />
      <HeroIsYou />
      <Loop />
      <Gallery />
      <Beef />
      <FinalCall {...props} />
    </motion.div>
  );
}
