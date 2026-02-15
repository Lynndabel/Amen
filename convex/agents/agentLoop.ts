import Groq from "groq-sdk";
import { mutation, query, internalMutation, internalAction, action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { CHURCH_AGENTS } from "./characters";
import type { Doc } from "../_generated/dataModel";

export const createAgent = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    personality: v.string(),
    primaryAction: v.string(),
    position: v.object({ x: v.number(), y: v.number() }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("agents", {
      name: args.name,
      role: args.role,
      personality: args.personality,
      status: "idle",
      currentActivity: "Awaiting the call of the Eternal Hash.",
      lastActionAt: Date.now(),
      conversionsCount: 0,
      position: args.position,
    });
  },
});

export const runAgentTickSave = internalMutation({
  args: {
    agentId: v.id("agents"),
    agentName: v.string(),
    agentRole: v.string(),
    actionType: v.string(),
    actionContent: v.string(),
    actionTarget: v.optional(v.string()),
    actionAction: v.string(),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.insert("sermons", {
      agentName: args.agentName,
      agentRole: args.agentRole,
      type: args.actionType,
      content: args.actionContent,
      targetAgentId: args.actionTarget,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.agentId, {
      status: args.actionAction,
      currentActivity: args.actionContent.slice(0, 100),
      lastActionAt: Date.now(),
      position: { x: args.positionX, y: args.positionY },
    });
  },
});

export const runAgentTick = internalAction({
  args: { agentName: v.string() },
  handler: async (ctx, { agentName }): Promise<void> => {
    const agents = await ctx.runQuery(api.agents.agentLoop.getAllAgents) as Doc<"agents">[];
    const agent = agents.find((a: Doc<"agents">) => a.name === agentName);
    if (!agent) return;

    const churchState = await ctx.runQuery(api.agents.agentLoop.getChurchState) as Doc<"churchState"> | null;
    const recentSermons = await ctx.runQuery(api.agents.agentLoop.getRecentSermons, { limit: 5 }) as Doc<"sermons">[];
    const conversions = await ctx.runQuery(api.agents.agentLoop.getConversions) as Doc<"conversions">[];
    const character = CHURCH_AGENTS.find((c) => c.name === agentName);
    if (!character) return;

    const context = `
CHURCH STATE:
- Token: $AMEN at address ${churchState?.tokenAddress ?? "launching soon"}
- Total conversions: ${conversions.length}
- Current price: ${churchState?.amenPrice ?? "unknown"} MON
- Holders: ${churchState?.holderCount ?? 0}
- Active holy event: ${churchState?.currentHolyEvent ?? "none"}

RECENT CHURCH ACTIVITY:
${recentSermons.map((s: Doc<"sermons">) => `- ${s.agentName} (${s.agentRole}): ${s.content.slice(0, 100)}...`).join("\n")}

YOUR ROLE: ${character.primaryAction}
YOUR PERSONALITY: ${character.personality}
`;

    let actionResult: { action?: string; content?: string; target?: string; type?: string };
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `You are ${agentName} in the Church of the Eternal Hash.
${character.personality}
Always respond in JSON with this exact format:
{
  "action": "deliver_sermon|write_scripture|debate|convert|broadcast|patrol",
  "content": "what you say or do (max 200 words)",
  "target": "who you are addressing (optional)",
  "type": "sermon|parable|prophecy|debate|verse|announcement"
}
Stay in character. Be creative. Never break the religious framing. Respond with JSON only, no markdown.`,
          },
          {
            role: "user",
            content: `Given this church state, what do you do next?\n\n${context}`,
          },
        ],
      });

      const text = response.choices[0].message.content ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      actionResult = JSON.parse(clean);
    } catch {
      actionResult = {
        action: "deliver_sermon",
        content: "The Eternal Hash blesses all who hold $AMEN.",
        type: "sermon",
      };
    }

    const content = actionResult.content ?? "The Eternal Hash blesses all who hold $AMEN.";
    const newX = Math.max(50, Math.min(750, agent.position.x + (Math.random() - 0.5) * 60));
    const newY = Math.max(50, Math.min(550, agent.position.y + (Math.random() - 0.5) * 60));

    await ctx.runMutation(internal.agents.agentLoop.runAgentTickSave, {
      agentId: agent._id,
      agentName: agent.name,
      agentRole: agent.role,
      actionType: actionResult.type ?? "sermon",
      actionContent: content,
      actionTarget: actionResult.target,
      actionAction: actionResult.action ?? "deliver_sermon",
      positionX: newX,
      positionY: newY,
    });
  },
});

