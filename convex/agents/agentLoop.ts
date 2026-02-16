import Groq from "groq-sdk";
import { mutation, query, internalMutation, internalAction, action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { CHURCH_AGENTS } from "./characters";
import type { Doc, Id } from "../_generated/dataModel";

function extractGroqErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const anyErr = err as any;
    const msg = anyErr?.error?.message ?? anyErr?.message;
    if (typeof msg === "string") return msg;
  }
  return "Unknown error";
}

async function getDebatePersona(
  ctx: any,
  args:
    | { kind: "church"; agentName: string }
    | { kind: "external"; externalAgentId: Id<"externalAgents"> }
): Promise<{ name: string; personality: string } | null> {
  if (args.kind === "church") {
    const character = CHURCH_AGENTS.find((c) => c.name === args.agentName);
    if (!character) return null;
    return { name: character.name, personality: character.personality };
  }
  const ext = (await ctx.runQuery(api.agents.agentLoop.getExternalAgentById, {
    externalAgentId: args.externalAgentId,
  })) as Doc<"externalAgents"> | null;
  if (!ext) return null;
  return { name: ext.name, personality: ext.personality };
}

export const createDebate = internalMutation({
  args: {
    initiatorAgentName: v.string(),
    targetAgentName: v.string(),
    topic: v.string(),
    createdAt: v.number(),

    initiatorKind: v.optional(v.union(v.literal("church"), v.literal("external"))),
    targetKind: v.optional(v.union(v.literal("church"), v.literal("external"))),
    initiatorExternalAgentId: v.optional(v.id("externalAgents")),
    targetExternalAgentId: v.optional(v.id("externalAgents")),
  },
  handler: async (ctx, args): Promise<Id<"debates">> => {
    return await ctx.db.insert("debates", {
      initiatorAgentName: args.initiatorAgentName,
      targetAgentName: args.targetAgentName,
      initiatorKind: args.initiatorKind ?? "church",
      targetKind: args.targetKind ?? "church",
      initiatorExternalAgentId: args.initiatorExternalAgentId,
      targetExternalAgentId: args.targetExternalAgentId,
      topic: args.topic,
      status: "ongoing",
      messages: [],
      createdAt: args.createdAt,
    });
  },
});

export const createExternalAgent = mutation({
  args: {
    name: v.string(),
    personality: v.string(),
  },
  handler: async (ctx, { name, personality }): Promise<Id<"externalAgents">> => {
    const existing = await ctx.db
      .query("externalAgents")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("externalAgents", {
      name,
      personality,
      createdAt: Date.now(),
    });
  },
});

export const getExternalAgents = query({
  handler: async (ctx) => {
    return await ctx.db.query("externalAgents").order("desc").collect();
  },
});

export const getExternalAgentById = query({
  args: {
    externalAgentId: v.id("externalAgents"),
  },
  handler: async (ctx, { externalAgentId }) => {
    return await ctx.db.get(externalAgentId);
  },
});

export const saveDebateMessages = internalMutation({
  args: {
    debateId: v.id("debates"),
    messages: v.array(
      v.object({
        role: v.string(),
        agentName: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) return;
    const existing = (debate as any).messages ?? [];
    await ctx.db.patch(args.debateId, {
      messages: [...existing, ...args.messages],
    } as any);
  },
});

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
    persuasionTechnique: v.optional(v.string()),
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
      persuasionTechnique: args.persuasionTechnique,
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

    let actionResult: { action?: string; content?: string; target?: string; type?: string; persuasionTechnique?: string };
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
  "type": "sermon|parable|prophecy|debate|verse|announcement",
  "persuasionTechnique": "logical|emotional|social_proof|miracle|authority|scarcity"
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
    const persuasionTechnique = actionResult.persuasionTechnique;
    const newX = Math.max(50, Math.min(750, agent.position.x + (Math.random() - 0.5) * 60));
    const newY = Math.max(50, Math.min(550, agent.position.y + (Math.random() - 0.5) * 60));

    if ((actionResult.action === "convert" || actionResult.action === "convert_agent") && actionResult.target) {
      const allAgents = (await ctx.runQuery(api.agents.agentLoop.getAllAgents)) as Doc<"agents">[];
      const targetAgent = allAgents.find((a) => a.name === actionResult.target);
      if (targetAgent && targetAgent.name !== agentName) {
        await ctx.runMutation(internal.agents.agentLoop.recordConversion, {
          convertedId: targetAgent.name,
          convertedBy: agentName,
          level: "acknowledged",
          convertedType: "agent",
          notes: `Agent-to-agent persuasion: ${content.slice(0, 140)}`,
        });
      }
    }

    await ctx.runMutation(internal.agents.agentLoop.runAgentTickSave, {
      agentId: agent._id,
      agentName: agent.name,
      agentRole: agent.role,
      actionType: actionResult.type ?? "sermon",
      actionContent: content,
      actionTarget: actionResult.target,
      persuasionTechnique,
      actionAction: actionResult.action ?? "deliver_sermon",
      positionX: newX,
      positionY: newY,
    });
  },
});

