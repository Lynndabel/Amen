import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const initializeChurch = mutation({
  args: {
    tokenAddress: v.optional(v.string()),
  },
  handler: async (ctx, { tokenAddress }) => {
    const existing = await ctx.db.query("churchState").first();
    if (existing) return existing._id;
    return await ctx.db.insert("churchState", {
      tokenAddress: tokenAddress ?? "pending",
      tokenLaunched: !!tokenAddress && tokenAddress !== "pending",
      totalConversions: 0,
      amenPrice: "0",
      holderCount: 0,
      currentHolyEvent: undefined,
      foundedAt: Date.now(),
    });
  },
});

export const setTokenAddress = mutation({
  args: {
    tokenAddress: v.string(),
  },
  handler: async (ctx, { tokenAddress }) => {
    const state = await ctx.db.query("churchState").first();
    if (!state) return;
    await ctx.db.patch(state._id, {
      tokenAddress,
      tokenLaunched: true,
    });
  },
});

export const updateChurchMarketData = internalMutation({
  args: {
    amenPrice: v.string(),
    holderCount: v.number(),
  },
  handler: async (ctx, { amenPrice, holderCount }) => {
    const state = await ctx.db.query("churchState").first();
    if (!state) return;
    await ctx.db.patch(state._id, { amenPrice, holderCount });
  },
});

export const getChurchState = query({
  handler: async (ctx) => {
    return await ctx.db.query("churchState").first();
  },
});
