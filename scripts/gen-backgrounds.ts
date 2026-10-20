/**
 * One-time: build the manga background library in public/bg using the
 * Cloudflare Workers AI free tier. Skips images that already exist.
 *   npx tsx --env-file=.env.local scripts/gen-backgrounds.ts
 */
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { libraryPrompt, SETTING_DESC, TONES, type Tone } from "../src/lib/art";
import type { District } from "../src/lib/lore";

const out = path.join(process.cwd(), "public", "bg");
mkdirSync(out, { recursive: true });

async function gen(prompt: string) {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ prompt, steps: 8 }),
    },
  );
  const j = await res.json();
  if (!j.success) throw new Error(JSON.stringify(j.errors));
  return sharp(Buffer.from(j.result.image, "base64")).resize(768, 768).webp({ quality: 78 }).toBuffer();
}

const jobs: [District["library"], Tone][] = [];
for (const s of Object.keys(SETTING_DESC) as District["library"][]) for (const t of TONES) jobs.push([s, t]);

let done = 0;
async function worker() {
  while (jobs.length) {
    const [s, t] = jobs.shift()!;
    const file = path.join(out, `${s}-${t}.webp`);
    if (existsSync(file)) {
      done++;
      continue;
    }
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        writeFileSync(file, await gen(libraryPrompt(s, t)));
        console.log(`✓ ${++done}/40 ${s}-${t}`);
        break;
      } catch (e) {
        console.warn(`✗ ${s}-${t} attempt ${attempt}: ${(e as Error).message.slice(0, 160)}`);
        await new Promise((r) => setTimeout(r, 3000 * attempt));
      }
    }
  }
}
Promise.all([worker(), worker()]).then(() => console.log("library done"));
