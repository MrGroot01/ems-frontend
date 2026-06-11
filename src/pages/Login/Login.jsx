import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Captcha from '../../components/Captcha/Captcha';
import './Login.css';

// ── Typewriter hook ────────────────────────────────────────
function useTypewriter(words, speed = 100, pause = 2000) {
  const [text,    setText]    = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setText(current.slice(0, text.length + 1));
        if (text.length + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        }
      } else {
        setText(current.slice(0, text.length - 1));
        if (text.length - 1 === 0) {
          setDeleting(false);
          setWordIdx(i => (i + 1) % words.length);
        }
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(timeout);
  }, [text, deleting, wordIdx, words, speed, pause]);

  return text;
}

// ── Particle canvas ────────────────────────────────────────
function Particles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const DOTS = Array.from({ length: 60 }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      r:  Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      o:  Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      DOTS.forEach(d => {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x = canvas.width;
        if (d.x > canvas.width) d.x = 0;
        if (d.y < 0) d.y = canvas.height;
        if (d.y > canvas.height) d.y = 0;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${d.o})`;
        ctx.fill();
      });

      // Draw connecting lines between close dots
      for (let i = 0; i < DOTS.length; i++) {
        for (let j = i + 1; j < DOTS.length; j++) {
          const dist = Math.hypot(DOTS[i].x - DOTS[j].x, DOTS[i].y - DOTS[j].y);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(DOTS[i].x, DOTS[i].y);
            ctx.lineTo(DOTS[j].x, DOTS[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="lp-canvas" />;
}

// ── Role-specific content ──────────────────────────────────
const CONTENT = {
  employee: {
    words:  ['Simplified.', 'Streamlined.', 'Effortless.'],
    prefix: 'Your Work,',
    sub:    'Check attendance, apply for leaves, download payslips, and stay on top of your schedule — all from one place.',
    badges: ['📅 Attendance', '🏖️ Leave Requests', '💰 Payslips', '📊 Reports'],
    stats: [
      { icon:'📅', label:'Attendance', value:'Today' },
      { icon:'🏖️', label:'Leave Balance', value:'View' },
      { icon:'💰', label:'Latest Payslip', value:'Download' },
    ],
  },
  admin: {
    words:  ['Reimagined.', 'Empowered.', 'Intelligent.'],
    prefix: 'Your HR,',
    sub:    'Manage your entire workforce, track attendance, approve leaves, run payroll and generate reports from one powerful dashboard.',
    badges: ['✅ JWT Secured', '📊 Analytics', '🌓 Dark Mode', '📱 Responsive'],
    stats: [
      { icon:'👥', label:'Total Employees', value:'Manage' },
      { icon:'📈', label:'Reports', value:'Analytics' },
      { icon:'⚙️', label:'System Control', value:'Admin' },
    ],
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role,            setRole]            = useState('employee');
  const [showPwd,         setShowPwd]         = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [errs,            setErrs]            = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [form,            setForm]            = useState({ email:'', password:'', remember:false });
  const [focused,         setFocused]         = useState('');

  const c    = CONTENT[role];
  const typed = useTypewriter(c.words, 90, 2200);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrs(p => ({ ...p, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    if (!captchaVerified)      { setError('Please verify the captcha'); return; }
    setLoading(true); setError('');
    try {
      const res = await authAPI.login({ email: form.email, password: form.password, role });
      login(res.data.user, res.data.tokens);
      navigate(role === 'admin' ? '/admin' : '/employee');
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Login failed. Please check your credentials.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="lp-page">

      {/* ── Animated background ── */}
      <Particles />
      <div className="lp-mesh" />

      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="lp-left">

        {/* Logo */}
        <div className="lp-logo">
          <div className="lp-logo-box">🏢</div>
          <span className="lp-logo-text">EMS <span>Pro</span></span>
        </div>

        {/* Hero */}
        <div className="lp-hero">
          <p className="lp-hero-pre">{c.prefix}</p>
          <h1 className="lp-hero-title">
            <span className="lp-hl">{typed}</span>
            <span className="lp-cursor">|</span>
          </h1>
          <p className="lp-hero-sub">{c.sub}</p>
        </div>

        {/* Badges */}
        <div className="lp-badges">
          {c.badges.map(b => (
            <span key={b} className="lp-badge">{b}</span>
          ))}
        </div>

        {/* Mini stats cards */}
        <div className="lp-stats">
          {c.stats.map(s => (
            <div key={s.label} className="lp-stat-card">
              <span className="lp-stat-icon">{s.icon}</span>
              <div>
                <div className="lp-stat-label">{s.label}</div>
                <div className="lp-stat-val">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className="lp-right">
        <div className="lp-card">

          {/* Card header */}
          <div className="lp-card-head">
            <div className="lp-card-avatar">
              {role === 'admin' ? '🛡️' : '👤'}
            </div>
            <h2>Welcome back 👋</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          {/* Role tabs */}
          <div className="lp-tabs">
            {[['employee','👤','Employee'],['admin','🛡️','Admin']].map(([val, ico, lbl]) => (
              <button key={val} type="button"
                className={`lp-tab ${role === val ? 'active' : ''}`}
                onClick={() => { setRole(val); setError(''); setErrs({}); }}>
                <span>{ico}</span>
                <span>{lbl}</span>
                {role === val && <span className="lp-tab-dot" />}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="lp-alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} noValidate>

            {/* Email */}
            <div className={`lp-field ${focused === 'email' ? 'focused' : ''} ${errs.email ? 'errored' : ''}`}>
              <label>Email Address</label>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email" name="email" value={form.email}
                  onChange={change} placeholder="you@company.com"
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  autoFocus
                />
              </div>
              {errs.email && <p className="lp-field-err">⚠ {errs.email}</p>}
            </div>

            {/* Password */}
            <div className={`lp-field ${focused === 'password' ? 'focused' : ''} ${errs.password ? 'errored' : ''}`}>
              <label>Password</label>
              <div className="lp-input-wrap">
                <svg className="lp-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPwd ? 'text' : 'password'} name="password"
                  value={form.password} onChange={change}
                  placeholder="Enter your password"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                />
                <button type="button" className="lp-eye"
                  onClick={() => setShowPwd(p => !p)}
                  tabIndex={-1}>
                  {showPwd
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
              {errs.password && <p className="lp-field-err">⚠ {errs.password}</p>}
            </div>

            {/* Remember + forgot */}
            <div className="lp-check-row">
              <label className="lp-chk">
                <input type="checkbox" name="remember"
                  checked={form.remember} onChange={change} />
                <span className="lp-chk-box" />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" className="lp-forgot">Forgot password?</Link>
            </div>

            {/* Captcha */}
            <div className="lp-captcha-wrap">
              <Captcha onVerify={(valid) => setCaptchaVerified(valid)} />
            </div>

            {/* Submit */}
            <button type="submit" className="lp-submit"
              disabled={loading || !captchaVerified}>
              {loading ? (
                <><div className="lp-spin" /> Signing in…</>
              ) : (
                <><span>Sign In</span><span className="lp-arrow">→</span></>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="lp-card-footer">
            {role === 'admin' ? (
              <p>New here? <Link to="/register">Create an account</Link></p>
            ) : (
              <p className="lp-emp-note">
                <span>🔒</span> Contact your admin to get an account
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}