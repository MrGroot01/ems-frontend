import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { tasksAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Tasks.css';

const STATUSES   = ['todo','in_progress','completed'];
const STATUS_LABELS = { todo:'Pending', in_progress:'In Progress', completed:'Completed' };
const PRIORITIES = ['low','medium','high','urgent'];
const PRIORITY_PILL = { low:'pill-gray', medium:'pill-blue', high:'pill-amber', urgent:'pill-red' };

export default function Tasks() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tasks,      setTasks]      = useState([]);
  const [users,      setUsers]      = useState([]);   // all employee users for dropdown
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({
    title:'', description:'', assigned_to:'',
    priority:'medium', due_date:'', status:'todo'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchTasks();
    if (isAdmin()) fetchUsers();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res  = await tasksAPI.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTasks(data);
    } catch (e) {
      console.error('Fetch tasks error', e);
    } finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res  = await authAPI.getUsers();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setUsers(data);
    } catch (e) {
      console.error('Fetch users error', e);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim())    errs.title      = 'Title required';
    if (!form.assigned_to)     errs.assigned_to = 'Please select an employee';
    if (!form.due_date)        errs.due_date   = 'Due date required';
    return errs;
  };

  const handleCreate = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      await tasksAPI.create(form);
      setShowCreate(false);
      setForm({ title:'', description:'', assigned_to:'', priority:'medium', due_date:'', status:'todo' });
      setFormErrors({});
      setSuccessMsg('✅ Task assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchTasks();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(typeof data === 'object'
        ? Object.values(data).flat().join(' | ')
        : 'Failed to create task.');
    } finally { setSaving(false); }
  };

  const handleProgressUpdate = async (id, progress, newStatus) => {
    try {
      await tasksAPI.updateProgress(id, { progress, status: newStatus });
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); fetchTasks(); } catch (e) { alert('Delete failed'); }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  const colColors = { todo:'rgba(245,158,11,.15)', in_progress:'rgba(99,102,241,.12)', completed:'rgba(16,185,129,.12)' };
  const colBorder = { todo:'rgba(245,158,11,.25)',  in_progress:'rgba(99,102,241,.25)',  completed:'rgba(16,185,129,.25)'  };

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Tasks"
          subtitle={isAdmin() ? 'Assign & track tasks' : 'My assigned tasks'}
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
              <h1>✅ {isAdmin() ? 'All Tasks' : 'My Tasks'}</h1>
              <p>{tasks.length} total • {tasksByStatus('in_progress').length} in progress</p>
            </div>
            {isAdmin() && (
              <button className="qa-btn primary" onClick={() => {
                setForm({title:'',description:'',assigned_to:'',priority:'medium',due_date:'',status:'todo'});
                setFormErrors({}); setSaveErr(''); setShowCreate(true);
              }}>➕ Assign Task</button>
            )}
          </div>

          {loading ? (
            <div className="tasks-board">
              {STATUSES.map(s => <div key={s} className="skeleton" style={{height:250,borderRadius:14}}/>)}
            </div>
          ) : (
            <div className="tasks-board">
              {STATUSES.map(status => (
                <div key={status} className="section-card task-col" style={{background:colColors[status],borderColor:colBorder[status]}}>
                  <div className="task-col-head">
                    <span className="task-col-title">
                      {status==='todo'?'⏳':status==='in_progress'?'🔄':'✅'} {STATUS_LABELS[status]}
                    </span>
                    <span className="task-col-count">{tasksByStatus(status).length}</span>
                  </div>

                  {tasksByStatus(status).length === 0 ? (
                    <div style={{textAlign:'center',color:'rgba(255,255,255,.2)',fontSize:13,padding:'24px 0'}}>No tasks</div>
                  ) : (
                    tasksByStatus(status).map(t => (
                      <div key={t.id} className="task-card">
                        <div className="task-card-head">
                          <div className="task-card-title">{t.title}</div>
                          <span className={`pill ${PRIORITY_PILL[t.priority]||'pill-gray'}`}>{t.priority}</span>
                        </div>
                        {t.description && (
                          <div className="task-card-desc">{t.description.slice(0,80)}{t.description.length>80?'…':''}</div>
                        )}
                        <div className="task-card-meta">
                          <span className="pill pill-gray">📅 {t.due_date}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="task-prog-row" style={{marginBottom:8}}>
                          <div className="task-prog-bar">
                            <div className="task-prog-fill" style={{width:`${t.progress}%`}}/>
                          </div>
                          <span className="task-prog-val">{t.progress}%</span>
                        </div>

                        {/* Slider — employees only, not on completed */}
                        {!isAdmin() && t.status !== 'completed' && (
                          <input type="range" className="progress-slider" min={0} max={100} value={t.progress}
                            onChange={e => {
                              const v = Number(e.target.value);
                              const ns = v===100 ? 'completed' : v>0 ? 'in_progress' : 'todo';
                              handleProgressUpdate(t.id, v, ns);
                            }}/>
                        )}

                        <div className="task-card-footer">
                          <div className="task-assignee">
                            <span>👤</span>
                            <span style={{fontSize:12}}>
                              {isAdmin() ? t.assigned_to_name : t.assigned_by_name || '—'}
                            </span>
                          </div>
                          {isAdmin() && (
                            <button className="act-btn danger" onClick={() => handleDelete(t.id)}>🗑️</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE TASK MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="✅ Assign New Task"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '🚀 Assign Task'}
          </button>
        </>}>
        {saveErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:14}}>⚠ {saveErr}</div>}

        <div className="field">
          <label>Task Title *</label>
          <input type="text" placeholder="e.g. Fix login bug" value={form.title}
            onChange={e=>setForm(p=>({...p,title:e.target.value}))}
            style={{borderColor:formErrors.title?'rgba(239,68,68,.6)':''}}/>
          {formErrors.title && <p className="field-err">{formErrors.title}</p>}
        </div>

        <div className="field">
          <label>Description</label>
          <textarea placeholder="Task details…" value={form.description}
            onChange={e=>setForm(p=>({...p,description:e.target.value}))}/>
        </div>

        <div className="two-col">
          <div className="field">
            <label>Assign To *</label>
            <select value={form.assigned_to}
              onChange={e=>setForm(p=>({...p,assigned_to:e.target.value}))}
              style={{borderColor:formErrors.assigned_to?'rgba(239,68,68,.6)':''}}>
              <option value="">Select employee…</option>
              {users.length === 0
                ? <option disabled>No employees found – add one first</option>
                : users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>)
              }
            </select>
            {formErrors.assigned_to && <p className="field-err">{formErrors.assigned_to}</p>}
          </div>

          <div className="field">
            <label>Priority</label>
            <select value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}>
              {PRIORITIES.map(p=><option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>

          <div className="field">
            <label>Due Date *</label>
            <input type="date" value={form.due_date}
              onChange={e=>setForm(p=>({...p,due_date:e.target.value}))}
              style={{borderColor:formErrors.due_date?'rgba(239,68,68,.6)':''}}/>
            {formErrors.due_date && <p className="field-err">{formErrors.due_date}</p>}
          </div>

          <div className="field">
            <label>Initial Status</label>
            <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
              {STATUSES.map(s=><option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
