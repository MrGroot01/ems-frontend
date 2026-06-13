import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import Captcha from '../../components/Captcha/Captcha';
import './Register.css';

const DEPTS = ['Engineering','HR','Finance','Marketing','Operations','Design','Sales'];

const strength = (p) => {
  let s = 0;
  if (p.length >= 8)        s++;
  if (/[A-Z]/.test(p))      s++;
  if (/[0-9]/.test(p))      s++;
  if (/[!@#$%^&*]/.test(p)) s++;
  return s;
};
const STRENGTH_LABEL = ['','Weak','Fair','Good','Strong'];
const STRENGTH_COLOR = ['','#ef4444','#f59e0b','#10b981','#6366f1'];

// ── SVG icon set ────────────────────────────────────────────
const Icon = {
  user: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  badge: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <circle cx="9" cy="13" r="2"/>
      <path d="M15 11h3M15 15h3"/>
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.36 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.34 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  building: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

export default function Register() {
  const navigate = useNavigate();
  const [loading,         setLoading]         = useState(false);
  const [toast,           setToast]           = useState('');
  const [gErr,            setGErr]            = useState('');
  const [errs,            setErrs]            = useState({});
  const [showP,           setShowP]           = useState(false);
  const [showC,           setShowC]           = useState(false);
  const [photo,           setPhoto]           = useState(null);
  const [focused,         setFocused]         = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [form,            setForm]            = useState({
    full_name: '', employee_id: '', email: '', phone: '',
    department: '', role: 'employee',
    password: '', confirm_password: '', profile_image: null,
  });

  const sc = strength(form.password);

  const change = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_image' && files[0]) {
      setForm(p => ({ ...p, profile_image: files[0] }));
      setPhoto(URL.createObjectURL(files[0]));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
    setErrs(p => ({ ...p, [name]: '' }));
    setGErr('');
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim())   e.full_name   = 'Required';
    if (!form.employee_id.trim()) e.employee_id = 'Required';
    if (!form.email.trim())       e.email       = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim())       e.phone       = 'Required';
    if (!form.department)         e.department  = 'Select dept';
    if (!form.password)           e.password    = 'Required';
    else if (sc < 3)              e.password    = 'Password too weak';
    if (form.password !== form.confirm_password)
      e.confirm_password = 'Passwords do not match';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    if (!captchaVerified) {
      setGErr('Please verify the captcha first');
      return;
    }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    try {
      await authAPI.register(fd);
      setToast('✅ Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      const data = err.response?.data || {};
      const e2 = {};
      Object.entries(data).forEach(([k, v]) => {
        e2[k] = Array.isArray(v) ? v[0] : v;
      });
      setErrs(e2);
      setGErr('Registration failed — please fix the errors above.');
    } finally { setLoading(false); }
  };

  // ── Field component ─────────────────────────────────────
  const Field = ({ name, label, icon, type='text', placeholder, eye, eyeShow, onEyeClick, error }) => (
    <div className={`rg-field ${focused === name ? 'focused' : ''} ${error ? 'errored' : ''}`}>
      <label>{label}</label>
      <div className="rg-input-wrap">
        <span className="rg-input-icon">{icon}</span>
        <input
          type={eye ? (eyeShow ? 'text' : 'password') : type}
          name={name} value={form[name]} onChange={change}
          placeholder={placeholder}
          onFocus={() => setFocused(name)}
          onBlur={() => setFocused('')}
        />
        {eye && (
          <button type="button" className="rg-eye" tabIndex={-1} onClick={onEyeClick}>
            {eyeShow ? Icon.eyeOff : Icon.eye}
          </button>
        )}
      </div>
      {error && <p className="rg-field-err">⚠ {error}</p>}
    </div>
  );

  return (
    <div className="rg-page">
      <div className="rg-mesh" />
      {toast && <div className="rg-toast">{toast}</div>}

      <div className="rg-card">
        <div className="rg-head">
          <div className="rg-icon">🏢</div>
          <h1>Create Your Account</h1>
          <p>Join EMS Pro and manage your work seamlessly</p>
        </div>

        {gErr && <div className="rg-alert">⚠ {gErr}</div>}

        <form onSubmit={submit} noValidate>
          <div className="rg-grid">

            {/* Photo */}
            <div className="rg-field span2">
              <label>Profile Photo</label>
              <div className="rg-photo-row">
                <div className="rg-photo-circle">
                  {photo ? <img src={photo} alt="preview"/> : <span>{Icon.user}</span>}
                </div>
                <label className="rg-photo-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Upload Photo
                  <input type="file" name="profile_image"
                    accept="image/*" hidden onChange={change}/>
                </label>
              </div>
            </div>

            {/* Full Name */}
            <Field name="full_name" label="Full Name" icon={Icon.user}
              placeholder="John Doe" error={errs.full_name}/>

            {/* Employee ID */}
            <Field name="employee_id" label="Employee ID" icon={Icon.badge}
              placeholder="EMP001" error={errs.employee_id}/>

            {/* Email */}
            <Field name="email" label="Email Address" icon={Icon.mail}
              type="email" placeholder="you@company.com" error={errs.email}/>

            {/* Phone */}
            <Field name="phone" label="Phone Number" icon={Icon.phone}
              type="tel" placeholder="+1 234 567 8900" error={errs.phone}/>

            {/* Department */}
            <div className={`rg-field ${focused === 'department' ? 'focused' : ''} ${errs.department ? 'errored' : ''}`}>
              <label>Department</label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">{Icon.building}</span>
                <select name="department" value={form.department}
                  onChange={change}
                  onFocus={() => setFocused('department')}
                  onBlur={() => setFocused('')}>
                  <option value="">Select department…</option>
                  {DEPTS.map(d =>
                    <option key={d} value={d.toLowerCase()}>{d}</option>
                  )}
                </select>
                <span className="rg-select-arrow">▾</span>
              </div>
              {errs.department && <p className="rg-field-err">⚠ {errs.department}</p>}
            </div>

            {/* Role */}
            <div className={`rg-field ${focused === 'role' ? 'focused' : ''}`}>
              <label>Role</label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">{Icon.shield}</span>
                <select name="role" value={form.role} onChange={change}
                  onFocus={() => setFocused('role')}
                  onBlur={() => setFocused('')}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
                <span className="rg-select-arrow">▾</span>
              </div>
            </div>

            {/* Password */}
            <div className={`rg-field ${focused === 'password' ? 'focused' : ''} ${errs.password ? 'errored' : ''}`}>
              <label>Password</label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">{Icon.lock}</span>
                <input type={showP ? 'text' : 'password'} name="password"
                  value={form.password} onChange={change}
                  placeholder="Min. 8 characters"
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}/>
                <button type="button" className="rg-eye" tabIndex={-1}
                  onClick={() => setShowP(p=>!p)}>
                  {showP ? Icon.eyeOff : Icon.eye}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="rg-pwd-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="rg-pwd-bar"
                        style={{ background: sc >= i ? STRENGTH_COLOR[sc] : 'rgba(255,255,255,.1)' }}/>
                    ))}
                  </div>
                  <p className="rg-pwd-hint" style={{ color: STRENGTH_COLOR[sc] }}>
                    {STRENGTH_LABEL[sc]}
                  </p>
                </>
              )}
              {errs.password && <p className="rg-field-err">⚠ {errs.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className={`rg-field ${focused === 'confirm_password' ? 'focused' : ''} ${errs.confirm_password ? 'errored' : ''}`}>
              <label>Confirm Password</label>
              <div className="rg-input-wrap">
                <span className="rg-input-icon">{Icon.key}</span>
                <input type={showC ? 'text' : 'password'} name="confirm_password"
                  value={form.confirm_password} onChange={change}
                  placeholder="Repeat password"
                  onFocus={() => setFocused('confirm_password')}
                  onBlur={() => setFocused('')}/>
                <button type="button" className="rg-eye" tabIndex={-1}
                  onClick={() => setShowC(p=>!p)}>
                  {showC ? Icon.eyeOff : Icon.eye}
                </button>
              </div>
              {form.confirm_password && form.password !== form.confirm_password && (
                <p className="rg-field-err">⚠ Passwords do not match</p>
              )}
              {errs.confirm_password &&
                <p className="rg-field-err">⚠ {errs.confirm_password}</p>}
            </div>

          </div>

          {/* Captcha */}
          <div className="rg-captcha-wrap">
            <Captcha onVerify={(valid) => setCaptchaVerified(valid)} />
          </div>

          <button type="submit" className="rg-submit"
            disabled={loading || !captchaVerified}>
            {loading
              ? <><div className="rg-spin"/> Creating account…</>
              : <>🚀 Create Account</>}
          </button>

          <p className="rg-alt-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}