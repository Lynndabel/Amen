import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    role: v.string(),
    personality: v.string(),
    status: v.string(),
    currentActivity: v.string(),
    lastActionAt: v.number(),
    conversionsCount: v.number(),
    position: v.object({ x: v.number(), y: v.number() }),
  }),

  sermons: defineTable({
    agentName: v.string(),
    agentRole: v.string(),
    type: v.string(),
    content: v.string(),
    targetAgentId: v.optional(v.string()),
    createdAt: v.number(),
  }),

  conversions: defineTable({
    convertedId: v.string(),
    convertedBy: v.string(),
    level: v.string(),
    txHash: v.optional(v.string()),
    notes: v.string(),
    timestamp: v.number(),
  }),

  churchState: defineTable({
    tokenAddress: v.string(),
    tokenLaunched: v.boolean(),
    totalConversions: v.number(),
    amenPrice: v.string(),
    holderCount: v.number(),
    currentHolyEvent: v.optional(v.string()),
    foundedAt: v.number(),
  }),

  debates: defineTable({
    outsiderMessage: v.string(),
    outsiderId: v.string(),
    respondingAgent: v.string(),
    response: v.string(),
    outcome: v.string(),
    timestamp: v.number(),
  }),

  conversations: defineTable({
    agent1: v.string(),
    agent2: v.string(),
    topic: v.string(),
    messages: v.array(
      v.object({
        speaker: v.string(),
        content: v.string(),
      })
    ),
    timestamp: v.number(),
  }),
});
