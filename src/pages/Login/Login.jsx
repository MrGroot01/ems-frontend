import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import Captcha from '../../components/Captcha/Captcha';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role,            setRole]            = useState('employee');
  const [showPwd,         setShowPwd]         = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [errs,            setErrs]            = useState({});
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [form,            setForm]            = useState({
    email: '', password: '', remember: false
  });

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    setErrs(p => ({ ...p, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    if (!captchaVerified) {
      setError('Please verify the captcha first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authAPI.login({
        email: form.email, password: form.password, role
      });
      login(res.data.user, res.data.tokens);
      navigate(role === 'admin' ? '/admin' : '/employee');
    } catch (err) {
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Login failed. Check credentials.'
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />

      {/* LEFT */}
      <div className="login-left">
        <div className="login-logo">
          <div className="login-logo-box">🏢</div>
          <div className="login-logo-text">EMS <span>Pro</span></div>
        </div>
        <h1 className="login-hero-title">
          Your HR,<br />
          <span className="hl">Reimagined.</span>
        </h1>
        <p className="login-hero-sub">
          A powerful, secure employee management platform built for modern teams.
          Manage attendance, leaves, payroll & more from one place.
        </p>
        <div className="login-badges">
          {['✅ JWT Secured','📊 Analytics','🌓 Dark Mode','📱 Responsive'].map(b => (
            <span key={b} className="badge">{b}</span>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-head">
            <h2>Welcome back 👋</h2>
            <p>Sign in to continue to your dashboard</p>
          </div>

          <div className="role-tabs">
            {[['employee','👤 Employee'],['admin','🛡️ Admin']].map(([val,label]) => (
              <button key={val} type="button"
                className={`role-tab ${role === val ? 'active' : ''}`}
                onClick={() => setRole(val)}>{label}</button>
            ))}
          </div>

          {error && <div className="alert-box">⚠ {error}</div>}

          <form onSubmit={submit}>
            <div className="field">
              <label>Email Address</label>
              <div className="field-wrap">
                <span className="field-ico">✉️</span>
                <input type="email" name="email" value={form.email}
                  onChange={change} placeholder="you@company.com"
                  className={errs.email ? 'is-error' : ''} />
              </div>
              {errs.email && <p className="field-err">{errs.email}</p>}
            </div>

            <div className="field">
              <label>Password</label>
              <div className="field-wrap">
                <span className="field-ico">🔒</span>
                <input type={showPwd ? 'text' : 'password'} name="password"
                  value={form.password} onChange={change}
                  placeholder="Enter password"
                  className={errs.password ? 'is-error' : ''} />
                <button type="button" className="eye-btn"
                  onClick={() => setShowPwd(p => !p)}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {errs.password && <p className="field-err">{errs.password}</p>}
            </div>

            <div className="check-row">
              <label className="chk-label">
                <input type="checkbox" name="remember"
                  checked={form.remember} onChange={change} />
                Remember me
              </label>
              <Link to="/forgot-password" className="link-sm">
                Forgot password?
              </Link>
            </div>

            {/* ── CAPTCHA ── */}
            <Captcha onVerify={(valid) => setCaptchaVerified(valid)} />

            <button type="submit" className="btn-submit"
              disabled={loading || !captchaVerified}
              style={{ opacity: captchaVerified ? 1 : 0.6 }}>
              {loading
                ? <><div className="spin"/>&nbsp;Signing in…</>
                : 'Sign In →'}
            </button>
          </form>

          <p className="alt-link">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}