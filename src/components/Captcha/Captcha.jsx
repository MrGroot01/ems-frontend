import { useState, useEffect, useCallback, useRef } from 'react';

const generateText = (length = 5) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

const drawCaptcha = (canvas, text) => {
  if (!canvas || !text) return;
  const ctx = canvas.getContext('2d');
  const w   = canvas.width;
  const h   = canvas.height;

  // Clear first
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, w, h);

  // Noise lines
  for (let i = 0; i < 6; i++) {
    ctx.strokeStyle = `rgba(37,99,235,${Math.random() * 0.3 + 0.1})`;
    ctx.lineWidth   = Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(Math.random() * w, Math.random() * h);
    ctx.lineTo(Math.random() * w, Math.random() * h);
    ctx.stroke();
  }

  // Noise dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(37,99,235,${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw characters
  const charWidth = w / (text.length + 1);
  text.split('').forEach((char, i) => {
    ctx.save();
    ctx.translate(charWidth * (i + 0.9), h / 2 + 8);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.font      = `bold ${Math.floor(Math.random() * 8) + 28}px Arial`;
    ctx.fillStyle = `hsl(${220 + Math.random() * 40},80%,${30 + Math.random() * 20}%)`;
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur  = 2;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  });

  // Border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth   = 2;
  ctx.strokeRect(0, 0, w, h);
};


export default function Captcha({ onVerify }) {
  const canvasRef                     = useRef(null);
  const [captchaText, setCaptchaText] = useState('');
  const [input,       setInput]       = useState('');
  const [verified,    setVerified]    = useState(false);
  const [error,       setError]       = useState('');

  // ── Generate new text ──────────────────────────────────
  const refresh = useCallback(() => {
    const text = generateText(5);
    setCaptchaText(text);
    setInput('');
    setVerified(false);
    setError('');
    onVerify && onVerify(false);
  }, [onVerify]);

  // ── Draw whenever captchaText changes ─────────────────
  useEffect(() => {
    if (captchaText && canvasRef.current) {
      drawCaptcha(canvasRef.current, captchaText);
    }
  }, [captchaText]);

  // ── Initial load ───────────────────────────────────────
  useEffect(() => {
    refresh();
  }, []); // eslint-disable-line

  const verify = () => {
    if (!input.trim()) {
      setError('Please enter the captcha text');
      return;
    }
    if (input.trim().toUpperCase() === captchaText.toUpperCase()) {
      setVerified(true);
      setError('');
      onVerify && onVerify(true);
    } else {
      setError('Wrong captcha! Try again.');
      refresh();
    }
  };

  return (
    <div style={{ margin: '16px 0' }}>
      <label style={{
        fontSize: '11px', fontWeight: '600',
        letterSpacing: '1px', textTransform: 'uppercase',
        color: '#94a3b8', display: 'block', marginBottom: '8px'
      }}>
        CAPTCHA VERIFICATION
      </label>

      {/* Canvas + Refresh */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '10px', marginBottom: '10px'
      }}>
        <canvas
          ref={canvasRef}
          width={180}
          height={58}
          style={{
            borderRadius: '8px',
            border: '2px solid #e2e8f0',
            display: 'block',
            cursor: 'pointer',
            background: '#f1f5f9',
          }}
          onClick={refresh}
          title="Click to refresh"
        />
        <button
          type="button"
          onClick={refresh}
          title="Refresh captcha"
          style={{
            background: '#f1f5f9',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            padding: '8px 12px',
          }}
        >
          🔄
        </button>
      </div>

      {/* Input + Verify or Success */}
      {!verified ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="Type the text above"
            maxLength={6}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: error ? '2px solid #dc2626' : '2px solid #e2e8f0',
              fontSize: '16px',
              letterSpacing: '4px',
              fontWeight: 'bold',
              outline: 'none',
              background: '#f8fafc',
              color: '#1e293b',
              textTransform: 'uppercase',
            }}
          />
          <button
            type="button"
            onClick={verify}
            disabled={!input}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: input ? '#2563eb' : '#94a3b8',
              color: '#fff',
              border: 'none',
              cursor: input ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            Verify
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: '#f0fdf4',
          border: '2px solid #16a34a',
          color: '#16a34a',
          fontWeight: '600',
          fontSize: '14px',
        }}>
          ✅ Captcha verified successfully!
        </div>
      )}

      {error && (
        <p style={{
          color: '#dc2626',
          fontSize: '12px',
          margin: '6px 0 0',
        }}>
          ⚠️ {error}
        </p>
      )}

      <p style={{
        color: '#94a3b8',
        fontSize: '11px',
        margin: '6px 0 0',
      }}>
        💡 Click image or 🔄 to refresh
      </p>
    </div>
  );
}