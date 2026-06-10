import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';

const SUGGESTIONS = {
  admin: [
    '👥 How many employees?',
    '📅 Who is absent today?',
    '📋 Pending leave requests?',
    '💰 Payroll overview?',
    '🎯 Overdue tasks?',
  ],
  employee: [
    '📋 What are my tasks?',
    '💰 What is my salary?',
    '🏖️ My leave balance?',
    '📅 My attendance today?',
    '🔔 Any notifications?',
  ],
};

export default function AIChat() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [role,     setRole]     = useState('employee');
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.role === 'admin' || u.is_staff) setRole('admin');
    } catch {}
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setMessages(p => [...p, { role:'user', content:msg, ts:new Date() }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.role, content: m.content,
      }));
      const { data } = await api.post('/ai-assistant/chat/', {
        message: msg, history,
      });
      setMessages(p => [...p, {
        role: 'assistant',
        content: data.reply || 'No response received.',
        ts: new Date(),
      }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      const errMsg = err.response?.data?.error ||
        err.response?.data?.detail ||
        'Something went wrong. Please try again.';
      setMessages(p => [...p, {
        role: 'assistant', content: `⚠️ ${errMsg}`, ts: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestions = SUGGESTIONS[role] || SUGGESTIONS.employee;
  const timeStr = (d) => new Date(d).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <>
      {/* ── Floating Button ── */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        zIndex: 99999,
      }}>
        {/* Unread badge */}
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: -6, right: -6,
            width: 20, height: 20, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1,
          }}>
            {unread}
          </div>
        )}

        <button
          onClick={() => setOpen(p => !p)}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: open
              ? '#ef4444'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24,
            boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
            transition: 'all 0.3s',
            transform: open ? 'rotate(0deg)' : 'rotate(0deg)',
          }}
        >
          {open ? '✕' : '🤖'}
        </button>
      </div>

      {/* ── Chat Panel ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24,
          zIndex: 99998,
          width: 380, height: 560,
          background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          animation: 'slideUp 0.25s ease',
          overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            padding: '16px 18px',
            background: 'linear-gradient(135deg,#1e1b4b,#312e81)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', gap: 10,
            flexShrink: 0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
            }}>
              🤖
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                color: '#fff', fontWeight: 700, fontSize: 14,
              }}>
                EMS Assistant
              </div>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 5, marginTop: 2,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#34d399',
                  display: 'inline-block',
                  animation: 'pulse 1.5s infinite',
                }}/>
                <span style={{ color: '#94a3b8', fontSize: 11 }}>
                  Online · Gemini AI ·{' '}
                  {role === 'admin' ? '🛡️ Admin' : '👤 Employee'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setMessages([])}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: 'none', borderRadius: 8,
                color: '#94a3b8', padding: '4px 8px',
                cursor: 'pointer', fontSize: 11,
              }}
              title="Clear chat"
            >
              🗑️
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>

            {messages.length === 0 && !loading && (
              <div>
                {/* Welcome */}
                <div style={{
                  textAlign: 'center', padding: '16px 8px 12px',
                }}>
                  <div style={{ fontSize: 36, marginBottom: 6 }}>🤖</div>
                  <p style={{
                    color: '#e2e8f0', fontSize: 13,
                    fontWeight: 600, margin: '0 0 4px',
                  }}>
                    Hi! I'm your EMS Assistant
                  </p>
                  <p style={{
                    color: '#64748b', fontSize: 11,
                    margin: 0, lineHeight: 1.5,
                  }}>
                    Ask me about employees, attendance,
                    payroll, leaves, or tasks
                  </p>
                </div>

                {/* Suggestions */}
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 6,
                  justifyContent: 'center',
                }}>
                  {suggestions.map((s, i) => (
                    <button key={i}
                      onClick={() => send(s)}
                      style={{
                        padding: '6px 10px', borderRadius: 20,
                        background: 'rgba(99,102,241,0.1)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        color: '#a5b4fc', cursor: 'pointer',
                        fontSize: 11, fontWeight: 500,
                        transition: 'all 0.15s',
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                gap: 8, alignItems: 'flex-start',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  flexShrink: 0, fontSize: 14,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  background: m.role === 'user'
                    ? 'rgba(255,255,255,0.06)'
                    : 'linear-gradient(135deg,#1a3a6e,#4f8ef7)',
                }}>
                  {m.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '82%' }}>
                  <div style={{
                    padding: '9px 13px',
                    borderRadius: m.role === 'user'
                      ? '14px 3px 14px 14px'
                      : '3px 14px 14px 14px',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg,#1e3a5f,#1c3358)'
                      : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${m.role === 'user'
                      ? 'rgba(99,102,241,0.3)'
                      : 'rgba(255,255,255,0.08)'}`,
                    color: m.role === 'user' ? '#c9daff' : '#e2e8f0',
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                  <div style={{
                    color: '#475569', fontSize: 10,
                    marginTop: 3,
                    textAlign: m.role === 'user' ? 'right' : 'left',
                    paddingLeft: 4, paddingRight: 4,
                  }}>
                    {timeStr(m.ts)}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing */}
            {loading && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg,#1a3a6e,#4f8ef7)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 14,
                }}>
                  🤖
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: '3px 14px 14px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', gap: 4, alignItems: 'center',
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#6366f1', display: 'inline-block',
                      animation: `bounce 1.2s ${i * 0.2}s infinite`,
                    }}/>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px 14px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <div style={{
              display: 'flex', gap: 8, alignItems: 'flex-end',
            }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
                onKeyDown={handleKey}
                placeholder="Ask anything..."
                disabled={loading}
                rows={1}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#e2e8f0',
                  fontSize: 12.5, padding: '9px 12px',
                  resize: 'none', outline: 'none',
                  fontFamily: 'inherit',
                  maxHeight: 80, lineHeight: 1.5,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  width: 36, height: 36,
                  borderRadius: 10, border: 'none',
                  background: input.trim() && !loading
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  color: '#fff', cursor: input.trim() && !loading
                    ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? '⏳' : '➤'}
              </button>
            </div>
            <p style={{
              color: '#475569', fontSize: 10,
              margin: '5px 0 0', textAlign: 'center',
            }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes bounce {
          0%,80%,100% { transform:translateY(0); opacity:0.4; }
          40%          { transform:translateY(-5px); opacity:1; }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%      { opacity:0.4; }
        }
      `}</style>
    </>
  );
}