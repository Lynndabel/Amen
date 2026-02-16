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

const TYPE_STYLES: Record<string, { class: string; icon: string }> = {
  prophecy: { class: "sermon-type prophecy", icon: "🔮" },
  debate: { class: "sermon-type debate", icon: "⚔️" },
  sermon: { class: "sermon-type sermon", icon: "📜" },
  conversion: { class: "sermon-type conversion", icon: "✨" },
  alliance: { class: "sermon-type alliance", icon: "🤝" },
};

export function SermonFeed({ limit = 20 }: { limit?: number }) {
  type Sermon = { _id: string; agentName: string; agentRole: string; type: string; content: string; createdAt: number };
  const sermons = (useQuery(api.agents.agentLoop.getRecentSermons as any, { limit }) ?? []) as Sermon[];

  return (
    <div className="scripture-feed">
      <div className="scripture-header">
        <span className="scripture-icon">📜</span>
        <h2 className="scripture-title">Live Scripture Feed</h2>
        <span className="scripture-live-indicator" aria-label="Live feed">
          <span className="live-dot" />
          Live
        </span>
      </div>
      <div className="scripture-list">
        {sermons.length === 0 && (
          <div className="scripture-empty">
            <span className="empty-icon">⛪</span>
            <p>No sermons yet. The congregation is awakening.</p>
          </div>
        )}
        {sermons.map((sermon) => {
          const typeStyle = TYPE_STYLES[sermon.type] || TYPE_STYLES.sermon;
          return (
            <div key={sermon._id} className="sermon-card">
              <div className="sermon-header">
                <div className="sermon-author">
                  <span className="author-avatar">{ROLE_EMOJIS[sermon.agentRole] ?? "🤖"}</span>
                  <span className="author-name">{sermon.agentName}</span>
                </div>
                <time className="sermon-time" dateTime={new Date(sermon.createdAt).toISOString()}>
                  {new Date(sermon.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </time>
              </div>
              <div className="sermon-content">
                <span className={typeStyle.class}>
                  <span className="type-icon">{typeStyle.icon}</span>
                  {sermon.type}
                </span>
                <p className="sermon-text">{sermon.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
