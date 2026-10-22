import type { Metadata } from "next";
import Link from "next/link";
import "./docs.css";

export const metadata: Metadata = {
  title: "ChogTales Docs — The Daily Manga",
  description: "How ChogTales works: your Chog NFT stars in a daily AI manga, raised by you, shared through the Library, paid in $CHOG.",
};

const CONTRACT = "0xc96d31f8626c6d03fae5dcd3d61e3fb9f4a73763";
const CHOG_TOKEN = "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777";

function Chapter({ n, title, sfx, children }: { n: number; title: string; sfx?: string; children: React.ReactNode }) {
  return (
    <section className="doc-page">
      <header className="doc-head">
        <span className="doc-chip">Chapter {n}</span>
        <h2>{title}</h2>
        {sfx && <span className="doc-sfx">{sfx}</span>}
      </header>
      {children}
      <footer className="doc-folio">ChogTales · Vol. 1 · {n}</footer>
    </section>
  );
}

function Panel({ title, children, wide }: { title?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`doc-panel ${wide ? "doc-wide" : ""}`}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

function Bubble({ who, children }: { who: string; children: React.ReactNode }) {
  return (
    <div className="doc-bubble">
      <b>{who}</b>
      {children}
    </div>
  );
}

export default function Docs() {
  return (
    <main className="docs">
      <nav className="docs-nav">
        <Link href="/" className="docs-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/chogs/chog-1.svg" alt="" />
          CHOGTALES <span>Docs</span>
        </Link>
        <div>
          <Link href="/library">Library</Link>
          <a href="/chogtales-docs.pdf" download className="docs-pdf">
            ⬇ PDF
          </a>
          <Link href="/" className="docs-cta">
            Open the app
          </Link>
        </div>
      </nav>

      {/* cover */}
      <section className="doc-page doc-cover">
        <div className="doc-cover-art">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/showcase/p0.webp" alt="" />
        </div>
        <div className="doc-cover-text">
          <div className="doc-vertical">チョグ物語</div>
          <h1>
            CHOG
            <br />
            TALES
          </h1>
          <p className="doc-cover-sub">The Daily Manga · Official Guide · Vol. 1</p>
          <p className="doc-cover-blurb">
            Your Chog NFT stars in a manga that is written and drawn fresh every day. This guide explains how it works, why the NFT is the heart of it, and how
            $CHOG flows from readers to creators.
          </p>
          <ol className="doc-toc">
            <li>What is ChogTales</li>
            <li>Why the Chog is essential</li>
            <li>A day in Chog City</li>
            <li>Beef: stories that cross</li>
            <li>The Library &amp; $CHOG</li>
            <li>Under the hood</li>
            <li>FAQ</li>
          </ol>
        </div>
      </section>

      <Chapter n={1} title="What is ChogTales" sfx="WHOOSH!">
        <div className="doc-grid">
          <Panel wide>
            <p className="doc-lead">
              ChogTales turns a Chog Genesis NFT into the main character of a serialized manga. Every day a new chapter is written and fully illustrated, with a
              cover, two pages of panels and a final decision, and it picks up exactly where the last one ended.
            </p>
          </Panel>
          <Panel title="You raise it">
            <p>Feed it, bathe it, train it, scold it, or start beef with another Chog. Every action quietly shifts a hidden personality and plants a story seed.</p>
          </Panel>
          <Panel title="It becomes someone">
            <p>Thief, sheriff, prophet, mayor, avenger. Who your Chog becomes is caused by what happened and what you chose. Nothing resets.</p>
          </Panel>
          <Panel wide>
            <Bubble who="Vex">So every keeper gets a different story?</Bubble>
            <Bubble who="Narrator">Every Chog. Same city, same rules, no two lives alike.</Bubble>
          </Panel>
        </div>
      </Chapter>

      <Chapter n={2} title="Why the Chog is essential" sfx="KRAKK!">
        <div className="doc-grid">
          <Panel title="It's the face of the manga">
            <p>The AI artist receives your Chog&apos;s NFT image as a reference for every panel, so the hero is your Chog: same cap, eyewear and outfit.</p>
          </Panel>
          <Panel title="Its traits are its nature">
            <p>On-chain traits give each Chog a hidden sensitivity to every personality trait. Two Chogs fed the same food grow up differently.</p>
          </Panel>
          <Panel title="Its traits are its legend">
            <p>The writer turns traits into plot: BTC glasses that flash a hidden code, a cap the Baron&apos;s enforcers fear, a jersey number on a mystery crate.</p>
          </Panel>
          <Panel title="Only the holder writes it">
            <p>Sign-in is a free wallet signature, and every action checks ownerOf on Monad mainnet. Sell the Chog and its saga goes with it.</p>
          </Panel>
          <Panel wide>
            <p className="doc-mono">
              Chog Genesis · Monad mainnet (chain 143) · <code>{CONTRACT}</code>
            </p>
          </Panel>
        </div>
      </Chapter>

      <Chapter n={3} title="A day in Chog City" sfx="TICK TOCK">
        <div className="doc-grid doc-steps">
          {[
            ["01", "Read", "Open today's chapter: a cover and two pages starring your Chog. It unlocks the moment every panel is drawn."],
            ["02", "Decide", "Each chapter ends on a hard choice with 2–3 options and no right answer. You choose once; the next chapter is built on it."],
            ["03", "Raise", "3 meals from 11 foods, 3 care actions from 10 (bath, groom, early night, stay up late, train, study, play, talk, scold, medicine)."],
            ["04", "Return", "At midnight UTC the day rolls over. Tomorrow's chapter is usually already drawn, because it's produced the moment today's actions are in."],
          ].map(([n, t, d]) => (
            <Panel key={n}>
              <div className="doc-step-n">{n}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </Panel>
          ))}
          <Panel wide title="Neglect is a choice too">
            <p>
              Skip meals and hunger pushes your Chog darker. Skip baths and it gets smelly: trackers follow it, doors stay shut. Stay up too late and it makes
              mistakes in the big fight. Hygiene, Energy, Hunger and Mood are always on the dashboard.
            </p>
          </Panel>
          <Panel wide title="Seasons">
            <p>
              Stories run in 7-chapter seasons drawn from 19 arcs (heist, tournament, rebellion, time loop, kaiju…), each with a season mystery revealed piece by
              piece. Chapter 1 always opens mid-crisis, and every chapter ends on a cliffhanger with a &ldquo;Next time…&rdquo; teaser.
            </p>
          </Panel>
        </div>
      </Chapter>

      <Chapter n={4} title="Beef: stories that cross" sfx="VS!">
        <div className="doc-grid">
          <Panel wide>
            <p className="doc-lead">
              Once a day you can start beef with another keeper&apos;s Chog. Pick a rival, then a move. The rivalry becomes the main conflict of your next
              chapter, and it lands in <i>their</i> next chapter too.
            </p>
          </Panel>
          {[
            ["⚔️ Duel", "Face to face. Winner takes the street."],
            ["🗯️ Trash-talk", "Say it loud, in front of everyone."],
            ["🍱 Steal its food", "Its lunch, its snacks, its dignity."],
            ["🤫 Spread a rumor", "Whisper something. Let the city do the rest."],
            ["🎭 Prank it", "Glue, paint, a bucket over a door."],
          ].map(([t, d]) => (
            <Panel key={t} title={t}>
              <p>{d}</p>
            </Panel>
          ))}
        </div>
      </Chapter>

      <Chapter n={5} title="The Library & $CHOG" sfx="KA-CHING!">
        <div className="doc-grid">
          <Panel wide>
            <p className="doc-lead">
              Any finished chapter can be published to the public Library, for free or for a price in $CHOG. Paid chapters show the cover and first page as a
              preview; the rest unlocks once the reader pays.
            </p>
          </Panel>
          <Panel title="Straight to the creator">
            <p>
              Unlocking sends $CHOG directly from the reader&apos;s wallet to the keeper who made the chapter. There&apos;s no escrow and no middleman contract.
              ChogTales takes nothing.
            </p>
          </Panel>
          <Panel title="Verified on-chain">
            <p>
              The server reads the transfer on Monad: right token, from the reader, to the author, at least the price. Each transaction unlocks once, for that
              wallet, forever.
            </p>
          </Panel>
          <Panel title="Publishing">
            <p>From My Saga, press Publish on any finished chapter and pick Free, 50, 100, 500 or a custom amount. You can take it down any time.</p>
          </Panel>
          <Panel title="Demo keepers">
            <p>Demo mode can publish for free. Selling for $CHOG needs a connected wallet that holds the Chog.</p>
          </Panel>
          <Panel wide>
            <p className="doc-mono">
              $CHOG · Monad mainnet · 18 decimals · <code>{CHOG_TOKEN}</code>
            </p>
          </Panel>
        </div>
      </Chapter>

      <Chapter n={6} title="Under the hood" sfx="BZZT">
        <div className="doc-grid">
          <Panel title="Story">
            <p>
              Two passes on Groq: <code>gpt-oss-120b</code> plans the plot, twist, cliffhanger and life update; <code>qwen3.8-27b</code> writes 8 panels of
              captions and dialogue, from a series bible and the Chog&apos;s entire life so far.
            </p>
          </Panel>
          <Panel title="Art">
            <p>FLUX.2 [klein] on Cloudflare Workers AI, with the NFT image as the character reference, 8 artists drawing in parallel.</p>
          </Panel>
          <Panel title="Chain">
            <p>viem reads ownerOf, tokenURI and totalSupply from Chog Genesis, finds a wallet&apos;s Chogs with one multicall, and verifies $CHOG payments.</p>
          </Panel>
          <Panel title="App">
            <p>Next.js 15 on Vercel, Redis for saves, wagmi + RainbowKit for wallets, a manga reader with PDF export (one chapter or a whole book).</p>
          </Panel>
          <Panel wide>
            <p className="doc-mono">
              Open source · <a href="https://github.com/Milliebanned/chogtales">github.com/Milliebanned/chogtales</a>
            </p>
          </Panel>
        </div>
      </Chapter>

      <Chapter n={7} title="FAQ" sfx="?!">
        <div className="doc-faq">
          {[
            ["Do I need a Chog to try it?", "No. Demo mode gives you three real Chog Genesis NFTs to play with. To make your own saga, you need a Chog in your wallet; the app links to the collection on OpenSea."],
            ["Does signing in cost gas?", "No. It's a free message signature. The only on-chain transaction in ChogTales is when you choose to pay $CHOG for a Library chapter."],
            ["How long does a chapter take?", "Writing takes about 10 seconds; drawing takes a couple of minutes. After day 1, tomorrow's chapter is drawn ahead while you play, so it's usually ready when you return."],
            ["Can I keep my chapters?", "Yes. Download any chapter as a PDF, or pick several and get them as one book or separate files, readable on phone or desktop."],
            ["What happens if I sell my Chog?", "The saga belongs to the Chog. The new holder continues it; you can no longer act for it."],
            ["Is the story the same for everyone?", "No. Your choices, your Chog's traits, what you fed it and who you beefed with all shape it. Even the same choices play out differently on different Chogs."],
          ].map(([q, a]) => (
            <div key={q} className="doc-qa">
              <Bubble who="Q">{q}</Bubble>
              <p>{a}</p>
            </div>
          ))}
        </div>
        <div className="doc-end">TO BE CONTINUED…</div>
      </Chapter>
    </main>
  );
}
