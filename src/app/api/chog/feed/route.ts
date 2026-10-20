import { handle, HttpError, publicState, resolveChog } from "@/lib/api";
import { feed, MEALS_PER_DAY } from "@/lib/game";
import { FOODS } from "@/lib/foods";
import { saveState } from "@/lib/chogs";
import { prepareTomorrow, readyForTomorrow } from "@/lib/chapters";
import type { FoodId } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId, food } = (await req.json()) as { tokenId: string; food: FoodId };
    if (!(food in FOODS)) throw new HttpError(400, "Unknown food");
    const state = await resolveChog(String(tokenId));
    if (state.meals.length >= MEALS_PER_DAY)
      throw new HttpError(429, "It can't eat another bite today. Come back tomorrow!");
    const reaction = feed(state, food);
    await saveState(state);
    // everything for today is in (decision + meals) → write and draw tomorrow's chapter now
    if (readyForTomorrow(state)) prepareTomorrow(state);
    return { reaction, state: await publicState(state) };
  });
}
