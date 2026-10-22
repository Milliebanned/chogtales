import { handle, HttpError } from "@/lib/api";
import { canRead, countRead, getPublished, preview } from "@/lib/library";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** One published chapter: the full thing if free or unlocked, otherwise a preview. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const { id } = await params;
    const found = await getPublished(decodeURIComponent(id));
    if (!found) throw new HttpError(404, "That chapter isn't in the Library anymore");
    const open = await canRead(found.pub, await getSession());
    if (open) await countRead(found.pub.id);
    return { pub: found.pub, chapter: open ? found.chapter : preview(found.chapter), locked: !open };
  });
}
