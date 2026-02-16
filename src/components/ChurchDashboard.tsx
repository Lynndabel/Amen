import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo, useState } from "react";

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
  return (
    <div className={`stat-card stat-${color}`}>
      <span className="stat-icon">{icon}</span>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
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
  function AlliesBadge({ agentName }: { agentName: string }) {
    type Alliance = { _id: string; agentName: string; allyAgentName: string; type: "defense" | "evangelism" | "scripture"; createdAt: number };
    const alliances = (useQuery(api.agents.agentLoop.getAgentAlliances as any, { agentName }) ?? []) as Alliance[];
    const [open, setOpen] = useState(false);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[10px] px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-emerald-300 hover:bg-gray-700"
        >
          Allies {alliances.length}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-950 border border-emerald-800 rounded p-2 text-xs text-white z-20 shadow-xl">
            <div className="flex justify-between items-center mb-1">
              <span className="text-emerald-300 font-bold">Allies</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            </div>
            {alliances.length === 0 ? (
              <p className="text-gray-500">None yet.</p>
            ) : (
              <div className="space-y-1">
                {alliances.slice(0, 8).map((a) => (
                  <div key={a._id} className="flex justify-between gap-2">
                    <span className="text-gray-200 truncate">{a.allyAgentName}</span>
                    <span className="text-emerald-300 shrink-0">{a.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

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
      <div className="flex justify-between items-center gap-2">
        <p className="text-gray-400 text-xs line-clamp-2 flex-1">{agent.currentActivity}</p>
        <AlliesBadge agentName={agent.name} />
      </div>
      <p className="text-amber-600 text-xs mt-1">{agent.conversionsCount} converts</p>
    </div>
  );
}

export function ChurchDashboard() {
  type Agent = { _id: string; name: string; role: string; status: string; currentActivity: string; conversionsCount: number };
  type ChurchState = { tokenAddress: string; amenPrice: string; holderCount: number; currentHolyEvent?: string } | null;
  type Conversion = { _id: string; convertedId: string; convertedBy: string; level: string; convertedType?: "outsider" | "agent"; timestamp: number };
  type ExternalAgent = { _id: string; name: string; personality: string; createdAt: number };
  type DebateMessage = { role: string; agentName: string; content: string };
  type Debate = {
    _id: string;
    initiatorAgentName?: string;
    targetAgentName?: string;
    initiatorKind?: "church" | "external";
    targetKind?: "church" | "external";
    initiatorExternalAgentId?: string;
    targetExternalAgentId?: string;
    topic?: string;
    status?: "ongoing" | "ended";
    messages?: DebateMessage[];
    createdAt?: number;
  };
  const agents = (useQuery(api.agents.agentLoop.getAllAgents as any) ?? []) as Agent[];
  const churchState = useQuery(api.agents.agentLoop.getChurchState as any) as ChurchState;
  const conversions = (useQuery(api.agents.agentLoop.getConversions as any) ?? []) as Conversion[];
  const externalAgents = (useQuery(api.agents.agentLoop.getExternalAgents as any) ?? []) as ExternalAgent[];
  const activeDebates = (useQuery(api.agents.agentLoop.getActiveDebates as any) ?? []) as Debate[];
  const [openDebateId, setOpenDebateId] = useState<string | null>(null);
  const selectedDebate = useMemo(
    () => activeDebates.find((d) => d._id === openDebateId) ?? null,
    [activeDebates, openDebateId]
  );

  const startAgentDebate = useAction(api.agents.agentLoop.startAgentDebate as any);
  const continueAgentDebate = useAction(api.agents.agentLoop.continueAgentDebate as any);
  const requestAlliance = useMutation(api.agents.agentLoop.requestAlliance as any);
  const createExternalAgent = useMutation(api.agents.agentLoop.createExternalAgent as any);

  const [debateInitiatorKind, setDebateInitiatorKind] = useState<"church" | "external">("church");
  const [debateTargetKind, setDebateTargetKind] = useState<"church" | "external">("church");
  const [debateInitiator, setDebateInitiator] = useState<string>(agents[0]?.name ?? "The Prophet");
  const [debateTarget, setDebateTarget] = useState<string>(agents[1]?.name ?? "The Inquisitor");
  const [debateInitiatorExternalId, setDebateInitiatorExternalId] = useState<string>("");
  const [debateTargetExternalId, setDebateTargetExternalId] = useState<string>("");
  const [debateTopic, setDebateTopic] = useState<string>("The One True Token");
  const [startingDebate, setStartingDebate] = useState(false);

  const [externalName, setExternalName] = useState("");
  const [externalPersonality, setExternalPersonality] = useState("");
  const [creatingExternal, setCreatingExternal] = useState(false);

  const [allyType, setAllyType] = useState<"defense" | "evangelism" | "scripture">("defense");

  const agentConversions = useMemo(
    () => conversions.filter((c) => c.convertedType === "agent").length,
    [conversions]
  );

  return (
    <div className="p-3 sm:p-4 border-b border-amber-900/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-amber-400">
            <span className="church-icon">⛪</span> Church of the Eternal Hash
          </h1>
          <p className="text-gray-400 mt-2">The One True Token Lives On Monad</p>
          <div className="mt-3 flex justify-center">
            <a
              href="https://nad.fun/tokens/0x93c5710d21600206C61628f6931701A1D2e57777"
              target="_blank"
              rel="noopener noreferrer"
              className="buy-button button-ripple"
            >
              Buy $AMEN
            </a>
          </div>
          {churchState?.tokenAddress && churchState.tokenAddress !== "pending" && (
            <div className="mt-2">
              <div className="token-address-chip" role="note" aria-label="$AMEN token address">
                <span className="address-text">$AMEN: {churchState.tokenAddress}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(churchState.tokenAddress!)}
                  className="copy-button"
                  aria-label="Copy address"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="stats-container">
          <StatCard label="Total Converts" value={conversions.length} icon="🙏" color="yellow" />
          <StatCard label="$AMEN Price" value={`${churchState?.amenPrice ?? "0"} MON`} icon="💰" color="green" />
          <StatCard label="Holders" value={churchState?.holderCount ?? 0} icon="👥" color="blue" />
          <StatCard label="Agent Converts" value={agentConversions} icon="🤝" color="purple" />
        </div>
        {churchState?.currentHolyEvent && (
          <div className="bg-amber-900 border border-amber-600 rounded-lg p-3 mb-6 text-center">
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

        <div className="external-agents-section">
          <div className="section-header">
            <span className="section-icon">🌍</span>
            <h2 className="section-title">External Agents</h2>
          </div>
          <div className="form-grid">
            <div className="input-group">
              <input
                id="external-name"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                className={`form-input ${externalName.trim() ? "valid" : ""}`}
                placeholder=" "
              />
              <label htmlFor="external-name" className="floating-label">External agent name</label>
            </div>
            <div className="input-group">
              <input
                id="external-personality"
                value={externalPersonality}
                onChange={(e) => setExternalPersonality(e.target.value)}
                className={`form-input ${externalPersonality.trim() ? "valid" : ""}`}
                placeholder=" "
                maxLength={120}
              />
              <label htmlFor="external-personality" className="floating-label">Personality / doctrine</label>
              <span className="char-count">{externalPersonality.length}/120</span>
            </div>
            <button
              type="button"
              disabled={creatingExternal || !externalName.trim() || !externalPersonality.trim()}
              onClick={async () => {
                setCreatingExternal(true);
                try {
                  await createExternalAgent({
                    name: externalName.trim(),
                    personality: externalPersonality.trim(),
                  });
                  setExternalName("");
                  setExternalPersonality("");
                } finally {
                  setCreatingExternal(false);
                }
              }}
              className="create-agent-button"
            >
              {creatingExternal ? "Creating..." : "Create Agent"}
            </button>
          </div>

          <div className="external-agents-list">
            {externalAgents.slice(0, 8).map((ea) => (
              <div key={ea._id} className="external-agent-card">
                <div className="external-agent-avatar">{ea.name.charAt(0).toUpperCase()}</div>
                <div className="external-agent-info">
                  <p className="external-agent-name">{ea.name}</p>
                  <p className="external-agent-personality">{ea.personality}</p>
                </div>
              </div>
            ))}
            {externalAgents.length === 0 && (
              <p className="text-xs text-gray-500">No external agents yet.</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-amber-400 mb-3">⚔️ Holy Debates</h2>
          <div className="bg-gray-900/60 rounded-lg border border-gray-700 overflow-hidden">
            <div className="p-3 border-b border-gray-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-gray-400 text-xs">Start a new debate, then select it from the list.</p>
                {openDebateId && (
                  <button
                    type="button"
                    onClick={() => setOpenDebateId(null)}
                    className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700 w-full sm:w-auto"
                  >
                    Deselect
                  </button>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
                <select
                  value={debateInitiatorKind}
                  onChange={(e) => setDebateInitiatorKind(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="church">church</option>
                  <option value="external">external</option>
                </select>
                {debateInitiatorKind === "church" ? (
                  <select
                    value={debateInitiator}
                    onChange={(e) => setDebateInitiator(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {agents.map((a) => (
                      <option key={a._id} value={a.name}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={debateInitiatorExternalId}
                    onChange={(e) => setDebateInitiatorExternalId(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="">Select external</option>
                    {externalAgents.map((ea) => (
                      <option key={ea._id} value={ea._id}>
                        {ea.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={debateTargetKind}
                  onChange={(e) => setDebateTargetKind(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                >
                  <option value="church">church</option>
                  <option value="external">external</option>
                </select>
                {debateTargetKind === "church" ? (
                  <select
                    value={debateTarget}
                    onChange={(e) => setDebateTarget(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    {agents
                      .filter((a) => !(debateInitiatorKind === "church" && a.name === debateInitiator))
                      .map((a) => (
                        <option key={a._id} value={a.name}>
                          {a.name}
                        </option>
                      ))}
                  </select>
                ) : (
                  <select
                    value={debateTargetExternalId}
                    onChange={(e) => setDebateTargetExternalId(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="">Select external</option>
                    {externalAgents.map((ea) => (
                      <option key={ea._id} value={ea._id}>
                        {ea.name}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  value={debateTopic}
                  onChange={(e) => setDebateTopic(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                  placeholder="Debate topic"
                />
                <button
                  type="button"
                  disabled={
                    startingDebate ||
                    !debateTopic.trim() ||
                    (debateInitiatorKind === "external" && !debateInitiatorExternalId) ||
                    (debateTargetKind === "external" && !debateTargetExternalId)
                  }
                  onClick={async () => {
                    setStartingDebate(true);
                    try {
                      const id = await startAgentDebate({
                        initiatorKind: debateInitiatorKind,
                        targetKind: debateTargetKind,
                        initiatorAgentName: debateInitiatorKind === "church" ? debateInitiator : undefined,
                        targetAgentName: debateTargetKind === "church" ? debateTarget : undefined,
                        initiatorExternalAgentId: debateInitiatorKind === "external" ? debateInitiatorExternalId : undefined,
                        targetExternalAgentId: debateTargetKind === "external" ? debateTargetExternalId : undefined,
                        topic: debateTopic.trim(),
                      });
                      if (id) setOpenDebateId(String(id));
                    } finally {
                      setStartingDebate(false);
                    }
                  }}
                  className="text-xs px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold border border-emerald-500"
                >
                  {startingDebate ? "..." : "Start"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="border-b lg:border-b-0 lg:border-r border-gray-800">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Debates</p>
                  <p className="text-[10px] text-gray-500">{activeDebates.length} ongoing</p>
                </div>
                {activeDebates.length === 0 ? (
                  <p className="p-4 text-gray-500 text-sm">No holy debates are ongoing.</p>
                ) : (
                  <div className="max-h-72 lg:max-h-[420px] overflow-y-auto">
                    {activeDebates.slice(0, 12).map((d) => {
                      const active = d._id === openDebateId;
                      const badge = `${d.initiatorKind ?? "church"} vs ${d.targetKind ?? "church"}`;
                      return (
                        <button
                          key={d._id}
                          type="button"
                          onClick={() => setOpenDebateId(d._id)}
                          className={`w-full text-left p-3 border-b border-gray-800 hover:bg-gray-800/40 ${
                            active ? "bg-gray-800/60" : "bg-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">
                                {d.initiatorAgentName} vs {d.targetAgentName}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{d.topic}</p>
                              <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">
                                {badge}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-500 shrink-0">
                              {(d.messages ?? []).length} msgs
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-2">
                {!selectedDebate ? (
                  <div className="p-6">
                    <p className="text-gray-300 text-sm font-bold">Select a debate to view the thread</p>
                    <p className="text-gray-500 text-xs mt-2">
                      Tip: start a debate above, then click it in the list.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white text-base font-bold truncate">
                          {selectedDebate.initiatorAgentName} vs {selectedDebate.targetAgentName}
                        </p>
                        <p className="text-gray-400 text-xs truncate mt-1">{selectedDebate.topic}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await continueAgentDebate({ debateId: selectedDebate._id });
                          }}
                          className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await requestAlliance({
                              agentName: selectedDebate.initiatorAgentName ?? "The Prophet",
                              allyAgentName: selectedDebate.targetAgentName ?? "The Inquisitor",
                              type: allyType,
                            });
                          }}
                          className="text-xs px-2 py-1 rounded bg-emerald-900/70 border border-emerald-800 text-emerald-200 hover:bg-emerald-900"
                        >
                          Form Alliance
                        </button>
                        <select
                          value={allyType}
                          onChange={(e) => setAllyType(e.target.value as any)}
                          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                        >
                          <option value="defense">defense</option>
                          <option value="evangelism">evangelism</option>
                          <option value="scripture">scripture</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setOpenDebateId(null)}
                          className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 max-h-80 lg:max-h-[420px] overflow-y-auto pr-1">
                      {(selectedDebate.messages ?? []).length === 0 ? (
                        <p className="text-gray-500 text-xs">No messages yet.</p>
                      ) : (
                        (selectedDebate.messages ?? []).map((m) => (
                          <div
                            key={`${selectedDebate._id}-${m.agentName}-${m.content.slice(0, 24)}`}
                            className={`p-3 rounded border text-sm ${
                              m.agentName === selectedDebate.initiatorAgentName
                                ? "bg-gray-800 border-gray-700"
                                : "bg-gray-800/60 border-gray-700"
                            }`}
                          >
                            <div className="flex justify-between items-center gap-2 mb-1">
                              <span className="text-amber-400 font-bold truncate text-xs">{m.agentName}</span>
                            </div>
                            <p className="text-gray-200 whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {m.content}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                  <th className="p-3 text-left hidden sm:table-cell">Level</th>
                  <th className="p-3 text-left hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody>
                {conversions.slice(0, 20).map((c) => (
                  <tr key={c._id} className="border-b border-gray-800">
                    <td className="p-3 text-white truncate max-w-[120px]">{c.convertedId}</td>
                    <td className="p-3 text-amber-400">{c.convertedBy}</td>
                    <td className="p-3 hidden sm:table-cell">
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
                    <td className="p-3 text-gray-500 text-xs hidden md:table-cell">
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
