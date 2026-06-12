import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { tasksAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Tasks.css';

const STATUSES      = ['todo', 'in_progress', 'completed'];
const STATUS_LABELS = { todo: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
const STATUS_ICONS  = { todo: '⏳', in_progress: '🔄', completed: '✅' };
const PRIORITIES    = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_PILL = { low:'pill-gray', medium:'pill-blue', high:'pill-amber', urgent:'pill-red' };
const PRIORITY_ICON = { low:'🟢', medium:'🟡', high:'🟠', urgent:'🔴' };
const PRIORITY_ORDER = { urgent:4, high:3, medium:2, low:1 };

const COL_STYLE = {
  todo:        { bg:'rgba(245,158,11,.08)',  border:'rgba(245,158,11,.2)',  accent:'#f59e0b' },
  in_progress: { bg:'rgba(99,102,241,.08)', border:'rgba(99,102,241,.2)', accent:'#6366f1' },
  completed:   { bg:'rgba(16,185,129,.08)', border:'rgba(16,185,129,.2)', accent:'#10b981' },
};

const EMPTY_FORM = {
  title:'', description:'', assigned_to:'',
  priority:'medium', due_date:'', status:'todo',
};

// ─────────────────────────────────────────────────────────────
// TaskForm is OUTSIDE Tasks so it never gets recreated on render
// This is what fixes the "one character at a time" bug
// ─────────────────────────────────────────────────────────────
function TaskForm({ form, setForm, formErrors, saveErr, isEdit, assignAll, setAssignAll, users, isAdmin }) {
  return (
    <>
      {saveErr && (
        <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',
          borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:14}}>
          ⚠ {saveErr}
        </div>
      )}

      {/* Title */}
      <div className="field" style={{marginBottom:12}}>
        <label>Task Title *</label>
        <input
          type="text"
          placeholder="e.g. Fix login bug"
          value={form.title}
          onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
          style={{ borderColor: formErrors.title ? 'rgba(239,68,68,.6)' : '' }}
        />
        {formErrors.title && <p className="field-err">{formErrors.title}</p>}
      </div>

      {/* Description */}
      <div className="field" style={{marginBottom:12}}>
        <label>Description</label>
        <textarea
          rows={3}
          placeholder="Task details, requirements, notes…"
          value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        />
      </div>

      {/* Assign All (only on create for admin) */}
      {!isEdit && isAdmin && (
        <div
          style={{
            display:'flex', alignItems:'center', gap:12, padding:'12px 16px',
            borderRadius:10, marginBottom:12, cursor:'pointer', transition:'all .2s',
            background: assignAll ? 'rgba(99,102,241,.15)' : 'rgba(255,255,255,.04)',
            border: assignAll ? '1px solid rgba(99,102,241,.4)' : '1px solid rgba(255,255,255,.08)',
          }}
          onClick={() => { setAssignAll(p => !p); setForm(p => ({ ...p, assigned_to: '' })); }}
        >
          <div style={{
            width:22, height:22, borderRadius:6, display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:14, flexShrink:0, transition:'all .2s',
            background: assignAll ? '#6366f1' : 'rgba(255,255,255,.1)',
            border: assignAll ? 'none' : '1px solid rgba(255,255,255,.2)',
          }}>
            {assignAll ? '✓' : ''}
          </div>
          <div>
            <div style={{color:'#e2e8f0',fontSize:13,fontWeight:600}}>
              👥 Assign to ALL Employees ({users.length})
            </div>
            <div style={{color:'#94a3b8',fontSize:11}}>
              Task will be created for every employee
            </div>
          </div>
        </div>
      )}

      <div className="two-col">
        {/* Assign To */}
        {isAdmin && (
          <div className="field">
            <label>Assign To {!assignAll && !isEdit && '*'}</label>
            <select
              value={form.assigned_to}
              onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
              disabled={assignAll}
              style={{
                borderColor: formErrors.assigned_to ? 'rgba(239,68,68,.6)' : '',
                opacity: assignAll ? 0.4 : 1,
              }}
            >
              <option value="">{assignAll ? '— All selected —' : 'Select employee…'}</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.full_name} · {u.department || u.employee_id}
                </option>
              ))}
            </select>
            {formErrors.assigned_to && <p className="field-err">{formErrors.assigned_to}</p>}
          </div>
        )}

        {/* Priority */}
        <div className="field">
          <label>Priority</label>
          <select
            value={form.priority}
            onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>
                {PRIORITY_ICON[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Due Date */}
        <div className="field">
          <label>Due Date *</label>
          <input
            type="date"
            value={form.due_date}
            onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
            style={{ borderColor: formErrors.due_date ? 'rgba(239,68,68,.6)' : '' }}
          />
          {formErrors.due_date && <p className="field-err">{formErrors.due_date}</p>}
        </div>

        {/* Status */}
        <div className="field">
          <label>Status</label>
          <select
            value={form.status}
            onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assign all preview */}
      {!isEdit && assignAll && users.length > 0 && (
        <div style={{padding:'12px 16px',borderRadius:10,marginTop:4,
          background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)'}}>
          <p style={{color:'#a5b4fc',fontSize:12,fontWeight:600,margin:'0 0 8px'}}>
            Will be assigned to:
          </p>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {users.map(u => (
              <span key={u.id} style={{padding:'3px 10px',borderRadius:20,
                background:'rgba(99,102,241,.2)',color:'#c7d2fe',fontSize:11}}>
                {u.full_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TaskCard is also outside Tasks for the same reason
// ─────────────────────────────────────────────────────────────
function TaskCard({ task, isAdmin, updatingId, onView, onEdit, onDelete, onStatusChange, onProgressUpdate }) {
  const isOverdue = (t) =>
    t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date();

  const daysUntil = (due) => {
    const diff = Math.ceil((new Date(due) - new Date()) / 86400000);
    if (diff < 0)   return { label: `${Math.abs(diff)}d overdue`, color: '#f87171' };
    if (diff === 0) return { label: 'Due today',                  color: '#fbbf24' };
    if (diff <= 2)  return { label: `Due in ${diff}d`,            color: '#fb923c' };
    return { label: `Due in ${diff}d`, color: '#94a3b8' };
  };

  const overdue    = isOverdue(task);
  const dueInfo    = task.due_date ? daysUntil(task.due_date) : null;
  const isUpdating = updatingId === task.id;

  return (
    <div
      className={`task-card ${overdue ? 'overdue' : ''} ${isUpdating ? 'updating' : ''}`}
      style={{ opacity: isUpdating ? 0.7 : 1 }}
    >
      {/* Overdue banner */}
      {overdue && (
        <div style={{background:'rgba(239,68,68,.15)',borderRadius:6,padding:'4px 8px',
          fontSize:11,color:'#f87171',fontWeight:600,marginBottom:8,
          display:'flex',alignItems:'center',gap:4}}>
          🚨 Overdue
        </div>
      )}

      {/* Title row */}
      <div className="task-card-head">
        <div className="task-card-title"
          style={{ cursor:'pointer', flex:1 }}
          onClick={() => onView(task)}>
          {task.title}
        </div>
        <span className={`pill ${PRIORITY_PILL[task.priority] || 'pill-gray'}`}>
          {PRIORITY_ICON[task.priority]} {task.priority}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <div className="task-card-desc">
          {task.description.slice(0, 90)}{task.description.length > 90 ? '…' : ''}
        </div>
      )}

      {/* Due date */}
      {dueInfo && (
        <div style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:11,
          padding:'3px 8px',borderRadius:6,marginBottom:8,fontWeight:500,
          background:'rgba(255,255,255,.05)',color:dueInfo.color}}>
          📅 {dueInfo.label}
        </div>
      )}

      {/* Progress bar */}
      <div className="task-prog-row">
        <div className="task-prog-bar">
          <div className="task-prog-fill" style={{
            width: `${task.progress || 0}%`,
            background: task.status === 'completed' ? '#10b981'
              : task.progress > 60 ? '#6366f1' : '#f59e0b',
          }}/>
        </div>
        <span className="task-prog-val">{task.progress || 0}%</span>
      </div>

      {/* Slider — employees only */}
      {!isAdmin && task.status !== 'completed' && (
        <input
          type="range" className="progress-slider"
          min={0} max={100} step={5}
          value={task.progress || 0}
          onChange={e => onProgressUpdate(task.id, Number(e.target.value))}
        />
      )}

      {/* Status pills — quick change for admin */}
      {isAdmin && (
        <div style={{display:'flex',gap:4,marginBottom:8,flexWrap:'wrap'}}>
          {STATUSES.map(s => (
            <button key={s}
              onClick={() => task.status !== s && onStatusChange(task, s)}
              style={{
                padding:'3px 10px', borderRadius:20, border:'none', cursor:'pointer',
                fontSize:11, fontWeight:600, fontFamily:'inherit', transition:'all .15s',
                background: task.status === s
                  ? s==='todo'?'rgba(245,158,11,.3)':s==='in_progress'?'rgba(99,102,241,.3)':'rgba(16,185,129,.3)'
                  : 'rgba(255,255,255,.06)',
                color: task.status === s
                  ? s==='todo'?'#fbbf24':s==='in_progress'?'#a5b4fc':'#6ee7b7'
                  : 'rgba(255,255,255,.3)',
              }}>
              {STATUS_ICONS[s]} {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="task-card-footer">
        <div className="task-assignee">
          <div style={{width:22,height:22,borderRadius:6,background:'rgba(99,102,241,.3)',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:10,fontWeight:700,color:'#a5b4fc',flexShrink:0}}>
            {(task.assigned_to_name || '?').charAt(0).toUpperCase()}
          </div>
          <span style={{fontSize:12,color:'#94a3b8'}}>
            {isAdmin ? task.assigned_to_name || '—' : `By: ${task.assigned_by_name || 'Admin'}`}
          </span>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button className="act-btn info" title="View" onClick={() => onView(task)}>👁️</button>
          {isAdmin && (
            <button className="act-btn edit" title="Edit" onClick={() => onEdit(task)}>✏️</button>
          )}
          {isAdmin && (
            <button className="act-btn danger" title="Delete" onClick={() => onDelete(task.id)}>🗑️</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Tasks component
// ─────────────────────────────────────────────────────────────
export default function Tasks() {
  const { isAdmin, user } = useAuth();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [tasks,       setTasks]       = useState([]);
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showCreate,  setShowCreate]  = useState(false);
  const [showEdit,    setShowEdit]    = useState(false);
  const [showDetail,  setShowDetail]  = useState(false);
  const [activeTask,  setActiveTask]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [saveErr,     setSaveErr]     = useState('');
  const [successMsg,  setSuccessMsg]  = useState('');
  const [assignAll,   setAssignAll]   = useState(false);
  const [search,      setSearch]      = useState('');
  const [filterPri,   setFilterPri]   = useState('');
  const [sortBy,      setSortBy]      = useState('created');
  const [sortOrder,   setSortOrder]   = useState('desc');
  const [updatingId,  setUpdatingId]  = useState(null);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [formErrors,  setFormErrors]  = useState({});

  useEffect(() => {
    fetchTasks();
    if (isAdmin()) fetchUsers();
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchTasks, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res  = isAdmin() ? await tasksAPI.getAll() : await tasksAPI.getMine();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res  = await authAPI.getUsers();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setUsers(data.filter(u => u.role === 'employee'));
    } catch (e) { console.error(e); }
  };

  const filteredTasks = useCallback((status) => {
    let list = tasks.filter(t => t.status === status);
    if (search)    list = list.filter(t =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to_name?.toLowerCase().includes(search.toLowerCase())
    );
    if (filterPri) list = list.filter(t => t.priority === filterPri);
    return [...list].sort((a, b) => {
      let va, vb;
      if (sortBy === 'priority')      { va = PRIORITY_ORDER[a.priority]||0; vb = PRIORITY_ORDER[b.priority]||0; }
      else if (sortBy === 'due_date') { va = new Date(a.due_date); vb = new Date(b.due_date); }
      else { va = new Date(a.created_at||0); vb = new Date(b.created_at||0); }
      return sortOrder === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }, [tasks, search, filterPri, sortBy, sortOrder]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim())              errs.title       = 'Title required';
    if (!assignAll && !form.assigned_to) errs.assigned_to = 'Select employee or choose All';
    if (!form.due_date)                  errs.due_date    = 'Due date required';
    return errs;
  };

  const handleCreate = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      if (assignAll && users.length > 0) {
        await Promise.all(users.map(u => tasksAPI.create({ ...form, assigned_to: u.id })));
        showToast(`✅ Task assigned to all ${users.length} employees!`);
      } else {
        await tasksAPI.create(form);
        showToast('✅ Task assigned successfully!');
      }
      setShowCreate(false); resetForm(); fetchTasks();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(typeof data === 'object' ? Object.values(data).flat().join(' | ') : 'Failed to create task.');
    } finally { setSaving(false); }
  };

  const openEdit = (task) => {
    setActiveTask(task);
    setForm({
      title:       task.title       || '',
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      priority:    task.priority    || 'medium',
      due_date:    task.due_date    || '',
      status:      task.status      || 'todo',
    });
    setFormErrors({}); setSaveErr('');
    setShowEdit(true);
  };

  const handleEdit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title    = 'Title required';
    if (!form.due_date)     errs.due_date = 'Due date required';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      await tasksAPI.update(activeTask.id, form);
      setShowEdit(false); resetForm(); setActiveTask(null);
      showToast('✅ Task updated!');
      fetchTasks();
    } catch (e) {
      setSaveErr('Failed to update task.');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (task, newStatus) => {
    setUpdatingId(task.id);
    try {
      await tasksAPI.update(task.id, { status: newStatus });
      setTasks(prev => prev.map(t =>
        t.id === task.id ? { ...t, status: newStatus } : t
      ));
      showToast(`Task moved to ${STATUS_LABELS[newStatus]}`);
    } catch { showToast('Update failed', true); }
    finally { setUpdatingId(null); }
  };

  const handleProgressUpdate = async (id, progress) => {
    const newStatus = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'todo';
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, progress, status: newStatus } : t
    ));
    try {
      await tasksAPI.updateProgress(id, { progress, status: newStatus });
    } catch { fetchTasks(); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    setUpdatingId(id);
    try {
      await tasksAPI.delete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      showToast('🗑️ Task deleted');
    } catch { showToast('Delete failed', true); }
    finally { setUpdatingId(null); }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM); setFormErrors({}); setSaveErr(''); setAssignAll(false);
  };

  const showToast = (msg, isErr = false) => {
    setSuccessMsg({ text: msg, err: isErr });
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const isOverdue = (task) =>
    task.status !== 'completed' &&
    task.due_date && new Date(task.due_date) < new Date();

  const stats = {
    total:      tasks.length,
    pending:    tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed:  tasks.filter(t => t.status === 'completed').length,
    overdue:    tasks.filter(t => isOverdue(t)).length,
  };

  // Stable callbacks passed down to TaskCard (avoids unnecessary re-renders)
  const handleView = useCallback((task) => { setActiveTask(task); setShowDetail(true); }, []);
  const handleEdit_cb = useCallback((task) => openEdit(task), [users]);

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)}/>
      <div className="dash-main">
        <Navbar
          title="Tasks"
          subtitle={isAdmin() ? 'Assign & track team tasks' : 'My assigned tasks'}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="dash-content">

          {/* Toast */}
          {successMsg && (
            <div style={{
              background: successMsg.err ? 'rgba(239,68,68,.12)' : 'rgba(16,185,129,.12)',
              border: `1px solid ${successMsg.err ? 'rgba(239,68,68,.3)' : 'rgba(16,185,129,.3)'}`,
              borderRadius:12, padding:'12px 18px',
              color: successMsg.err ? '#f87171' : '#34d399',
              fontSize:14, fontWeight:600, marginBottom:20,
            }}>
              {successMsg.text}
            </div>
          )}

          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',
            gap:12,marginBottom:24}}>
            {[
              { label:'Total',       value: stats.total,      color:'#818cf8', icon:'📋' },
              { label:'Pending',     value: stats.pending,    color:'#f59e0b', icon:'⏳' },
              { label:'In Progress', value: stats.inProgress, color:'#6366f1', icon:'🔄' },
              { label:'Completed',   value: stats.completed,  color:'#10b981', icon:'✅' },
              { label:'Overdue',     value: stats.overdue,    color:'#ef4444', icon:'🚨' },
            ].map(s => (
              <div key={s.label} className="section-card"
                style={{padding:'16px 18px',display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontSize:22}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls bar */}
          <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
            <div style={{flex:1,minWidth:200,position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',
                fontSize:14,color:'rgba(255,255,255,.3)'}}>🔍</span>
              <input type="text" placeholder="Search tasks or assignee…"
                value={search} onChange={e => setSearch(e.target.value)}
                style={{width:'100%',paddingLeft:36,paddingRight:12,paddingTop:9,paddingBottom:9,
                  background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',
                  borderRadius:10,color:'#e8eaf2',fontSize:13,fontFamily:'inherit',
                  outline:'none',boxSizing:'border-box'}}/>
            </div>

            <select value={filterPri} onChange={e => setFilterPri(e.target.value)}
              style={{padding:'9px 12px',background:'rgba(255,255,255,.05)',
                border:'1px solid rgba(255,255,255,.1)',borderRadius:10,
                color:'#e8eaf2',fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p =>
                <option key={p} value={p}>{PRIORITY_ICON[p]} {p.charAt(0).toUpperCase()+p.slice(1)}</option>
              )}
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{padding:'9px 12px',background:'rgba(255,255,255,.05)',
                border:'1px solid rgba(255,255,255,.1)',borderRadius:10,
                color:'#e8eaf2',fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>
              <option value="created">📅 Date Created</option>
              <option value="priority">🔥 Priority</option>
              <option value="due_date">⏰ Due Date</option>
            </select>

            <button onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
              style={{padding:'9px 12px',background:'rgba(255,255,255,.05)',
                border:'1px solid rgba(255,255,255,.1)',borderRadius:10,
                color:'#e8eaf2',cursor:'pointer',fontSize:14}}>
              {sortOrder === 'asc' ? '⬆️' : '⬇️'}
            </button>

            <button onClick={fetchTasks}
              style={{padding:'9px 12px',background:'rgba(255,255,255,.05)',
                border:'1px solid rgba(255,255,255,.1)',borderRadius:10,
                color:'rgba(255,255,255,.5)',cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
              🔄 Refresh
            </button>

            {isAdmin() && (
              <button className="qa-btn primary"
                onClick={() => { resetForm(); setShowCreate(true); }}>
                ➕ Assign Task
              </button>
            )}
          </div>

          {/* Board */}
          {loading ? (
            <div className="tasks-board">
              {STATUSES.map(s =>
                <div key={s} className="skeleton" style={{height:300,borderRadius:16}}/>
              )}
            </div>
          ) : (
            <div className="tasks-board">
              {STATUSES.map(status => {
                const col   = COL_STYLE[status];
                const items = filteredTasks(status);
                return (
                  <div key={status} className="task-col"
                    style={{background:col.bg,border:`1px solid ${col.border}`,
                      borderRadius:16,padding:16,display:'flex',flexDirection:'column',gap:0}}>

                    <div style={{display:'flex',alignItems:'center',
                      justifyContent:'space-between',marginBottom:14}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{width:8,height:8,borderRadius:'50%',background:col.accent}}/>
                        <span style={{fontWeight:700,fontSize:14,color:'#e8eaf2'}}>
                          {STATUS_ICONS[status]} {STATUS_LABELS[status]}
                        </span>
                      </div>
                      <span style={{background:'rgba(255,255,255,.08)',color:'#94a3b8',
                        fontSize:12,fontWeight:700,padding:'2px 10px',borderRadius:20}}>
                        {items.length}
                      </span>
                    </div>

                    <div style={{display:'flex',flexDirection:'column',gap:10,flex:1}}>
                      {items.length === 0 ? (
                        <div style={{textAlign:'center',color:'rgba(255,255,255,.2)',
                          fontSize:13,padding:'32px 0',borderRadius:10,
                          border:'1px dashed rgba(255,255,255,.08)'}}>
                          No tasks
                        </div>
                      ) : (
                        items.map(t => (
                          <TaskCard
                            key={t.id}
                            task={t}
                            isAdmin={isAdmin()}
                            updatingId={updatingId}
                            onView={handleView}
                            onEdit={handleEdit_cb}
                            onDelete={handleDelete}
                            onStatusChange={handleStatusChange}
                            onProgressUpdate={handleProgressUpdate}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}
        title="➕ Assign New Task" width="600px"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleCreate} disabled={saving}>
            {saving
              ? <><div className="spin"/>{assignAll ? `Assigning to ${users.length}…` : 'Saving…'}</>
              : assignAll ? `🚀 Assign to All ${users.length}` : '🚀 Assign Task'}
          </button>
        </>}>
        <TaskForm
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          saveErr={saveErr}
          isEdit={false}
          assignAll={assignAll}
          setAssignAll={setAssignAll}
          users={users}
          isAdmin={isAdmin()}
        />
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={showEdit} onClose={() => { setShowEdit(false); resetForm(); }}
        title="✏️ Edit Task" width="600px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowEdit(false); resetForm(); }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleEdit} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '💾 Save Changes'}
          </button>
        </>}>
        <TaskForm
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          saveErr={saveErr}
          isEdit={true}
          assignAll={assignAll}
          setAssignAll={setAssignAll}
          users={users}
          isAdmin={isAdmin()}
        />
      </Modal>

      {/* DETAIL MODAL */}
      <Modal open={showDetail && !!activeTask}
        onClose={() => { setShowDetail(false); setActiveTask(null); }}
        title="📋 Task Details" width="480px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowDetail(false); setActiveTask(null); }}>
            Close
          </button>
          {isAdmin() && activeTask && (
            <button className="btn-primary"
              onClick={() => { setShowDetail(false); openEdit(activeTask); }}>
              ✏️ Edit Task
            </button>
          )}
        </>}>
        {activeTask && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{padding:'16px',background:'rgba(255,255,255,.04)',borderRadius:12}}>
              <div style={{fontSize:17,fontWeight:700,color:'#e8eaf2',marginBottom:6}}>
                {activeTask.title}
              </div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <span className={`pill ${PRIORITY_PILL[activeTask.priority]||'pill-gray'}`}>
                  {PRIORITY_ICON[activeTask.priority]} {activeTask.priority}
                </span>
                <span style={{fontSize:12,padding:'3px 10px',borderRadius:20,
                  background: activeTask.status==='completed'?'rgba(16,185,129,.2)':
                    activeTask.status==='in_progress'?'rgba(99,102,241,.2)':'rgba(245,158,11,.2)',
                  color: activeTask.status==='completed'?'#6ee7b7':
                    activeTask.status==='in_progress'?'#a5b4fc':'#fcd34d'}}>
                  {STATUS_ICONS[activeTask.status]} {STATUS_LABELS[activeTask.status]}
                </span>
                {activeTask.status !== 'completed' && activeTask.due_date &&
                  new Date(activeTask.due_date) < new Date() && (
                  <span style={{fontSize:12,padding:'3px 10px',borderRadius:20,
                    background:'rgba(239,68,68,.2)',color:'#f87171'}}>
                    🚨 Overdue
                  </span>
                )}
              </div>
            </div>

            {activeTask.description && (
              <div style={{padding:'12px 14px',background:'rgba(255,255,255,.03)',
                borderRadius:10,fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.7}}>
                {activeTask.description}
              </div>
            )}

            {[
              { label:'Assigned To', value: activeTask.assigned_to_name || '—', icon:'👤' },
              { label:'Due Date',    value: activeTask.due_date || '—',          icon:'📅' },
              { label:'Progress',    value: `${activeTask.progress||0}%`,        icon:'📊' },
              { label:'Created',     value: activeTask.created_at
                ? new Date(activeTask.created_at).toLocaleDateString() : '—',   icon:'🕒' },
            ].map(row => (
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'10px 14px',
                background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                borderRadius:10}}>
                <span style={{fontSize:13,color:'#6b7280',display:'flex',gap:8}}>
                  {row.icon} {row.label}
                </span>
                <span style={{fontSize:13,color:'#e8eaf2',fontWeight:500}}>
                  {row.value}
                </span>
              </div>
            ))}

            <div style={{padding:'12px 14px',background:'rgba(255,255,255,.03)',borderRadius:10}}>
              <div style={{display:'flex',justifyContent:'space-between',
                fontSize:12,color:'#6b7280',marginBottom:8}}>
                <span>Progress</span>
                <span style={{fontWeight:700,color:'#e8eaf2'}}>{activeTask.progress||0}%</span>
              </div>
              <div style={{height:8,background:'rgba(255,255,255,.08)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:4,
                  width:`${activeTask.progress||0}%`,
                  background:activeTask.status==='completed'?'#10b981':'#6366f1',
                  transition:'width .3s'}}/>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}