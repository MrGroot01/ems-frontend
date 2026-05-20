import React, { useState, useRef, useEffect, useCallback } from "react";
import api from "../../services/api";   // ✅ correct import (not axiosInstance)
import "./AIAssistant.css";

// ── Suggestion prompts ─────────────────────────────────────
const SUGGESTIONS = {
  admin: [
    "How many employees are there?",
    "Who is absent today?",
    "Show pending leave requests",
    "List overdue tasks",
    "Give company summary",
    "Show payroll overview",
  ],
  employee: [
    "What are my tasks today?",
    "Show my attendance this month",
    "What is my salary?",
    "Check my leave status",
    "Any pending notifications?",
  ],
};

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`message-row ${isUser ? "user" : "ai"}`}>
      <div className={`msg-avatar ${isUser ? "usr-av" : "ai-av"}`}>
        {isUser ? "👤" : "🤖"}
      </div>
      <div>
        <div className="message-bubble">{msg.content}</div>
        <div className="msg-time">{formatTime(msg.ts)}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="msg-avatar ai-av">🤖</div>
      <div className="typing-bubble">
        <span /><span /><span />
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [userRole, setUserRole] = useState("employee");

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // Detect role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === "admin" || parsed.is_staff || parsed.is_superuser) {
          setUserRole("admin");
        }
      } catch (_) {}
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  const buildHistory = useCallback(() => {
    return messages.slice(-10).map((m) => ({
      role:    m.role,
      content: m.content,
    }));
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = buildHistory();

      // ✅ FIXED: baseURL is 'http://localhost:8000/api'
      // so endpoint is '/ai-assistant/chat/' NOT '/api/ai-assistant/chat/'
      const { data } = await api.post("/ai-assistant/chat/", {
        message: trimmed,
        history,
      });

      if (data.role) setUserRole(data.role.toLowerCase());

      setMessages((prev) => [
        ...prev,
        {
          role:    "assistant",
          content: data.reply || "Sorry, no response received.",
          ts:      new Date(),
        },
      ]);
    } catch (err) {
      console.error("AI Assistant error:", err.response || err);

      const errText =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        `Error ${err.response?.status || ''}: Something went wrong. Please try again.`;

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errText, ts: new Date() },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, [input, loading, buildHistory]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat   = () => setMessages([]);
  const suggestions = SUGGESTIONS[userRole] || SUGGESTIONS.employee;

  return (
    <div className="ems-ai-page">

      {/* Sidebar */}
      <aside className="ems-sidebar">
        <div className="sidebar-brand">
          <h2>EMS AI</h2>
          <p>Your HR Intelligence Assistant</p>
        </div>

        <div className="sidebar-suggestions">
          <h3>Quick Ask</h3>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="suggestion-chip"
              onClick={() => sendMessage(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="role-badge">
            {userRole === "admin" ? "🛡️ Admin" : "👤 Employee"}
          </div>
          <button className="clear-btn" onClick={clearChat}>
            🗑 Clear Chat
          </button>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="ems-chat-area">

        <header className="chat-header">
          <div className="ai-avatar">🤖</div>
          <div className="chat-header-info">
            <h1>EMS Assistant</h1>
            <p>
              <span className="status-dot" />
              Online · Powered by Gemini AI
            </p>
          </div>
        </header>

        <div className="messages-container">
          {messages.length === 0 && !loading ? (
            <div className="empty-state">
              <div className="big-icon">🤖</div>
              <h2>Hello! How can I help?</h2>
              <p>
                Ask me about employees, attendance, payroll, leaves, or tasks.
                Use the quick prompts on the left to get started.
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-textarea"
              placeholder="Ask about employees, attendance, payroll…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              title="Send (Enter)"
            >
              {loading ? "⏳" : "➤"}
            </button>
          </div>
          <p className="input-hint">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>

      </main>
    </div>
  );
}