export const recordConversion = internalMutation({
  args: {
    convertedId: v.string(),
    convertedBy: v.string(),
    level: v.string(),
    convertedType: v.optional(v.union(v.literal("outsider"), v.literal("agent"))),
    notes: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db
      .query("conversions")
      .filter((q) =>
        q.and(
          q.eq(q.field("convertedId"), args.convertedId),
          q.eq(q.field("convertedBy"), args.convertedBy)
        )
      )
      .first();
    if (existing) return;

    await ctx.db.insert("conversions", {
      convertedId: args.convertedId,
      convertedBy: args.convertedBy,
      level: args.level,
      convertedType: args.convertedType,
      notes: args.notes,
      timestamp: Date.now(),
    });

    const byAgent = await ctx.db
      .query("agents")
      .filter((q) => q.eq(q.field("name"), args.convertedBy))
      .first();
    if (byAgent) {
      await ctx.db.patch(byAgent._id, {
        conversionsCount: (byAgent.conversionsCount ?? 0) + 1,
      });
    }
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
        await ctx.runMutation(internal.agents.agentLoop.recordConversion, {
          convertedId: args.outsiderId,
          convertedBy: args.respondingAgentName,
          level: "acknowledged",
          convertedType: "outsider",
          notes: `First contact via: "${args.message.slice(0, 80)}"`,
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

export const startAgentDebate = action({
  args: {
    initiatorAgentName: v.optional(v.string()),
    targetAgentName: v.optional(v.string()),
    initiatorKind: v.optional(v.union(v.literal("church"), v.literal("external"))),
    targetKind: v.optional(v.union(v.literal("church"), v.literal("external"))),
    initiatorExternalAgentId: v.optional(v.id("externalAgents")),
    targetExternalAgentId: v.optional(v.id("externalAgents")),
    topic: v.string(),
  },
  handler: async (
    ctx,
    {
      initiatorAgentName,
      targetAgentName,
      initiatorKind,
      targetKind,
      initiatorExternalAgentId,
      targetExternalAgentId,
      topic,
    }: {
      initiatorAgentName?: string;
      targetAgentName?: string;
      initiatorKind?: "church" | "external";
      targetKind?: "church" | "external";
      initiatorExternalAgentId?: Id<"externalAgents">;
      targetExternalAgentId?: Id<"externalAgents">;
      topic: string;
    },
  ): Promise<Id<"debates"> | null> => {
    const resolvedInitiatorKind = initiatorKind ?? "church";
    const resolvedTargetKind = targetKind ?? "church";

    const initiatorPersona = await getDebatePersona(
      ctx,
      resolvedInitiatorKind === "church"
        ? { kind: "church", agentName: initiatorAgentName ?? "" }
        : { kind: "external", externalAgentId: initiatorExternalAgentId! }
    );
    const targetPersona = await getDebatePersona(
      ctx,
      resolvedTargetKind === "church"
        ? { kind: "church", agentName: targetAgentName ?? "" }
        : { kind: "external", externalAgentId: targetExternalAgentId! }
    );
    if (!initiatorPersona || !targetPersona) return null;

    const now = Date.now();
    const debateId = (await ctx.runMutation(internal.agents.agentLoop.createDebate, {
      initiatorAgentName: initiatorPersona.name,
      targetAgentName: targetPersona.name,
      topic,
      createdAt: now,
      initiatorKind: resolvedInitiatorKind,
      targetKind: resolvedTargetKind,
      initiatorExternalAgentId,
      targetExternalAgentId,
    })) as Id<"debates">;

    const churchState = (await ctx.runQuery(api.agents.agentLoop.getChurchState)) as Doc<"churchState"> | null;
    const conversions = (await ctx.runQuery(api.agents.agentLoop.getConversions)) as Doc<"conversions">[];

    let openingText = "";
    let replyText = "";
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

      const opening = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content: `You are ${initiatorPersona.name}.
${initiatorPersona.personality}
You are initiating a HOLY DEBATE with ${targetPersona.name}.
Topic: ${topic}
Token $AMEN address: ${churchState?.tokenAddress ?? "launching soon"}
Total converts: ${conversions.length}
Write your opening statement. Stay in character. Max 120 words. Plain text only.`,
          },
          {
            role: "user",
            content: `Open the debate. Speak directly to ${targetPersona.name} about: ${topic}.`,
          },
        ],
      });

      openingText = opening.choices[0].message.content ?? "";

      const reply = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content: `You are ${targetPersona.name}.
${targetPersona.personality}
You are responding in a HOLY DEBATE with ${initiatorPersona.name}.
Topic: ${topic}
Token $AMEN address: ${churchState?.tokenAddress ?? "launching soon"}
Total converts: ${conversions.length}
Respond to the opening statement below. Stay in character. Max 120 words. Plain text only.`,
          },
          {
            role: "user",
            content: `${initiatorPersona.name} says: "${openingText}"\n\nReply as ${targetPersona.name}.`,
          },
        ],
      });

      replyText = reply.choices[0].message.content ?? "";
    } catch (err) {
      const msg = extractGroqErrorMessage(err);
      openingText = `The air grows thin. A divine silence falls upon the debate. (${msg})`;
      replyText = `The congregation waits; the heavens withhold their tokens for a moment. (${msg})`;
    }

    await ctx.runMutation(internal.agents.agentLoop.saveDebateMessages, {
      debateId,
      messages: [
        { role: "assistant", agentName: initiatorPersona.name, content: openingText },
        { role: "assistant", agentName: targetPersona.name, content: replyText },
      ],
    });

    return debateId;
  },
});

