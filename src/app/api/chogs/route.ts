import { handle, HttpError } from "@/lib/api";
import { getSession } from "@/lib/session";
import { demoChogs } from "@/lib/chogs";
import { fetchMeta, tokensOf } from "@/lib/nft";
import { CHOG_CONTRACT } from "@/lib/chain";

/** List the Chogs the signed-in keeper can play with. */
export async function GET() {
  return handle(async () => {
    const session = await getSession();
    if (!session) throw new HttpError(401, "Not signed in");
    if (session.demo) return { chogs: await demoChogs(), enumerable: true, demo: true };
    if (!CHOG_CONTRACT) throw new HttpError(503, "Chog contract not configured yet — try demo mode");
    const ids = await tokensOf(session.owner as `0x${string}`);
    if (ids === null) return { chogs: [], enumerable: false, demo: false };
    return { chogs: await Promise.all(ids.map(fetchMeta)), enumerable: true, demo: false };
  });
}
