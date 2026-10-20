import { handle, HttpError, resolveChog } from "@/lib/api";
import { kv } from "@/lib/store";
import { chapterStatus, kick } from "@/lib/chapters";
import { inkProgress } from "@/lib/inker";
import type { Chapter } from "@/lib/types";

export const maxDuration = 60;

/**
 * Today's chapter. Returns immediately with whatever exists so far and makes
 * sure production is running in the background; the client polls this.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId } = (await req.json()) as { tokenId: string };
    const state = await resolveChog(String(tokenId));
    const { chapter, progress, writerBusy } = await chapterStatus(state);
    if (chapter?.status !== "ready") await kick(state);
    return { chapter, progress, writing: !chapter, writerBusy, decision: state.decision?.day === state.day ? state.decision : null };
  });
}

/** Read an older chapter of your own saga. */
export async function GET(req: Request) {
  return handle(async () => {
    const url = new URL(req.url);
    const state = await resolveChog(url.searchParams.get("tokenId") ?? "");
    const day = Number(url.searchParams.get("day"));
    const chapter = await kv.get<Chapter>(`chapter:${state.key}:${day}`);
    if (!chapter) throw new HttpError(404, "Chapter not found");
    return { chapter, progress: inkProgress(chapter) };
  });
}
