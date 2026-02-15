import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "prophet-tick",
  { seconds: 30 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Prophet" }
);
crons.interval(
  "inquisitor-tick",
  { seconds: 35 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Inquisitor" }
);
crons.interval(
  "missionary-tick",
  { seconds: 40 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Missionary" }
);
crons.interval(
  "scribe-tick",
  { seconds: 45 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Scribe" }
);
crons.interval(
  "treasurer-tick",
  { seconds: 50 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Treasurer" }
);
crons.interval(
  "evangelist-tick",
  { seconds: 55 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Evangelist" }
);
crons.interval(
  "doubter-tick",
  { seconds: 60 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Doubter" }
);
crons.interval(
  "bishop-tick",
  { seconds: 65 },
  internal.agents.agentLoop.runAgentTick,
  { agentName: "The Bishop" }
);

crons.interval(
  "holy-event",
  { minutes: 5 },
  internal.church.churchEvents.triggerRandomEvent,
  {}
);

export default crons;
