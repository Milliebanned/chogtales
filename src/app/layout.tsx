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
  metadataBase: new URL("https://chogtales.milliebanned.xyz"),
  title: "ChogTales: The Daily Manga — your Chog, your manga",
  description: "Your Chog NFT stars in a manga that is written and drawn fresh every day. Feed it, raise it, start beef, and choose who it becomes.",
  applicationName: "ChogTales",
  openGraph: {
    title: "ChogTales: The Daily Manga",
    description: "Your Chog NFT stars in a manga that is written and drawn fresh every day.",
    url: "/",
    siteName: "ChogTales",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChogTales: The Daily Manga",
    description: "Your Chog NFT stars in a manga that is written and drawn fresh every day.",
  },
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
