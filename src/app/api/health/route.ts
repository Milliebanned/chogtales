import { NextResponse } from "next/server";
import { kv, storeInfo, storeKind } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Deploy check: which commit is live and whether storage works. Shows env var NAMES only, never values. */
export async function GET() {
  let storage = "ok";
  try {
    await kv.set("health:ping", Date.now());
    await kv.get("health:ping");
  } catch (e) {
    storage = (e as Error).message;
  }
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    store: storeKind,
    storage,
    storageFrom: storeInfo.via,
    storageVarsFound: storeInfo.candidates,
    art: !!process.env.CLOUDFLARE_API_TOKEN,
    writer: !!process.env.GROQ_API_KEY,
    contract: !!process.env.NEXT_PUBLIC_CHOG_CONTRACT,
  });
}
