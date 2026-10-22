"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useChainId, useConfig, useSignMessage, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import MangaReader from "@/components/MangaReader";
import { OPENSEA_URL } from "@/components/OpenSeaLogo";
import { roleColor } from "@/lib/roleStyle";
import type { Chapter, Role } from "@/lib/types";

const CHOG_TOKEN = (process.env.NEXT_PUBLIC_CHOG_TOKEN || "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777") as `0x${string}`;
const MONAD_ID = 143;
const CHOG_MARKET = "https://dexscreener.com/monad/0x116e7d070f1888b81e1e0324f56d6746b2d7d8f1";

interface Item {
  id: string;
  author: string;
  price: string;
  publishedAt: number;
  reads: number;
  seed?: boolean;
  title: string;
  tagline: string;
  heroName: string;
  heroImage: string;
  cover: string | null;
  role: Role;
  day: number;
  unlocked: boolean;
  mine: boolean;
}

const loginMessage = (address: string, issuedAt: number) =>
  `ChogTales\n\nSign in to write your Chog's story.\nThis costs no gas.\n\nWallet: ${address.toLowerCase()}\nIssued: ${issuedAt}`;

const short = (a: string) => (a.startsWith("0x") ? `${a.slice(0, 6)}…${a.slice(-4)}` : a.startsWith("demo") ? "a demo keeper" : a);
const priceLabel = (p: string) => (p === "0" ? "Free" : `${Number(p).toLocaleString()} $CHOG`);
const usdLabel = (p: string, usd: number | null) => {
  if (p === "0" || !usd) return "";
  const v = Number(p) * usd;
  return `≈ $${v < 0.1 ? v.toFixed(3) : v < 10 ? v.toFixed(2) : v.toFixed(0)}`;
};
const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};
type ShelfEntry = { id: string; at: number };
const SHELF_LS = "ct_shelf";
function localShelf(): ShelfEntry[] {
  try {
    return JSON.parse(localStorage.getItem(SHELF_LS) || "[]");
  } catch {
    return [];
  }
}
function remember(id: string) {
  try {
    const list = [{ id, at: Date.now() }, ...localShelf().filter((e) => e.id !== id)].slice(0, 60);
    localStorage.setItem(SHELF_LS, JSON.stringify(list));
  } catch {}
}
const forSale = (it: { author: string; price: string }) => it.price === "0" || it.author.startsWith("0x");

