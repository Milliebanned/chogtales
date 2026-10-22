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
              <div className="glass mt-6 max-w-xl rounded-3xl p-6">
                <h3 className="font-[family-name:var(--font-dela)] text-xl">No Chog in this wallet yet</h3>
                <p className="mt-2 text-sm text-white/65">
                  ChogTales stars <i>your</i> Chog: its picture is the hero of every panel and its traits shape who it becomes. Get a Chog Genesis NFT on OpenSea,
                  then come back and connect again.
                </p>
                <a
                  href={OPENSEA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Get a Chog on OpenSea"
                  className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-[#2081E2]/50 bg-[#2081E2]/15 px-5 py-3 font-semibold transition hover:bg-[#2081E2]/30"
                >
                  <OpenSeaLogo className="h-8 w-8" />
                  Get a Chog on OpenSea ↗
                </a>
                <p className="mt-4 text-xs text-white/45">
                  Just looking? <button onClick={() => { logout(); }} className="underline hover:text-white">Try the demo</button> with three real Chogs.
                </p>
              </div>
            )}
            {chogs && !session.demo && !enumerable && (
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

const OPENSEA_URL = "https://opensea.io/collection/chog-genesis";

/** OpenSea's mark (Simple Icons, CC0): blue disc with the white sailboat. */
function OpenSeaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-hidden="true">
      <circle cx="12" cy="12" r="11.5" fill="#fff" />
      <path fill="#2081E2" d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.629 0 12 0ZM5.92 12.403l.051-.081 3.123-4.884a.107.107 0 0 1 .187.014c.52 1.169.972 2.623.76 3.528-.088.372-.335.876-.614 1.342a2.405 2.405 0 0 1-.117.199.106.106 0 0 1-.09.045H6.013a.106.106 0 0 1-.091-.163zm13.914 1.68a.109.109 0 0 1-.065.101c-.243.103-1.07.485-1.414.962-.878 1.222-1.548 2.97-3.048 2.97H9.053a4.019 4.019 0 0 1-4.013-4.028v-.072c0-.058.048-.106.108-.106h3.485c.07 0 .12.063.115.132-.026.226.017.459.125.67.206.42.636.682 1.099.682h1.726v-1.347H9.99a.11.11 0 0 1-.089-.173l.063-.09c.16-.231.391-.586.621-.992.156-.274.308-.566.43-.86.024-.052.043-.107.065-.16.033-.094.067-.182.091-.269a4.57 4.57 0 0 0 .065-.223c.057-.25.081-.514.081-.787 0-.108-.004-.221-.014-.327-.005-.117-.02-.235-.034-.352a3.415 3.415 0 0 0-.048-.312 6.494 6.494 0 0 0-.098-.468l-.014-.06c-.03-.108-.056-.21-.09-.317a11.824 11.824 0 0 0-.328-.972 5.212 5.212 0 0 0-.142-.355c-.072-.178-.146-.339-.213-.49a3.564 3.564 0 0 1-.094-.197 4.658 4.658 0 0 0-.103-.213c-.024-.053-.053-.104-.072-.152l-.211-.388c-.029-.053.019-.118.077-.101l1.32.357h.01l.173.05.192.054.07.019v-.783c0-.379.302-.686.679-.686a.66.66 0 0 1 .477.202.69.69 0 0 1 .2.484V6.65l.141.039c.01.005.022.01.031.017.034.024.084.062.147.11.05.038.103.086.165.137a10.351 10.351 0 0 1 .574.504c.214.199.454.432.684.691.065.074.127.146.192.226.062.079.132.156.19.232.079.104.16.212.235.324.033.053.074.108.105.161.096.142.178.288.257.435.034.067.067.141.096.213.089.197.159.396.202.598a.65.65 0 0 1 .029.132v.01c.014.057.019.12.024.184a2.057 2.057 0 0 1-.106.874c-.031.084-.06.17-.098.254-.075.17-.161.343-.264.502-.034.06-.075.122-.113.182-.043.063-.089.123-.127.18a3.89 3.89 0 0 1-.173.221c-.053.072-.106.144-.166.209-.081.098-.16.19-.245.278-.048.058-.1.118-.156.17-.052.06-.108.113-.156.161-.084.084-.15.147-.208.202l-.137.122a.102.102 0 0 1-.072.03h-1.051v1.346h1.322c.295 0 .576-.104.804-.298.077-.067.415-.36.816-.802a.094.094 0 0 1 .05-.03l3.65-1.057a.108.108 0 0 1 .138.103z" />
    </svg>
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
