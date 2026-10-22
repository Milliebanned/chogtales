import { handle, HttpError, resolveChog } from "@/lib/api";
import { MAX_PRICE, pubKey, type Published } from "@/lib/library";
import { getSession } from "@/lib/session";
import { kv } from "@/lib/store";
import type { Chapter } from "@/lib/types";

/** Publish one of your chapters to the Library, free or for a price in $CHOG paid straight to you. */
export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId, day, price } = (await req.json()) as { tokenId: string; day: number; price: string };
    const session = await getSession();
    const state = await resolveChog(String(tokenId)); // enforces ownership
    const p = String(price ?? "0").trim();
    if (!/^\d+(\.\d{1,6})?$/.test(p) || Number(p) > MAX_PRICE) throw new HttpError(400, `Price must be between 0 and ${MAX_PRICE.toLocaleString()} $CHOG`);
    if (session?.demo && Number(p) > 0) throw new HttpError(400, "Demo keepers can only publish for free. Connect a wallet to sell chapters for $CHOG.");
    const chapterKey = `chapter:${state.key}:${Number(day)}`;
    const chapter = await kv.get<Chapter>(chapterKey);
    if (!chapter || chapter.status !== "ready") throw new HttpError(400, "Only finished chapters can be published");
    const prev = await kv.get<Published>(pubKey(chapter.id));
    const pub: Published = {
      id: chapter.id,
      chapterKey,
      tokenId: state.tokenId,
      author: state.owner,
      price: Number(p) === 0 ? "0" : String(Number(p)),
      publishedAt: prev?.publishedAt ?? Date.now(),
      reads: prev?.reads ?? 0,
      title: chapter.title,
      tagline: chapter.tagline,
      heroName: chapter.heroName,
      heroImage: chapter.heroImage,
      cover: chapter.cover.image ?? null,
      role: chapter.role,
      day: chapter.day,
    };
    await kv.set(pubKey(chapter.id), pub);
    await kv.sadd("pub:index", chapter.id);
    return { pub };
  });
}

/** Take a chapter out of the Library. People who already paid keep nothing new; it just stops being listed. */
export async function DELETE(req: Request) {
  return handle(async () => {
    const { tokenId, day } = (await req.json()) as { tokenId: string; day: number };
    const state = await resolveChog(String(tokenId));
    const chapter = await kv.get<Chapter>(`chapter:${state.key}:${Number(day)}`);
    if (!chapter) throw new HttpError(404, "Chapter not found");
    await kv.set(pubKey(chapter.id), null);
    return { ok: true };
  });
}
