/**
 * One-time script: deploy $AMEN token on nad.fun (Monad).
 * Requires: PRIVATE_KEY, NAD_API_KEY (optional), and assets/amen-logo.png
 * Run: npm run deploy-token
 */
import "dotenv/config";
import { launchAmenToken } from "./monadBridge";
import { resolve } from "path";

async function main() {
  const imagePath = resolve(process.cwd(), "assets/amen-logo.png");
  const { existsSync } = await import("fs");
  if (!existsSync(imagePath)) {
    console.error("Missing assets/amen-logo.png. Add a 512x512 PNG logo.");
    process.exit(1);
  }
  if (!process.env.PRIVATE_KEY) {
    console.error("Set PRIVATE_KEY in .env (Monad wallet with MON for gas + deploy fee).");
    process.exit(1);
  }
  console.log("Deploying $AMEN on Monad via nad.fun...");
  const { tokenAddress, txHash } = await launchAmenToken(imagePath);
  console.log("Token deployed.");
  console.log("TOKEN_ADDRESS=" + tokenAddress);
  console.log("TX_HASH=" + txHash);
  console.log("Add TOKEN_ADDRESS to .env and run: npx convex env set TOKEN_ADDRESS", tokenAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
