import { handle, publicState, resolveChog } from "@/lib/api";

export async function GET(req: Request) {
  return handle(async () => {
    const tokenId = new URL(req.url).searchParams.get("tokenId") ?? "";
    return publicState(await resolveChog(tokenId));
  });
}
