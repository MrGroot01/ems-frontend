/**
 * Settings.jsx
 * src/pages/Settings/Settings.jsx
 * Professional settings page — real-time applying changes
 */

import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Settings.css';

// ── Accent colours ─────────────────────────────────────────
const ACCENTS = [
  { name:'Indigo', hex:'#6366f1', rgb:'99,102,241'   },
  { name:'Blue',   hex:'#3b82f6', rgb:'59,130,246'   },
  { name:'Cyan',   hex:'#06b6d4', rgb:'6,182,212'    },
  { name:'Green',  hex:'#10b981', rgb:'16,185,129'   },
  { name:'Amber',  hex:'#f59e0b', rgb:'245,158,11'   },
  { name:'Rose',   hex:'#f43f5e', rgb:'244,63,94'    },
  { name:'Purple', hex:'#a855f7', rgb:'168,85,247'   },
  { name:'Pink',   hex:'#ec4899', rgb:'236,72,153'   },
];

const FONT_SIZES = [
  { label:'Small',  value:'13px'  },
  { label:'Medium', value:'14px'  },
  { label:'Large',  value:'15px'  },
];

// ── Helpers ────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled = false }) => (
  <button
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`st-toggle ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
  >
    <span className="st-toggle-thumb" />
  </button>
);

const Field = ({ label, hint, children }) => (
  <div className="st-field">
    <div className="st-field-label">
      <span>{label}</span>
      {hint && <span className="st-field-hint">{hint}</span>}
    </div>
    <div className="st-field-input">{children}</div>
  </div>
);

const Section = ({ title, desc, children, danger = false }) => (
  <div className={`st-section ${danger ? 'st-section-danger' : ''}`}>
    <div className="st-section-head">
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
    </div>
    <div className="st-section-body">{children}</div>
  </div>
);

const SaveBtn = ({ saving, label = 'Save changes', onClick }) => (
  <button className="st-save-btn" onClick={onClick} disabled={saving}>
    {saving ? <><span className="st-spin" />Saving…</> : label}
  </button>
);

// ── Main component ─────────────────────────────────────────
export default function Settings() {
  const { isDark, toggleTheme }  = useTheme();
  const { user, updateUser }     = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav,  setActiveNav]  = useState('Profile');
  const [toast,      setToast]      = useState(null);  // { msg, type }
  const toastTimer = useRef(null);

  // ── Accent colour — apply immediately ──────────────────
  const [accent, setAccent] = useState(() =>
    ACCENTS.find(a => a.hex === localStorage.getItem('accent_color')) || ACCENTS[0]
  );

  // ── Font size ──────────────────────────────────────────
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem('font_size') || '14px'
  );

  // ── Border radius ──────────────────────────────────────
  const [rounded, setRounded] = useState(
    () => localStorage.getItem('rounded') !== 'false'
  );

  // ── Apply accent on mount ──────────────────────────────
  useEffect(() => {
    applyAccent(accent);
    applyFontSize(fontSize);
    applyRounded(rounded);
  }, []);

  const applyAccent = (a) => {
    document.documentElement.style.setProperty('--accent',       a.hex);
    document.documentElement.style.setProperty('--accent-rgb',   a.rgb);
    document.documentElement.style.setProperty('--accent-glow',  `rgba(${a.rgb},0.18)`);
    document.documentElement.style.setProperty('--accent-dim',   `rgba(${a.rgb},0.08)`);
    document.documentElement.style.setProperty('--border-glow',  `rgba(${a.rgb},0.3)`);
    localStorage.setItem('accent_color', a.hex);
  };

  const applyFontSize = (size) => {
    document.documentElement.style.setProperty('--base-font-size', size);
    localStorage.setItem('font_size', size);
  };

  const applyRounded = (val) => {
    document.documentElement.style.setProperty('--radius-lg', val ? '16px' : '8px');
    document.documentElement.style.setProperty('--radius-md', val ? '10px' : '6px');
    document.documentElement.style.setProperty('--radius-sm', val ? '6px'  : '4px');
    localStorage.setItem('rounded', val);
  };

  const handleAccent = (a) => {
    setAccent(a);
    applyAccent(a);
    showToast(`✅ Accent changed to ${a.name}`, 'success');
  };

  const handleFontSize = (size) => {
    setFontSize(size);
    applyFontSize(size);
    showToast('✅ Font size updated', 'success');
  };

  const handleRounded = (val) => {
    setRounded(val);
    applyRounded(val);
  };

  // ── Toast ──────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Profile ────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name:  user?.full_name  || '',
    phone:      user?.phone      || '',
    department: user?.department || '',
  });
  const [profileImg, setProfileImg] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const fileRef = useRef();

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) { showToast('Full name is required', 'error'); return; }
    setProfileSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name',  profileForm.full_name);
      fd.append('phone',      profileForm.phone);
      fd.append('department', profileForm.department);
      if (profileImg) fd.append('profile_image', profileImg);
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data);
      showToast('✅ Profile updated successfully!', 'success');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Failed to update profile', 'error');
    } finally { setProfileSaving(false); }
  };

  // ── Password ───────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({ old_password:'', new_password:'', confirm_password:'' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showPwd, setShowPwd] = useState({ old:false, new:false, confirm:false });

  const pwdStrength = (p) => {
    let s = 0;
    if (p.length >= 8)        s++;
    if (/[A-Z]/.test(p))      s++;
    if (/[0-9]/.test(p))      s++;
    if (/[!@#$%^&*]/.test(p)) s++;
    return s;
  };
  const strength = pwdStrength(pwdForm.new_password);
  const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  const handleChangePassword = async () => {
    if (!pwdForm.old_password)          { showToast('Current password is required', 'error'); return; }
    if (pwdForm.new_password.length < 8){ showToast('Password must be at least 8 characters', 'error'); return; }
    if (pwdForm.new_password !== pwdForm.confirm_password) { showToast('Passwords do not match', 'error'); return; }
    setPwdSaving(true);
    try {
      await authAPI.changePassword({ old_password: pwdForm.old_password, new_password: pwdForm.new_password });
      setPwdForm({ old_password:'', new_password:'', confirm_password:'' });
      showToast('✅ Password changed successfully!', 'success');
    } catch (e) {
      showToast(e.response?.data?.error || 'Current password is incorrect', 'error');
    } finally { setPwdSaving(false); }
  };

  // ── Notification prefs ─────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_prefs') || '{}'); }
    catch { return {}; }
  });
  const togglePref = (key) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    localStorage.setItem('notif_prefs', JSON.stringify(next));
  };

  // ── Company ────────────────────────────────────────────
  const [company, setCompany] = useState(() => ({
    name:     localStorage.getItem('company_name')    || '',
    hrEmail:  localStorage.getItem('company_hrEmail') || '',
    phone:    localStorage.getItem('company_phone')   || '',
    website:  localStorage.getItem('company_website') || '',
    address:  localStorage.getItem('company_address') || '',
    timezone: localStorage.getItem('company_timezone')|| 'Asia/Kolkata',
    industry: localStorage.getItem('company_industry')|| '',
  }));

  const handleSaveCompany = () => {
    Object.entries(company).forEach(([k, v]) =>
      localStorage.setItem(`company_${k}`, v)
    );
    showToast('✅ Company settings saved!', 'success');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  const NAV = [
    { icon:'👤', label:'Profile'       },
    { icon:'🔒', label:'Security'      },
    { icon:'🎨', label:'Appearance'    },
    { icon:'🔔', label:'Notifications' },
    { icon:'🏢', label:'Company'       },
  ];

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="Settings" subtitle="Account & system preferences"
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content st-page">

          {/* ── Toast ────────────────────────────────── */}
          {toast && (
            <div className={`st-toast ${toast.type}`}>
              {toast.msg}
            </div>
          )}

          <div className="st-layout">

            {/* ── Left Nav ─────────────────────────── */}
            <aside className="st-nav-card">
              <div className="st-nav-user">
                <div className="st-nav-avatar">
                  {user?.profile_image
                    ? <img src={user.profile_image} alt="av"/>
                    : initials}
                </div>
                <div>
                  <div className="st-nav-name">{user?.full_name}</div>
                  <div className="st-nav-role">
                    {user?.role === 'admin' ? '🛡️ Admin' : '👤 Employee'}
                  </div>
                </div>
              </div>

              <nav className="st-nav-list">
                {NAV.map(item => (
                  <button key={item.label}
                    className={`st-nav-item ${activeNav === item.label ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.label)}>
                    <span className="st-nav-ico">{item.icon}</span>
                    <span>{item.label}</span>
                    {activeNav === item.label && <span className="st-nav-arrow">›</span>}
                  </button>
                ))}
              </nav>
            </aside>

            {/* ── Right Panel ──────────────────────── */}
            <div className="st-panel">

              {/* ══════════════════════════════════════
                  PROFILE
              ══════════════════════════════════════ */}
              {activeNav === 'Profile' && (
                <>
                  <div className="st-panel-header">
                    <h2>Profile</h2>
                    <p>Manage your personal information and photo</p>
                  </div>

                  {/* Photo section */}
                  <Section title="Profile Photo" desc="This will be shown on your profile and dashboard">
                    <div className="st-photo-row">
                      <div className="st-photo-avatar">
                        {profileImg
                          ? <img src={URL.createObjectURL(profileImg)} alt="preview"/>
                          : user?.profile_image
                            ? <img src={user.profile_image} alt="av"/>
                            : <span>{initials}</span>}
                      </div>
                      <div className="st-photo-actions">
                        <button className="st-outline-btn"
                          onClick={() => fileRef.current.click()}>
                          📷 Upload Photo
                        </button>
                        <input ref={fileRef} type="file" accept="image/*" hidden
                          onChange={e => setProfileImg(e.target.files[0])}/>
                        <p className="st-muted">JPG, PNG up to 2MB</p>
                      </div>
                    </div>
                  </Section>

                  {/* Personal info */}
                  <Section title="Personal Information" desc="Update your name, phone, and department">
                    <div className="st-form-grid">
                      <Field label="Full Name">
                        <input type="text" value={profileForm.full_name}
                          placeholder="John Doe"
                          onChange={e=>setProfileForm(p=>({...p,full_name:e.target.value}))}/>
                      </Field>
                      <Field label="Phone Number">
                        <input type="tel" value={profileForm.phone}
                          placeholder="+91 98765 43210"
                          onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))}/>
                      </Field>
                      <Field label="Department">
                        <input type="text" value={profileForm.department}
                          placeholder="Engineering"
                          onChange={e=>setProfileForm(p=>({...p,department:e.target.value}))}/>
                      </Field>
                      <Field label="Email Address" hint="Cannot be changed">
                        <input type="email" value={user?.email||''} disabled
                          style={{opacity:0.5,cursor:'not-allowed'}}/>
                      </Field>
                      <Field label="Employee ID" hint="Read only">
                        <input type="text" value={user?.employee_id||''} disabled
                          style={{opacity:0.5,cursor:'not-allowed'}}/>
                      </Field>
                      <Field label="Role" hint="Assigned by admin">
                        <input type="text"
                          value={user?.role === 'admin' ? 'Administrator' : 'Employee'}
                          disabled style={{opacity:0.5,cursor:'not-allowed'}}/>
                      </Field>
                    </div>
                    <div className="st-section-footer">
                      <SaveBtn saving={profileSaving} label="💾 Save Profile"
                        onClick={handleSaveProfile}/>
                    </div>
                  </Section>
                </>
              )}

              {/* ══════════════════════════════════════
                  SECURITY
              ══════════════════════════════════════ */}
              {activeNav === 'Security' && (
                <>
                  <div className="st-panel-header">
                    <h2>Security</h2>
                    <p>Manage your password and account security settings</p>
                  </div>

                  <Section title="Change Password"
                    desc="Use a strong password that you don't use elsewhere">
                    <div className="st-form-grid st-form-single">

                      <Field label="Current Password">
                        <div className="st-pwd-wrap">
                          <input type={showPwd.old ? 'text' : 'password'}
                            value={pwdForm.old_password} placeholder="Enter current password"
                            onChange={e=>setPwdForm(p=>({...p,old_password:e.target.value}))}/>
                          <button className="st-eye" tabIndex={-1}
                            onClick={()=>setShowPwd(p=>({...p,old:!p.old}))}>
                            {showPwd.old ? '🙈' : '👁️'}
                          </button>
                        </div>
                      </Field>

                      <Field label="New Password">
                        <div className="st-pwd-wrap">
                          <input type={showPwd.new ? 'text' : 'password'}
                            value={pwdForm.new_password} placeholder="Minimum 8 characters"
                            onChange={e=>setPwdForm(p=>({...p,new_password:e.target.value}))}/>
                          <button className="st-eye" tabIndex={-1}
                            onClick={()=>setShowPwd(p=>({...p,new:!p.new}))}>
                            {showPwd.new ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {pwdForm.new_password && (
                          <div className="st-strength">
                            <div className="st-strength-bars">
                              {[1,2,3,4].map(i => (
                                <div key={i} className="st-strength-bar"
                                  style={{background: strength >= i ? STRENGTH_COLOR[strength] : 'rgba(255,255,255,.1)'}}/>
                              ))}
                            </div>
                            <span style={{fontSize:11,color:STRENGTH_COLOR[strength]}}>
                              {STRENGTH_LABEL[strength]}
                            </span>
                          </div>
                        )}
                      </Field>

                      <Field label="Confirm New Password">
                        <div className="st-pwd-wrap">
                          <input type={showPwd.confirm ? 'text' : 'password'}
                            value={pwdForm.confirm_password} placeholder="Repeat new password"
                            onChange={e=>setPwdForm(p=>({...p,confirm_password:e.target.value}))}/>
                          <button className="st-eye" tabIndex={-1}
                            onClick={()=>setShowPwd(p=>({...p,confirm:!p.confirm}))}>
                            {showPwd.confirm ? '🙈' : '👁️'}
                          </button>
                        </div>
                        {pwdForm.confirm_password && pwdForm.new_password !== pwdForm.confirm_password && (
                          <p style={{fontSize:11,color:'#f87171',marginTop:4}}>Passwords do not match</p>
                        )}
                      </Field>
                    </div>
                    <div className="st-section-footer">
                      <SaveBtn saving={pwdSaving} label="🔐 Update Password"
                        onClick={handleChangePassword}/>
                    </div>
                  </Section>

                  <Section title="Security Options">
                    {[
                      { key:'sessionTimeout', label:'Auto Session Timeout',
                        desc:'Automatically log out after 2 hours of inactivity' },
                      { key:'loginAlerts',    label:'Login Notifications',
                        desc:'Receive email alerts when your account signs in from a new device' },
                      { key:'twoFactor',      label:'Two-Factor Authentication',
                        desc:'Add an extra layer of security (coming soon)', disabled:true },
                    ].map(item => (
                      <div key={item.key} className="st-row">
                        <div className="st-row-info">
                          <div className="st-row-label">{item.label}</div>
                          <div className="st-row-desc">{item.desc}</div>
                        </div>
                        <Toggle
                          checked={!!notifPrefs[item.key]}
                          onChange={() => togglePref(item.key)}
                          disabled={item.disabled}
                        />
                      </div>
                    ))}
                  </Section>
                </>
              )}

              {/* ══════════════════════════════════════
                  APPEARANCE
              ══════════════════════════════════════ */}
              {activeNav === 'Appearance' && (
                <>
                  <div className="st-panel-header">
                    <h2>Appearance</h2>
                    <p>Customize how EMS Pro looks and feels — changes apply instantly</p>
                  </div>

                  {/* Theme */}
                  <Section title="Theme" desc="Choose your preferred colour scheme">
                    <div className="st-theme-row">
                      {[
                        { label:'Light', icon:'☀️', val:false },
                        { label:'Dark',  icon:'🌙', val:true  },
                        { label:'System',icon:'💻', val:null  },
                      ].map(opt => (
                        <button key={opt.label}
                          className={`st-theme-card ${(opt.val === null ? false : isDark) === (opt.val === null ? false : opt.val) && opt.val !== null ? 'active' : ''}`}
                          onClick={() => opt.val !== null && opt.val !== isDark && toggleTheme()}>
                          <span style={{fontSize:28}}>{opt.icon}</span>
                          <span className="st-theme-label">{opt.label}</span>
                          {opt.val !== null && (isDark === opt.val) && (
                            <span className="st-theme-check">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Accent colour */}
                  <Section title="Accent Color"
                    desc="Applied to buttons, links, highlights and active states throughout the app">
                    <div className="st-accent-grid">
                      {ACCENTS.map(a => (
                        <button key={a.name} className="st-accent-item"
                          onClick={() => handleAccent(a)}
                          title={a.name}>
                          <div className="st-accent-swatch"
                            style={{
                              background: a.hex,
                              boxShadow: accent.hex === a.hex ? `0 0 0 3px rgba(${a.rgb},.5)` : 'none',
                              outline: accent.hex === a.hex ? `2px solid ${a.hex}` : '2px solid transparent',
                              outlineOffset: '2px',
                            }}/>
                          <span className="st-accent-name"
                            style={{color: accent.hex === a.hex ? a.hex : undefined}}>
                            {a.name}
                          </span>
                          {accent.hex === a.hex && (
                            <span className="st-accent-check"
                              style={{background:a.hex}}>✓</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Live preview */}
                    <div className="st-accent-preview"
                      style={{borderColor:`rgba(${accent.rgb},.25)`,
                        background:`rgba(${accent.rgb},.06)`}}>
                      <span style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>Preview:</span>
                      <button style={{background:accent.hex,border:'none',borderRadius:8,
                        padding:'6px 16px',color:'#fff',fontSize:12,fontWeight:600,
                        cursor:'pointer',boxShadow:`0 4px 14px rgba(${accent.rgb},.4)`}}>
                        Sample Button
                      </button>
                      <span style={{color:accent.hex,fontSize:13,fontWeight:600}}>
                        Active Link
                      </span>
                      <div style={{width:60,height:6,borderRadius:3,
                        background:`rgba(${accent.rgb},.2)`}}>
                        <div style={{width:'60%',height:'100%',borderRadius:3,
                          background:accent.hex}}/>
                      </div>
                    </div>
                  </Section>

                  {/* Font size */}
                  <Section title="Font Size" desc="Adjust the base text size across the app">
                    <div className="st-font-row">
                      {FONT_SIZES.map(f => (
                        <button key={f.value}
                          className={`st-font-card ${fontSize === f.value ? 'active' : ''}`}
                          onClick={() => handleFontSize(f.value)}
                          style={fontSize === f.value ? {
                            borderColor:accent.hex,
                            background:`rgba(${accent.rgb},.1)`,
                            color:accent.hex,
                          } : {}}>
                          <span style={{fontSize:f.value}}>Aa</span>
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </Section>

                  {/* Layout options */}
                  <Section title="Layout & Motion">
                    {[
                      { key:'rounded',    label:'Rounded Corners',     desc:'Use rounded corners on cards and buttons' },
                      { key:'animations', label:'Smooth Animations',   desc:'Enable transitions and micro-animations'  },
                      { key:'compactSidebar', label:'Compact Sidebar', desc:'Collapse sidebar to icon-only mode'       },
                    ].map(item => (
                      <div key={item.key} className="st-row">
                        <div className="st-row-info">
                          <div className="st-row-label">{item.label}</div>
                          <div className="st-row-desc">{item.desc}</div>
                        </div>
                        <Toggle
                          checked={item.key === 'rounded' ? rounded : notifPrefs[item.key] !== false}
                          onChange={() => {
                            if (item.key === 'rounded') { const n = !rounded; setRounded(n); applyRounded(n); }
                            else togglePref(item.key);
                          }}
                        />
                      </div>
                    ))}
                  </Section>
                </>
              )}

              {/* ══════════════════════════════════════
                  NOTIFICATIONS
              ══════════════════════════════════════ */}
              {activeNav === 'Notifications' && (
                <>
                  <div className="st-panel-header">
                    <h2>Notifications</h2>
                    <p>Choose what you want to be notified about</p>
                  </div>

                  <Section title="In-App Notifications"
                    desc="These appear in the notification bell in the top bar">
                    {[
                      { key:'leaveNotif',  label:'Leave Request Updates', desc:'When your leave is approved, rejected, or pending review' },
                      { key:'taskNotif',   label:'Task Assignments',       desc:'When a new task is assigned or updated' },
                      { key:'payNotif',    label:'Payslip Generated',      desc:'When your monthly payslip is ready to view' },
                      { key:'announcNotif',label:'Company Announcements',  desc:'Company-wide messages from HR or admin' },
                      { key:'attendNotif', label:'Attendance Reminders',   desc:'Morning reminder if you have not checked in by 10 AM' },
                      { key:'meetingNotif',label:'Meeting Invites',        desc:'Auto-scheduled meetings from the task warning system' },
                    ].map(item => (
                      <div key={item.key} className="st-row">
                        <div className="st-row-info">
                          <div className="st-row-label">{item.label}</div>
                          <div className="st-row-desc">{item.desc}</div>
                        </div>
                        <Toggle
                          checked={notifPrefs[item.key] !== false}
                          onChange={() => togglePref(item.key)}/>
                      </div>
                    ))}
                  </Section>

                  <Section title="Email Notifications"
                    desc="Sent to your registered email address">
                    {[
                      { key:'emailLeave',  label:'Leave Status Email',  desc:'Email when leave is approved or rejected' },
                      { key:'emailPayslip',label:'Payslip Email',       desc:'Email with payslip summary each month'    },
                      { key:'emailTask',   label:'Task Deadline Email', desc:'Reminder 24h before task deadline'        },
                    ].map(item => (
                      <div key={item.key} className="st-row">
                        <div className="st-row-info">
                          <div className="st-row-label">{item.label}</div>
                          <div className="st-row-desc">{item.desc}</div>
                        </div>
                        <Toggle
                          checked={notifPrefs[item.key] !== false}
                          onChange={() => togglePref(item.key)}/>
                      </div>
                    ))}
                  </Section>

                  <div className="st-section-footer" style={{marginTop:8}}>
                    <SaveBtn label="💾 Save Preferences"
                      onClick={() => {
                        localStorage.setItem('notif_prefs', JSON.stringify(notifPrefs));
                        showToast('✅ Notification preferences saved!', 'success');
                      }}/>
                  </div>
                </>
              )}

              {/* ══════════════════════════════════════
                  COMPANY
              ══════════════════════════════════════ */}
              {activeNav === 'Company' && (
                <>
                  <div className="st-panel-header">
                    <h2>Company</h2>
                    <p>Configure your company information and branding</p>
                  </div>

                  <Section title="Company Details"
                    desc="This information appears on payslips and official documents">
                    <div className="st-form-grid">
                      <Field label="Company Name">
                        <input type="text" value={company.name}
                          placeholder="NexaCorp Pvt. Ltd."
                          onChange={e=>setCompany(p=>({...p,name:e.target.value}))}/>
                      </Field>
                      <Field label="Industry">
                        <select value={company.industry}
                          onChange={e=>setCompany(p=>({...p,industry:e.target.value}))}>
                          <option value="">Select industry</option>
                          {['Technology','Finance','Healthcare','Education','Manufacturing',
                            'Retail','Consulting','Real Estate','Other'].map(i =>
                            <option key={i} value={i.toLowerCase()}>{i}</option>
                          )}
                        </select>
                      </Field>
                      <Field label="HR Email">
                        <input type="email" value={company.hrEmail}
                          placeholder="hr@company.com"
                          onChange={e=>setCompany(p=>({...p,hrEmail:e.target.value}))}/>
                      </Field>
                      <Field label="Phone">
                        <input type="tel" value={company.phone}
                          placeholder="+91 80 1234 5678"
                          onChange={e=>setCompany(p=>({...p,phone:e.target.value}))}/>
                      </Field>
                      <Field label="Website">
                        <input type="url" value={company.website}
                          placeholder="https://company.com"
                          onChange={e=>setCompany(p=>({...p,website:e.target.value}))}/>
                      </Field>
                      <Field label="Timezone">
                        <select value={company.timezone}
                          onChange={e=>setCompany(p=>({...p,timezone:e.target.value}))}>
                          {['Asia/Kolkata','Asia/Dubai','Europe/London','America/New_York',
                            'America/Los_Angeles','Australia/Sydney','Asia/Singapore'].map(tz =>
                            <option key={tz} value={tz}>{tz}</option>
                          )}
                        </select>
                      </Field>
                    </div>
                    <Field label="Office Address">
                      <textarea rows={2} value={company.address}
                        placeholder="123 Business Park, Bengaluru, Karnataka 560001"
                        onChange={e=>setCompany(p=>({...p,address:e.target.value}))}/>
                    </Field>
                    <div className="st-section-footer">
                      <SaveBtn label="💾 Save Company Info" onClick={handleSaveCompany}/>
                    </div>
                  </Section>

                  <Section title="Work Schedule"
                    desc="Define standard working hours for attendance tracking">
                    <div className="st-form-grid">
                      <Field label="Work Start Time">
                        <input type="time" defaultValue="09:00"
                          onChange={e=>localStorage.setItem('work_start', e.target.value)}/>
                      </Field>
                      <Field label="Work End Time">
                        <input type="time" defaultValue="18:00"
                          onChange={e=>localStorage.setItem('work_end', e.target.value)}/>
                      </Field>
                      <Field label="Late Mark After">
                        <input type="time" defaultValue="09:30"
                          onChange={e=>localStorage.setItem('late_after', e.target.value)}/>
                      </Field>
                      <Field label="Working Days">
                        <select defaultValue="mon-fri">
                          <option value="mon-fri">Monday – Friday</option>
                          <option value="mon-sat">Monday – Saturday</option>
                          <option value="mon-sun">All 7 Days</option>
                        </select>
                      </Field>
                    </div>
                    <div className="st-section-footer">
                      <SaveBtn label="💾 Save Schedule"
                        onClick={() => showToast('✅ Work schedule saved!', 'success')}/>
                    </div>
                  </Section>
                </>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}