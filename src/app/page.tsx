"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import Dashboard from "@/components/Dashboard";
import Landing from "@/components/Landing";
import SiteNav from "@/components/SiteNav";
import { OPENSEA_URL, OpenSeaLogo } from "@/components/OpenSeaLogo";
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
    // ?chog=<tokenId> opens that Chog's dashboard directly (shareable, and handy on phones)
    const wanted = new URLSearchParams(window.location.search).get("chog");
    if (wanted && j.chogs.some((c: ChogMeta) => c.tokenId === wanted)) setSelected(wanted);
    else if (j.chogs.length === 1) setSelected(j.chogs[0].tokenId);
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
      <SiteNav
        onLogo={() => setSelected(null)}
        action={<LibraryPill />}
        links={[
          { label: "Read docs", href: "/docs" },
          {
            label: `SFX ${sound ? "on" : "off"}`,
            onClick: () => {
              setSoundEnabled(!sound);
              setSound(!sound);
            },
          },
          ...(session
            ? [
                {
                  label: session.demo ? "Exit demo" : "Sign out",
                  onClick: () => {
                    logout();
                    if (!session.demo) disconnect();
                  },
                },
              ]
            : []),
        ]}
      />

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

/** Always-visible way into the Manga Library, on every screen size. */
function LibraryPill() {
  return (
    <a
      href="/library"
      className="rounded-full border border-violet-400/50 bg-violet-500/15 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-violet-100 transition hover:bg-violet-500/30"
    >
      <span className="sm:hidden">Library</span>
      <span className="hidden sm:inline">Manga Library</span>
    </a>
  );
}
