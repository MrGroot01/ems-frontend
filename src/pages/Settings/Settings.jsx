import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Settings.css';

const NAV_ITEMS = [
  { icon: '👤', label: 'Profile'       },
  { icon: '🔒', label: 'Security'      },
  { icon: '🎨', label: 'Appearance'    },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🏢', label: 'Company'       },
];

const ACCENT_COLORS = [
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Cyan',   hex: '#06b6d4' },
  { name: 'Green',  hex: '#10b981' },
  { name: 'Amber',  hex: '#f59e0b' },
  { name: 'Rose',   hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
];

const Toggle = ({ checked, onChange }) => (
  <label className="toggle-sw">
    <input type="checkbox" checked={!!checked} onChange={onChange} />
    <span className="toggle-sw-track" />
  </label>
);

export default function Settings() {
  const { isDark, toggleTheme }  = useTheme();
  const { user, updateUser }     = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeNav,  setActiveNav]  = useState('Appearance');
  const [saving,     setSaving]     = useState(false);
  const [savedMsg,   setSavedMsg]   = useState('');
  const [accentColor, setAccentColor] = useState(
    localStorage.getItem('accent_color') || '#6366f1'
  );

  // ── Profile form ──────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    full_name:  user?.full_name  || '',
    phone:      user?.phone      || '',
    department: user?.department || '',
  });
  const [profileErr, setProfileErr] = useState('');

  // ── Password form ─────────────────────────────────────────
  const [pwdForm, setPwdForm] = useState({
    old_password: '', new_password: '', confirm_password: ''
  });
  const [pwdErr, setPwdErr] = useState('');

  // ── Notification prefs ────────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notif_prefs') || '{}'); }
    catch { return {}; }
  });

  const togglePref = (key) => {
    const next = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(next);
    localStorage.setItem('notif_prefs', JSON.stringify(next));
  };

  const showSaved = (msg = '✅ Settings saved!') => {
    setSavedMsg(msg);
    setTimeout(() => setSavedMsg(''), 3500);
  };

  // ── Save profile ──────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim()) { setProfileErr('Full name is required'); return; }
    setSaving(true); setProfileErr('');
    try {
      const fd = new FormData();
      fd.append('full_name',  profileForm.full_name);
      fd.append('phone',      profileForm.phone);
      fd.append('department', profileForm.department);
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data);
      showSaved('✅ Profile updated successfully!');
    } catch (e) {
      setProfileErr(e.response?.data?.detail || 'Failed to update profile. Try again.');
    } finally { setSaving(false); }
  };

  // ── Change password ───────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwdForm.old_password)          { setPwdErr('Current password is required'); return; }
    if (pwdForm.new_password.length < 8){ setPwdErr('New password must be at least 8 characters'); return; }
    if (pwdForm.new_password !== pwdForm.confirm_password) { setPwdErr('Passwords do not match'); return; }
    setSaving(true); setPwdErr('');
    try {
      await authAPI.changePassword({
        old_password: pwdForm.old_password,
        new_password: pwdForm.new_password,
      });
      setPwdForm({ old_password: '', new_password: '', confirm_password: '' });
      showSaved('✅ Password changed successfully!');
    } catch (e) {
      setPwdErr(e.response?.data?.error || 'Current password is incorrect.');
    } finally { setSaving(false); }
  };

  // ── Set accent color ──────────────────────────────────────
  const handleAccentColor = (hex, name) => {
    setAccentColor(hex);
    localStorage.setItem('accent_color', hex);
    document.documentElement.style.setProperty('--accent', hex);
    showSaved(`✅ Accent color set to ${name}!`);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="Settings" subtitle="Configure your EMS"
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">

          {/* Success message */}
          {savedMsg && (
            <div className="settings-alert-ok">{savedMsg}</div>
          )}

          <div className="page-header" style={{ marginBottom: 28 }}>
            <div>
              <h1>⚙️ Settings</h1>
              <p>Manage your account and system preferences</p>
            </div>
          </div>

          <div className="settings-grid">

            {/* ── Left nav ── */}
            <div className="section-card" style={{ padding: 10 }}>
              <div className="settings-nav">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.label}
                    className={`settings-nav-item ${activeNav === item.label ? 'active' : ''}`}
                    onClick={() => setActiveNav(item.label)}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="settings-panel">

              {/* ══ PROFILE ══ */}
              {activeNav === 'Profile' && (
                <div className="section-card">
                  <div className="settings-section">
                    <h3>👤 Profile Information</h3>

                    {profileErr && <div className="settings-alert-err">⚠ {profileErr}</div>}

                    {/* Avatar + name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                      <div className="settings-avatar">{initials}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
                          {user?.full_name}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          ID: {user?.employee_id} · {user?.role}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {user?.email}
                        </div>
                      </div>
                    </div>

                    <div className="two-col">
                      <div className="field">
                        <label>Full Name</label>
                        <input type="text" value={profileForm.full_name}
                          placeholder="Your full name"
                          onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
                      </div>
                      <div className="field">
                        <label>Phone</label>
                        <input type="tel" value={profileForm.phone}
                          placeholder="+91 98765 43210"
                          onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="field">
                        <label>Department</label>
                        <input type="text" value={profileForm.department}
                          placeholder="Engineering"
                          onChange={e => setProfileForm(p => ({ ...p, department: e.target.value }))} />
                      </div>
                      <div className="field">
                        <label>Email (read-only)</label>
                        <input type="email" value={user?.email || ''} disabled
                          style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                      </div>
                    </div>

                    <button className="btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ marginTop: 8 }}>
                      {saving ? <><div className="spin" />Saving…</> : '💾 Save Profile'}
                    </button>
                  </div>
                </div>
              )}

              {/* ══ SECURITY ══ */}
              {activeNav === 'Security' && (
                <div className="section-card">
                  <div className="settings-section">
                    <h3>🔑 Change Password</h3>
                    {pwdErr && <div className="settings-alert-err">⚠ {pwdErr}</div>}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 440 }}>
                      {[
                        ['old_password',     'Current Password',  'Enter your current password'],
                        ['new_password',     'New Password',      'Minimum 8 characters'],
                        ['confirm_password', 'Confirm New Password', 'Repeat new password'],
                      ].map(([key, label, ph]) => (
                        <div key={key} className="field" style={{ margin: 0 }}>
                          <label>{label}</label>
                          <input type="password" placeholder={ph} value={pwdForm[key]}
                            onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      ))}
                      <button className="btn-primary" style={{ alignSelf: 'flex-start' }}
                        onClick={handleChangePassword} disabled={saving}>
                        {saving ? <><div className="spin" />Updating…</> : '🔐 Update Password'}
                      </button>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>🔒 Security Options</h3>
                    {[
                      ['Session Timeout', 'Auto-logout after 2 hours of inactivity', 'sessionTimeout'],
                      ['Login Alerts',    'Get email alert when account is logged in', 'loginAlerts'],
                    ].map(([label, sub, key]) => (
                      <div key={key} className="settings-row">
                        <div>
                          <div className="settings-row-label">{label}</div>
                          <div className="settings-row-sub">{sub}</div>
                        </div>
                        <Toggle checked={notifPrefs[key]} onChange={() => togglePref(key)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══ APPEARANCE ══ */}
              {activeNav === 'Appearance' && (
                <div className="section-card">
                  <div className="settings-section">
                    <h3>🎨 Theme</h3>
                    <div className="settings-row">
                      <div>
                        <div className="settings-row-label">Dark Mode</div>
                        <div className="settings-row-sub">Toggle between dark and light themes</div>
                      </div>
                      <Toggle checked={isDark} onChange={toggleTheme} />
                    </div>
                    <div className="settings-row">
                      <div>
                        <div className="settings-row-label">Smooth Animations</div>
                        <div className="settings-row-sub">Enable UI transitions and micro-animations</div>
                      </div>
                      <Toggle
                        checked={notifPrefs.animations !== false}
                        onChange={() => togglePref('animations')}
                      />
                    </div>
                    <div className="settings-row">
                      <div>
                        <div className="settings-row-label">Compact Sidebar</div>
                        <div className="settings-row-sub">Show icons only in navigation sidebar</div>
                      </div>
                      <Toggle
                        checked={!!notifPrefs.compactSidebar}
                        onChange={() => togglePref('compactSidebar')}
                      />
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>🎨 Accent Color</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                      Choose your preferred accent color for buttons and highlights
                    </p>
                    <div className="accent-grid">
                      {ACCENT_COLORS.map(c => (
                        <div key={c.name} className="accent-item" onClick={() => handleAccentColor(c.hex, c.name)}>
                          <div
                            className={`accent-circle ${accentColor === c.hex ? 'selected' : ''}`}
                            style={{
                              background: c.hex,
                              boxShadow: `0 0 20px ${c.hex}66`,
                            }}
                          />
                          <span className="accent-label">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══ NOTIFICATIONS ══ */}
              {activeNav === 'Notifications' && (
                <div className="section-card">
                  <div className="settings-section">
                    <h3>🔔 Notification Preferences</h3>
                    {[
                      ['Leave Updates',    'Get notified when your leave is approved or rejected', 'leaveNotif'],
                      ['Task Assignments', 'Get notified when a new task is assigned to you',      'taskNotif'],
                      ['Payslip Ready',    'Get notified when your monthly payslip is generated',  'payNotif'],
                      ['Announcements',    'Receive company-wide announcements from admin',        'announcNotif'],
                      ['Attendance Alert', 'Reminder if you have not checked in by 10 AM',        'attendNotif'],
                    ].map(([label, sub, key]) => (
                      <div key={key} className="settings-row">
                        <div>
                          <div className="settings-row-label">{label}</div>
                          <div className="settings-row-sub">{sub}</div>
                        </div>
                        <Toggle
                          checked={notifPrefs[key] !== false}
                          onChange={() => togglePref(key)}
                        />
                      </div>
                    ))}
                    <button className="btn-primary" onClick={() => showSaved('✅ Notification preferences saved!')}
                      style={{ marginTop: 16 }}>
                      💾 Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {/* ══ COMPANY ══ */}
              {activeNav === 'Company' && (
                <div className="section-card">
                  <div className="settings-section">
                    <h3>🏢 Company Information</h3>
                    <div className="two-col">
                      {[
                        ['Company Name', 'companyName',    'NexaCorp'],
                        ['HR Email',     'hrEmail',        'hr@nexacorp.com'],
                        ['Phone',        'companyPhone',   '+1 555 0100'],
                        ['Website',      'companyWebsite', 'https://nexacorp.com'],
                        ['Address',      'companyAddress', '123 Business St'],
                        ['Timezone',     'timezone',       'UTC+5:30'],
                      ].map(([label, key, def]) => (
                        <div key={key} className="field">
                          <label>{label}</label>
                          <input type="text"
                            defaultValue={localStorage.getItem(`company_${key}`) || def}
                            onChange={e => localStorage.setItem(`company_${key}`, e.target.value)} />
                        </div>
                      ))}
                    </div>
                    <button className="btn-primary" onClick={() => showSaved('✅ Company settings saved!')}
                      style={{ marginTop: 8 }}>
                      💾 Save Settings
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}