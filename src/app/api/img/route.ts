import { kv } from "@/lib/store";

/** Serves the per-chapter AI images stored in KV. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^img:[\w:.-]{1,200}$/.test(id)) return new Response("bad id", { status: 400 });
  const b64 = await kv.get<string>(id);
  if (!b64) return new Response("not found", { status: 404 });
  return new Response(Buffer.from(b64, "base64"), {
    headers: { "content-type": "image/webp", "cache-control": "public, max-age=31536000, immutable" },
  });
}
