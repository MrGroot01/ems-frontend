import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { leavesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './LeaveRequests.css';

const LEAVE_TYPES = ['sick','casual','annual','unpaid'];
const TYPE_ICONS  = {sick:'🤒',casual:'😎',annual:'🌴',unpaid:'📋'};

export default function LeaveRequests() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [leaves,     setLeaves]     = useState([]);
  const [tab,        setTab]        = useState('pending');
  const [loading,    setLoading]    = useState(true);
  const [showApply,  setShowApply]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');
  const [rejectId,   setRejectId]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
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
    } catch (e) {
      console.error('Fetch leaves error', e);
    } finally { setLoading(false); }
  };

  const validateApply = () => {
    const errs = {};
    if (!form.start_date) errs.start_date = 'Start date required';
    if (!form.end_date)   errs.end_date   = 'End date required';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
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
      setSuccessMsg('✅ Leave application submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchLeaves();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(typeof data === 'object'
        ? Object.values(data).flat().join(' | ')
        : 'Failed to submit leave. Please try again.');
    } finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try {
      await leavesAPI.updateStatus(id, { status: 'approved' });
      setSuccessMsg('✅ Leave approved!');
      setTimeout(() => setSuccessMsg(''), 2000);
      fetchLeaves();
    } catch (e) { alert('Approve failed'); }
  };

  const handleReject = async () => {
    try {
      await leavesAPI.updateStatus(rejectId, { status: 'rejected', reason: rejectReason });
      setRejectId(null); setRejectReason('');
      fetchLeaves();
    } catch (e) { alert('Reject failed'); }
  };

  const filtered = tab === 'all' ? leaves : leaves.filter(l => l.status === tab);
  const pending  = leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="dash-layout">
      <Sidebar pendingLeaves={pending} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Leave Requests"
          subtitle={isAdmin() ? 'Manage employee leaves' : 'Your leave history'}
          onMenuClick={() => setMobileOpen(true)} />
        <div className="dash-content">

          {successMsg && (
            <div style={{background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12,padding:'12px 18px',color:'#34d399',fontSize:14,fontWeight:600,marginBottom:20}}>
              {successMsg}
            </div>
          )}

          <div className="page-header">
            <div>
              <h1>🏖️ {isAdmin() ? 'Leave Management' : 'My Leaves'}</h1>
              <p>{filtered.length} records</p>
            </div>
            {!isAdmin() && (
              <button className="qa-btn primary" onClick={() => {
                setForm({leave_type:'sick',start_date:'',end_date:'',reason:''});
                setFormErrors({}); setSaveErr(''); setShowApply(true);
              }}>➕ Apply Leave</button>
            )}
          </div>

          {/* TABS */}
          <div className="leave-tabs">
            {['pending','approved','rejected','all'].map(t => (
              <button key={t} className={`leave-tab ${tab===t?'active':''}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
                {t==='pending' && pending > 0 && (
                  <span style={{marginLeft:6,background:'#ef4444',color:'#fff',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:20}}>{pending}</span>
                )}
              </button>
            ))}
          </div>

          {/* LEAVE LIST */}
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:100,borderRadius:16}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-ico">🏖️</div>
              <p>No {tab === 'all' ? '' : tab} leave requests</p>
            </div>
          ) : (
            <div className="leave-cards">
              {filtered.map(l => (
                <div key={l.id} className={`leave-card ${l.status}`}>
                  <div className="leave-card-icon">{TYPE_ICONS[l.leave_type]||'📋'}</div>
                  <div className="leave-card-body">
                    <div className="leave-card-name">
                      {isAdmin() ? (l.user_name||'—') : `${l.leave_type.charAt(0).toUpperCase()+l.leave_type.slice(1)} Leave`}
                    </div>
                    <div className="leave-card-meta">
                      <span>📅 {l.start_date} → {l.end_date}</span>
                      <span>⏱ {l.days} day{l.days!==1?'s':''}</span>
                      <span className={`pill ${l.status==='approved'?'pill-green':l.status==='rejected'?'pill-red':l.status==='pending'?'pill-amber':'pill-gray'}`}>
                        {l.status}
                      </span>
                    </div>
                    <div className="leave-card-reason">"{l.reason}"</div>
                    {l.status==='rejected' && l.reject_reason &&
                      <div style={{fontSize:12,color:'#f87171',marginTop:6}}>❌ Reason: {l.reject_reason}</div>}
                    {l.approved_by_name && l.status !== 'pending' &&
                      <div style={{fontSize:11,color:'rgba(255,255,255,.3)',marginTop:4}}>By: {l.approved_by_name}</div>}
                  </div>
                  {isAdmin() && l.status === 'pending' && (
                    <div className="leave-card-actions">
                      <button className="btn-approve" onClick={() => handleApprove(l.id)}>✅ Approve</button>
                      <button className="btn-reject"  onClick={() => { setRejectId(l.id); setRejectReason(''); }}>❌ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* APPLY LEAVE MODAL */}
      <Modal open={showApply} onClose={() => setShowApply(false)} title="🏖️ Apply for Leave"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowApply(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleApply} disabled={saving}>
            {saving ? <><div className="spin"/>Submitting…</> : '📤 Submit'}
          </button>
        </>}>
        {saveErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:14}}>⚠ {saveErr}</div>}
        <div className="two-col">
          <div className="field">
            <label>Leave Type</label>
            <select value={form.leave_type} onChange={e=>setForm(p=>({...p,leave_type:e.target.value}))}>
              {LEAVE_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Start Date *</label>
            <input type="date" value={form.start_date}
              onChange={e=>setForm(p=>({...p,start_date:e.target.value}))}
              style={{borderColor:formErrors.start_date?'rgba(239,68,68,.6)':''}}/>
            {formErrors.start_date && <p className="field-err">{formErrors.start_date}</p>}
          </div>
          <div className="field">
            <label>End Date *</label>
            <input type="date" value={form.end_date}
              onChange={e=>setForm(p=>({...p,end_date:e.target.value}))}
              style={{borderColor:formErrors.end_date?'rgba(239,68,68,.6)':''}}/>
            {formErrors.end_date && <p className="field-err">{formErrors.end_date}</p>}
          </div>
        </div>
        <div className="field">
          <label>Reason *</label>
          <textarea placeholder="Briefly explain your reason…" value={form.reason}
            onChange={e=>setForm(p=>({...p,reason:e.target.value}))}
            style={{borderColor:formErrors.reason?'rgba(239,68,68,.6)':''}}/>
          {formErrors.reason && <p className="field-err">{formErrors.reason}</p>}
        </div>
      </Modal>

      {/* REJECT MODAL */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="❌ Reject Leave" width="420px"
        footer={<>
          <button className="btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleReject}>Confirm Reject</button>
        </>}>
        <div className="field">
          <label>Rejection Reason (optional)</label>
          <textarea placeholder="Reason for rejection…" value={rejectReason}
            onChange={e=>setRejectReason(e.target.value)}/>
        </div>
      </Modal>
    </div>
  );
}
