import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { leavesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './LeaveRequests.css';

const LEAVE_TYPES = ['sick','casual','annual','unpaid'];
const TYPE_ICONS  = { sick:'🤒', casual:'😎', annual:'🌴', unpaid:'📋' };
const TYPE_COLORS = {
  sick:    { bg:'rgba(239,68,68,.12)',   border:'rgba(239,68,68,.25)',   color:'#f87171' },
  casual:  { bg:'rgba(99,102,241,.12)',  border:'rgba(99,102,241,.25)',  color:'#a5b4fc' },
  annual:  { bg:'rgba(16,185,129,.12)',  border:'rgba(16,185,129,.25)',  color:'#34d399' },
  unpaid:  { bg:'rgba(245,158,11,.12)',  border:'rgba(245,158,11,.25)',  color:'#fbbf24' },
};

// Days calculation helper
const calcDays = (start, end) => {
  if (!start || !end) return 0;
  const diff = (new Date(end) - new Date(start)) / 86400000;
  return Math.max(1, Math.floor(diff) + 1);
};

export default function LeaveRequests() {
  const { isAdmin } = useAuth();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [leaves,        setLeaves]        = useState([]);
  const [tab,           setTab]           = useState('pending');
  const [loading,       setLoading]       = useState(true);
  const [showApply,     setShowApply]     = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saveErr,       setSaveErr]       = useState('');
  const [rejectId,      setRejectId]      = useState(null);
  const [rejectReason,  setRejectReason]  = useState('');
  const [rejectSaving,  setRejectSaving]  = useState(false);
  const [successMsg,    setSuccessMsg]    = useState('');
  const [form, setForm] = useState({
    leave_type:'sick', start_date:'', end_date:'', reason:''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res  = await leavesAPI.getMine();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setLeaves(data);
    } catch (e) { console.error('Fetch leaves error', e); }
    finally { setLoading(false); }
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const validateApply = () => {
    const errs = {};
    if (!form.start_date) errs.start_date = 'Start date required';
    if (!form.end_date)   errs.end_date   = 'End date required';
    else if (form.start_date && form.end_date < form.start_date)
      errs.end_date = 'End date must be after start date';
    if (!form.reason.trim()) errs.reason = 'Reason required';
    return errs;
  };

  const handleApply = async () => {
    const errs = validateApply();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      await leavesAPI.apply(form);
      setShowApply(false);
      setForm({ leave_type:'sick', start_date:'', end_date:'', reason:'' });
      setFormErrors({});
      showToast('✅ Leave application submitted successfully!');
      fetchLeaves();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(
        typeof data === 'object'
          ? Object.values(data).flat().join(' | ')
          : 'Failed to submit leave. Please try again.'
      );
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await leavesAPI.updateStatus(id, { status: 'approved' });
      showToast('✅ Leave approved!');
      fetchLeaves();
    } catch (e) {
      showToast('❌ Approve failed. Try again.');
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setRejectSaving(true);
    try {
      await leavesAPI.updateStatus(rejectId, {
        status: 'rejected',
        reason: rejectReason.trim(),
      });
      setRejectId(null); setRejectReason('');
      showToast('✅ Leave rejected.');
      fetchLeaves();
    } catch (e) {
      showToast('❌ Reject failed. Try again.');
    } finally { setRejectSaving(false); }
  };

  const filtered = tab === 'all' ? leaves : leaves.filter(l => l.status === tab);
  const pending  = leaves.filter(l => l.status === 'pending').length;

  // Leave stats for admin
  const stats = isAdmin() ? {
    total:    leaves.length,
    pending:  leaves.filter(l => l.status === 'pending').length,
    approved: leaves.filter(l => l.status === 'approved').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
  } : null;

  // Days preview in apply form
  const previewDays = calcDays(form.start_date, form.end_date);

  return (
    <div className="dash-layout">
      <Sidebar pendingLeaves={pending} mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar
          title="Leave Requests"
          subtitle={isAdmin() ? 'Manage employee leaves' : 'Your leave history'}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="dash-content">

          {/* Toast */}
          {successMsg && (
            <div style={{
              background: successMsg.startsWith('❌')
                ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
              border: `1px solid ${successMsg.startsWith('❌')
                ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`,
              borderRadius:12, padding:'12px 18px',
              color: successMsg.startsWith('❌') ? '#f87171' : '#34d399',
              fontSize:14, fontWeight:600, marginBottom:20,
            }}>
              {successMsg}
            </div>
          )}

          {/* Admin stats row */}
          {isAdmin() && stats && (
            <div className="stats-grid" style={{marginBottom:24}}>
              {[
                {label:'Total',    value:stats.total,    color:'#818cf8', icon:'📋'},
                {label:'Pending',  value:stats.pending,  color:'#f59e0b', icon:'⏳'},
                {label:'Approved', value:stats.approved, color:'#10b981', icon:'✅'},
                {label:'Rejected', value:stats.rejected, color:'#f43f5e', icon:'❌'},
              ].map(s => (
                <div key={s.label} className="section-card"
                  style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontSize:22}}>{s.icon}</span>
                  <div>
                    <div style={{fontSize:24,fontWeight:800,color:s.color,lineHeight:1}}>
                      {s.value}
                    </div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Page header */}
          <div className="page-header">
            <div>
              <h1>🏖️ {isAdmin() ? 'Leave Management' : 'My Leaves'}</h1>
              <p>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
            </div>
            {!isAdmin() && (
              <button className="qa-btn primary" onClick={() => {
                setForm({leave_type:'sick',start_date:'',end_date:'',reason:''});
                setFormErrors({}); setSaveErr(''); setShowApply(true);
              }}>
                ➕ Apply Leave
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="leave-tabs">
            {['pending','approved','rejected','all'].map(t => (
              <button key={t}
                className={`leave-tab ${tab===t?'active':''}`}
                onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='pending' && pending > 0 && (
                  <span style={{marginLeft:6,background:'#ef4444',color:'#fff',
                    fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20}}>
                    {pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Leave list */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[1,2,3].map(i =>
                <div key={i} className="skeleton" style={{height:100,borderRadius:16}}/>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-ico">🏖️</div>
              <p>No {tab === 'all' ? '' : tab} leave requests</p>
            </div>
          ) : (
            <div className="leave-cards">
              {filtered.map(l => {
                const tc = TYPE_COLORS[l.leave_type] || TYPE_COLORS.unpaid;
                return (
                  <div key={l.id} className={`leave-card ${l.status}`}>
                    {/* Type icon */}
                    <div style={{
                      width:52, height:52, borderRadius:14, flexShrink:0,
                      background: tc.bg, border:`1px solid ${tc.border}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:24,
                    }}>
                      {TYPE_ICONS[l.leave_type]||'📋'}
                    </div>

                    {/* Body */}
                    <div className="leave-card-body">
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                        <div className="leave-card-name">
                          {isAdmin()
                            ? (l.user_name || l.user?.full_name || '—')
                            : `${l.leave_type.charAt(0).toUpperCase()+l.leave_type.slice(1)} Leave`}
                        </div>
                        <span className={`pill ${
                          l.status==='approved'?'pill-green':
                          l.status==='rejected'?'pill-red':
                          l.status==='pending' ?'pill-amber':'pill-gray'}`}>
                          {l.status}
                        </span>
                        <span style={{
                          fontSize:11,padding:'2px 8px',borderRadius:99,
                          background:tc.bg,border:`1px solid ${tc.border}`,
                          color:tc.color,fontWeight:600,
                        }}>
                          {l.leave_type}
                        </span>
                      </div>

                      <div className="leave-card-meta">
                        <span>📅 {l.start_date} → {l.end_date}</span>
                        <span>⏱ {l.days} day{l.days!==1?'s':''}</span>
                        {l.applied_on && (
                          <span>🕒 Applied {new Date(l.applied_on).toLocaleDateString()}</span>
                        )}
                      </div>

                      {l.reason && (
                        <div className="leave-card-reason">💬 "{l.reason}"</div>
                      )}

                      {l.status === 'rejected' && l.reject_reason && (
                        <div style={{fontSize:12,color:'#f87171',marginTop:6,
                          background:'rgba(239,68,68,.08)',padding:'6px 10px',
                          borderRadius:8,border:'1px solid rgba(239,68,68,.2)'}}>
                          ❌ Rejected: {l.reject_reason}
                        </div>
                      )}

                      {l.approved_by_name && l.status !== 'pending' && (
                        <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:4}}>
                          {l.status === 'approved' ? '✅' : '❌'} By: {l.approved_by_name}
                        </div>
                      )}
                    </div>

                    {/* Admin actions */}
                    {isAdmin() && l.status === 'pending' && (
                      <div className="leave-card-actions">
                        <button className="btn-approve"
                          onClick={() => handleApprove(l.id)}>
                          ✅ Approve
                        </button>
                        <button className="btn-reject"
                          onClick={() => { setRejectId(l.id); setRejectReason(''); }}>
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* APPLY LEAVE MODAL */}
      <Modal open={showApply} onClose={() => setShowApply(false)}
        title="🏖️ Apply for Leave"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowApply(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleApply} disabled={saving}>
            {saving ? <><div className="spin"/>Submitting…</> : '📤 Submit Application'}
          </button>
        </>}>

        {saveErr && (
          <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',
            borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:14}}>
            ⚠ {saveErr}
          </div>
        )}

        {/* Leave type selector */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:18}}>
          {LEAVE_TYPES.map(t => {
            const tc = TYPE_COLORS[t];
            return (
              <button key={t} type="button"
                onClick={() => setForm(p => ({ ...p, leave_type: t }))}
                style={{
                  padding:'10px 6px',borderRadius:10,border:'none',cursor:'pointer',
                  background: form.leave_type === t ? tc.bg : 'rgba(255,255,255,.04)',
                  border: `1px solid ${form.leave_type===t ? tc.border : 'rgba(255,255,255,.08)'}`,
                  color: form.leave_type === t ? tc.color : 'rgba(255,255,255,.35)',
                  fontFamily:'inherit',fontSize:12,fontWeight:600,
                  display:'flex',flexDirection:'column',alignItems:'center',gap:4,
                  transition:'all .2s',
                }}>
                <span style={{fontSize:20}}>{TYPE_ICONS[t]}</span>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            );
          })}
        </div>

        <div className="two-col">
          <div className="field">
            <label>Start Date *</label>
            <input type="date" value={form.start_date}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              style={{ borderColor: formErrors.start_date ? 'rgba(239,68,68,.6)' : '' }}/>
            {formErrors.start_date && <p className="field-err">{formErrors.start_date}</p>}
          </div>
          <div className="field">
            <label>End Date *</label>
            <input type="date" value={form.end_date}
              min={form.start_date || new Date().toISOString().split('T')[0]}
              onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
              style={{ borderColor: formErrors.end_date ? 'rgba(239,68,68,.6)' : '' }}/>
            {formErrors.end_date && <p className="field-err">{formErrors.end_date}</p>}
          </div>
        </div>

        {/* Days preview */}
        {form.start_date && form.end_date && previewDays > 0 && (
          <div style={{
            marginBottom:14,padding:'8px 14px',borderRadius:10,
            background:'rgba(99,102,241,.1)',border:'1px solid rgba(99,102,241,.2)',
            color:'#a5b4fc',fontSize:13,fontWeight:600,
            display:'flex',alignItems:'center',gap:6,
          }}>
            📅 Duration: <strong>{previewDays} day{previewDays!==1?'s':''}</strong>
          </div>
        )}

        <div className="field">
          <label>Reason *</label>
          <textarea
            placeholder="Briefly explain your reason for leave…"
            value={form.reason}
            rows={3}
            onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
            style={{ borderColor: formErrors.reason ? 'rgba(239,68,68,.6)' : '' }}/>
          {formErrors.reason && <p className="field-err">{formErrors.reason}</p>}
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)}
        title="❌ Reject Leave Request" width="440px"
        footer={<>
          <button className="btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleReject} disabled={rejectSaving}>
            {rejectSaving ? <><div className="spin"/>Rejecting…</> : 'Confirm Reject'}
          </button>
        </>}>
        <p style={{color:'rgba(255,255,255,.5)',fontSize:13,marginBottom:14,lineHeight:1.6}}>
          The employee will be notified with the rejection reason.
        </p>
        <div className="field">
          <label>Rejection Reason (optional)</label>
          <textarea
            placeholder="e.g. Insufficient leave balance, critical project deadline…"
            value={rejectReason}
            rows={3}
            onChange={e => setRejectReason(e.target.value)}/>
        </div>
      </Modal>
    </div>
  );
}