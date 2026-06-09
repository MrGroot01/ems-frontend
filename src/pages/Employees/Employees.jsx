import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { employeesAPI } from '../../services/api';
import '../AdminDashboard/AdminDashboard.css';
import './Employees.css';

const DEPTS = [
  { label:'Engineering', value:'engineering' },
  { label:'HR',          value:'hr'          },
  { label:'Finance',     value:'finance'     },
  { label:'Marketing',   value:'marketing'   },
  { label:'Operations',  value:'operations'  },
  { label:'Design',      value:'design'      },
  { label:'Sales',       value:'sales'       },
];

const EMPTY_FORM = {
  full_name:'', email:'', employee_id:'', phone:'',
  password:'Employee@123', designation:'', department:'engineering',
  date_joined: new Date().toISOString().split('T')[0],
  address:'', status:'active',
};

export default function Employees() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [employees,  setEmployees]  = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [view,       setView]       = useState('grid');
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // ── Modal states ───────────────────────────────────────────
  const [showAdd,    setShowAdd]    = useState(false);
  const [showEdit,   setShowEdit]   = useState(false);  // ✅ NEW
  const [editId,     setEditId]     = useState(null);   // ✅ NEW
  const [deleteId,   setDeleteId]   = useState(null);
  const [viewEmp,    setViewEmp]    = useState(null);   // ✅ NEW

  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    let list = [...employees];
    if (search)     list = list.filter(e =>
      (e.user?.full_name||'').toLowerCase().includes(search.toLowerCase()) ||
      (e.user?.email||'').toLowerCase().includes(search.toLowerCase()) ||
      (e.user?.employee_id||'').toLowerCase().includes(search.toLowerCase())
    );
    if (deptFilter) list = list.filter(e => e.department === deptFilter);
    setFiltered(list);
  }, [search, deptFilter, employees]);

  const fetchEmployees = async () => {
    setLoading(true); setError('');
    try {
      const res  = await employeesAPI.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setEmployees(data);
      setFiltered(data);
    } catch { setError('Failed to load employees.'); }
    finally  { setLoading(false); }
  };

  const resetForm = () => { setForm(EMPTY_FORM); setFormErrors({}); setSaveErr(''); };

  const validate = (requirePassword = true) => {
    const errs = {};
    if (!form.full_name.trim())   errs.full_name   = 'Full name required';
    if (!form.email.trim())       errs.email       = 'Email required';
    if (!form.employee_id.trim()) errs.employee_id = 'Employee ID required';
    if (!form.designation.trim()) errs.designation = 'Designation required';
    if (!form.date_joined)        errs.date_joined = 'Date required';
    return errs;
  };

  // ── ADD ────────────────────────────────────────────────────
  const handleAdd = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      const res = await employeesAPI.create(form);
      setShowAdd(false); resetForm();
      showSuccess(`✅ ${res.data.message || 'Employee added!'}`);
      fetchEmployees();
    } catch (e) {
      const data = e.response?.data;
      if (typeof data === 'object') {
        setSaveErr(Object.entries(data).map(([k,v])=>`${k}: ${Array.isArray(v)?v[0]:v}`).join(' | '));
      } else setSaveErr('Failed to create employee.');
    } finally { setSaving(false); }
  };

  // ── EDIT — open modal with pre-filled data ✅ NEW ─────────
  const openEdit = (emp) => {
    setEditId(emp.id);
    setForm({
      full_name:   emp.user?.full_name   || '',
      email:       emp.user?.email       || '',
      employee_id: emp.user?.employee_id || '',
      phone:       emp.user?.phone       || '',
      password:    '',                          // leave blank = no change
      designation: emp.designation       || '',
      department:  emp.department        || 'engineering',
      date_joined: emp.date_joined       || '',
      address:     emp.address           || '',
      status:      emp.status            || 'active',
    });
    setFormErrors({}); setSaveErr('');
    setShowEdit(true);
  };

  // ── SAVE EDIT ✅ NEW ───────────────────────────────────────
  const handleEdit = async () => {
    const errs = validate(false);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true); setSaveErr('');
    try {
      // Only send password if filled in
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      await employeesAPI.update(editId, payload);
      setShowEdit(false); resetForm(); setEditId(null);
      showSuccess('✅ Employee updated successfully!');
      fetchEmployees();
    } catch (e) {
      const data = e.response?.data;
      if (typeof data === 'object') {
        setSaveErr(Object.entries(data).map(([k,v])=>`${k}: ${Array.isArray(v)?v[0]:v}`).join(' | '));
      } else setSaveErr('Failed to update employee.');
    } finally { setSaving(false); }
  };

  // ── DELETE ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return;
    try { await employeesAPI.delete(deleteId); setDeleteId(null); fetchEmployees(); }
    catch { alert('Delete failed'); }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const initials = (name='') =>
    name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() || '??';

  // ── Shared form fields (used in both Add & Edit modals) ───
  const FormFields = ({ isEdit = false }) => (
    <>
      {saveErr && (
        <div style={{background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',
          borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:16}}>
          ⚠ {saveErr}
        </div>
      )}

      {!isEdit && (
        <div style={{background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',
          borderRadius:10,padding:'10px 14px',color:'#a5b4fc',fontSize:12,marginBottom:16}}>
          💡 Default password: <strong>Employee@123</strong>
        </div>
      )}

      <div className="two-col">
        {/* Full Name */}
        <div className="field">
          <label>Full Name *</label>
          <input type="text" placeholder="John Doe" value={form.full_name}
            onChange={e=>setForm(p=>({...p,full_name:e.target.value}))}
            style={{borderColor: formErrors.full_name ? 'rgba(239,68,68,.6)':''}}/>
          {formErrors.full_name && <p className="field-err">{formErrors.full_name}</p>}
        </div>

        {/* Email */}
        <div className="field">
          <label>Email *</label>
          <input type="email" placeholder="john@company.com" value={form.email}
            onChange={e=>setForm(p=>({...p,email:e.target.value}))}
            style={{borderColor: formErrors.email ? 'rgba(239,68,68,.6)':''}}/>
          {formErrors.email && <p className="field-err">{formErrors.email}</p>}
        </div>

        {/* Employee ID */}
        <div className="field">
          <label>Employee ID *</label>
          <input type="text" placeholder="EMP001" value={form.employee_id}
            readOnly={isEdit}
            style={{
              borderColor: formErrors.employee_id ? 'rgba(239,68,68,.6)':'',
              opacity: isEdit ? 0.6 : 1,
              cursor:  isEdit ? 'not-allowed' : 'text',
            }}/>
          {formErrors.employee_id && <p className="field-err">{formErrors.employee_id}</p>}
        </div>

        {/* Phone */}
        <div className="field">
          <label>Phone</label>
          <input type="tel" placeholder="+91 98765 43210" value={form.phone}
            onChange={e=>setForm(p=>({...p,phone:e.target.value}))}/>
        </div>

        {/* Designation */}
        <div className="field">
          <label>Designation *</label>
          <input type="text" placeholder="Software Engineer" value={form.designation}
            onChange={e=>setForm(p=>({...p,designation:e.target.value}))}
            style={{borderColor: formErrors.designation ? 'rgba(239,68,68,.6)':''}}/>
          {formErrors.designation && <p className="field-err">{formErrors.designation}</p>}
        </div>

        {/* Department */}
        <div className="field">
          <label>Department</label>
          <select value={form.department}
            onChange={e=>setForm(p=>({...p,department:e.target.value}))}>
            {DEPTS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Date of Joining */}
        <div className="field">
          <label>Date of Joining *</label>
          <input type="date" value={form.date_joined}
            onChange={e=>setForm(p=>({...p,date_joined:e.target.value}))}
            style={{borderColor: formErrors.date_joined ? 'rgba(239,68,68,.6)':''}}/>
          {formErrors.date_joined && <p className="field-err">{formErrors.date_joined}</p>}
        </div>

        {/* Status */}
        <div className="field">
          <label>Status</label>
          <select value={form.status}
            onChange={e=>setForm(p=>({...p,status:e.target.value}))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        {/* Password — optional in edit */}
        <div className="field span2">
          <label>{isEdit ? 'New Password (leave blank to keep current)' : 'Password'}</label>
          <input type="password"
            placeholder={isEdit ? 'Leave blank to keep current password' : 'Employee@123'}
            value={form.password}
            onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
        </div>
      </div>

      {/* Address */}
      <div className="field">
        <label>Address</label>
        <textarea placeholder="123 Main St, City" value={form.address}
          onChange={e=>setForm(p=>({...p,address:e.target.value}))}
          rows={2}/>
      </div>
    </>
  );

  // ── Employee card action buttons ───────────────────────────
  const ActionButtons = ({ emp }) => (
    <div className="action-btns">
      {/* VIEW */}
      <button className="act-btn info" title="View Details"
        onClick={() => setViewEmp(emp)}>
        👁️
      </button>
      {/* EDIT ✅ NEW */}
      <button className="act-btn edit" title="Edit Employee"
        onClick={() => openEdit(emp)}>
        ✏️
      </button>
      {/* DELETE */}
      <button className="act-btn danger" title="Delete Employee"
        onClick={() => setDeleteId(emp.id)}>
        🗑️
      </button>
    </div>
  );

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Employees" subtitle="Manage your team"
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">

          {/* Success toast */}
          {successMsg && (
            <div style={{background:'rgba(16,185,129,.15)',border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12,padding:'12px 18px',color:'#34d399',fontSize:14,fontWeight:600,
              marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
              {successMsg}
            </div>
          )}

          {/* Page header */}
          <div className="page-header">
            <div>
              <h1>👥 All Employees</h1>
              <p>{filtered.length} team members</p>
            </div>
            <button className="qa-btn primary"
              onClick={() => { resetForm(); setShowAdd(true); }}>
              ➕ Add Employee
            </button>
          </div>

          {/* Filter bar */}
          <div className="filter-bar">
            <div className="filter-search">
              <span className="filter-search-ico">🔍</span>
              <input type="text" placeholder="Search by name, email, ID…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {DEPTS.map(d =>
                <option key={d.value} value={d.value}>{d.label}</option>
              )}
            </select>
            <div className="filter-spacer"/>
            <div className="view-toggle">
              <button className={`view-btn ${view==='grid'?'active':''}`}
                onClick={() => setView('grid')}>⊞</button>
              <button className={`view-btn ${view==='table'?'active':''}`}
                onClick={() => setView('table')}>☰</button>
            </div>
          </div>

          {error && (
            <div style={{color:'#f87171',padding:'12px',
              background:'rgba(239,68,68,.1)',borderRadius:10,marginBottom:16}}>
              {error}
            </div>
          )}

          {/* ── GRID VIEW ─────────────────────────────────── */}
          {view === 'grid' && (
            loading
              ? <div className="emp-grid">
                  {[1,2,3,4,5,6].map(i =>
                    <div key={i} className="skeleton"
                      style={{height:220,borderRadius:18}}/>
                  )}
                </div>
              : filtered.length === 0
                ? <div className="empty-state">
                    <div className="empty-ico">👤</div>
                    <p>No employees found</p>
                  </div>
                : <div className="emp-grid">
                    {filtered.map(e => (
                      <div key={e.id} className="emp-card">
                        <div className="emp-card-top">
                          <div className="emp-card-av">
                            {e.user?.profile_image
                              ? <img src={e.user.profile_image} alt="av"/>
                              : initials(e.user?.full_name||'')}
                          </div>
                          <span className={`pill ${
                            e.status==='active'   ?'pill-green':
                            e.status==='on_leave' ?'pill-amber':'pill-red'}`}>
                            {e.status}
                          </span>
                        </div>
                        <div className="emp-card-body">
                          <div className="emp-card-name">{e.user?.full_name||'—'}</div>
                          <div className="emp-card-role">{e.designation||'—'}</div>
                          <div className="emp-card-id">ID: {e.user?.employee_id}</div>
                        </div>
                        <div className="emp-card-info">
                          <div className="emp-card-info-row"><span>🏬</span><span>{e.department}</span></div>
                          <div className="emp-card-info-row"><span>✉️</span><span>{e.user?.email}</span></div>
                          <div className="emp-card-info-row"><span>📅</span><span>{e.date_joined}</span></div>
                        </div>
                        <div className="emp-card-footer">
                          <ActionButtons emp={e} />
                        </div>
                      </div>
                    ))}
                  </div>
          )}

          {/* ── TABLE VIEW ────────────────────────────────── */}
          {view === 'table' && (
            <div className="section-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th><th>ID</th><th>Dept</th>
                    <th>Designation</th><th>Joined</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? <tr><td colSpan={7} style={{textAlign:'center',padding:30,
                        color:'rgba(255,255,255,.3)'}}>Loading…</td></tr>
                    : filtered.map(e => (
                      <tr key={e.id}>
                        <td>
                          <div className="emp-mini">
                            <div className="emp-av">
                              {e.user?.profile_image
                                ? <img src={e.user.profile_image} alt="av"/>
                                : initials(e.user?.full_name||'')}
                            </div>
                            <div>
                              <div className="emp-name">{e.user?.full_name}</div>
                              <div className="emp-dept">{e.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{e.user?.employee_id}</td>
                        <td style={{textTransform:'capitalize'}}>{e.department}</td>
                        <td>{e.designation}</td>
                        <td>{e.date_joined}</td>
                        <td>
                          <span className={`pill ${
                            e.status==='active'   ?'pill-green':
                            e.status==='on_leave' ?'pill-amber':'pill-red'}`}>
                            {e.status}
                          </span>
                        </td>
                        <td><ActionButtons emp={e} /></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          ADD EMPLOYEE MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}
        title="➕ Add Employee" width="660px"
        footer={<>
          <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd} disabled={saving}>
            {saving ? <><div className="spin"/>Creating…</> : '✅ Add Employee'}
          </button>
        </>}>
        <FormFields isEdit={false} />
      </Modal>

      {/* ══════════════════════════════════════════════════════
          EDIT EMPLOYEE MODAL  ✅ NEW
      ══════════════════════════════════════════════════════ */}
      <Modal open={showEdit} onClose={() => { setShowEdit(false); resetForm(); }}
        title="✏️ Edit Employee" width="660px"
        footer={<>
          <button className="btn-ghost"
            onClick={() => { setShowEdit(false); resetForm(); }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleEdit} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '💾 Save Changes'}
          </button>
        </>}>
        <FormFields isEdit={true} />
      </Modal>

      {/* ══════════════════════════════════════════════════════
          VIEW EMPLOYEE DETAILS MODAL  ✅ NEW
      ══════════════════════════════════════════════════════ */}
      <Modal open={!!viewEmp} onClose={() => setViewEmp(null)}
        title="👤 Employee Details" width="480px"
        footer={<>
          <button className="btn-ghost" onClick={() => setViewEmp(null)}>Close</button>
          <button className="btn-primary"
            onClick={() => { setViewEmp(null); openEdit(viewEmp); }}>
            ✏️ Edit Employee
          </button>
        </>}>
        {viewEmp && (
          <div style={{display:'flex',flexDirection:'column',gap:16}}>
            {/* Avatar */}
            <div style={{display:'flex',alignItems:'center',gap:16,
              padding:'16px',background:'rgba(255,255,255,.04)',borderRadius:14}}>
              <div style={{width:64,height:64,borderRadius:16,
                background:'linear-gradient(135deg,#1a3a6e,#4f8ef7)',
                display:'flex',alignItems:'center',justifyContent:'center',
                fontSize:22,fontWeight:800,color:'#fff',flexShrink:0}}>
                {viewEmp.user?.profile_image
                  ? <img src={viewEmp.user.profile_image} alt="av"
                      style={{width:'100%',height:'100%',borderRadius:16,objectFit:'cover'}}/>
                  : initials(viewEmp.user?.full_name||'')}
              </div>
              <div>
                <div style={{fontSize:18,fontWeight:700,color:'#e8eaf2'}}>
                  {viewEmp.user?.full_name}
                </div>
                <div style={{fontSize:13,color:'#6b7280'}}>{viewEmp.designation}</div>
                <span className={`pill ${
                  viewEmp.status==='active'   ?'pill-green':
                  viewEmp.status==='on_leave' ?'pill-amber':'pill-red'}`}
                  style={{marginTop:6,display:'inline-block'}}>
                  {viewEmp.status}
                </span>
              </div>
            </div>

            {/* Details grid */}
            {[
              { label:'Employee ID',  value: viewEmp.user?.employee_id, icon:'🪪' },
              { label:'Email',        value: viewEmp.user?.email,        icon:'✉️' },
              { label:'Phone',        value: viewEmp.user?.phone || '—', icon:'📱' },
              { label:'Department',   value: viewEmp.department,          icon:'🏬' },
              { label:'Date Joined',  value: viewEmp.date_joined,         icon:'📅' },
              { label:'Address',      value: viewEmp.address || '—',      icon:'📍' },
            ].map(row => (
              <div key={row.label} style={{display:'flex',justifyContent:'space-between',
                alignItems:'center',padding:'10px 14px',
                background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.06)',
                borderRadius:10}}>
                <span style={{fontSize:13,color:'#6b7280',display:'flex',gap:8,alignItems:'center'}}>
                  {row.icon} {row.label}
                </span>
                <span style={{fontSize:13,color:'#e8eaf2',fontWeight:500,
                  textAlign:'right',maxWidth:'55%',wordBreak:'break-all'}}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)}
        title="🗑️ Confirm Delete" width="400px"
        footer={<>
          <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete}>Yes, Delete</button>
        </>}>
        <p style={{color:'rgba(255,255,255,.6)',fontSize:14,lineHeight:1.7}}>
          This will permanently delete the employee and their user account.
          This action cannot be undone.
        </p>
      </Modal>

    </div>
  );
}
