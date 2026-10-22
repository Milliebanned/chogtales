import { promises as fs } from "fs";
import path from "path";
import { seedArtLocked } from "@/lib/library";
import { getSession } from "@/lib/session";

/** Art for the built-in paid chapters. Cover and page 1 are the free preview; the rest needs an unlock. */
export async function GET(req: Request) {
  const f = new URL(req.url).searchParams.get("f") ?? "";
  if (!/^[a-z0-9-]+\/[a-z0-9-]+\.webp$/.test(f)) return new Response("bad file", { status: 400 });
  if (await seedArtLocked(f, await getSession())) return new Response("locked", { status: 402 });
  try {
    const buf = await fs.readFile(path.join(process.cwd(), "library-private", f));
    return new Response(new Uint8Array(buf), { headers: { "content-type": "image/webp", "cache-control": "private, max-age=86400" } });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
