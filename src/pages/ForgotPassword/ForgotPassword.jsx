import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './ForgotPassword.css';

const OTP_TIMER = 30;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [email,   setEmail]   = useState('');
  const [otp,     setOtp]     = useState(['','','','','','']);
  const [pwd,     setPwd]     = useState('');
  const [conf,    setConf]    = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConf,setShowConf]= useState(false);

  // Timer
  const [timer,     setTimer]     = useState(OTP_TIMER);
  const [timerDone, setTimerDone] = useState(false);
  const timerRef = useRef(null);
  const refs     = useRef([]);

  const clearMsgs = () => { setErr(''); setOk(''); };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const startTimer = () => {
    setTimer(OTP_TIMER);
    setTimerDone(false);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── STEP 1: Request OTP ───────────────────────────────────
  const handleStep1 = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!email.trim()) { setErr('Email is required'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.forgotPassword(email.trim());
      setOk('OTP sent! Check your email.');
      setTimeout(() => {
        setOk('');
        setStep(2);
        setOtp(['','','','','','']);
        startTimer();
      }, 1400);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.response?.data?.detail || 'No account found with this email');
    } finally { setLoading(false); }
  };

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (!timerDone) return;
    setLoading(true); clearMsgs();
    try {
      await authAPI.forgotPassword(email.trim());
      setOk('New OTP sent!');
      setTimeout(() => setOk(''), 2000);
      setOtp(['','','','','','']);
      refs.current[0]?.focus();
      startTimer();
    } catch {
      setErr('Failed to resend OTP. Try again.');
    } finally { setLoading(false); }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };
  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      refs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setErr('Enter all 6 digits'); return; }
    if (timerDone) { setErr('OTP expired. Click Resend OTP.'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.verifyOTP({ email, otp: otpStr });
      clearInterval(timerRef.current);
      setOk('OTP verified!');
      setTimeout(() => { setOk(''); setStep(3); }, 1000);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Invalid or expired OTP. Try again.');
    } finally { setLoading(false); }
  };

  // ── STEP 3: Reset password ────────────────────────────────
  const handleStep3 = async (e) => {
    e.preventDefault();
    if (!pwd)           { setErr('New password is required'); return; }
    if (pwd.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (pwd !== conf)   { setErr('Passwords do not match'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.resetPassword({ email, otp: otp.join(''), new_password: pwd, confirm_password: conf });
      setOk('Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2200);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Reset failed. OTP may have expired — go back and retry.');
    } finally { setLoading(false); }
  };

  // Timer ring math
  const R          = 16;
  const C          = 2 * Math.PI * R;
  const timerPct   = timer / OTP_TIMER;
  const strokeDash = timerPct * C;
  const timerColor = timer > 15 ? '#10b981' : timer > 8 ? '#f59e0b' : '#ef4444';

  const ICONS  = ['', '🔐', '📱', '🔑'];
  const TITLES = ['', 'Reset Password', 'Verify OTP', 'New Password'];
  const SUBS   = ['',
    "Enter your registered email and we'll send a 6-digit OTP",
    'Enter the 6-digit code sent to your email',
    'Set a strong new password for your account',
  ];

  return (
    <div className="fp-page">
      <div className="fp-bg"/>
      <div className="fp-card">

        <div className="fp-icon">{ICONS[step]}</div>
        <h2>{TITLES[step]}</h2>
        <p className="fp-sub">{SUBS[step]}</p>

        {/* Step indicators */}
        <div className="fp-steps">
          {[1,2,3].map((s,i) => (
            <React.Fragment key={s}>
              <div className={`fp-dot ${step===s?'active':step>s?'done':''}`}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && <div className={`fp-line ${step>s?'done':''}`}/>}
            </React.Fragment>
          ))}
        </div>

        {err && <div className="alert-err">⚠ {err}</div>}
        {ok  && <div className="alert-ok">✅ {ok}</div>}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="field">
              <label>Registered Email</label>
              <div className="field-wrap">
                {/* SVG icon via CSS class — no emoji */}
                <span className="field-ico field-ico--email"/>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearMsgs(); }}
                  placeholder="you@company.com"
                  autoFocus
                />
              </div>
            </div>
            <button type="submit" className="btn-fp" disabled={loading}>
              {loading
                ? <><div className="spin"/> Sending OTP…</>
                : '📨 Send OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === 2 && (
          <form onSubmit={handleStep2}>

            {/* Countdown ring */}
            <div className="otp-timer-wrap">
              <svg className="otp-timer-svg" viewBox="0 0 40 40">
                {/* track */}
                <circle cx="20" cy="20" r={R}
                  fill="none"
                  stroke="rgba(255,255,255,.08)"
                  strokeWidth="3"
                />
                {/* progress arc */}
                <circle cx="20" cy="20" r={R}
                  fill="none"
                  stroke={timerDone ? '#ef4444' : timerColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${C}`}
                  transform="rotate(-90 20 20)"
                  style={{ transition: 'stroke-dasharray .95s linear, stroke .4s' }}
                />
                {/* number */}
                <text x="20" y="20"
                  dominantBaseline="central"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="800"
                  fill={timerDone ? '#ef4444' : timerColor}
                  fontFamily="Plus Jakarta Sans, sans-serif">
                  {timerDone ? '!' : timer}
                </text>
              </svg>
              <div className="otp-timer-label">
                {timerDone
                  ? <span style={{ color:'#f87171', fontWeight:600 }}>OTP expired — resend below</span>
                  : <span>
                      Expires in{' '}
                      <strong style={{ color: timerColor }}>{timer}s</strong>
                    </span>
                }
              </div>
            </div>

            {/* OTP input boxes */}
            <div className={`otp-row ${timerDone ? 'expired' : ''}`}>
              {otp.map((d,i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKey(i, e)}
                  onPaste={handleOtpPaste}
                  autoFocus={i === 0}
                  disabled={timerDone}
                />
              ))}
            </div>

            {/* Resend */}
            <div className="resend-row">
              Didn't get it?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={!timerDone || loading}
                className={timerDone ? 'resend-active' : ''}
              >
                {loading ? 'Sending…' : timerDone ? '🔁 Resend OTP' : `Resend in ${timer}s`}
              </button>
            </div>

            <br/>
            <button
              type="submit"
              className="btn-fp"
              disabled={loading || timerDone || otp.join('').length < 6}
            >
              {loading
                ? <><div className="spin"/> Verifying…</>
                : '✅ Verify OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 3: New password ── */}
        {step === 3 && (
          <form onSubmit={handleStep3}>

            {/* Password strength bar */}
            {pwd && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4].map(i => {
                    const strength =
                      (pwd.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(pwd) ? 1 : 0) +
                      (/[0-9]/.test(pwd) ? 1 : 0) +
                      (/[!@#$%^&*]/.test(pwd) ? 1 : 0);
                    const colors = ['','#ef4444','#f59e0b','#10b981','#6366f1'];
                    return (
                      <div key={i} style={{
                        flex:1, height:4, borderRadius:4,
                        background: strength >= i ? colors[strength] : 'rgba(255,255,255,.1)',
                        transition: 'background .3s',
                      }}/>
                    );
                  })}
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.35)' }}>
                  {['','Weak','Fair','Good','Strong'][
                    (pwd.length >= 8 ? 1 : 0) +
                    (/[A-Z]/.test(pwd) ? 1 : 0) +
                    (/[0-9]/.test(pwd) ? 1 : 0) +
                    (/[!@#$%^&*]/.test(pwd) ? 1 : 0)
                  ]} password
                </div>
              </div>
            )}

            <div className="field">
              <label>New Password</label>
              <div className="field-wrap">
                <span className="field-ico field-ico--lock"/>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={pwd}
                  onChange={e => { setPwd(e.target.value); clearMsgs(); }}
                  placeholder="Min. 8 characters"
                  autoFocus
                />
                <button type="button" className="eye-btn-fp"
                  onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="field">
              <label>Confirm Password</label>
              <div className="field-wrap">
                <span className="field-ico field-ico--key"/>
                <input
                  type={showConf ? 'text' : 'password'}
                  value={conf}
                  onChange={e => { setConf(e.target.value); clearMsgs(); }}
                  placeholder="Repeat password"
                />
                <button type="button" className="eye-btn-fp"
                  onClick={() => setShowConf(p => !p)}>
                  {showConf ? '🙈' : '👁️'}
                </button>
              </div>
              {/* Match indicator */}
              {conf && (
                <div style={{
                  fontSize: 11, marginTop: 5,
                  color: pwd === conf ? '#34d399' : '#f87171',
                }}>
                  {pwd === conf ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
            </div>

            <button type="submit" className="btn-fp" disabled={loading}>
              {loading
                ? <><div className="spin"/> Resetting…</>
                : '🔐 Reset Password'}
            </button>
          </form>
        )}

        <div className="back-link">
          <Link to="/login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}