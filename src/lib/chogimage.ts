import "server-only";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { kv } from "./store";
import { originalImageUrl } from "./nft";

/** A Chog's NFT art as webp bytes — fetched from IPFS once, then cached forever. */
export async function chogImage(tokenId: string): Promise<Buffer | null> {
  const key = `chogimg:${tokenId}`;
  const cached = await kv.get<string>(key);
  if (cached) return Buffer.from(cached, "base64");
  const url = await originalImageUrl(tokenId);
  if (!url) return null;
  const candidates = [url, url.replace(/^https:\/\/[^/]+\/ipfs\//, "https://gateway.pinata.cloud/ipfs/")];
  for (const u of candidates) {
    try {
      const res = await fetch(u, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) continue;
      const buf = await sharp(Buffer.from(await res.arrayBuffer())).resize(768, 768).webp({ quality: 82 }).toBuffer();
      await kv.set(key, buf.toString("base64"));
      return buf;
    } catch {}
  }
  return null;
}

/** Reference image for the panel artist, from a chapter image URL. */
export async function referenceFor(image: string): Promise<Buffer | null> {
  const m = image.match(/^\/api\/chog-image\/(\d+)$/);
  if (m) return chogImage(m[1]);
  if (image.startsWith("/")) {
    try {
      return await fs.readFile(path.join(process.cwd(), "public", image));
    } catch {
      return null;
    }
  }
  return null;
}
