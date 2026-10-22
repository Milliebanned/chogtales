import { handle, HttpError } from "@/lib/api";
import { getPublished, recordRead, verifyAndUnlock } from "@/lib/library";
import { getSession } from "@/lib/session";

export const maxDuration = 60;

/** The reader paid the author in $CHOG: check the transfer on-chain and unlock the chapter for their wallet. */
export async function POST(req: Request) {
  return handle(async () => {
    const session = await getSession();
    if (!session || session.demo) throw new HttpError(401, "Sign in with your wallet to unlock chapters");
    const { id, txHash } = (await req.json()) as { id: string; txHash: `0x${string}` };
    const found = await getPublished(String(id));
    if (!found) throw new HttpError(404, "That chapter isn't in the Library anymore");
    if (found.pub.price === "0") return { chapter: found.chapter };
    try {
      await verifyAndUnlock(found.pub, session.owner, txHash);
    } catch (e) {
      throw new HttpError(400, (e as Error).message);
    }
    await recordRead(session.owner, found.pub.id);
    return { chapter: found.chapter };
  });
}
