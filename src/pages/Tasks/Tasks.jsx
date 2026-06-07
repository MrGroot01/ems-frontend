import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { tasksAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Tasks.css';

const STATUSES      = ['todo','in_progress','completed'];
const STATUS_LABELS = { todo:'Pending', in_progress:'In Progress', completed:'Completed' };
const PRIORITIES    = ['low','medium','high','urgent'];
const PRIORITY_PILL = { low:'pill-gray', medium:'pill-blue', high:'pill-amber', urgent:'pill-red' };
const PRIORITY_ORDER = { urgent:4, high:3, medium:2, low:1 };

export default function Tasks() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tasks,      setTasks]      = useState([]);
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Sorting ────────────────────────────────────────────
  const [sortBy,    setSortBy]    = useState('created');  // created|priority|due_date|status
  const [sortOrder, setSortOrder] = useState('desc');     // asc|desc

  // ── Assign to ALL toggle ───────────────────────────────
  const [assignAll, setAssignAll] = useState(false);

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res  = await authAPI.getUsers();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setUsers(data);
    } catch (e) { console.error(e); }
  };

  // ── Sort tasks ────────────────────────────────────────
  const sortTasks = (list) => {
    return [...list].sort((a, b) => {
      let valA, valB;
      if (sortBy === 'priority') {
        valA = PRIORITY_ORDER[a.priority] || 0;
        valB = PRIORITY_ORDER[b.priority] || 0;
      } else if (sortBy === 'due_date') {
        valA = new Date(a.due_date);
        valB = new Date(b.due_date);
      } else if (sortBy === 'status') {
        valA = STATUSES.indexOf(a.status);
        valB = STATUSES.indexOf(b.status);
      } else {
        valA = new Date(a.created_at || 0);
        valB = new Date(b.created_at || 0);
      }
      return sortOrder === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  };

  const validateForm = () => {
    const errs = {};
    if (!form.title.trim()) errs.title    = 'Title required';
    if (!assignAll && !form.assigned_to)
      errs.assigned_to = 'Please select an employee or choose All';
    if (!form.due_date)     errs.due_date = 'Due date required';
    return errs;
  };

  // ── Create task(s) ────────────────────────────────────
  const handleCreate = async () => {
    const errs = validateForm();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');

    try {
      if (assignAll && users.length > 0) {
        // Assign to ALL employees simultaneously
        await Promise.all(
          users.map(u =>
            tasksAPI.create({ ...form, assigned_to: u.id })
          )
        );
        setSuccessMsg(`✅ Task assigned to all ${users.length} employees!`);
      } else {
        await tasksAPI.create(form);
        setSuccessMsg('✅ Task assigned successfully!');
      }

      setShowCreate(false);
      resetForm();
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchTasks();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(typeof data === 'object'
        ? Object.values(data).flat().join(' | ')
        : 'Failed to create task.');
    } finally { setSaving(false); }
  };

  const resetForm = () => {
    setForm({ title:'', description:'', assigned_to:'',
              priority:'medium', due_date:'', status:'todo' });
    setFormErrors({});
    setSaveErr('');
    setAssignAll(false);
  };

  const handleProgressUpdate = async (id, progress, newStatus) => {
    try {
      await tasksAPI.updateProgress(id, { progress, status: newStatus });
      fetchTasks();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try { await tasksAPI.delete(id); fetchTasks(); }
    catch { alert('Delete failed'); }
  };

  const tasksByStatus = (status) =>
    sortTasks(tasks.filter(t => t.status === status));

  const colColors = {
    todo:        'rgba(245,158,11,.15)',
    in_progress: 'rgba(99,102,241,.12)',
    completed:   'rgba(16,185,129,.12)',
  };
  const colBorder = {
    todo:        'rgba(245,158,11,.25)',
    in_progress: 'rgba(99,102,241,.25)',
    completed:   'rgba(16,185,129,.25)',
  };

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar
          title="Tasks"
          subtitle={isAdmin() ? 'Assign & track tasks' : 'My assigned tasks'}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="dash-content">

          {successMsg && (
            <div style={{
              background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12, padding:'12px 18px', color:'#34d399',
              fontSize:14, fontWeight:600, marginBottom:20
            }}>
              {successMsg}
            </div>
          )}

          {/* ── Header + Sort Controls ── */}
          <div className="page-header" style={{ flexWrap:'wrap', gap:12 }}>
            <div>
              <h1>✅ {isAdmin() ? 'All Tasks' : 'My Tasks'}</h1>
              <p>{tasks.length} total • {tasksByStatus('in_progress').length} in progress</p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>

              {/* Sort controls */}
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <label style={{ color:'#94a3b8', fontSize:13 }}>Sort:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    padding:'6px 10px', borderRadius:8,
                    background:'rgba(255,255,255,.05)',
                    border:'1px solid rgba(255,255,255,.1)',
                    color:'#e2e8f0', fontSize:13, cursor:'pointer',
                  }}
                >
                  <option value="created">📅 Date Created</option>
                  <option value="priority">🔥 Priority</option>
                  <option value="due_date">⏰ Due Date</option>
                  <option value="status">📊 Status</option>
                </select>

                <button
                  onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                  style={{
                    padding:'6px 10px', borderRadius:8,
                    background:'rgba(255,255,255,.05)',
                    border:'1px solid rgba(255,255,255,.1)',
                    color:'#e2e8f0', fontSize:14, cursor:'pointer',
                  }}
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                </button>
              </div>

              {isAdmin() && (
                <button className="qa-btn primary" onClick={() => {
                  resetForm();
                  setShowCreate(true);
                }}>
                  ➕ Assign Task
                </button>
              )}
            </div>
          </div>

          {/* ── Board ── */}
          {loading ? (
            <div className="tasks-board">
              {STATUSES.map(s =>
                <div key={s} className="skeleton" style={{height:250,borderRadius:14}}/>
              )}
            </div>
          ) : (
            <div className="tasks-board">
              {STATUSES.map(status => (
                <div key={status} className="section-card task-col"
                  style={{background:colColors[status], borderColor:colBorder[status]}}>

                  <div className="task-col-head">
                    <span className="task-col-title">
                      {status==='todo'?'⏳':status==='in_progress'?'🔄':'✅'} {STATUS_LABELS[status]}
                    </span>
                    <span className="task-col-count">{tasksByStatus(status).length}</span>
                  </div>

                  {tasksByStatus(status).length === 0 ? (
                    <div style={{
                      textAlign:'center', color:'rgba(255,255,255,.2)',
                      fontSize:13, padding:'24px 0'
                    }}>
                      No tasks
                    </div>
                  ) : (
                    tasksByStatus(status).map(t => (
                      <div key={t.id} className="task-card">
                        <div className="task-card-head">
                          <div className="task-card-title">{t.title}</div>
                          <span className={`pill ${PRIORITY_PILL[t.priority]||'pill-gray'}`}>
                            {t.priority}
                          </span>
                        </div>

                        {t.description && (
                          <div className="task-card-desc">
                            {t.description.slice(0,80)}{t.description.length>80?'…':''}
                          </div>
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

                        {/* Slider for employees */}
                        {!isAdmin() && t.status !== 'completed' && (
                          <input type="range" className="progress-slider"
                            min={0} max={100} value={t.progress}
                            onChange={e => {
                              const v  = Number(e.target.value);
                              const ns = v===100?'completed':v>0?'in_progress':'todo';
                              handleProgressUpdate(t.id, v, ns);
                            }}
                          />
                        )}

                        <div className="task-card-footer">
                          <div className="task-assignee">
                            <span>👤</span>
                            <span style={{fontSize:12}}>
                              {isAdmin() ? t.assigned_to_name : t.assigned_by_name || '—'}
                            </span>
                          </div>
                          {isAdmin() && (
                            <button className="act-btn danger"
                              onClick={() => handleDelete(t.id)}>🗑️</button>
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

      {/* ── CREATE TASK MODAL ── */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="✅ Assign New Task"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving}>
            {saving
              ? <><div className="spin"/>
                  {assignAll ? `Assigning to ${users.length}…` : 'Saving…'}
                </>
              : assignAll
                ? `🚀 Assign to All ${users.length} Employees`
                : '🚀 Assign Task'
            }
          </button>
        </>}
      >
        {saveErr && (
          <div style={{
            background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
            borderRadius:10, padding:'10px 14px', color:'#fca5a5',
            fontSize:13, marginBottom:14
          }}>
            ⚠ {saveErr}
          </div>
        )}

        {/* Task Title */}
        <div className="field">
          <label>Task Title *</label>
          <input type="text" placeholder="e.g. Fix login bug" value={form.title}
            onChange={e => setForm(p=>({...p,title:e.target.value}))}
            style={{borderColor:formErrors.title?'rgba(239,68,68,.6)':''}}/>
          {formErrors.title && <p className="field-err">{formErrors.title}</p>}
        </div>

        {/* Description */}
        <div className="field">
          <label>Description</label>
          <textarea placeholder="Task details…" value={form.description}
            onChange={e => setForm(p=>({...p,description:e.target.value}))}/>
        </div>

        {/* ── Assign All Toggle ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:12,
          padding:'12px 16px', borderRadius:10, marginBottom:12,
          background: assignAll ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)',
          border: assignAll ? '1px solid rgba(99,102,241,.4)' : '1px solid rgba(255,255,255,.08)',
          cursor:'pointer', transition:'all .2s',
        }}
          onClick={() => {
            setAssignAll(p => !p);
            setForm(p => ({ ...p, assigned_to: '' }));
            setFormErrors(p => ({ ...p, assigned_to: '' }));
          }}
        >
          <div style={{
            width:22, height:22, borderRadius:6,
            background: assignAll ? '#6366f1' : 'rgba(255,255,255,.1)',
            border: assignAll ? 'none' : '1px solid rgba(255,255,255,.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, flexShrink:0,
          }}>
            {assignAll ? '✓' : ''}
          </div>
          <div>
            <div style={{ color:'#e2e8f0', fontSize:14, fontWeight:600 }}>
              👥 Assign to ALL Employees
            </div>
            <div style={{ color:'#94a3b8', fontSize:12 }}>
              This task will be assigned to all {users.length} employees at once
            </div>
          </div>
        </div>

        <div className="two-col">

          {/* Assign To dropdown — hidden when assignAll */}
          <div className="field">
            <label>Assign To {!assignAll && '*'}</label>
            <select
              value={form.assigned_to}
              onChange={e => setForm(p=>({...p,assigned_to:e.target.value}))}
              disabled={assignAll}
              style={{
                borderColor: formErrors.assigned_to ? 'rgba(239,68,68,.6)' : '',
                opacity: assignAll ? 0.4 : 1,
              }}
            >
              <option value="">
                {assignAll ? '— All employees selected —' : 'Select employee…'}
              </option>
              {users.map(u =>
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.employee_id})
                </option>
              )}
            </select>
            {formErrors.assigned_to &&
              <p className="field-err">{formErrors.assigned_to}</p>}
          </div>

          {/* Priority */}
          <div className="field">
            <label>Priority</label>
            <select value={form.priority}
              onChange={e => setForm(p=>({...p,priority:e.target.value}))}>
              {PRIORITIES.map(p =>
                <option key={p} value={p}>
                  {p==='urgent'?'🔴':p==='high'?'🟠':p==='medium'?'🟡':'🟢'} {p.charAt(0).toUpperCase()+p.slice(1)}
                </option>
              )}
            </select>
          </div>

          {/* Due Date */}
          <div className="field">
            <label>Due Date *</label>
            <input type="date" value={form.due_date}
              onChange={e => setForm(p=>({...p,due_date:e.target.value}))}
              style={{borderColor:formErrors.due_date?'rgba(239,68,68,.6)':''}}/>
            {formErrors.due_date && <p className="field-err">{formErrors.due_date}</p>}
          </div>

          {/* Initial Status */}
          <div className="field">
            <label>Initial Status</label>
            <select value={form.status}
              onChange={e => setForm(p=>({...p,status:e.target.value}))}>
              {STATUSES.map(s =>
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              )}
            </select>
          </div>

        </div>

        {/* Preview when assign all */}
        {assignAll && users.length > 0 && (
          <div style={{
            marginTop:12, padding:'12px 16px', borderRadius:10,
            background:'rgba(99,102,241,.08)',
            border:'1px solid rgba(99,102,241,.2)',
          }}>
            <p style={{ color:'#a5b4fc', fontSize:13, fontWeight:600, margin:'0 0 8px' }}>
              👥 Will be assigned to:
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {users.map(u => (
                <span key={u.id} style={{
                  padding:'3px 10px', borderRadius:20,
                  background:'rgba(99,102,241,.2)',
                  color:'#c7d2fe', fontSize:12,
                }}>
                  {u.full_name}
                </span>
              ))}
            </div>
          </div>
        )}

      </Modal>
    </div>
  );
}