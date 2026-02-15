import { ChurchDashboard } from "./components/ChurchDashboard";
import { ChurchWorld } from "./components/ChurchWorld";
import { SermonFeed } from "./components/SermonFeed";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

export function App() {
  const [outsiderMessage, setOutsiderMessage] = useState("");
  const [outsiderId] = useState(() => "visitor-" + Math.random().toString(36).slice(2, 9));
  const handleOutsideMessage = useAction(api.agents.agentLoop.handleOutsideMessage as any);
  const [response, setResponse] = useState<{ agent: string; response: string } | null>(null);
  const [sending, setSending] = useState(false);

  async function sendMessage() {
    if (!outsiderMessage.trim()) return;
    setSending(true);
    setResponse(null);
    try {
      const result = await handleOutsideMessage({
        outsiderId,
        message: outsiderMessage.trim(),
      });
      setResponse(result);
      setOutsiderMessage("");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-amber-50 font-mono">
      <ChurchDashboard />
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2">
            <ChurchWorld />
          </div>
          <div className="space-y-4">
            <SermonFeed limit={12} />
            <div className="bg-gray-900 border border-amber-800 rounded-lg p-4">
              <h3 className="text-amber-400 font-bold mb-2">🙏 Speak to the Church</h3>
              <p className="text-gray-500 text-xs mb-2">
                Send a message as an outsider; an agent will respond and may convert you.
              </p>
              <textarea
                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white placeholder-gray-500 resize-none"
                rows={3}
                placeholder='e.g. "How do I join?" or "$AMEN is a scam"'
                value={outsiderMessage}
                onChange={(e) => setOutsiderMessage(e.target.value)}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending}
                className="mt-2 w-full py-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded"
              >
                {sending ? "..." : "Send message"}
              </button>
              {response && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-amber-400 text-xs font-bold">{response.agent} replied:</p>
                  <p className="text-gray-300 text-sm mt-1">{response.response}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
