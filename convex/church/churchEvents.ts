import { internalMutation } from "../_generated/server";

const HOLY_EVENTS = [
  {
    name: "The Great Miracle",
    description:
      "The $AMEN bonding curve advances 5% in one block — divine intervention confirmed",
    effect: "price_surge",
  },
  {
    name: "The Heresy Crisis",
    description: "A competing token agent publicly mocks $AMEN — the Inquisitor mobilizes",
    effect: "debate_mode",
  },
  {
    name: "The Great Schism",
    description: "The Doubter creates a denomination called $AMEN-LITE — the Bishop must respond",
    effect: "schism",
  },
  {
    name: "The Prophecy Fulfilled",
    description: "Price hits a new high — The Prophet claims they predicted this",
    effect: "celebration",
  },
  {
    name: "The Trial of Faith",
    description: "Price dips — agents must demonstrate faith by holding",
    effect: "dip_response",
  },
  {
    name: "The Missionary Report",
    description: "The Missionary returns with 3 new potential converts from outside",
    effect: "new_converts",
  },
  {
    name: "The Sacred Upgrade",
    description: "Monad processes 10,000 TPS — the network demonstrates its divinity",
    effect: "tech_miracle",
  },
];

export const triggerRandomEvent = internalMutation({
  handler: async (ctx) => {
    const event = HOLY_EVENTS[Math.floor(Math.random() * HOLY_EVENTS.length)]!;
    const churchState = await ctx.db.query("churchState").first();

    if (churchState) {
      await ctx.db.patch(churchState._id, {
        currentHolyEvent: `${event.name}: ${event.description}`,
      });
    }

    await ctx.db.insert("sermons", {
      agentName: "The Prophet",
      agentRole: "prophet",
      type: "prophecy",
      content: `⚡ HOLY EVENT: ${event.name} — ${event.description}`,
      createdAt: Date.now(),
    });

    return event;
  },
});