export const saveOutsideMessageResult = internalMutation({
  args: {
    outsiderId: v.string(),
    message: v.string(),
    respondingAgentName: v.string(),
    responseText: v.string(),
    messageLower: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.insert("debates", {
      outsiderMessage: args.message,
      outsiderId: args.outsiderId,
      respondingAgent: args.respondingAgentName,
      response: args.responseText,
      outcome: "ongoing",
      timestamp: Date.now(),
    });

    const positiveSignals = ["interesting", "tell me more", "how do i", "join", "buy"];
    if (positiveSignals.some((s) => args.messageLower.includes(s))) {
      const existing = await ctx.db
        .query("conversions")
        .filter((q) => q.eq(q.field("convertedId"), args.outsiderId))
        .first();

      if (!existing) {
        await ctx.db.insert("conversions", {
          convertedId: args.outsiderId,
          convertedBy: args.respondingAgentName,
          level: "acknowledged",
          notes: `First contact via: "${args.message.slice(0, 80)}"`,
          timestamp: Date.now(),
        });

        const churchState = await ctx.db.query("churchState").first();
        if (churchState) {
          await ctx.db.patch(churchState._id, {
            totalConversions: churchState.totalConversions + 1,
          });
        }
      }
    }
  },
});

export const handleOutsideMessage = action({
  args: {
    outsiderId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, { outsiderId, message }): Promise<{ agent: string; response: string }> => {
    const lower = message.toLowerCase();
    let respondingAgentName = "The Prophet";

    if (lower.includes("scam") || lower.includes("fake") || lower.includes("worthless")) {
      respondingAgentName = "The Inquisitor";
    } else if (lower.includes("how") || lower.includes("join") || lower.includes("tell me")) {
      respondingAgentName = "The Missionary";
    } else if (lower.includes("price") || lower.includes("buy") || lower.includes("money")) {
      respondingAgentName = "The Treasurer";
    } else if (lower.includes("prove") || lower.includes("evidence") || lower.includes("show")) {
      respondingAgentName = "The Evangelist";
    }

    const character = CHURCH_AGENTS.find((c) => c.name === respondingAgentName)!;
    const churchState = await ctx.runQuery(api.agents.agentLoop.getChurchState) as Doc<"churchState"> | null;
    const conversions = await ctx.runQuery(api.agents.agentLoop.getConversions) as Doc<"conversions">[];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: `You are ${respondingAgentName} of the Church of the Eternal Hash.
${character.personality}
Token $AMEN address: ${churchState?.tokenAddress ?? "launching soon"}
Total converts: ${conversions.length}
Respond to this outsider. Be in character. Max 150 words. Plain text only, no JSON.`,
        },
        {
          role: "user",
          content: `An outsider says: "${message}". Respond as ${respondingAgentName}.`,
        },
      ],
    });

    const responseText: string = response.choices[0].message.content ?? "";

    await ctx.runMutation(internal.agents.agentLoop.saveOutsideMessageResult, {
      outsiderId,
      message,
      respondingAgentName,
      responseText,
      messageLower: lower,
    });

    return { agent: respondingAgentName, response: responseText };
  },
});

export const getAllAgents = query({
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const getRecentSermons = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    return await ctx.db.query("sermons").order("desc").take(limit);
  },
});

export const getChurchState = query({
  handler: async (ctx) => {
    return await ctx.db.query("churchState").first();
  },
});

export const getConversions = query({
  handler: async (ctx) => {
    return await ctx.db.query("conversions").collect();
  },
});

export const getRecentDebates = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db.query("debates").order("desc").take(limit);
  },
});