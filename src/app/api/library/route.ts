import { handle } from "@/lib/api";
import { canRead, chogUsd, listPublished, shelfOf } from "@/lib/library";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Every published chapter, newest first, with whether the viewer can read it. */
export async function GET() {
  return handle(async () => {
    const session = await getSession();
    const [items, usd, shelf] = await Promise.all([listPublished(), chogUsd(), session ? shelfOf(session.owner) : Promise.resolve([])]);
    const access = await Promise.all(items.map((p) => canRead(p, session)));
    return { items: items.map((p, i) => ({ ...p, unlocked: access[i], mine: !!session && session.owner === p.author })), viewer: session?.demo ? null : session?.owner ?? null, chogUsd: usd, shelf };
  });
}
