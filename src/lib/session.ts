import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "cc_session";

export interface Session {
  owner: string; // lowercase wallet address, or "demo:<id>"
  demo: boolean;
  exp: number;
}

const sign = (payload: string) =>
  crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");

export function loginMessage(address: string, issuedAt: number) {
  return `ChogTales\n\nSign in to write your Chog's story.\nThis costs no gas.\n\nWallet: ${address.toLowerCase()}\nIssued: ${issuedAt}`;
}

export async function setSession(owner: string, demo: boolean) {
  const s: Session = { owner, demo, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 };
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return s;
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s.exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