export default function Library() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [viewer, setViewer] = useState<string | null>(null);
  const [usd, setUsd] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "free" | "paid" | "shelf">("all");
  const [shelf, setShelf] = useState<ShelfEntry[]>([]);
  const [open, setOpen] = useState<{ item: Item; chapter: Chapter; locked: boolean } | null>(null);
  const [reading, setReading] = useState<Chapter | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  const load = useCallback(async () => {
    const r = await fetch("/api/library", { cache: "no-store" });
    const j = await r.json();
    setItems(j.items ?? []);
    setViewer(j.viewer);
    setUsd(j.chogUsd ?? null);
    // signed-in shelf from the server, plus anything read on this device
    const merged = new Map<string, number>();
    for (const e of [...(j.shelf ?? []), ...localShelf()]) merged.set(e.id, Math.max(merged.get(e.id) ?? 0, e.at));
    setShelf([...merged].map(([id, at]) => ({ id, at })).sort((a, b) => b.at - a.at));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(
    () => (items ?? []).filter((i) => (filter === "all" || filter === "shelf" ? true : filter === "free" ? i.price === "0" : i.price !== "0")),
    [items, filter],
  );
  const byId = useMemo(() => new Map((items ?? []).map((i) => [i.id, i])), [items]);
  const bought = useMemo(() => (items ?? []).filter((i) => i.price !== "0" && i.unlocked && !i.mine), [items]);
  const mine = useMemo(() => (items ?? []).filter((i) => i.mine), [items]);
  const recent = useMemo(() => shelf.map((e) => ({ e, it: byId.get(e.id) })).filter((x) => x.it) as { e: ShelfEntry; it: Item }[], [shelf, byId]);
  const shelfCount = new Set([...bought.map((i) => i.id), ...recent.map((r) => r.it.id), ...mine.map((i) => i.id)]).size;

  async function openItem(item: Item) {
    setStatus("");
    const r = await fetch(`/api/library/${encodeURIComponent(item.id)}`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) return setStatus(j.error);
    remember(item.id);
    setShelf((sh) => [{ id: item.id, at: Date.now() }, ...sh.filter((e) => e.id !== item.id)]);
    if (!j.locked) {
      setReading(j.chapter);
      load();
    } else setOpen({ item, chapter: j.chapter, locked: true });
  }

  async function signIn() {
    if (!address) return false;
    const issuedAt = Date.now();
    const signature = await signMessageAsync({ message: loginMessage(address, issuedAt) });
    const r = await fetch("/api/auth", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, signature, issuedAt }) });
    if (!r.ok) throw new Error((await r.json()).error);
    setViewer(address.toLowerCase());
    return true;
  }

  /** Pay the author directly in $CHOG, then let the server confirm the transfer on-chain. */
  async function unlock(item: Item) {
    if (!address) return;
    setBusy(true);
    setStatus("");
    try {
      if (viewer !== address.toLowerCase()) {
        setStatus("Sign the free login message in your wallet…");
        await signIn();
      }
      if (chainId !== MONAD_ID) {
        setStatus("Switch your wallet to Monad…");
        await switchChainAsync({ chainId: MONAD_ID });
      }
      setStatus(`Confirm sending ${priceLabel(item.price)} to the author…`);
      const hash = await writeContractAsync({
        address: CHOG_TOKEN,
        abi: erc20Abi,
        functionName: "transfer",
        args: [item.author as `0x${string}`, parseUnits(item.price, 18)],
        chainId: MONAD_ID,
      });
      setStatus("Waiting for Monad to confirm…");
      await waitForTransactionReceipt(config, { hash, chainId: MONAD_ID });
      setStatus("Checking the payment…");
      const r = await fetch("/api/library/unlock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id, txHash: hash }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setOpen(null);
      setReading(j.chapter);
      load();
    } catch (e) {
      const msg = (e as Error).message.split("\n")[0];
      setStatus(/rejected|denied/i.test(msg) ? "Cancelled in your wallet." : /exceeds balance|insufficient/i.test(msg) ? "Not enough $CHOG in this wallet." : msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chogs/chog-1.svg" alt="" className="h-9 w-9 rounded-lg border border-white/20" />
          <span className="font-[family-name:var(--font-dela)] text-lg tracking-wide">CHOGTALES</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-white/60 hover:text-white">
            Make your own
          </Link>
          <Link href="/docs" className="rounded-full border border-white/15 px-3 py-1.5 text-xs uppercase tracking-widest text-white/80 hover:bg-white/10">
            Read docs
          </Link>
          <ConnectButton chainStatus="none" showBalance={false} accountStatus="address" />
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl pt-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Manga Library
          </span>
          <h1 className="mt-5 font-[family-name:var(--font-dela)] text-[clamp(36px,5.5vw,68px)] leading-[0.95]">
            Read other Chogs&apos; manga, or <span className="accent">buy one</span> with $CHOG.
          </h1>
          <p className="mt-5 max-w-xl text-white/60">
            Keepers publish their Chog&apos;s chapters here, free or for $CHOG. Paid chapters let you read the cover and first page; connect your wallet, pay in
            $CHOG on Monad, and the whole chapter is yours. The $CHOG goes straight to the keeper who made it.
          </p>
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <div className="seg">
            {(
              [
                ["all", "All"],
                ["free", "Free"],
                ["paid", "$CHOG"],
                ["shelf", `My shelf${shelfCount ? ` · ${shelfCount}` : ""}`],
              ] as const
            ).map(([k, t]) => (
              <button key={k} onClick={() => setFilter(k)} data-on={filter === k}>
                {t}
              </button>
            ))}
          </div>
          <span className="text-xs text-white/40">
            {items ? `${shown.length} chapter${shown.length === 1 ? "" : "s"}` : "Loading…"}
            {usd ? ` · 1 $CHOG ≈ $${usd.toFixed(5)}` : ""}
          </span>
        </div>
        {status && !open && <p className="mt-4 text-sm text-red-300">{status}</p>}

        {filter === "all" && recent.length > 0 && (
          <div className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">Continue reading</h2>
              <button onClick={() => setFilter("shelf")} className="text-xs text-violet-300 hover:text-white">
                Open my shelf →
              </button>
            </div>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {recent.slice(0, 8).map(({ e, it }) => (
                <button key={it.id} onClick={() => openItem(it)} className="card flex w-[260px] shrink-0 items-center gap-3 p-2.5 text-left transition hover:border-white/25">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.cover && <img src={it.cover} alt="" className="h-16 w-12 shrink-0 rounded-md object-cover" />}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{it.title}</span>
                    <span className="block truncate text-xs text-white/50">
                      {it.heroName} · Ch.{it.day}
                    </span>
                    <span className="mt-1 block text-[11px] text-white/40">
                      {it.price !== "0" && it.unlocked && !it.mine ? "Bought · " : it.price !== "0" && !it.unlocked ? "Preview · " : ""}
                      {ago(e.at)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {filter === "shelf" && (
          <div className="mt-8 space-y-10">
            {[
              { t: "Bought with $CHOG", list: bought, empty: "Nothing bought yet. Paid chapters you unlock stay here, forever, for your wallet." },
              { t: "Recently read", list: recent.map((r) => r.it), empty: "Chapters you open show up here, so you can pick up where you left off." },
              { t: "Published by you", list: mine, empty: "Publish a chapter from My Saga and it will show up here." },
            ].map((sec) => (
              <div key={sec.t}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/50">
                  {sec.t} <span className="text-white/30">· {sec.list.length}</span>
                </h2>
                {sec.list.length ? (
                  <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {sec.list.map((it, i) => (
                      <Card key={it.id} it={it} i={i} usd={usd} onOpen={openItem} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/40">{sec.empty}</p>
                )}
              </div>
            ))}
            {!viewer && <p className="text-xs text-white/35">Connect and sign in with your wallet to keep your shelf across devices. Without it, your shelf lives in this browser.</p>}
          </div>
        )}

        <div className={`mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${filter === "shelf" ? "hidden" : ""}`}>
          {shown.map((it, i) => (
            <Card key={it.id} it={it} i={i} usd={usd} onOpen={openItem} />
          ))}
        </div>
        {items && !shown.length && <p className="mt-10 text-center text-white/40">Nothing here yet.</p>}
      </section>

      {/* paid chapter: preview + unlock */}
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-40 grid place-items-center bg-black/80 px-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setOpen(null)}>
            <motion.div initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} className="card w-full max-w-lg overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-[140px_1fr] gap-4 p-5">
                <div className="aspect-[0.68] overflow-hidden rounded-lg border border-white/10">
                  {open.item.cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={open.item.cover} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                    {open.item.heroName} · Chapter {open.item.day}
                  </div>
                  <h3 className="mt-1 font-[family-name:var(--font-dela)] text-2xl leading-tight">{open.item.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-white/60">{open.item.tagline}</p>
                  <p className="mt-3 text-xs text-white/40">by {short(open.item.author)}</p>
                </div>
              </div>
              <div className="border-t border-white/10 p-5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-white/60">Unlock the full chapter</span>
                  <span className="text-right">
                    <span className="block font-[family-name:var(--font-dela)] text-2xl">{priceLabel(open.item.price)}</span>
                    {usd && <span className="block text-xs text-white/45">{usdLabel(open.item.price, usd)}</span>}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/40">Paid on Monad, straight to the keeper&apos;s wallet. Unlocks forever for your wallet.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setReading(open.chapter)} className="btn-ghost py-3 text-sm">
                    Read preview
                  </button>
                  {!forSale(open.item) ? (
                    <button disabled className="btn-primary py-3 text-sm">
                      On sale soon
                    </button>
                  ) : isConnected ? (
                    <button onClick={() => unlock(open.item)} disabled={busy} className="btn-primary py-3 text-sm">
                      {busy ? "Working…" : `Unlock · ${priceLabel(open.item.price)}`}
                    </button>
                  ) : (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <button onClick={openConnectModal} className="btn-primary py-3 text-sm">
                          Connect wallet to unlock
                        </button>
                      )}
                    </ConnectButton.Custom>
                  )}
                </div>
                {status && <p className="mt-3 text-center text-xs text-white/70">{status}</p>}
                <p className="mt-3 text-center text-[11px] text-white/35">
                  Need $CHOG?{" "}
                  <a href={CHOG_MARKET} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                    See the market
                  </a>{" "}
                  · Want your own Chog?{" "}
                  <a href={OPENSEA_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                    OpenSea
                  </a>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{reading && <MangaReader chapter={reading} onClose={() => setReading(null)} />}</AnimatePresence>
    </main>
  );
}

/** One chapter in the Library grid. */
function Card({ it, i, usd, onOpen }: { it: Item; i: number; usd: number | null; onOpen: (it: Item) => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 10) * 0.05 }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen(it)}
      className="group text-left"
    >
      <div className="relative aspect-[0.68] overflow-hidden rounded-xl border border-white/10 bg-[#1a1626] shadow-2xl">
        {it.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={it.cover} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
        <span
          className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${it.price === "0" ? "bg-white text-black" : "bg-violet-600 text-white"}`}
        >
          {it.mine ? "Yours" : it.price !== "0" && it.unlocked ? "Unlocked" : priceLabel(it.price)}
        </span>
        {it.price !== "0" && !it.unlocked && !it.mine && usd && (
          <span className="absolute right-2 top-9 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white/80">{usdLabel(it.price, usd)}</span>
        )}
        <div className="absolute bottom-0 p-3">
          <div className="line-clamp-1 text-[10px] uppercase tracking-widest" style={{ color: roleColor(it.role.alignment) }}>
            {it.role.title}
          </div>
          <div className="font-[family-name:var(--font-dela)] text-base leading-tight">{it.title}</div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={it.heroImage} alt="" className="h-5 w-5 rounded-md object-cover" />
        <span className="truncate">
          {it.heroName} · Ch.{it.day}
        </span>
        <span className="ml-auto shrink-0">{it.reads} reads</span>
      </div>
      <div className="mt-0.5 text-[11px] text-white/35">by {short(it.author)}</div>
    </motion.button>
  );
}
