import { handle, HttpError, publicState, resolveChog } from "@/lib/api";
import { kv } from "@/lib/store";
import { saveState } from "@/lib/chogs";
import { prepareTomorrow, readyForTomorrow } from "@/lib/chapters";
import type { Chapter } from "@/lib/types";

export const maxDuration = 60;

/** The keeper answers the decision at the end of today's chapter. Final once made. */
export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId, option } = (await req.json()) as { tokenId: string; option: string };
    const state = await resolveChog(String(tokenId));
    const chapter = await kv.get<Chapter>(`chapter:${state.key}:${state.day}`);
    const picked = chapter?.choice?.options.find((o) => o.id === option);
    if (!chapter?.choice || !picked) throw new HttpError(400, "There's no decision to make right now");
    if (state.decision?.day === state.day) throw new HttpError(409, "You already decided. There's no going back.");
    state.decision = { day: state.day, prompt: chapter.choice.prompt, picked: picked.label };
    await saveState(state);
    if (readyForTomorrow(state)) prepareTomorrow(state);
    return { state: await publicState(state) };
  });
}
