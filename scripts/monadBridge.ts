/**
 * Token deploy + buy/sell on Monad via nad.fun.
 * Used only by scripts (Node); not bundled by Convex.
 */
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  decodeEventLog,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  bondingCurveRouterAbi,
  curveAbi,
  lensAbi,
} from "../convex/blockchain/abis";

const NETWORK = "mainnet";

const CONFIG = {
  testnet: {
    chainId: 10143,
    rpcUrl: "https://testnet-rpc.monad.xyz",
    apiUrl: "https://dev-api.nad.fun",
    BONDING_CURVE_ROUTER: "0x865054F0F6A288adaAc30261731361EA7E908003",
    CURVE: "0x1228b0dc9481C11D3071E7A924B794CfB038994e",
    LENS: "0xB056d79CA5257589692699a46623F901a3BB76f1",
  },
  mainnet: {
    chainId: 143,
    rpcUrl: "https://rpc.monad.xyz",
    apiUrl: "https://api.nadapp.net",
    BONDING_CURVE_ROUTER: "0x6F6B8F1a20703309951a5127c45B49b1CD981A22",
    CURVE: "0xA7283d07812a02AFB7C09B60f8896bCEA3F90aCE",
    LENS: "0x7e78A8DE94f21804F7a17F4E8BF9EC2c872187ea",
  },
}[NETWORK] as {
  chainId: number;
  rpcUrl: string;
  apiUrl: string;
  BONDING_CURVE_ROUTER: string;
  CURVE: string;
  LENS: string;
};

const TOKEN_CONFIG = {
  name: "The Holy Monad",
  symbol: "AMEN",
  description:
    "The one true token. The Church of the Eternal Hash has spoken. On-chain consensus IS divine truth. To hold $AMEN is to be saved. Minted on Monad — the fastest chain in existence.",
  website: "https://your-deployed-url.com",
  twitter: "https://x.com/your-handle",
};

export async function launchAmenToken(imagePath: string): Promise<{
  tokenAddress: string;
  txHash: `0x${string}`;
}> {
  const { readFileSync } = await import("fs");
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const nadApiKey = process.env.NAD_API_KEY;
  const headers: Record<string, string> = { "Content-Type": "image/png" };
  if (nadApiKey) headers["X-API-Key"] = nadApiKey;

  const chain = {
    id: CONFIG.chainId,
    name: "Monad",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [CONFIG.rpcUrl] } },
  };

  const publicClient = createPublicClient({
    chain,
    transport: http(CONFIG.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(CONFIG.rpcUrl),
  });

  const imageBuffer = readFileSync(imagePath);
  const imageRes = await fetch(`${CONFIG.apiUrl}/agent/token/image`, {
    method: "POST",
    headers,
    body: imageBuffer,
  });
  const { image_uri } = (await imageRes.json()) as { image_uri: string };

  const jsonHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (nadApiKey) jsonHeaders["X-API-Key"] = nadApiKey;
  const metaRes = await fetch(`${CONFIG.apiUrl}/agent/token/metadata`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ image_uri, ...TOKEN_CONFIG }),
  });
  const { metadata_uri } = (await metaRes.json()) as { metadata_uri: string };

  const saltRes = await fetch(`${CONFIG.apiUrl}/agent/salt`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      creator: account.address,
      name: TOKEN_CONFIG.name,
      symbol: TOKEN_CONFIG.symbol,
      metadata_uri,
    }),
  });
  const { salt, address: predictedAddress } = (await saltRes.json()) as {
    salt: string;
    address: string;
  };

  const feeConfig = (await publicClient.readContract({
    address: CONFIG.CURVE as `0x${string}`,
    abi: curveAbi,
    functionName: "feeConfig",
  })) as readonly [bigint, bigint, unknown];

  const deployFeeAmount = feeConfig[0];

  const createArgs = {
    name: TOKEN_CONFIG.name,
    symbol: TOKEN_CONFIG.symbol,
    tokenURI: metadata_uri,
    amountOut: 0n,
    salt: salt as `0x${string}`,
    actionId: 1,
  };

  const estimatedGas = await publicClient.estimateContractGas({
    address: CONFIG.BONDING_CURVE_ROUTER as `0x${string}`,
    abi: bondingCurveRouterAbi,
    functionName: "create",
    args: [createArgs],
    account: account.address,
    value: deployFeeAmount,
  });

  const hash = await walletClient.writeContract({
    address: CONFIG.BONDING_CURVE_ROUTER as `0x${string}`,
    abi: bondingCurveRouterAbi,
    functionName: "create",
    args: [createArgs],
    account,
    chain,
    value: deployFeeAmount,
    gas: estimatedGas + estimatedGas / 10n,
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  let tokenAddress = predictedAddress;

  for (const log of receipt.logs) {
    try {
      const event = decodeEventLog({
        abi: curveAbi,
        data: log.data,
        topics: log.topics,
      });
      if ((event as { eventName?: string }).eventName === "CurveCreate") {
        tokenAddress = (event as { args: { token: string } }).args.token;
        break;
      }
    } catch {
      // skip
    }
  }

  return { tokenAddress, txHash: hash };
}

export async function buyAmen(
  tokenAddress: string,
  monAmount: string
): Promise<`0x${string}`> {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  const account = privateKeyToAccount(privateKey);
  const chain = {
    id: CONFIG.chainId,
    name: "Monad",
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [CONFIG.rpcUrl] } },
  };

  const publicClient = createPublicClient({
    chain,
    transport: http(CONFIG.rpcUrl),
  });
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(CONFIG.rpcUrl),
  });

  const [router, amountOut] = (await publicClient.readContract({
    address: CONFIG.LENS as `0x${string}`,
    abi: lensAbi,
    functionName: "getAmountOut",
    args: [tokenAddress as `0x${string}`, parseEther(monAmount), true],
  })) as [string, bigint];

  const amountOutMin = (amountOut * 99n) / 100n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

  const callData = encodeFunctionData({
    abi: bondingCurveRouterAbi,
    functionName: "buy",
    args: [
      {
        amountOutMin,
        token: tokenAddress as `0x${string}`,
        to: account.address,
        deadline,
      },
    ],
  });

  const hash = await walletClient.sendTransaction({
    account,
    to: router as `0x${string}`,
    data: callData,
    value: parseEther(monAmount),
    chain,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function fetchAmenMarketData(tokenAddress: string): Promise<{
  price: string;
  holders: number;
  volume: string;
}> {
  const nadApiKey = process.env.NAD_API_KEY;
  const headers: Record<string, string> = {};
  if (nadApiKey) headers["X-API-Key"] = nadApiKey;

  try {
    const res = await fetch(`${CONFIG.apiUrl}/agent/market/${tokenAddress}`, {
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