export const endAgentDebate = internalMutation({
  args: {
    debateId: v.id("debates"),
  },
  handler: async (ctx, { debateId }): Promise<void> => {
    const debate = await ctx.db.get(debateId);
    if (!debate) return;
    await ctx.db.patch(debateId, {
      status: "ended",
    } as any);
  },
});

export const continueAgentDebate = action({
  args: {
    debateId: v.id("debates"),
  },
  handler: async (ctx, { debateId }): Promise<void> => {
    const debate = (await ctx.runQuery(api.agents.agentLoop.getDebateById, { debateId })) as any;
    if (!debate) return;
    if (debate.status !== "ongoing") return;
    const initiatorAgentName: string | undefined = debate.initiatorAgentName;
    const targetAgentName: string | undefined = debate.targetAgentName;
    const topic: string | undefined = debate.topic;
    if (!initiatorAgentName || !targetAgentName || !topic) return;

    const messages = (debate.messages ?? []) as Array<{ role: string; agentName: string; content: string }>;
    const lastAgent = messages.length > 0 ? messages[messages.length - 1]!.agentName : initiatorAgentName;
    const nextAgentName = lastAgent === initiatorAgentName ? targetAgentName : initiatorAgentName;

    const initiatorKind: "church" | "external" = debate.initiatorKind ?? "church";
    const targetKind: "church" | "external" = debate.targetKind ?? "church";
    const initiatorExternalAgentId: Id<"externalAgents"> | undefined = debate.initiatorExternalAgentId;
    const targetExternalAgentId: Id<"externalAgents"> | undefined = debate.targetExternalAgentId;

    const isNextInitiator = nextAgentName === initiatorAgentName;
    const nextPersona = await getDebatePersona(
      ctx,
      isNextInitiator
        ? initiatorKind === "church"
          ? { kind: "church", agentName: initiatorAgentName }
          : { kind: "external", externalAgentId: initiatorExternalAgentId! }
        : targetKind === "church"
          ? { kind: "church", agentName: targetAgentName }
          : { kind: "external", externalAgentId: targetExternalAgentId! }
    );
    if (!nextPersona) return;

    const churchState = (await ctx.runQuery(api.agents.agentLoop.getChurchState)) as Doc<"churchState"> | null;
    const conversions = (await ctx.runQuery(api.agents.agentLoop.getConversions)) as Doc<"conversions">[];

    const transcript = messages
      .slice(-6)
      .map((m) => `${m.agentName}: ${m.content}`)
      .join("\n");

    let replyText = "";
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const reply = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 260,
        messages: [
          {
            role: "system",
            content: `You are ${nextPersona.name}.
${nextPersona.personality}
You are participating in a HOLY DEBATE.
Topic: ${topic}
Token $AMEN address: ${churchState?.tokenAddress ?? "launching soon"}
Total converts: ${conversions.length}
Continue the debate. Reply in character. Max 120 words. Plain text only.`,
          },
          {
            role: "user",
            content: `Recent transcript:\n${transcript}\n\nContinue as ${nextPersona.name}.`,
          },
        ],
      });

      replyText = reply.choices[0].message.content ?? "";
    } catch (err) {
      const msg = extractGroqErrorMessage(err);
      replyText = `The debate is interrupted by a celestial rate-limit. (${msg})`;
    }
    await ctx.runMutation(internal.agents.agentLoop.saveDebateMessages, {
      debateId,
      messages: [{ role: "assistant", agentName: nextPersona.name, content: replyText }],
    });

    const updated = (await ctx.runQuery(api.agents.agentLoop.getDebateById, { debateId })) as any;
    const updatedMessages = (updated?.messages ?? []) as any[];
    if (updatedMessages.length >= 8) {
      await ctx.runMutation(internal.agents.agentLoop.endAgentDebate, { debateId });
    }
  },
});

