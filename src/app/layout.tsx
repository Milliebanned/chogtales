import type { Metadata } from "next";
import { Bangers, Comic_Neue, Dela_Gothic_One, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dela = Dela_Gothic_One({ subsets: ["latin"], weight: "400", variable: "--font-dela" });
const bangers = Bangers({ subsets: ["latin"], weight: "400", variable: "--font-bangers" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const comic = Comic_Neue({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-comic" });

export const metadata: Metadata = {
  title: "ChogTales: The Daily Manga — your Chog, your manga",
  description:
    "Care for your Chog NFT. Feed it, spoil it, or forget it. Every day it stars in a new manga chapter shaped by your choices.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dela.variable} ${bangers.variable} ${comic.variable} ${serif.variable} antialiased ink-bg grain min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
