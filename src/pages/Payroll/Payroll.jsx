import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { payrollAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import '../Attendance/Attendance.css';
import './Payroll.css';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const EMPTY_SAL = {
  user:'', basic:'', hra:'0', transport:'0', medical:'0',
  other_allowances:'0', pf_deduction:'0', tax_deduction:'0',
  other_deductions:'0',
  effective_from: new Date().toISOString().split('T')[0]
};

const EMPTY_GEN = {
  user:'', month: new Date().getMonth() + 1,
  year: new Date().getFullYear(), days_worked: 22
};

export default function Payroll() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [payslips,   setPayslips]   = useState([]);
  const [salary,     setSalary]     = useState(null);
  const [employees,  setEmployees]  = useState([]);   // user list for dropdowns
  const [loading,    setLoading]    = useState(true);
  const [showSet,    setShowSet]    = useState(false);
  const [showGen,    setShowGen]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saveErr,    setSaveErr]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [salForm,    setSalForm]    = useState({ ...EMPTY_SAL });
  const [genForm,    setGenForm]    = useState({ ...EMPTY_GEN });

  useEffect(() => {
    fetchData();
    if (isAdmin()) fetchEmployees();
  }, []);

  // ── Fetch employees (user list) for dropdowns ─────────────
  const fetchEmployees = async () => {
    try {
      const res  = await authAPI.getUsers();          // GET /api/auth/users/
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setEmployees(data);
    } catch (e) {
      console.error('Failed to fetch employees', e);
    }
  };

  // ── Fetch payslips / salary ───────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin()) {
        const res  = await payrollAPI.getAllPayslips();
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setPayslips(data);
      } else {
        const [psRes, salRes] = await Promise.allSettled([
          payrollAPI.getMyPayslips(),
          payrollAPI.getMySalary(),
        ]);
        if (psRes.status === 'fulfilled') {
          const d = Array.isArray(psRes.value.data) ? psRes.value.data : (psRes.value.data.results || []);
          setPayslips(d);
        }
        if (salRes.status === 'fulfilled') {
          const d = Array.isArray(salRes.value.data) ? salRes.value.data : (salRes.value.data.results || []);
          setSalary(Array.isArray(d) ? d[0] : d);
        }
      }
    } catch (e) {
      console.error('fetchData error', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Save salary structure ─────────────────────────────────
  const handleSetSalary = async () => {
    if (!salForm.user)  { setSaveErr('Please select an employee'); return; }
    if (!salForm.basic) { setSaveErr('Basic salary is required');  return; }

    setSaving(true); setSaveErr('');
    try {
      await payrollAPI.setSalary(salForm);
      setShowSet(false);
      setSalForm({ ...EMPTY_SAL });
      setSuccessMsg('✅ Salary structure saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (e) {
      const data = e.response?.data;
      if (data && typeof data === 'object') {
        const msg = Object.values(data).flat().join(' | ');
        setSaveErr(msg);
      } else {
        setSaveErr('Failed to save salary. Check all fields.');
      }
    } finally { setSaving(false); }
  };

  // ── Generate payslip ──────────────────────────────────────
  const handleGenerate = async () => {
    if (!genForm.user) { setSaveErr('Please select an employee'); return; }

    setSaving(true); setSaveErr('');
    try {
      await payrollAPI.generatePayslip(genForm);
      setShowGen(false);
      setGenForm({ ...EMPTY_GEN });
      setSuccessMsg('✅ Payslip generated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (e) {
      const data = e.response?.data;
      if (data && typeof data === 'object') {
        setSaveErr(Object.values(data).flat().join(' | '));
      } else {
        setSaveErr('Failed to generate payslip.');
      }
    } finally { setSaving(false); }
  };

  const totalExpense = payslips.reduce((s, p) => s + Number(p.net || 0), 0);

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar
          title="Payroll"
          subtitle={isAdmin() ? 'Salary & payslip management' : 'My salary details'}
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="dash-content">

          {/* Success banner */}
          {successMsg && (
            <div style={{
              background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12, padding:'12px 18px', color:'#34d399',
              fontSize:14, fontWeight:600, marginBottom:20
            }}>
              {successMsg}
            </div>
          )}

          <div className="page-header">
            <div>
              <h1>💰 {isAdmin() ? 'Payroll Management' : 'My Payroll'}</h1>
              <p>
                {isAdmin()
                  ? `Total expense: ₹${totalExpense.toLocaleString()}`
                  : 'View your salary & payslips'}
              </p>
            </div>
            {isAdmin() && (
              <div style={{display:'flex', gap:10}}>
                <button className="qa-btn" onClick={() => { setSalForm({...EMPTY_SAL}); setSaveErr(''); setShowSet(true); }}>
                  ⚙️ Set Salary
                </button>
                <button className="qa-btn primary" onClick={() => { setGenForm({...EMPTY_GEN}); setSaveErr(''); setShowGen(true); }}>
                  📄 Generate Payslip
                </button>
              </div>
            )}
          </div>

          {/* ── Employee: salary breakdown ── */}
          {!isAdmin() && salary && (
            <>
              <div className="salary-breakdown">
                <div className="breakdown-item">
                  <div className="breakdown-label">Basic Salary</div>
                  <div className="breakdown-value">₹{Number(salary.basic || 0).toLocaleString()}</div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">Gross Salary</div>
                  <div className="breakdown-value green">₹{Number(salary.gross || 0).toLocaleString()}</div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">Total Deductions</div>
                  <div className="breakdown-value red">
                    -₹{(
                      Number(salary.pf_deduction   || 0) +
                      Number(salary.tax_deduction  || 0) +
                      Number(salary.other_deductions || 0)
                    ).toLocaleString()}
                  </div>
                </div>
                <div className="breakdown-item">
                  <div className="breakdown-label">Net Salary</div>
                  <div className="breakdown-value purple">₹{Number(salary.net || 0).toLocaleString()}</div>
                </div>
              </div>

              <div className="section-card" style={{marginBottom:24}}>
                <div className="section-card-head"><h3>📊 Salary Breakdown</h3></div>
                <div className="salary-rows">
                  {[
                    ['Basic Salary',       salary.basic,             ''],
                    ['HRA',                salary.hra,               'green'],
                    ['Transport',          salary.transport,         'green'],
                    ['Medical',            salary.medical,           'green'],
                    ['Other Allowances',   salary.other_allowances,  'green'],
                    ['PF Deduction',       salary.pf_deduction,      'red'],
                    ['Tax Deduction',      salary.tax_deduction,     'red'],
                    ['Other Deductions',   salary.other_deductions,  'red'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="sal-row">
                      <span className="sal-label">{label}</span>
                      <span className={`sal-val ${color}`}>
                        {color === 'red' ? '-' : ''}₹{Number(val || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="sal-row" style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:14,marginTop:4}}>
                    <span style={{fontWeight:800,color:'#fff',fontSize:14}}>Net Salary</span>
                    <span className="sal-val total">₹{Number(salary.net || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Employee: no salary configured ── */}
          {!isAdmin() && !salary && !loading && (
            <div className="section-card" style={{marginBottom:24}}>
              <div className="empty-state">
                <div className="empty-ico">💰</div>
                <p>Salary not configured yet. Contact admin.</p>
              </div>
            </div>
          )}

          {/* ── Payslips list ── */}
          <div className="section-card">
            <div className="section-card-head">
              <h3>📄 {isAdmin() ? 'All Payslips' : 'My Payslips'}</h3>
            </div>

            {loading ? (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:80,borderRadius:14}}/>)}
              </div>
            ) : payslips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-ico">📄</div>
                <p>No payslips generated yet</p>
              </div>
            ) : (
              payslips.map(ps => (
                <div key={ps.id} className="payslip-card">
                  <div>
                    <div className="payslip-month">{MONTHS[(ps.month || 1) - 1]} {ps.year}</div>
                    {isAdmin() && <div className="payslip-yr">{ps.user_name}</div>}
                    <div className="payslip-meta">
                      <span className="pill pill-gray">📅 {ps.days_worked} days worked</span>
                      <span className={`pill ${ps.paid ? 'pill-green' : 'pill-amber'}`}>
                        {ps.paid ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:4}}>Net Salary</div>
                      <div className="payslip-net">₹{Number(ps.net || 0).toLocaleString()}</div>
                    </div>
                    <button className="payslip-dl" style={{marginTop:10}}
                      onClick={() => alert(`Downloading payslip for ${MONTHS[(ps.month||1)-1]} ${ps.year}`)}>
                      ⬇ Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* ── SET SALARY MODAL ── */}
      <Modal
        open={showSet}
        onClose={() => { setShowSet(false); setSaveErr(''); }}
        title="⚙️ Set Salary Structure"
        width="600px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowSet(false); setSaveErr(''); }}>Cancel</button>
          <button className="btn-primary" onClick={handleSetSalary} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '💾 Save Salary'}
          </button>
        </>}
      >
        {saveErr && (
          <div style={{
            background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
            borderRadius:10, padding:'10px 14px', color:'#fca5a5',
            fontSize:13, marginBottom:16
          }}>⚠ {saveErr}</div>
        )}

        {/* Employee dropdown — uses real user list */}
        <div className="field" style={{marginBottom:18}}>
          <label>Employee *</label>
          <select
            value={salForm.user}
            onChange={e => setSalForm(p => ({...p, user: e.target.value}))}
          >
            <option value="">Select employee…</option>
            {employees.length === 0
              ? <option disabled>No employees found — add employees first</option>
              : employees.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.employee_id})
                  </option>
                ))
            }
          </select>
        </div>

        <div className="two-col">
          {[
            ['basic',            'Basic Salary *'],
            ['hra',              'HRA'],
            ['transport',        'Transport Allowance'],
            ['medical',          'Medical Allowance'],
            ['other_allowances', 'Other Allowances'],
            ['pf_deduction',     'PF Deduction'],
            ['tax_deduction',    'Tax Deduction'],
            ['other_deductions', 'Other Deductions'],
          ].map(([key, label]) => (
            <div key={key} className="field">
              <label>{label}</label>
              <input
                type="number" min="0" placeholder="0"
                value={salForm[key]}
                onChange={e => setSalForm(p => ({...p, [key]: e.target.value}))}
              />
            </div>
          ))}

          <div className="field">
            <label>Effective From</label>
            <input
              type="date"
              value={salForm.effective_from}
              onChange={e => setSalForm(p => ({...p, effective_from: e.target.value}))}
            />
          </div>
        </div>
      </Modal>

      {/* ── GENERATE PAYSLIP MODAL ── */}
      <Modal
        open={showGen}
        onClose={() => { setShowGen(false); setSaveErr(''); }}
        title="📄 Generate Payslip"
        width="440px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowGen(false); setSaveErr(''); }}>Cancel</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={saving}>
            {saving ? <><div className="spin"/>Generating…</> : '🚀 Generate'}
          </button>
        </>}
      >
        {saveErr && (
          <div style={{
            background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
            borderRadius:10, padding:'10px 14px', color:'#fca5a5',
            fontSize:13, marginBottom:16
          }}>⚠ {saveErr}</div>
        )}

        {/* Employee dropdown */}
        <div className="field" style={{marginBottom:18}}>
          <label>Employee *</label>
          <select
            value={genForm.user}
            onChange={e => setGenForm(p => ({...p, user: e.target.value}))}
          >
            <option value="">Select employee…</option>
            {employees.length === 0
              ? <option disabled>No employees found — add employees first</option>
              : employees.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.employee_id})
                  </option>
                ))
            }
          </select>
        </div>

        <div className="two-col">
          <div className="field">
            <label>Month</label>
            <select
              value={genForm.month}
              onChange={e => setGenForm(p => ({...p, month: Number(e.target.value)}))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Year</label>
            <input
              type="number" min="2020" max="2099"
              value={genForm.year}
              onChange={e => setGenForm(p => ({...p, year: Number(e.target.value)}))}
            />
          </div>

          <div className="field">
            <label>Days Worked</label>
            <input
              type="number" min="1" max="31"
              value={genForm.days_worked}
              onChange={e => setGenForm(p => ({...p, days_worked: Number(e.target.value)}))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}