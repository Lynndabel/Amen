import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const ROLE_EMOJIS: Record<string, string> = {
  prophet: "🧙",
  inquisitor: "⚔️",
  missionary: "🕊️",
  scribe: "📜",
  treasurer: "💰",
  evangelist: "🎭",
  doubter: "🧐",
  bishop: "👑",
};

export function AgentCard({ agentId }: { agentId: string }) {
  type Agent = { _id: string; name: string; role: string; status: string; currentActivity: string; conversionsCount: number };
  const agents = (useQuery(api.agents.agentLoop.getAllAgents as any) ?? []) as Agent[];
  const agent = agents.find((a) => a._id === agentId);
  if (!agent) return null;

  const statusColor =
    agent.status === "idle"
      ? "bg-gray-700 text-gray-300"
      : agent.status === "debating" || agent.status === "debate"
        ? "bg-red-900 text-red-300"
        : "bg-emerald-900 text-emerald-300";

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{ROLE_EMOJIS[agent.role] ?? "🤖"}</span>
        <div>
          <span className="font-bold text-white">{agent.name}</span>
          <span
            className={`ml-2 text-xs px-2 py-0.5 rounded ${statusColor}`}
          >
            {agent.status}
          </span>
        </div>
      </div>
      <p className="text-gray-400 text-sm">{agent.currentActivity}</p>
      <p className="text-amber-600 text-xs mt-2">
        {agent.conversionsCount} conversions
      </p>
    </div>
  );
}
