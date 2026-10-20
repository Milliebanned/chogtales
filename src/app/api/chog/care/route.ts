import { handle, HttpError, publicState, resolveChog } from "@/lib/api";
import { care, CARES_PER_DAY } from "@/lib/game";
import { CARES } from "@/lib/care";
import { saveState } from "@/lib/chogs";
import { prepareTomorrow, readyForTomorrow } from "@/lib/chapters";
import type { CareId } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId, action } = (await req.json()) as { tokenId: string; action: CareId };
    if (!(action in CARES)) throw new HttpError(400, "Unknown care action");
    const state = await resolveChog(String(tokenId));
    if (state.cares.length >= CARES_PER_DAY) throw new HttpError(429, "That's enough fussing for today. Let it be!");
    const reaction = care(state, action);
    await saveState(state);
    if (readyForTomorrow(state)) prepareTomorrow(state);
    return { reaction, state: await publicState(state) };
  });
}
