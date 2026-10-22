# ChogTales: The Daily Manga

**Your Chog stars in its own manga. A new chapter is written and drawn every day, and how you raise your Chog decides who it becomes.**

Built for [Chogathon 2026](https://chogathon.chog.xyz).

> **Live demo:** https://chogtales.milliebanned.xyz · **Demo video:** _coming soon_

---

## What it is

Connect a wallet that holds a Chog Genesis NFT and pick your Chog. It wakes up in Chog City, a manga world of food barons, masked chefs, gangs and old monks. From then on it is the main character of a serialized manga that never resets.

Every day you:

1. **Read today's chapter.** You get a cover and two pages of panels, drawn with *your* Chog as the hero.
2. **Make the decision** at the end of the chapter. It's final, and the next chapter is built on it.
3. **Raise your Chog.** Feed it, care for it (bath, bedtime, training, a hard word…), or start beef with another player's Chog.
4. **Come back tomorrow** to see what it became. A thief can become a sheriff, a rebel can become a mayor, a lover can become an avenger.

Nothing you do has a visible formula. Every action quietly shifts a hidden personality and plants a story consequence, and the next chapter makes those consequences happen on the page.

## Why the Chog is essential

Take the NFT away and there is no story. The Chog is what each part runs on:

- **It's the face of the manga.** The AI artist receives your Chog's NFT image as a reference in every panel, so the hero looks like *your* Chog: same hat, eyewear and outfit.
- **Its traits are its nature.** Each Chog's on-chain traits give it a hidden sensitivity to every personality trait. Two Chogs fed the same food grow up differently.
- **Its traits are its legend.** The writer turns traits into personality, signature moves and plot. In one chapter a Chog's Bitcoin glasses flashed a hidden code that a dying stranger had been waiting for.
- **Only the holder can write its story.** Sign-in is a free wallet signature, and every action checks `ownerOf` on Monad mainnet. Sell the Chog and its saga goes with it.
- **Chogs meet each other.** Other players' Chogs show up as rivals and allies, and beef you start lands in *their* next chapter too.

## Features

| | |
|---|---|
| 📖 **Daily chapter** | Cover, 2 pages of 4 panels, and a "Next time…" teaser. Read it page by page with tap, arrow keys or auto-play. |
| ⚖️ **Final decisions** | 2–3 options with no obvious right answer. The choice drives the next chapter. |
| 🍙 **Feeding** | 11 foods, 3 meals a day. Each meal shifts the hidden personality and plants a story seed. |
| 🛁 **Care** | Bath, brush & groom, early night, stay up late, train, study, play, talk & cuddle, scold, medicine. 3 a day, with Hygiene and Energy meters. Neglect shows up in the story too. |
| 🔥 **Beef** | Challenge, trash-talk, steal from, spread a rumor about, or prank another player's Chog. It becomes the main conflict of your next chapter and lands in theirs. |
| 🧬 **A life that remembers** | Identity, motive, relationships, wounds, open threads and a timeline carry across every chapter. |
| 🎬 **Seasons** | 19 seven-chapter story arcs (heist, tournament, rebellion, time loop, kaiju…) with a season mystery revealed piece by piece. |
| ⬇️ **PDF download** | Download any chapter, or pick several and get one book or separate files. Readable on phone or desktop. |
| ⏩ **Draw-ahead** | Once today's actions are in, tomorrow's chapter is written and drawn in the background, so it's ready when you return. |

## Testing it

### Demo mode (no wallet needed)
1. Open the site and choose **Try the demo →**.
2. Pick one of the three demo Chogs. These are real Chog Genesis NFTs read from mainnet.
3. Wait for chapter 1 to be written and drawn. Read it and make the decision.
4. Feed it 3 times, do 3 care actions, and optionally start beef with another Chog.
5. Press **⏭ Skip to tomorrow (demo)** to jump a day. The next chapter picks up from your decision and shows the consequences of what you did.
6. In **My Saga**, use **⬇ Download chapters** to save one or several chapters as a PDF.

To see beef cross between stories: with Chog A, start beef with Chog B. Skip a day on A, then open B. Both chapters feature the rivalry.

### With a real Chog
1. Connect a wallet that holds a Chog Genesis NFT on Monad with any browser wallet (MetaMask, Rabby, Phantom…). Mobile wallets via WalletConnect work when `NEXT_PUBLIC_WC_PROJECT_ID` is set.
2. Sign the login message. It's free and sends no transaction.
3. Your Chogs are listed automatically. Pick one and play. The day rolls over at midnight UTC.
4. No Chog in the wallet? The app links you to the [Chog Genesis collection on OpenSea](https://opensea.io/collection/chog-genesis).

## How it works

```
Wallet ──signature──▶ session ──ownerOf (Monad)──▶ your Chog's state
                                                    │
     feed / care / beef / decision ────────────────▶│ hidden personality + story seeds
                                                    ▼
                                         Story writer (2 passes)
                                  plan: plot, twist, cliffhanger, life update
                                  script: 8 panels, captions, dialogue
                                                    ▼
                                    Panel artist (NFT image as reference)
                                                    ▼
                                       Manga reader · PDF · saga shelf
```

- **Story:** Groq. `gpt-oss-120b` plans the chapter and `qwen3.8-27b` writes the panel script and lettering. The writer works from a series bible (`src/lib/lore.ts`), a plot bank of arcs, twists, set pieces and cliffhangers (`src/lib/plotbank.ts`, `src/lib/craft.ts`), and the Chog's full life so far.
- **Art:** FLUX.2 [klein] on Cloudflare Workers AI, with the NFT image passed as a reference. The model's output filter rejects some images at random, so missing panels are retried with several attempts in parallel. A pre-drawn scenery library (`public/bg`) is the last fallback.
- **Chain:** viem reads `ownerOf`, `tokenURI` and `totalSupply` from Chog Genesis (`0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763`) on Monad mainnet (chain 143). The collection isn't enumerable, so a holder's Chogs are found with one multicall over all owners (about 2 s).
- **Storage:** Upstash Redis in production, a local JSON file in development.

## Tech stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · wagmi + viem + RainbowKit · Groq · Cloudflare Workers AI · Upstash Redis · sharp · html-to-image + jsPDF

## Running locally

```bash
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev                  # http://localhost:3000
```

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_CHOG_CONTRACT`, `NEXT_PUBLIC_MONAD_RPC` | Reading Chogs from Monad (already filled in) |
| `GROQ_API_KEY` | Story writing ([console.groq.com](https://console.groq.com), free) |
| `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | Panel art (Workers AI) |
| `SESSION_SECRET` | Signing sessions (any long random string) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Storage in production (or the `KV_REST_API_*` pair Vercel adds) |
| `DEMO_TOKEN_IDS` | Real Chog token IDs used in demo mode, comma-separated |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Optional: mobile wallets via WalletConnect |
| `GEMINI_API_KEY` | Optional: fallback story writer |

## Pre-existing work

None. Everything here was built during Chogathon 2026, starting from a blank `create-next-app`.
