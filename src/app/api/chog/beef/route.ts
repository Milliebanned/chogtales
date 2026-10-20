import { handle, HttpError, publicState, resolveChog } from "@/lib/api";
import { startBeef } from "@/lib/game";
import { BEEFS } from "@/lib/beef";
import { beefTargets, incomingBeefKey, saveState } from "@/lib/chogs";
import { kv } from "@/lib/store";
import type { BeefKind, IncomingBeef } from "@/lib/types";

/** Who this Chog can start beef with. */
export async function GET(req: Request) {
  return handle(async () => {
    const state = await resolveChog(new URL(req.url).searchParams.get("tokenId") ?? "");
    return { targets: await beefTargets(state) };
  });
}

/** Start beef: shapes tomorrow's chapter for this Chog AND the target's next chapter. */
export async function POST(req: Request) {
  return handle(async () => {
    const { tokenId, target, kind } = (await req.json()) as { tokenId: string; target: string; kind: BeefKind };
    if (!(kind in BEEFS)) throw new HttpError(400, "Unknown move");
    const state = await resolveChog(String(tokenId));
    if (state.beef?.day === state.day) throw new HttpError(429, "One beef a day. Let this one simmer.");
    if (state.tomorrow) throw new HttpError(409, "Tomorrow's chapter is already being drawn. Start beef before you finish today's meals and care.");
    const rival = (await beefTargets(state, 50)).find((t) => t.tokenId === String(target));
    if (!rival) throw new HttpError(404, "That Chog isn't around");
    const reaction = startBeef(state, kind, rival);
    await saveState(state);
    // the other side hears about it too
    const key = incomingBeefKey(rival.tokenId);
    const list = (await kv.get<IncomingBeef[]>(key)) ?? [];
    const from = { name: state.meta.name, tokenId: state.tokenId, image: state.meta.image, role: state.role.title };
    await kv.set(key, [...list, { kind, from, at: Date.now() }].slice(-20));
    return { reaction, state: await publicState(state) };
  });
}
