import { chogImage } from "@/lib/chogimage";

export const maxDuration = 30;

/** The holder's Chog art, served from our cache (fast, no IPFS hiccups). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,6}$/.test(id)) return new Response("bad id", { status: 400 });
  const buf = await chogImage(id);
  if (!buf) return new Response("image unavailable", { status: 502 });
  return new Response(new Uint8Array(buf), {
    headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
  });
}
