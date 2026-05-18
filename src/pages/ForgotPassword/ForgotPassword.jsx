import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './ForgotPassword.css';

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
  const refs = useRef([]);

  const clearMsgs = () => { setErr(''); setOk(''); };

  // ── STEP 1: Request OTP ───────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setErr('Email is required'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.forgotPassword(email.trim());
      setOk('OTP sent! Check your email (or Django console in dev mode).');
      setTimeout(() => { setOk(''); setStep(2); }, 1800);
    } catch (ex) {
      setErr(ex.response?.data?.error || ex.response?.data?.detail || 'No account found with this email');
    } finally { setLoading(false); }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) refs.current[idx+1]?.focus();
  };
  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx-1]?.focus();
  };
  const handleStep2 = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setErr('Enter all 6 digits'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.verifyOTP({ email, otp: otpStr });
      setOk('OTP verified!');
      setTimeout(() => { setOk(''); setStep(3); }, 1000);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Invalid or expired OTP. Try again.');
    } finally { setLoading(false); }
  };

  // ── STEP 3: Reset password ────────────────────────────────
  const handleStep3 = async (e) => {
    e.preventDefault();
    if (!pwd)       { setErr('New password is required'); return; }
    if (pwd.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (pwd !== conf)   { setErr('Passwords do not match'); return; }
    setLoading(true); clearMsgs();
    try {
      await authAPI.resetPassword({ email, otp: otp.join(''), new_password: pwd, confirm_password: conf });
      setOk('✅ Password reset successfully! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2200);
    } catch (ex) {
      setErr(ex.response?.data?.error || 'Reset failed. OTP may have expired — go back and retry.');
    } finally { setLoading(false); }
  };

  const ICONS   = ['','🔐','📱','🔑'];
  const TITLES  = ['','Reset Password','Verify OTP','New Password'];
  const SUBS    = ['',
    "Enter your registered email and we'll send a 6-digit OTP",
    'Enter the 6-digit code sent to your email',
    'Set a strong new password for your account'
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
                {step>s?'✓':s}
              </div>
              {i<2 && <div className={`fp-line ${step>s?'done':''}`}/>}
            </React.Fragment>
          ))}
        </div>

        {err && <div className="alert-err">⚠ {err}</div>}
        {ok  && <div className="alert-ok">✅ {ok}</div>}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <form onSubmit={handleStep1}>
            <div className="field">
              <label>Registered Email</label>
              <div className="field-wrap">
                <span className="field-ico">✉️</span>
                <input type="email" value={email}
                  onChange={e => { setEmail(e.target.value); clearMsgs(); }}
                  placeholder="you@company.com" autoFocus/>
              </div>
            </div>
            <button type="submit" className="btn-fp" disabled={loading}>
              {loading ? <><div className="spin"/> Sending OTP…</> : '📨 Send OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <form onSubmit={handleStep2}>
            <div className="otp-row">
              {otp.map((d,i) => (
                <input key={i} ref={el => refs.current[i]=el}
                  className="otp-box" type="text" inputMode="numeric"
                  maxLength={1} value={d}
                  onChange={e => handleOtpChange(i,e.target.value)}
                  onKeyDown={e => handleOtpKey(i,e)}
                  autoFocus={i===0}/>
              ))}
            </div>
            <div className="resend-row">
              Didn't get it?{' '}
              <button type="button" onClick={handleStep1} disabled={loading}>Resend OTP</button>
            </div>
            <br/>
            <button type="submit" className="btn-fp" disabled={loading}>
              {loading ? <><div className="spin"/> Verifying…</> : '✅ Verify OTP'}
            </button>
          </form>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <form onSubmit={handleStep3}>
            <div className="field">
              <label>New Password</label>
              <div className="field-wrap">
                <span className="field-ico">🔒</span>
                <input type={showPwd?'text':'password'} value={pwd}
                  onChange={e => { setPwd(e.target.value); clearMsgs(); }}
                  placeholder="Min. 8 characters" autoFocus/>
                <button type="button" className="eye-btn-fp"
                  onClick={() => setShowPwd(p=>!p)}>{showPwd?'🙈':'👁️'}</button>
              </div>
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <div className="field-wrap">
                <span className="field-ico">🔑</span>
                <input type={showPwd?'text':'password'} value={conf}
                  onChange={e => { setConf(e.target.value); clearMsgs(); }}
                  placeholder="Repeat password"/>
              </div>
            </div>
            <button type="submit" className="btn-fp" disabled={loading}>
              {loading ? <><div className="spin"/> Resetting…</> : '🔐 Reset Password'}
            </button>
          </form>
        )}

        <div className="back-link"><Link to="/login">← Back to Login</Link></div>
      </div>
    </div>
  );
}
