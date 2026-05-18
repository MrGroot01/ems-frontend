import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import '../Attendance/Attendance.css';

const NOTIF_ICONS = {
  info:'ℹ️', success:'✅', warning:'⚠️', leave:'🏖️',
  task:'✅', payroll:'💰', announcement:'📢'
};
const NOTIF_TYPES = ['announcement','leave','task','payroll','info','warning'];

export default function Notifications() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifs,     setNotifs]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('all');
  const [showSend,   setShowSend]   = useState(false);
  const [sending,    setSending]    = useState(false);
  const [sendErr,    setSendErr]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ type:'announcement', title:'', message:'' });

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res  = await notificationsAPI.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setNotifs(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try { await notificationsAPI.markRead(id); fetchNotifs(); } catch {}
  };

  const handleMarkAllRead = async () => {
    try { await notificationsAPI.markAllRead(); fetchNotifs(); } catch {}
  };

  const handleBroadcast = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setSendErr('Title and message are required'); return;
    }
    setSending(true); setSendErr('');
    try {
      const res = await notificationsAPI.broadcast(form);
      setShowSend(false);
      setForm({ type:'announcement', title:'', message:'' });
      setSuccessMsg(`✅ ${res.data.message}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setSendErr(e.response?.data?.error || 'Failed to send announcement');
    } finally { setSending(false); }
  };

  const unread   = notifs.filter(n => !n.is_read).length;
  const filtered = filter === 'all'    ? notifs
                 : filter === 'unread' ? notifs.filter(n => !n.is_read)
                 : notifs.filter(n => n.type === filter);

  const timeAgo = (dt) => {
    if (!dt) return '';
    const diff = Math.floor((Date.now() - new Date(dt)) / 1000);
    if (diff < 60)    return `${diff}s ago`;
    if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div className="dash-layout">
      <Sidebar unreadNotifs={unread} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Notifications" unreadNotifs={unread} onMenuClick={() => setMobileOpen(true)} />
        <div className="dash-content">

          {successMsg && (
            <div style={{background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12,padding:'12px 18px',color:'#34d399',fontSize:14,fontWeight:600,marginBottom:20}}>
              {successMsg}
            </div>
          )}

          <div className="page-header">
            <div>
              <h1>🔔 Notifications</h1>
              <p>{unread} unread · {notifs.length} total</p>
            </div>
            <div style={{display:'flex',gap:10}}>
              {unread > 0 && (
                <button className="qa-btn" onClick={handleMarkAllRead}>✅ Mark all read</button>
              )}
              {isAdmin() && (
                <button className="qa-btn primary" onClick={() => { setForm({type:'announcement',title:'',message:''}); setSendErr(''); setShowSend(true); }}>
                  📢 Broadcast
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="leave-tabs" style={{marginBottom:20}}>
            {['all','unread',...NOTIF_TYPES].map(t => (
              <button key={t} className={`leave-tab ${filter===t?'active':''}`} onClick={() => setFilter(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='unread' && unread>0 && (
                  <span style={{marginLeft:6,background:'#ef4444',color:'#fff',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20}}>{unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notification list */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:80,borderRadius:14}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><div className="empty-ico">🔕</div><p>No notifications</p></div>
          ) : (
            filtered.map(n => (
              <div key={n.id}
                className={`notif-page-item ${!n.is_read?'unread':''}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                style={{cursor: !n.is_read ? 'pointer' : 'default'}}>
                <span className="notif-page-ico">{NOTIF_ICONS[n.type]||'🔔'}</span>
                <div className="notif-page-body">
                  <div className="notif-page-title">{n.title}</div>
                  <div className="notif-page-msg">{n.message}</div>
                  <div style={{display:'flex',gap:10,marginTop:6,alignItems:'center'}}>
                    <span className="notif-page-time">{timeAgo(n.created_at)}</span>
                    {n.sender_name && <span style={{fontSize:11,color:'rgba(255,255,255,.25)'}}>from {n.sender_name}</span>}
                    <span className="pill pill-gray" style={{fontSize:10}}>{n.type}</span>
                  </div>
                </div>
                {!n.is_read && <div className="notif-page-unread-dot"/>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* BROADCAST MODAL */}
      <Modal open={showSend} onClose={() => setShowSend(false)} title="📢 Send Announcement"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowSend(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleBroadcast} disabled={sending}>
            {sending ? <><div className="spin"/>Sending…</> : '📤 Send to All'}
          </button>
        </>}>
        {sendErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:14}}>⚠ {sendErr}</div>}
        <div className="field">
          <label>Type</label>
          <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
            {NOTIF_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Title *</label>
          <input type="text" placeholder="Announcement title" value={form.title}
            onChange={e=>setForm(p=>({...p,title:e.target.value}))}/>
        </div>
        <div className="field">
          <label>Message *</label>
          <textarea placeholder="Write your announcement…" style={{minHeight:120}} value={form.message}
            onChange={e=>setForm(p=>({...p,message:e.target.value}))}/>
        </div>
      </Modal>
    </div>
  );
}
