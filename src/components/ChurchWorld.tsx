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

const ROLE_GRADIENTS: Record<string, string> = {
  prophet: "linear-gradient(135deg, #FFD700, #FFA500)",
  inquisitor: "linear-gradient(135deg, #DC2626, #991B1B)",
  missionary: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
  scribe: "linear-gradient(135deg, #A855F7, #7C3AED)",
  treasurer: "linear-gradient(135deg, #10B981, #059669)",
  evangelist: "linear-gradient(135deg, #F59E0B, #D97706)",
  doubter: "linear-gradient(135deg, #6B7280, #4B5563)",
  bishop: "linear-gradient(135deg, #EF4444, #B91C1C)",
};

export function ChurchWorld() {
  type Agent = { _id: string; name: string; role: string; position: { x: number; y: number }; currentActivity: string; status: string };
  const agents = (useQuery(api.agents.agentLoop.getAllAgents as any) ?? []) as Agent[];

  return (
    <div className="cathedral-container">
      <div className="cathedral-grid" />
      <div className="cathedral-title">Cathedral of the Eternal Hash</div>
      <div className="cathedral-cross">✝️</div>
      {agents.map((agent) => (
        <div
          key={agent._id}
          className="agent-marker"
          style={{ left: agent.position.x, top: agent.position.y }}
        >
          <div
            className="agent-avatar"
            style={{ background: ROLE_GRADIENTS[agent.role] ?? ROLE_GRADIENTS.prophet }}
            title={`${agent.name}: ${agent.currentActivity}`}
          >
            {ROLE_EMOJIS[agent.role] ?? "🤖"}
          </div>
          <div className="agent-label">{agent.name.split(" ")[1]}</div>
          <div className="agent-tooltip">
            <strong className="agent-tooltip-name">{agent.name}</strong>
            <p className="agent-tooltip-activity">{agent.currentActivity}</p>
            <span className={`agent-tooltip-status ${agent.status}`}>{agent.status}</span>
          </div>
          {agent.status !== "idle" && (
            <div
              className={`agent-ping ${agent.status}`}
              style={{ width: 32, height: 32 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
