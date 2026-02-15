/**
 * Fetch $AMEN market data from nad.fun. Safe for Convex (no Node/fs/viem).
 * Deploy/buy logic lives in scripts/monadBridge.ts (Node only).
 */

const NAD_MAINNET_API = "https://api.nadapp.net";

export async function fetchAmenMarketData(tokenAddress: string): Promise<{
  price: string;
  holders: number;
  volume: string;
}> {
  const nadApiKey = process.env.NAD_API_KEY;
  const headers: Record<string, string> = {};
  if (nadApiKey) headers["X-API-Key"] = nadApiKey;

  try {
    const res = await fetch(`${NAD_MAINNET_API}/agent/market/${tokenAddress}`, {
      headers,
    });
    const data = (await res.json()) as {
      market_info?: { price_usd?: string; holder_count?: number; volume?: string };
    };
    return {
      price: data.market_info?.price_usd ?? "0",
      holders: data.market_info?.holder_count ?? 0,
      volume: data.market_info?.volume ?? "0",
    };
  } catch {
    return { price: "0", holders: 0, volume: "0" };
  }
}
