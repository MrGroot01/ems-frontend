import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Register.css';

const DEPTS = ['Engineering','HR','Finance','Marketing','Operations','Design','Sales'];

const strength = (p) => {
  let s = 0;
  if (p.length >= 8)         s++;
  if (/[A-Z]/.test(p))       s++;
  if (/[0-9]/.test(p))       s++;
  if (/[!@#$%^&*]/.test(p))  s++;
  return s;
};
const STRENGTH_LABEL = ['','Weak','Fair','Good','Strong'];

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast,   setToast]   = useState('');
  const [gErr,    setGErr]    = useState('');
  const [errs,    setErrs]    = useState({});
  const [showP,   setShowP]   = useState(false);
  const [showC,   setShowC]   = useState(false);
  const [photo,   setPhoto]   = useState(null);
  const [form,    setForm]    = useState({
    full_name:'', employee_id:'', email:'', phone:'',
    department:'', role:'employee', password:'', confirm_password:'', profile_image: null,
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
    if (!form.full_name.trim())   e.full_name    = 'Required';
    if (!form.employee_id.trim()) e.employee_id  = 'Required';
    if (!form.email.trim())       e.email        = 'Required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim())       e.phone        = 'Required';
    if (!form.department)         e.department   = 'Select dept';
    if (!form.password)           e.password     = 'Required';
    else if (sc < 3)              e.password     = 'Password too weak';
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match';
    return e;
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrs(v); return; }
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => { if(v) fd.append(k,v); });
    try {
      await authAPI.register(fd);
      setToast('✅ Account created! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      const data = err.response?.data || {};
      const e2 = {};
      Object.entries(data).forEach(([k,v]) => { e2[k] = Array.isArray(v) ? v[0] : v; });
      setErrs(e2);
      setGErr('Registration failed — please fix the errors above.');
    } finally { setLoading(false); }
  };

  return (
    <div className="reg-page">
      <div className="reg-bg" />
      {toast && <div className="toast">{toast}</div>}

      <div className="reg-card">
        <div className="reg-head">
          <div className="reg-icon">🏢</div>
          <h1>Create Your Account</h1>
          <p>Join EMS Pro and manage your work seamlessly</p>
        </div>

        {gErr && <div className="alert-box" style={{marginBottom:16}}>⚠ {gErr}</div>}

        <form onSubmit={submit}>
          <div className="reg-grid">

            {/* Photo */}
            <div className="field span2">
              <label>Profile Photo</label>
              <div className="photo-row">
                <div className="photo-circle">
                  {photo ? <img src={photo} alt="preview"/> : '👤'}
                </div>
                <label className="photo-btn">
                  📷 Upload Photo
                  <input type="file" name="profile_image" accept="image/*" hidden onChange={change}/>
                </label>
              </div>
            </div>

            {/* Full Name */}
            <div className="field">
              <label>Full Name</label>
              <div className="field-wrap">
                <span className="field-ico">👤</span>
                <input type="text" name="full_name" value={form.full_name}
                  onChange={change} placeholder="John Doe"
                  className={errs.full_name ? 'is-error':''} />
              </div>
              {errs.full_name && <p className="field-err">{errs.full_name}</p>}
            </div>

            {/* Employee ID */}
            <div className="field">
              <label>Employee ID</label>
              <div className="field-wrap">
                <span className="field-ico">🪪</span>
                <input type="text" name="employee_id" value={form.employee_id}
                  onChange={change} placeholder="EMP001"
                  className={errs.employee_id ? 'is-error':''} />
              </div>
              {errs.employee_id && <p className="field-err">{errs.employee_id}</p>}
            </div>

            {/* Email */}
            <div className="field">
              <label>Email Address</label>
              <div className="field-wrap">
                <span className="field-ico">✉️</span>
                <input type="email" name="email" value={form.email}
                  onChange={change} placeholder="you@company.com"
                  className={errs.email ? 'is-error':''} />
              </div>
              {errs.email && <p className="field-err">{errs.email}</p>}
            </div>

            {/* Phone */}
            <div className="field">
              <label>Phone Number</label>
              <div className="field-wrap">
                <span className="field-ico">📱</span>
                <input type="tel" name="phone" value={form.phone}
                  onChange={change} placeholder="+1 234 567 8900"
                  className={errs.phone ? 'is-error':''} />
              </div>
              {errs.phone && <p className="field-err">{errs.phone}</p>}
            </div>

            {/* Department */}
            <div className="field">
              <label>Department</label>
              <div className="field-wrap">
                <span className="field-ico">🏬</span>
                <select name="department" value={form.department} onChange={change}
                  className={errs.department ? 'is-error':''}>
                  <option value="">Select department…</option>
                  {DEPTS.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
              {errs.department && <p className="field-err">{errs.department}</p>}
            </div>

            {/* Role */}
            <div className="field">
              <label>Role</label>
              <div className="field-wrap">
                <span className="field-ico">🛡️</span>
                <select name="role" value={form.role} onChange={change}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="field">
              <label>Password</label>
              <div className="field-wrap">
                <span className="field-ico">🔒</span>
                <input type={showP?'text':'password'} name="password" value={form.password}
                  onChange={change} placeholder="Min. 8 chars"
                  className={errs.password ? 'is-error':''} />
                <button type="button" className="eye-btn" onClick={() => setShowP(p=>!p)}>
                  {showP ? '🙈':'👁️'}
                </button>
              </div>
              {form.password && (
                <>
                  <div className="pwd-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`pwd-bar ${sc >= i ? `s${sc}` : ''}`} />
                    ))}
                  </div>
                  <p className="pwd-hint">{STRENGTH_LABEL[sc]}</p>
                </>
              )}
              {errs.password && <p className="field-err">{errs.password}</p>}
            </div>

            {/* Confirm */}
            <div className="field">
              <label>Confirm Password</label>
              <div className="field-wrap">
                <span className="field-ico">🔑</span>
                <input type={showC?'text':'password'} name="confirm_password" value={form.confirm_password}
                  onChange={change} placeholder="Repeat password"
                  className={errs.confirm_password ? 'is-error':''} />
                <button type="button" className="eye-btn" onClick={() => setShowC(p=>!p)}>
                  {showC ? '🙈':'👁️'}
                </button>
              </div>
              {errs.confirm_password && <p className="field-err">{errs.confirm_password}</p>}
            </div>

          </div>

          <button type="submit" className="btn-reg" disabled={loading}>
            {loading ? <><div className="spin"/> Creating account…</> : '🚀 Create Account'}
          </button>
          <p className="alt-link">Already have an account? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
