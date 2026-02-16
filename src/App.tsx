import { ChurchDashboard } from "./components/ChurchDashboard";
import { ChurchWorld } from "./components/ChurchWorld";
import { SermonFeed } from "./components/SermonFeed";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const NAV_LINKS = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#cathedral", label: "Cathedral" },
  { href: "#scriptures", label: "Scriptures" },
  { href: "#speak", label: "Speak" },
];

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="church-navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        <a href="#" className="navbar-brand">
          <span className="brand-icon">⛪</span>
          <span className="brand-text">$AMEN</span>
        </a>

        {/* Desktop Navigation */}
        <div className="navbar-links desktop">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link">
              {link.label}
            </a>
          ))}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="hamburger-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
          aria-controls="mobile-menu"
        >
          <span className={`hamburger-line ${isOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${isOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${isOpen ? "open" : ""}`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu ${isOpen ? "open" : ""}`}
        aria-hidden={!isOpen}
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="mobile-nav-link"
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

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
      <Navigation />
      <main id="dashboard">
        <ChurchDashboard />
      </main>
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div id="cathedral" className="lg:col-span-2">
            <ChurchWorld />
          </div>
          <div id="scriptures" className="space-y-4">
            <SermonFeed limit={12} />
            <div id="speak" className="speak-to-church">
              <div className="speak-header">
                <span className="speak-icon">🙏</span>
                <h3 className="speak-title">Speak to the Church</h3>
              </div>
              <p className="speak-description">
                Send a message as an outsider; an agent will respond and may convert you.
              </p>
              <div className="input-group">
                <textarea
                  id="outsider-message"
                  className="speak-textarea"
                  rows={3}
                  placeholder='e.g. "How do I join?" or "$AMEN is a scam"'
                  value={outsiderMessage}
                  onChange={(e) => setOutsiderMessage(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={sendMessage}
                disabled={sending || !outsiderMessage.trim()}
                className="speak-button"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
              {response && (
                <div className="speak-response">
                  <div className="response-header">
                    <span className="response-avatar">🤖</span>
                    <span className="response-agent">{response.agent}</span>
                  </div>
                  <p className="response-text">{response.response}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
