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

export function ChurchWorld() {
  type Agent = { _id: string; name: string; role: string; position: { x: number; y: number }; currentActivity: string; status: string };
  const agents = (useQuery(api.agents.agentLoop.getAllAgents as any) ?? []) as Agent[];

  return (
    <div
      className="relative bg-gray-900 border border-amber-800 rounded-lg overflow-hidden"
      style={{ width: "100%", minHeight: 400, maxWidth: 800 }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,215,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.3) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-amber-600 text-lg font-bold opacity-50">
        Cathedral of the Eternal Hash
      </div>
      <div
        className="absolute text-4xl opacity-30 pointer-events-none"
        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
      >
        ✝️
      </div>
      {agents.map((agent) => (
        <div
          key={agent._id}
          className="absolute transition-all duration-1000 cursor-pointer group"
          style={{ left: agent.position.x, top: agent.position.y }}
        >
          <div className="text-2xl" title={`${agent.name}: ${agent.currentActivity}`}>
            {ROLE_EMOJIS[agent.role] ?? "🤖"}
          </div>
          <div className="text-xs text-amber-400 text-center whitespace-nowrap -mt-1">
            {agent.name.split(" ")[1]}
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-950 border border-amber-600 rounded p-2 text-xs text-white hidden group-hover:block z-10 shadow-xl">
            <strong className="text-amber-400">{agent.name}</strong>
            <p className="text-gray-300 mt-1">{agent.currentActivity}</p>
          </div>
          {agent.status !== "idle" && (
            <div
              className="absolute inset-0 rounded-full bg-amber-400 opacity-20 animate-ping pointer-events-none"
              style={{ width: 32, height: 32, left: 0, top: 0 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
