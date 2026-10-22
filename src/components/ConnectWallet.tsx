"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

const WC_ENABLED = !!process.env.NEXT_PUBLIC_WC_PROJECT_ID;

const isMobile = () => typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const hasInjected = () => typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;

/** Deep links that reopen this exact page inside a wallet app's own browser, where the wallet is injected. */
function walletLinks() {
  const href = window.location.href;
  const hostPath = href.replace(/^https?:\/\//, "");
  return [
    { name: "MetaMask", url: `https://metamask.app.link/dapp/${hostPath}` },
    { name: "Phantom", url: `https://phantom.app/ul/browse/${encodeURIComponent(href)}?ref=${encodeURIComponent(window.location.origin)}` },
    { name: "Coinbase Wallet", url: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(href)}` },
    { name: "OKX Wallet", url: `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(href)}` },
  ];
}

const INSTALL = [
  { name: "MetaMask", url: "https://metamask.io/download/" },
  { name: "Phantom", url: "https://phantom.com/download" },
  { name: "Rabby", url: "https://rabby.io/" },
];

/**
 * The one wallet button used across the site. With a wallet available (desktop
 * extension, or inside a wallet app's browser) it opens the normal connect
 * modal. On a phone browser with no wallet, it offers to open ChogTales inside
 * a wallet app; on desktop with no extension, it links to wallet downloads.
 */
export default function ConnectWallet({ label = "Connect wallet", className = "btn-primary px-7 py-3.5 text-base", compact }: { label?: string; className?: string; compact?: boolean }) {
  const [sheet, setSheet] = useState<null | "mobile" | "install">(null);
  return (
    <ConnectButton.Custom>
      {({ account, openConnectModal, openAccountModal, mounted }) => {
        if (mounted && account)
          return (
            <button onClick={openAccountModal} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10">
              {account.displayName}
            </button>
          );
        const onClick = () => {
          if (hasInjected()) return openConnectModal();
          if (isMobile()) return setSheet("mobile");
          if (WC_ENABLED) return openConnectModal();
          setSheet("install");
        };
        return (
          <>
            <button onClick={onClick} disabled={!mounted} className={className}>
              {compact ? "Connect" : label}
            </button>
            <AnimatePresence>
              {sheet && (
                <motion.div
                  className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSheet(null)}
                >
                  <motion.div
                    initial={{ y: 40 }}
                    animate={{ y: 0 }}
                    exit={{ y: 40 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#120f1a] p-5 sm:rounded-3xl"
                  >
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
                    <h3 className="font-[family-name:var(--font-dela)] text-xl text-white">
                      {sheet === "mobile" ? "Open ChogTales in your wallet" : "You need a wallet"}
                    </h3>
                    <p className="mt-1.5 text-sm text-white/60">
                      {sheet === "mobile"
                        ? "Phone browsers can't reach your wallet. Pick your wallet app: it opens this page in its own browser, where connecting just works."
                        : "Install a browser wallet that supports Monad, then come back and connect."}
                    </p>
                    <div className="mt-4 grid gap-2">
                      {(sheet === "mobile" ? walletLinks() : INSTALL).map((w) => (
                        <a
                          key={w.name}
                          href={w.url}
                          target={sheet === "install" ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm font-semibold text-white transition hover:border-violet-300/50 hover:bg-violet-500/10"
                        >
                          {sheet === "mobile" ? `Open in ${w.name}` : `Get ${w.name}`}
                          <span className="text-white/50">→</span>
                        </a>
                      ))}
                      {WC_ENABLED && (
                        <button
                          onClick={() => {
                            setSheet(null);
                            openConnectModal();
                          }}
                          className="flex items-center justify-between rounded-2xl border border-violet-400/40 bg-violet-500/15 px-4 py-3.5 text-left text-sm font-semibold text-white hover:bg-violet-500/25"
                        >
                          Scan with any wallet (WalletConnect)
                          <span className="text-white/50">→</span>
                        </button>
                      )}
                    </div>
                    <button onClick={() => setSheet(null)} className="mt-4 w-full rounded-2xl py-2.5 text-sm text-white/50 hover:text-white">
                      Not now
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );
      }}
    </ConnectButton.Custom>
  );
}
