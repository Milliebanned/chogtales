import "server-only";
import { createPublicClient, http, parseAbi } from "viem";
import { CHOG_CONTRACT, monad } from "./chain";
import { kv } from "./store";
import type { ChogMeta } from "./types";

const abi = parseAbi([
  "function ownerOf(uint256) view returns (address)",
  "function tokenURI(uint256) view returns (string)",
  "function totalSupply() view returns (uint256)",
]);

const client = createPublicClient({ chain: monad, transport: http() });

export function ipfsToHttp(uri: string) {
  if (!uri) return uri;
  if (uri.startsWith("ipfs://")) {
    const gw = process.env.IPFS_GATEWAY || "https://ipfs.filebase.io/ipfs/";
    return gw + uri.slice(7).replace(/^ipfs\//, "");
  }
  if (uri.startsWith("ar://")) return "https://arweave.net/" + uri.slice(5);
  return uri;
}

export async function ownerOf(tokenId: string): Promise<string> {
  if (!CHOG_CONTRACT) throw new Error("Chog contract not configured");
  const o = await client.readContract({
    address: CHOG_CONTRACT,
    abi,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });
  return o.toLowerCase();
}

interface RawMeta {
  name: string;
  image: string; // original ipfs/http url of the art
  traits: ChogMeta["traits"];
}

/** On-chain tokenURI → metadata JSON. Cached forever (Chog metadata is immutable). */
async function rawMeta(tokenId: string): Promise<RawMeta | null> {
  const cached = await kv.get<RawMeta>(`meta:${tokenId}`);
  if (cached) return cached;
  if (!CHOG_CONTRACT) return null;
  try {
    const uri = await client.readContract({
      address: CHOG_CONTRACT,
      abi,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    });
    let json: Record<string, unknown>;
    if (uri.startsWith("data:application/json;base64,")) {
      json = JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString());
    } else {
      const res = await fetch(ipfsToHttp(uri), { signal: AbortSignal.timeout(20_000) });
      json = await res.json();
    }
    const meta: RawMeta = {
      name: String(json.name || `Chog #${tokenId}`).replace(/^CHOG/, "Chog"),
      image: String(json.image || json.image_url || ""),
      traits: Array.isArray(json.attributes)
        ? (json.attributes as { trait_type: string; value: unknown }[])
            .filter((t) => !["Naked", "Form", "Side"].includes(String(t.trait_type)))
            .map((t) => ({ trait_type: String(t.trait_type), value: String(t.value) }))
        : [],
    };
    await kv.set(`meta:${tokenId}`, meta);
    return meta;
  } catch (e) {
    console.error("metadata failed", tokenId, (e as Error).message);
    return null;
  }
}

export async function fetchMeta(tokenId: string): Promise<ChogMeta> {
  const m = await rawMeta(tokenId);
  return {
    tokenId,
    name: m?.name ?? `Chog #${tokenId}`,
    // served through our own cached, resized proxy (fast + no IPFS hiccups)
    image: m?.image ? `/api/chog-image/${tokenId}` : "/chog-placeholder.svg",
    traits: m?.traits ?? [],
  };
}

export async function originalImageUrl(tokenId: string) {
  const m = await rawMeta(tokenId);
  return m?.image ? ipfsToHttp(m.image) : null;
}

/**
 * Chog Genesis isn't ERC721Enumerable, so we read every owner in a few
 * multicall batches (~2s for the full 1,969) and cache the map briefly.
 */
let ownersCache: { at: number; owners: (string | null)[] } | null = null;

async function allOwners() {
  if (ownersCache && Date.now() - ownersCache.at < 60_000) return ownersCache.owners;
  const supply = Number(
    await client.readContract({ address: CHOG_CONTRACT as `0x${string}`, abi, functionName: "totalSupply" }),
  );
  const res = await client.multicall({
    contracts: Array.from({ length: supply }, (_, i) => ({
      address: CHOG_CONTRACT as `0x${string}`,
      abi,
      functionName: "ownerOf" as const,
      args: [BigInt(i + 1)] as const,
    })),
    batchSize: 1024 * 64,
  });
  const owners = res.map((r) => (r.status === "success" ? (r.result as string).toLowerCase() : null));
  ownersCache = { at: Date.now(), owners };
  return owners;
}

export async function tokensOf(owner: `0x${string}`): Promise<string[] | null> {
  if (!CHOG_CONTRACT) return [];
  try {
    const owners = await allOwners();
    const me = owner.toLowerCase();
    return owners.flatMap((o, i) => (o === me ? [String(i + 1)] : [])).slice(0, 50);
  } catch (e) {
    console.error("tokensOf failed", (e as Error).message);
    return null; // fall back to typing a token ID
  }
}
