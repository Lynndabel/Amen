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

  const statusClass =
    agent.status === "idle"
      ? "congregation-card idle"
      : agent.status === "debating" || agent.status === "debate"
        ? "congregation-card debating"
        : "congregation-card active";

  const initials = agent.name
    .split(" ")
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={statusClass}>
      <div className="member-header">
        <div className="member-avatar">{initials}</div>
        <div className="member-info">
          <div className="member-name">{agent.name}</div>
          <div className="member-role">{ROLE_EMOJIS[agent.role] ?? "🤖"} {agent.role}</div>
        </div>
      </div>

      <div className="member-stats">
        <div className="stat-item">
          <span className="stat-item-value">{agent.conversionsCount}</span>
          <span className="stat-item-label">Converts</span>
        </div>
        <div className="stat-item">
          <span className="stat-item-value">{agent.status}</span>
          <span className="stat-item-label">Status</span>
        </div>
      </div>

      <p className="member-activity">{agent.currentActivity}</p>
    </div>
  );
}
