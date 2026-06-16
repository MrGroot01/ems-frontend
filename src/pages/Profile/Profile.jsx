import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { authAPI, attendanceAPI, leavesAPI, tasksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [showEdit,      setShowEdit]      = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [photoPreview,  setPhotoPreview]  = useState(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [stats, setStats] = useState({
    present: 0, leaveTaken: 0, tasksCompleted: 0, avgHours: '—',
  });
  const [form, setForm] = useState({
    full_name:     user?.full_name  || '',
    phone:         user?.phone      || '',
    department:    user?.department || '',
    profile_image: null,
  });

  const initials = user?.full_name
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // ── Fetch real activity stats ─────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const [attRes, leaveRes, taskRes] = await Promise.allSettled([
          attendanceAPI.getMine(),
          leavesAPI.getMine(),
          tasksAPI.getMine(),
        ]);

        // Present days
        let present = 0;
        if (attRes.status === 'fulfilled') {
          const data = Array.isArray(attRes.value.data)
            ? attRes.value.data
            : (attRes.value.data.results || []);
          present = data.filter(r => r.status === 'present').length;

          // Avg working hours from present days that have working_hours
          const hoursArr = data
            .filter(r => r.working_hours && parseFloat(r.working_hours) > 0)
            .map(r => parseFloat(r.working_hours));
          const avg = hoursArr.length
            ? (hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length).toFixed(1)
            : '—';

          setStats(p => ({ ...p, present, avgHours: avg === '—' ? '—' : `${avg}h` }));
        }

        // Leave taken (approved leaves)
        if (leaveRes.status === 'fulfilled') {
          const data = Array.isArray(leaveRes.value.data)
            ? leaveRes.value.data
            : (leaveRes.value.data.results || []);
          const leaveTaken = data
            .filter(l => l.status === 'approved')
            .reduce((sum, l) => sum + (l.days || l.number_of_days || 0), 0);
          setStats(p => ({ ...p, leaveTaken }));
        }

        // Tasks completed
        if (taskRes.status === 'fulfilled') {
          const data = Array.isArray(taskRes.value.data)
            ? taskRes.value.data
            : (taskRes.value.data.results || []);
          const tasksCompleted = data.filter(t => t.status === 'completed').length;
          setStats(p => ({ ...p, tasksCompleted }));
        }
      } catch (err) {
        console.error('Profile stats error:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(p => ({ ...p, profile_image: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('full_name',  form.full_name);
      fd.append('phone',      form.phone);
      fd.append('department', form.department);
      if (form.profile_image) fd.append('profile_image', form.profile_image);
      const res = await authAPI.updateProfile(fd);
      if (updateUser) updateUser(res.data);
      setShowEdit(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Profile update error:', e);
    } finally { setSaving(false); }
  };

  const avatarSrc = photoPreview || user?.profile_image || null;

  const INFO_FIELDS = [
    { icon:'✉️', label:'Email',       value: user?.email || '—' },
    { icon:'🪪', label:'Employee ID', value: user?.employee_id || '—' },
    { icon:'📱', label:'Phone',       value: user?.phone || '—' },
    { icon:'🏬', label:'Department',  value: user?.department || '—' },
    { icon:'🛡️', label:'Role',        value: user?.role
        ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
    { icon:'📅', label:'Joined',      value: user?.date_joined
        ? new Date(user.date_joined).toLocaleDateString('en-US',
            { year:'numeric', month:'long', day:'numeric' })
        : '—' },
  ];

  const ACTIVITY = [
    { icon:'📅', label:'Days Present',   val: stats.present,        color:'#34d399' },
    { icon:'🏖️', label:'Leave Taken',    val: stats.leaveTaken,     color:'#fbbf24' },
    { icon:'✅', label:'Tasks Completed',val: stats.tasksCompleted, color:'#818cf8' },
    { icon:'⏰', label:'Avg Working Hrs', val: stats.avgHours,       color:'#60a5fa' },
  ];

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="My Profile" onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">

          {saved && (
            <div style={{background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12,padding:'12px 18px',color:'#34d399',fontSize:13,fontWeight:700,
              marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              ✅ Profile updated successfully!
            </div>
          )}

          {/* ── Profile header ── */}
          <div className="profile-header">
            <div className="profile-big-av">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar"/>
                : initials}
            </div>
            <div className="profile-header-info">
              <div className="profile-big-name">{user?.full_name || '—'}</div>
              <div className="profile-big-role">
                {user?.department || '—'} —{' '}
                <span style={{
                  background:'rgba(99,102,241,.2)',color:'#a5b4fc',
                  padding:'2px 10px',borderRadius:99,fontSize:11,fontWeight:700,
                }}>
                  {user?.role || 'employee'}
                </span>
              </div>
              <div className="profile-big-id">ID: {user?.employee_id || '—'}</div>
              <button className="profile-edit-btn" onClick={() => setShowEdit(true)}>
                ✏️ Edit Profile
              </button>
            </div>
          </div>

          {/* ── Personal info grid ── */}
          <div className="section-card" style={{marginBottom:20}}>
            <div className="section-card-head"><h3>📋 Personal Information</h3></div>
            <div className="profile-info-grid">
              {INFO_FIELDS.map(f => (
                <div key={f.label} className="profile-info-item">
                  <div className="profile-info-label">{f.icon} {f.label}</div>
                  <div className="profile-info-value">{f.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity Overview — LIVE DATA ── */}
          <div className="section-card">
            <div className="section-card-head">
              <h3>📊 Activity Overview</h3>
              {statsLoading && (
                <span style={{fontSize:12,color:'rgba(255,255,255,.3)',
                  display:'flex',alignItems:'center',gap:6}}>
                  <div className="spin" style={{width:12,height:12,borderWidth:1.5}}/>
                  Loading...
                </span>
              )}
            </div>
            <div style={{display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:14}}>
              {ACTIVITY.map(s => (
                <div key={s.label} style={{
                  background:'rgba(255,255,255,.04)',
                  border:'1px solid rgba(255,255,255,.07)',
                  borderRadius:14, padding:18, textAlign:'center',
                  transition:'border-color .2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(99,102,241,.25)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='rgba(255,255,255,.07)'}
                >
                  <div style={{fontSize:26,marginBottom:8}}>{s.icon}</div>
                  {statsLoading ? (
                    <div className="skeleton" style={{
                      height:32,width:60,margin:'0 auto 8px',borderRadius:8,
                    }}/>
                  ) : (
                    <div style={{
                      fontSize:28,fontWeight:800,color:s.color,
                      letterSpacing:'-.5px',lineHeight:1,marginBottom:6,
                    }}>
                      {s.val}
                    </div>
                  )}
                  <div style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)}
        title="✏️ Edit Profile"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowEdit(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '💾 Save Changes'}
          </button>
        </>}>

        {/* Photo upload */}
        <div className="field" style={{marginBottom:20}}>
          <label>Profile Photo</label>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:64,height:64,borderRadius:'50%',
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:24,fontWeight:800,color:'#fff',
              overflow:'hidden',flexShrink:0}}>
              {avatarSrc
                ? <img src={avatarSrc} alt="av"
                    style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : initials}
            </div>
            <label style={{padding:'10px 18px',
              background:'rgba(99,102,241,.12)',
              border:'1px solid rgba(99,102,241,.3)',
              borderRadius:10,cursor:'pointer',
              color:'#818cf8',fontSize:13,fontWeight:700}}>
              📷 Change Photo
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange}/>
            </label>
          </div>
        </div>

        <div className="field" style={{marginBottom:14}}>
          <label>Full Name</label>
          <input type="text" value={form.full_name}
            onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            placeholder="Your full name"/>
        </div>

        <div className="two-col">
          <div className="field">
            <label>Phone</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+91 98765 43210"/>
          </div>
          <div className="field">
            <label>Department</label>
            <select value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
              <option value="">Select…</option>
              {['engineering','hr','finance','marketing','operations','design','sales'].map(d => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Read-only info */}
        <div style={{
          marginTop:16,padding:'12px 16px',
          background:'rgba(255,255,255,.03)',
          border:'1px solid rgba(255,255,255,.06)',
          borderRadius:10,fontSize:12,
          color:'rgba(255,255,255,.35)',lineHeight:1.8,
        }}>
          <div>✉️ Email: <strong style={{color:'rgba(255,255,255,.5)'}}>{user?.email}</strong></div>
          <div>🪪 Employee ID: <strong style={{color:'rgba(255,255,255,.5)'}}>{user?.employee_id}</strong></div>
          <div style={{marginTop:4,fontSize:11,color:'rgba(255,255,255,.2)'}}>
            Email and Employee ID cannot be changed. Contact admin if needed.
          </div>
        </div>
      </Modal>
    </div>
  );
}