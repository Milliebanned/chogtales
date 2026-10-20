import { verifyMessage, isAddress } from "viem";
import crypto from "crypto";
import { handle, HttpError } from "@/lib/api";
import { clearSession, getSession, loginMessage, setSession } from "@/lib/session";

export async function GET() {
  return handle(async () => ({ session: await getSession() }));
}

export async function POST(req: Request) {
  return handle(async () => {
    const body = await req.json();
    if (body.demo) {
      const s = await setSession(`demo:${crypto.randomBytes(6).toString("hex")}`, true);
      return { session: s };
    }
    const { address, signature, issuedAt } = body as {
      address: string;
      signature: `0x${string}`;
      issuedAt: number;
    };
    if (!isAddress(address)) throw new HttpError(400, "Bad address");
    if (Math.abs(Date.now() - issuedAt) > 10 * 60 * 1000) throw new HttpError(400, "Signature expired");
    const ok = await verifyMessage({
      address,
      message: loginMessage(address, issuedAt),
      signature,
    });
    if (!ok) throw new HttpError(401, "Invalid signature");
    return { session: await setSession(address.toLowerCase(), false) };
  });
}

export async function DELETE() {
  return handle(async () => {
    await clearSession();
    return { ok: true };
  });
}
