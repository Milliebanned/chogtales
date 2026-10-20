import { handle, HttpError, publicState, resolveChog } from "@/lib/api";
import { advanceDay } from "@/lib/game";
import { saveState } from "@/lib/chogs";
import { kick } from "@/lib/chapters";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

/** Demo mode only: fast-forward to tomorrow so judges can see the loop. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await getSession();
    if (!session?.demo && process.env.ALLOW_FAST_FORWARD !== "1")
      throw new HttpError(403, "Time only skips in demo mode");
    const { tokenId } = (await req.json()) as { tokenId: string };
    const state = await resolveChog(String(tokenId));
    advanceDay(state, `demo-${state.day + 1}`);
    await saveState(state);
    await kick(state); // the new day's chapter starts (or continues) drawing right away
    return { state: await publicState(state) };
  });
}
