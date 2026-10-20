"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { connectorsForWallets, darkTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  phantomWallet,
  rabbyWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monad } from "@/lib/chain";

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: projectId
        ? [metaMaskWallet, phantomWallet, rabbyWallet, walletConnectWallet, injectedWallet]
        : [injectedWallet],
    },
  ],
  { appName: "Chog Chronicles", projectId: projectId || "chog-chronicles" },
);

const config = createConfig({
  chains: [monad],
  connectors,
  transports: { [monad.id]: http() },
  ssr: true,
});

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider
          theme={darkTheme({ accentColor: "#8b5cf6", borderRadius: "large", overlayBlur: "small" })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
