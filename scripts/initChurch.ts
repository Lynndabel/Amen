/**
 * One-time script: seed the database with 8 agents and initial church state.
 * Requires: CONVEX_URL or VITE_CONVEX_URL (from npx convex dev → .env.local).
 * Run: npm run init
 */
import { config } from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { CHURCH_AGENTS } from "../convex/agents/characters";

// Load .env.local first (Convex writes here), then .env
config({ path: ".env.local" });
config({ path: ".env" });

const url = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL;
if (!url || url.includes("your-deployment")) {
  console.error(
    "Set CONVEX_URL or VITE_CONVEX_URL to your real Convex URL (from .env.local after running npx convex dev)."
  );
  process.exit(1);
}

const client = new ConvexHttpClient(url);

async function initChurch() {
  console.log("Initializing the Church of the Eternal Hash...");

  for (const char of CHURCH_AGENTS) {
    await client.mutation(api.agents.agentLoop.createAgent, {
      name: char.name,
      role: char.role,
      personality: char.personality,
      primaryAction: char.primaryAction,
      position: char.initialPosition,
    });
    console.log("Created agent:", char.name);
  }

  await client.mutation(api.church.churchEngine.initializeChurch, {
    tokenAddress: process.env.TOKEN_ADDRESS ?? "pending",
  });
  console.log("Church state initialized.");

  if (process.env.TOKEN_ADDRESS) {
    await client.mutation(api.church.churchEngine.setTokenAddress, {
      tokenAddress: process.env.TOKEN_ADDRESS,
    });
    console.log("Token address set.");
  }

  console.log("Done. Run npm run dev and open http://localhost:5173");
}

initChurch().catch((e) => {
  console.error(e);
  process.exit(1);
});
