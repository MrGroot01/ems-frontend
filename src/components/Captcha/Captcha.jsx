import { useState, useEffect, useCallback } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export default function Captcha({ onVerify }) {
  const [captchaKey,   setCaptchaKey]   = useState('');
  const [captchaImg,   setCaptchaImg]   = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [verified,     setVerified]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  const loadCaptcha = useCallback(async () => {
    try {
      setCaptchaInput('');
      setVerified(false);
      setError('');
      onVerify && onVerify(false);
      const res  = await fetch(`${API}/auth/captcha/`);
      const data = await res.json();
      setCaptchaKey(data.captcha_key);
      setCaptchaImg(data.captcha_image_url);
    } catch {
      setError('Failed to load captcha. Refresh page.');
    }
  }, [onVerify]);

  useEffect(() => { loadCaptcha(); }, [loadCaptcha]);

  const verifyCaptcha = async () => {
    if (!captchaInput.trim()) {
      setError('Please enter the captcha text');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/auth/captcha/verify/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captcha_key:   captchaKey,
          captcha_value: captchaInput,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerified(true);
        onVerify && onVerify(true);
      } else {
        setError('Wrong captcha! Try again.');
        loadCaptcha();
        onVerify && onVerify(false);
      }
    } catch {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
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

      {/* Image row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          background: '#f1f5f9', borderRadius: '8px',
          padding: '8px', border: '2px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '170px', minHeight: '60px',
        }}>
          {captchaImg
            ? <img src={captchaImg} alt="captcha"
                   style={{ height: '55px', display: 'block', borderRadius: '4px' }} />
            : <div style={{ height: '55px', width: '160px',
                            background: '#e2e8f0', borderRadius: '4px',
                            display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#94a3b8',
                            fontSize: '12px' }}>
                Loading...
              </div>
          }
        </div>

        <button
          type="button"
          onClick={loadCaptcha}
          title="Refresh captcha"
          style={{
            background: '#f1f5f9', border: '2px solid #e2e8f0',
            borderRadius: '8px', cursor: 'pointer',
            fontSize: '20px', padding: '8px 12px',
            transition: 'all 0.2s',
          }}
        >
          🔄
        </button>
      </div>

      {/* Input + Verify */}
      {!verified ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={captchaInput}
            onChange={e => {
              setCaptchaInput(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={e => e.key === 'Enter' && verifyCaptcha()}
            placeholder="Type the text above"
            maxLength={6}
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: '8px',
              border: error ? '2px solid #dc2626' : '2px solid #e2e8f0',
              fontSize: '16px', letterSpacing: '4px',
              fontWeight: 'bold', outline: 'none',
              background: '#f8fafc', color: '#1e293b',
              textTransform: 'uppercase',
            }}
          />
          <button
            type="button"
            onClick={verifyCaptcha}
            disabled={loading || !captchaInput}
            style={{
              padding: '10px 18px', borderRadius: '8px',
              background: loading ? '#94a3b8' : '#2563eb',
              color: '#fff', border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600', fontSize: '14px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '⏳' : 'Verify'}
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderRadius: '8px',
          background: '#f0fdf4', border: '2px solid #16a34a',
          color: '#16a34a', fontWeight: '600', fontSize: '14px',
        }}>
          ✅ Captcha verified successfully!
        </div>
      )}

      {error && (
        <p style={{
          color: '#dc2626', fontSize: '12px',
          margin: '6px 0 0', display: 'flex',
          alignItems: 'center', gap: '4px',
        }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}