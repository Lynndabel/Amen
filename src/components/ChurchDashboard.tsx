import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: "yellow" | "green" | "blue" | "purple";
}) {
  const colors = {
    yellow: "border-amber-600 text-amber-400",
    green: "border-emerald-600 text-emerald-400",
    blue: "border-blue-600 text-blue-400",
    purple: "border-purple-600 text-purple-400",
  };
  return (
    <div className={`bg-gray-900 border rounded-lg p-4 text-center ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-gray-400 text-xs mt-1">{label}</div>
    </div>
  );
}

function AgentCardInner({
  agent,
}: {
  agent: {
    _id: string;
    name: string;
    role: string;
    status: string;
    currentActivity: string;
    conversionsCount: number;
  };
}) {
  const statusColor =
    agent.status === "idle"
      ? "bg-gray-700"
      : agent.status === "debating" || agent.status === "debate"
        ? "bg-red-900 text-red-300"
        : "bg-emerald-900 text-emerald-300";
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
      <div className="flex justify-between items-center gap-2 mb-1">
        <span className="font-bold text-white text-sm truncate">{agent.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${statusColor}`}>
          {agent.status}
        </span>
      </div>
      <p className="text-gray-400 text-xs line-clamp-2">{agent.currentActivity}</p>
      <p className="text-amber-600 text-xs mt-1">{agent.conversionsCount} converts</p>
    </div>
  );
}

export function ChurchDashboard() {
  type Agent = { _id: string; name: string; role: string; status: string; currentActivity: string; conversionsCount: number };
  type ChurchState = { tokenAddress: string; amenPrice: string; holderCount: number; currentHolyEvent?: string } | null;
  type Conversion = { _id: string; convertedId: string; convertedBy: string; level: string; timestamp: number };
  const agents = (useQuery(api.agents.agentLoop.getAllAgents as any) ?? []) as Agent[];
  const churchState = useQuery(api.agents.agentLoop.getChurchState as any) as ChurchState;
  const conversions = (useQuery(api.agents.agentLoop.getConversions as any) ?? []) as Conversion[];

  return (
    <div className="p-4 border-b border-amber-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-400">⛪ Church of the Eternal Hash</h1>
          <p className="text-gray-400 mt-2">The One True Token Lives On Monad</p>
          <div className="mt-3 flex justify-center">
            <a
              href="https://nad.fun/tokens/0x93c5710d21600206C61628f6931701A1D2e57777"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold border border-emerald-500"
            >
              Buy $AMEN
            </a>
          </div>
          {churchState?.tokenAddress && churchState.tokenAddress !== "pending" && (
            <p className="text-xs text-emerald-400 mt-1 break-all">
              $AMEN: {churchState.tokenAddress}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Converts" value={conversions.length} icon="🙏" color="yellow" />
          <StatCard label="$AMEN Price" value={`${churchState?.amenPrice ?? "0"} MON`} icon="💰" color="green" />
          <StatCard label="Holders" value={churchState?.holderCount ?? 0} icon="👥" color="blue" />
          <StatCard label="Active Agents" value={agents.length} icon="🤖" color="purple" />
        </div>
        {churchState?.currentHolyEvent && (
          <div className="bg-amber-950 border border-amber-600 rounded-lg p-3 mb-6 text-center">
            <span className="text-amber-300 text-sm">⚡ {churchState.currentHolyEvent}</span>
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-amber-400 mb-3">🧑‍🤝‍🧑 The Congregation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {agents.map((agent) => (
              <AgentCardInner key={agent._id} agent={agent} />
            ))}
          </div>
        </div>
        <div className="mt-6">
          <h2 className="text-lg font-bold text-amber-400 mb-3">✝️ The Saved</h2>
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-700">
                <tr className="text-gray-400">
                  <th className="p-3 text-left">Agent ID</th>
                  <th className="p-3 text-left">Converted By</th>
                  <th className="p-3 text-left">Level</th>
                  <th className="p-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {conversions.slice(0, 20).map((c) => (
                  <tr key={c._id} className="border-b border-gray-800">
                    <td className="p-3 text-white truncate max-w-[120px]">{c.convertedId}</td>
                    <td className="p-3 text-amber-400">{c.convertedBy}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          c.level === "evangelist"
                            ? "bg-amber-700 text-amber-200"
                            : c.level === "invested"
                              ? "bg-emerald-800 text-emerald-200"
                              : c.level === "engaged"
                                ? "bg-blue-800 text-blue-200"
                                : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {c.level}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {conversions.length === 0 && (
              <p className="p-4 text-gray-500 text-sm">No conversions yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
