import "server-only";
import sharp from "sharp";

export const imagegenEnabled = () =>
  process.env.DISABLE_ART !== "1" &&
  !!process.env.CLOUDFLARE_ACCOUNT_ID && !!process.env.CLOUDFLARE_API_TOKEN;

export class QuotaError extends Error {}
/** The safety filter rejected this prompt/reference — retrying the same thing is pointless. */
export class FlaggedError extends Error {}

const run = (model: string) =>
  `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

/**
 * Draw a full manga panel with FLUX.2 [klein] (Cloudflare Workers AI free tier).
 * `refs` are the NFT images of the characters in the panel — the model redraws
 * those exact characters inside the scene. Returns compact webp bytes.
 */
export async function drawPanel(prompt: string, refs: Buffer[], width: number, height: number): Promise<Buffer> {
  const form = new FormData();
  form.append("prompt", prompt.slice(0, 2000));
  form.append("width", String(width));
  form.append("height", String(height));
  for (const [i, ref] of refs.slice(0, 4).entries()) {
    // reference images must be smaller than 512x512
    const png = await sharp(ref).resize(448, 448, { fit: "cover" }).png().toBuffer();
    form.append(`input_image_${i}`, new Blob([new Uint8Array(png)], { type: "image/png" }), `ref${i}.png`);
  }
  const res = await fetch(run(process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-4b"), {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
    body: form,
    signal: AbortSignal.timeout(45_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.success || !j.result?.image) {
    const msg = JSON.stringify(j.errors ?? j).slice(0, 300);
    if (/allocation|neurons|quota|429/i.test(msg) || res.status === 429) throw new QuotaError(msg);
    if (/flagged/i.test(msg)) throw new FlaggedError(msg);
    throw new Error(`cloudflare ${res.status}: ${msg}`);
  }
  return sharp(Buffer.from(j.result.image, "base64")).webp({ quality: 80 }).toBuffer();
}