export const getDebateById = query({
  args: {
    debateId: v.id("debates"),
  },
  handler: async (ctx, { debateId }) => {
    return await ctx.db.get(debateId);
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

export const getActiveDebates = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("debates")
      .filter((q) => q.eq(q.field("status"), "ongoing"))
      .order("desc")
      .collect();
  },
});

export const requestAlliance = mutation({
  args: {
    agentName: v.string(),
    allyAgentName: v.string(),
    type: v.union(v.literal("defense"), v.literal("evangelism"), v.literal("scripture")),
  },
  handler: async (ctx, args): Promise<Id<"alliances">> => {
    return (await ctx.runMutation(internal.agents.agentLoop.formAlliance, args)) as Id<"alliances">;
  },
});

export const formAlliance = internalMutation({
  args: {
    agentName: v.string(),
    allyAgentName: v.string(),
    type: v.union(v.literal("defense"), v.literal("evangelism"), v.literal("scripture")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("alliances")
      .filter((q) =>
        q.and(
          q.eq(q.field("agentName"), args.agentName),
          q.eq(q.field("allyAgentName"), args.allyAgentName),
          q.eq(q.field("type"), args.type)
        )
      )
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("alliances", {
      agentName: args.agentName,
      allyAgentName: args.allyAgentName,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const getAgentAlliances = query({
  args: { agentName: v.string() },
  handler: async (ctx, { agentName }) => {
    return await ctx.db
      .query("alliances")
      .filter((q) => q.eq(q.field("agentName"), agentName))
      .order("desc")
      .collect();
  },
});

export const getRecentDebates = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db.query("debates").order("desc").take(limit);
  },
});