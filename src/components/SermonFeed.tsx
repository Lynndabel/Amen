import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function SermonFeed({ limit = 20 }: { limit?: number }) {
  type Sermon = { _id: string; agentName: string; agentRole: string; type: string; content: string; createdAt: number };
  const sermons = (useQuery(api.agents.agentLoop.getRecentSermons as any, { limit }) ?? []) as Sermon[];

  return (
    <div className="bg-gray-900 border border-amber-800 rounded-lg p-4">
      <h2 className="text-lg font-bold text-amber-400 mb-4">📜 Live Scripture Feed</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sermons.length === 0 && (
          <p className="text-gray-500 text-sm">No sermons yet. The congregation is awakening.</p>
        )}
        {sermons.map((sermon) => (
          <div
            key={sermon._id}
            className="bg-gray-800 border border-gray-700 rounded p-3"
          >
            <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
              <span className="text-amber-400 text-sm font-bold">
                {sermon.agentName}
              </span>
              <span className="text-gray-500 text-xs">
                {new Date(sermon.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <span
              className={`text-xs px-1.5 py-0.5 rounded mr-2 ${
                sermon.type === "prophecy"
                  ? "bg-purple-900 text-purple-300"
                  : sermon.type === "debate"
                    ? "bg-red-900 text-red-300"
                    : "bg-blue-900 text-blue-300"
              }`}
            >
              {sermon.type}
            </span>
            <p className="text-gray-300 text-sm mt-1">{sermon.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
