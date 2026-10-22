"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import Dashboard from "@/components/Dashboard";
import { FOODS } from "@/lib/foods";
import { setSoundEnabled, soundEnabled } from "@/lib/sound";
import type { ChogMeta } from "@/lib/types";

interface Session {
  owner: string;
  demo: boolean;
}

const loginMessage = (address: string, issuedAt: number) =>
  `ChogTales\n\nSign in to write your Chog's story.\nThis costs no gas.\n\nWallet: ${address.toLowerCase()}\nIssued: ${issuedAt}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [chogs, setChogs] = useState<ChogMeta[] | null>(null);
  const [enumerable, setEnumerable] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setSound(soundEnabled());
    fetch("/api/auth")
      .then((r) => r.json())
      .then((j) => setSession(j.session ?? null))
      .catch(() => setSession(null));
  }, []);

  const loadChogs = useCallback(async () => {
    setError("");
    const r = await fetch("/api/chogs");
    const j = await r.json();
    if (!r.ok) {
      setError(j.error);
      setChogs([]);
      return;
    }
    setChogs(j.chogs);
    setEnumerable(j.enumerable);
    if (j.chogs.length === 1) setSelected(j.chogs[0].tokenId);
  }, []);

  useEffect(() => {
    if (session) loadChogs();
  }, [session, loadChogs]);

  // wallet switched → old session no longer valid
  useEffect(() => {
    if (session && !session.demo && address && session.owner !== address.toLowerCase()) logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  async function signIn() {
    if (!address) return;
    setLoading(true);
    setError("");
    try {
      const issuedAt = Date.now();
      const signature = await signMessageAsync({ message: loginMessage(address, issuedAt) });
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signature, issuedAt }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSession(j.session);
    } catch (e) {
      setError((e as Error).message.split("\n")[0]);
    } finally {
      setLoading(false);
    }
  }

  async function demo() {
    setLoading(true);
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demo: true }),
    });
    const j = await r.json();
    setSession(j.session);
    setLoading(false);
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    setSession(null);
    setChogs(null);
    setSelected(null);
  }

  return (
    <main className="min-h-screen">
      {/* nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chogs/chog-1.svg" alt="" className="h-9 w-9 rounded-lg border border-white/20" />
          <span className="font-[family-name:var(--font-dela)] text-lg tracking-wide">CHOGTALES</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!sound);
              setSound(!sound);
            }}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-widest text-white/60 hover:bg-white/10"
          >
            SFX {sound ? "on" : "off"}
          </button>
          {session && (
            <button onClick={() => { logout(); if (!session.demo) disconnect(); }} className="rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-widest text-white/60 hover:bg-white/10">
              {session.demo ? "Exit demo" : "Sign out"}
            </button>
          )}
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {session === undefined ? null : !session ? (
          <Landing key="landing" isConnected={isConnected} onSign={signIn} onDemo={demo} loading={loading} error={error} />
        ) : selected ? (
          <motion.div key={`dash-${selected}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard tokenId={selected} onBack={() => setSelected(null)} />
          </motion.div>
        ) : (
          <motion.div key="picker" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
            <h2 className="font-[family-name:var(--font-dela)] text-4xl">Choose your Chog</h2>
            <p className="mt-2 text-white/60">
              {session.demo
                ? "Demo Chogs — pick one and start its story from a clean slate."
                : "Every Chog you hold has its own story. A new keeper always starts from a clean slate."}
            </p>
            {error && <p className="mt-4 text-red-300">{error}</p>}
            {chogs === null ? (
              <p className="mt-10 text-white/40">Looking for your Chogs on Monad…</p>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {chogs.map((c) => (
                  <motion.button
                    key={c.tokenId}
                    whileHover={{ y: -6 }}
                    onClick={() => setSelected(c.tokenId)}
                    className="glass overflow-hidden rounded-2xl text-left"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt={c.name} className="aspect-square w-full object-cover" />
                    <div className="p-3 font-semibold">{c.name}</div>
                  </motion.button>
                ))}
              </div>
            )}
            {chogs && chogs.length === 0 && enumerable && !session.demo && !error && (
              <p className="mt-6 text-white/60">
                No Chogs found in this wallet. Grab one on a Monad marketplace — or <button onClick={() => { logout(); }} className="underline">try demo mode</button>.
              </p>
            )}
            {chogs && !session.demo && (!enumerable || chogs.length === 0) && (
              <form
                className="mt-8 flex max-w-sm gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualId) setSelected(manualId.trim());
                }}
              >
                <input
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your Chog token ID"
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 outline-none focus:border-[var(--chog)]"
                />
                <button className="rounded-xl bg-[var(--chog)] px-5 font-semibold">Open</button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Landing({
  isConnected,
  onSign,
  onDemo,
  loading,
  error,
}: {
  isConnected: boolean;
  onSign: () => void;
  onDemo: () => void;
  loading: boolean;
  error: string;
}) {
  const steps = [
    { n: "01", t: "Connect your Chog", d: "Your NFT becomes the main character, drawn into every panel. A new keeper always starts from a clean slate." },
    { n: "02", t: "Feed it — or don't", d: "Eleven foods, each with a hidden effect that mixes with your Chog's own traits. No formulas. No guarantees." },
    { n: "03", t: "Read today's chapter", d: "Overnight, your Chog becomes someone new. A fully drawn manga chapter reveals who — and what happened." },
  ];
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="grid items-center gap-10 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div>
          <span className="rounded-full border border-[var(--chog)]/40 bg-[var(--chog)]/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-violet-200">
            Chogathon 2026
          </span>
          <h1 className="mt-6 font-[family-name:var(--font-dela)] text-[clamp(44px,8vw,96px)] leading-[0.9]">
            Your Chog.
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">Your choices.</span>
            <br />
            Your manga.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-white/65">
            Your Chog wakes up with a clean slate. What you feed it — chili, glowing mushrooms, stolen bread, or nothing at all — secretly shapes who it becomes. Every day, a brand-new hand-drawn manga chapter starring your Chog.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!isConnected ? (
              <ConnectButton label="Connect wallet" />
            ) : (
              <button onClick={onSign} disabled={loading} className="rounded-xl bg-[var(--chog)] px-6 py-3 font-semibold shadow-lg shadow-violet-900/40 hover:brightness-110">
                {loading ? "Check your wallet…" : "Sign in (free, no gas)"}
              </button>
            )}
            <button onClick={onDemo} disabled={loading} className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-white/80 hover:bg-white/10">
              Try the demo →
            </button>
          </div>
          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </div>

        {/* hero art: a fanned stack of manga pages */}
        <div className="relative mx-auto h-[420px] w-full max-w-[420px]">
          {[
            { bg: "/bg/lair-dark.webp", fx: "fx-dark", label: "BANDIT?", color: "#ef4444" },
            { bg: "/bg/forest-tense.webp", fx: "fx-rain", label: "PROPHET?", color: "#38bdf8" },
            { bg: "/bg/city-action.webp", fx: "fx-focuslines", label: "MAYOR?", color: "#facc15" },
          ].map((p, i) => (
            <motion.div
              key={p.bg}
              className="manga-page absolute left-1/2 top-1/2 h-[380px] w-[270px] p-2"
              initial={{ x: "-50%", y: "-50%", rotate: 0, opacity: 0 }}
              animate={{ x: `${-50 + (i - 1) * 24}%`, y: "-50%", rotate: (i - 1) * 9, opacity: 1 }}
              whileHover={{ y: "-54%", zIndex: 5 }}
              transition={{ delay: 0.15 * i, type: "spring", stiffness: 80 }}
            >
              <div className="panel h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.bg} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className={`fx ${p.fx} ${i === 2 ? "opacity-40" : ""}`} />
                <div className="sfx left-3 top-3 rotate-[-6deg] text-4xl" style={{ color: p.color }}>
                  {p.label}
                </div>
                {i === 2 && <div className="bubble bubble-tail bottom-5 right-3 text-[11px]">Who will I become?</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-20 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="glass rounded-3xl p-6">
            <div className="font-[family-name:var(--font-bangers)] text-4xl text-[var(--chog)]">{s.n}</div>
            <div className="mt-2 text-lg font-semibold">{s.t}</div>
            <p className="mt-2 text-sm text-white/60">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="font-[family-name:var(--font-dela)] text-2xl sm:text-3xl">There is no recipe.</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/60">
          Every food changes your Chog in its own secret way. Your Chog&apos;s traits change how it reacts. The city throws a new event at it every day. Even we don&apos;t know who it will become.
        </p>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {Object.values(FOODS).map((f) => (
            <span key={f.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-white/75">
              {f.emoji} {f.name}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
