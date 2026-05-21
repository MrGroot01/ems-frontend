import React, { useState, useEffect, useRef } from 'react';
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
  user:'', month: new Date().getMonth()+1,
  year: new Date().getFullYear(), days_worked: 22
};

/* ─── PDF generation using browser print ─────────────────────── */
const generatePayslipPDF = (ps, userName, empId, dept) => {
  const monthName = MONTHS[(ps.month || 1) - 1];
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>Payslip ${monthName} ${ps.year}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
        .company-name { font-size: 26px; font-weight: 900; color: #6366f1; }
        .payslip-title { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .badge { background: #f3f4f6; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #374151; }
        .emp-section { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; background: #f9fafb; padding: 20px; border-radius: 10px; }
        .emp-info-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .emp-info-value { font-size: 14px; font-weight: 700; color: #111827; }
        .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .pay-table th { background: #6366f1; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
        .pay-table td { padding: 11px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        .pay-table tr:nth-child(even) td { background: #f9fafb; }
        .pay-table .amount { text-align: right; font-weight: 600; }
        .pay-table .deduct { color: #dc2626; }
        .net-row { background: #f0fdf4 !important; }
        .net-row td { font-weight: 900 !important; font-size: 15px !important; color: #065f46 !important; border-top: 2px solid #6366f1 !important; }
        .summary { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
        .summary-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
        .summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; }
        .summary-value { font-size: 20px; font-weight: 900; color: #111827; }
        .summary-value.green { color: #059669; }
        .summary-value.purple { color: #7c3aed; }
        .summary-value.red { color: #dc2626; }
        .footer { text-align: center; color: #9ca3af; font-size: 11px; margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        .paid-stamp { color: #059669; font-size: 12px; font-weight: 800; border: 2px solid #059669; padding: 3px 10px; border-radius: 4px; display: inline-block; margin-top: 4px; }
        @media print {
          body { padding: 20px; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">EMS Pro</div>
          <div class="payslip-title">Employee Payslip — ${monthName} ${ps.year}</div>
        </div>
        <div>
          <div class="badge">Pay Period: ${monthName} ${ps.year}</div>
          ${ps.paid ? '<div class="paid-stamp">✓ PAID</div>' : ''}
        </div>
      </div>

      <div class="emp-section">
        <div>
          <div class="emp-info-label">Employee Name</div>
          <div class="emp-info-value">${userName || 'N/A'}</div>
        </div>
        <div>
          <div class="emp-info-label">Employee ID</div>
          <div class="emp-info-value">${empId || 'N/A'}</div>
        </div>
        <div>
          <div class="emp-info-label">Department</div>
          <div class="emp-info-value">${dept || 'N/A'}</div>
        </div>
        <div>
          <div class="emp-info-label">Days Worked</div>
          <div class="emp-info-value">${ps.days_worked} days</div>
        </div>
      </div>

      <div class="summary">
        <div class="summary-box">
          <div class="summary-label">Gross Salary</div>
          <div class="summary-value green">₹${Number(ps.gross||0).toLocaleString()}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Total Deductions</div>
          <div class="summary-value red">-₹${Number(ps.deductions||0).toLocaleString()}</div>
        </div>
        <div class="summary-box">
          <div class="summary-label">Net Salary</div>
          <div class="summary-value purple">₹${Number(ps.net||0).toLocaleString()}</div>
        </div>
      </div>

      <table class="pay-table">
        <thead>
          <tr>
            <th>Earnings</th>
            <th class="amount">Amount (₹)</th>
            <th>Deductions</th>
            <th class="amount deduct">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary</td>
            <td class="amount">${Number(ps.basic||0).toLocaleString()}</td>
            <td>PF Deduction</td>
            <td class="amount deduct">${Number(ps.pf_deduction||0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>HRA</td>
            <td class="amount">${Number(ps.hra||0).toLocaleString()}</td>
            <td>Tax Deduction</td>
            <td class="amount deduct">${Number(ps.tax_deduction||0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Transport Allowance</td>
            <td class="amount">${Number(ps.transport||0).toLocaleString()}</td>
            <td>Other Deductions</td>
            <td class="amount deduct">${Number(ps.other_deductions||0).toLocaleString()}</td>
          </tr>
          <tr>
            <td>Medical Allowance</td>
            <td class="amount">${Number(ps.medical||0).toLocaleString()}</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Other Allowances</td>
            <td class="amount">${Number(ps.other_allowances||0).toLocaleString()}</td>
            <td></td>
            <td></td>
          </tr>
          <tr class="net-row">
            <td><strong>GROSS TOTAL</strong></td>
            <td class="amount">₹${Number(ps.gross||0).toLocaleString()}</td>
            <td><strong>NET PAYABLE</strong></td>
            <td class="amount">₹${Number(ps.net||0).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="footer">
        <p>This is a computer-generated payslip and does not require a signature.</p>
        <p>Generated by EMS Pro on ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
    </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function Payroll() {
  const { isAdmin, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [payslips,   setPayslips]   = useState([]);
  const [salary,     setSalary]     = useState(null);
  const [employees,  setEmployees]  = useState([]);
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

  const fetchEmployees = async () => {
    try {
      const res  = await authAPI.getUsers();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setEmployees(data);
    } catch (e) { console.error('fetch employees', e); }
  };

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
    } catch (e) { console.error('fetchData', e); }
    finally { setLoading(false); }
  };

  /* ── Set salary ─────────────────────────────────────────── */
  const handleSetSalary = async () => {
    if (!salForm.user)  { setSaveErr('Please select an employee'); return; }
    if (!salForm.basic || Number(salForm.basic) <= 0) {
      setSaveErr('Basic salary must be greater than 0'); return;
    }
    setSaving(true); setSaveErr('');
    try {
      await payrollAPI.setSalary(salForm);
      setShowSet(false);
      setSalForm({ ...EMPTY_SAL });
      setSuccessMsg('✅ Salary structure saved! You can now generate a payslip.');
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchData();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(
        typeof data === 'object'
          ? Object.values(data).flat().join(' | ')
          : 'Failed to save salary. Try again.'
      );
    } finally { setSaving(false); }
  };

  /* ── Generate payslip ───────────────────────────────────── */
  const handleGenerate = async () => {
    if (!genForm.user) { setSaveErr('Please select an employee'); return; }
    setSaving(true); setSaveErr('');
    try {
      const res = await payrollAPI.generatePayslip(genForm);
      setShowGen(false);
      setGenForm({ ...EMPTY_GEN });
      setSuccessMsg(`✅ Payslip generated! Net: ₹${Number(res.data.net||0).toLocaleString()}`);
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchData();
    } catch (e) {
      const data = e.response?.data;
      setSaveErr(
        typeof data === 'object'
          ? (data.error || Object.values(data).flat().join(' | '))
          : 'Failed to generate payslip.'
      );
    } finally { setSaving(false); }
  };

  /* ── Download payslip ───────────────────────────────────── */
  const handleDownload = (ps) => {
    const name = isAdmin() ? ps.user_name  : user?.full_name;
    const id   = isAdmin() ? ps.user_emp_id : user?.employee_id;
    const dept = isAdmin() ? ps.user_dept  : user?.department;
    generatePayslipPDF(ps, name, id, dept);
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
              borderRadius:12, padding:'14px 18px', color:'#34d399',
              fontSize:14, fontWeight:600, marginBottom:20, lineHeight:1.5
            }}>
              {successMsg}
            </div>
          )}

          <div className="page-header">
            <div>
              <h1>💰 {isAdmin() ? 'Payroll Management' : 'My Payroll'}</h1>
              <p>{isAdmin() ? `Total net expense: ₹${totalExpense.toLocaleString()}` : 'Your salary details & payslips'}</p>
            </div>
            {isAdmin() && (
              <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
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
                {[
                  ['Basic Salary', salary.basic,  ''],
                  ['Gross Salary', salary.gross,  'green'],
                  ['Deductions',   (Number(salary.pf_deduction||0)+Number(salary.tax_deduction||0)+Number(salary.other_deductions||0)), 'red'],
                  ['Net Salary',   salary.net,    'purple'],
                ].map(([label, val, cls]) => (
                  <div key={label} className="breakdown-item">
                    <div className="breakdown-label">{label}</div>
                    <div className={`breakdown-value ${cls}`}>
                      {cls==='red'?'-':''}₹{Number(val||0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-card" style={{marginBottom:24}}>
                <div className="section-card-head"><h3>📊 Salary Breakdown</h3></div>
                <div className="salary-rows">
                  {[
                    ['Basic Salary',     salary.basic,            ''],
                    ['HRA',              salary.hra,              'green'],
                    ['Transport',        salary.transport,        'green'],
                    ['Medical',          salary.medical,          'green'],
                    ['Other Allowances', salary.other_allowances, 'green'],
                    ['PF Deduction',     salary.pf_deduction,     'red'],
                    ['Tax Deduction',    salary.tax_deduction,    'red'],
                    ['Other Deductions', salary.other_deductions, 'red'],
                  ].map(([label, val, color]) => (
                    <div key={label} className="sal-row">
                      <span className="sal-label">{label}</span>
                      <span className={`sal-val ${color}`}>
                        {color==='red'?'-':''}₹{Number(val||0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="sal-row" style={{borderTop:'1px solid rgba(255,255,255,.12)',paddingTop:14,marginTop:4}}>
                    <span style={{fontWeight:800,color:'var(--text-primary)',fontSize:14}}>Net Salary</span>
                    <span className="sal-val total">₹{Number(salary.net||0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Employee: no salary set */}
          {!isAdmin() && !salary && !loading && (
            <div className="section-card" style={{marginBottom:24}}>
              <div className="empty-state">
                <div className="empty-ico">💰</div>
                <p>Salary not configured yet. Contact your admin.</p>
              </div>
            </div>
          )}

          {/* ── Payslips list ── */}
          <div className="section-card">
            <div className="section-card-head">
              <h3>📄 {isAdmin() ? 'All Payslips' : 'My Payslips'}</h3>
              <span style={{fontSize:13,color:'rgba(255,255,255,.4)'}}>
                {payslips.length} payslip{payslips.length !== 1 ? 's' : ''}
              </span>
            </div>

            {loading ? (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:90,borderRadius:14}}/>)}
              </div>
            ) : payslips.length === 0 ? (
              <div className="empty-state">
                <div className="empty-ico">📄</div>
                <p style={{marginBottom:8}}>No payslips generated yet</p>
                {isAdmin() && (
                  <p style={{fontSize:12,color:'rgba(255,255,255,.3)'}}>
                    Set an employee's salary first, then click "Generate Payslip"
                  </p>
                )}
              </div>
            ) : (
              payslips.map(ps => (
                <div key={ps.id} className="payslip-card">
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                      <div className="payslip-month">
                        {MONTHS[(ps.month||1)-1]} {ps.year}
                      </div>
                      {ps.paid
                        ? <span className="pill pill-green">✅ Paid</span>
                        : <span className="pill pill-amber">⏳ Pending</span>
                      }
                    </div>
                    {isAdmin() && (
                      <div style={{fontSize:13,color:'rgba(255,255,255,.55)',marginBottom:6}}>
                        👤 {ps.user_name} &nbsp;·&nbsp; {ps.user_emp_id}
                      </div>
                    )}
                    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
                      <span className="pill pill-gray">📅 {ps.days_worked} days</span>
                      <span style={{fontSize:12,color:'rgba(255,255,255,.4)'}}>
                        Gross: ₹{Number(ps.gross||0).toLocaleString()}
                      </span>
                      <span style={{fontSize:12,color:'#f87171'}}>
                        Ded: -₹{Number(ps.deductions||0).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div style={{textAlign:'right',flexShrink:0}}>
                    <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginBottom:4}}>Net Salary</div>
                    <div className="payslip-net" style={{marginBottom:10}}>
                      ₹{Number(ps.net||0).toLocaleString()}
                    </div>
                    <div style={{display:'flex',gap:8,justifyContent:'flex-end',flexWrap:'wrap'}}>
                      <button className="payslip-dl" onClick={() => handleDownload(ps)}>
                        ⬇ Download PDF
                      </button>
                      {isAdmin() && !ps.paid && (
                        <button
                          style={{
                            padding:'8px 14px',background:'rgba(16,185,129,.12)',
                            border:'1px solid rgba(16,185,129,.3)',borderRadius:10,
                            color:'#34d399',fontSize:12,fontWeight:700,cursor:'pointer'
                          }}
                          onClick={async () => {
                            try {
                              await payrollAPI.markPaid(ps.id);
                              fetchData();
                            } catch {}
                          }}
                        >
                          ✅ Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* ── SET SALARY MODAL ── */}
      <Modal open={showSet} onClose={() => { setShowSet(false); setSaveErr(''); }}
        title="⚙️ Set Salary Structure" width="600px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowSet(false); setSaveErr(''); }}>Cancel</button>
          <button className="btn-primary" onClick={handleSetSalary} disabled={saving}>
            {saving ? <><div className="spin"/>Saving…</> : '💾 Save Salary'}
          </button>
        </>}>

        {saveErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:16}}>⚠ {saveErr}</div>}

        <div style={{background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:10,padding:'10px 14px',color:'#a5b4fc',fontSize:13,marginBottom:18}}>
          💡 Set the salary for an employee first. Then you can generate their monthly payslip.
        </div>

        <div className="field" style={{marginBottom:18}}>
          <label>Employee *</label>
          <select value={salForm.user} onChange={e => setSalForm(p => ({...p, user: e.target.value}))}>
            <option value="">Select employee…</option>
            {employees.length === 0
              ? <option disabled>No employees — add employees first</option>
              : employees.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>)
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
              <input type="number" min="0" placeholder="0"
                value={salForm[key]}
                onChange={e => setSalForm(p => ({...p, [key]: e.target.value}))}/>
            </div>
          ))}
          <div className="field">
            <label>Effective From</label>
            <input type="date" value={salForm.effective_from}
              onChange={e => setSalForm(p => ({...p, effective_from: e.target.value}))}/>
          </div>
        </div>

        {/* Live net preview */}
        {salForm.basic && Number(salForm.basic) > 0 && (() => {
          const gross = Number(salForm.basic||0) + Number(salForm.hra||0) +
            Number(salForm.transport||0) + Number(salForm.medical||0) + Number(salForm.other_allowances||0);
          const deds  = Number(salForm.pf_deduction||0) + Number(salForm.tax_deduction||0) + Number(salForm.other_deductions||0);
          const net   = gross - deds;
          return (
            <div style={{background:'rgba(16,185,129,.08)',border:'1px solid rgba(16,185,129,.2)',borderRadius:10,padding:'12px 16px',marginTop:10,display:'flex',gap:24,flexWrap:'wrap'}}>
              <div><div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Gross</div><div style={{fontSize:16,fontWeight:800,color:'#34d399'}}>₹{gross.toLocaleString()}</div></div>
              <div><div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Deductions</div><div style={{fontSize:16,fontWeight:800,color:'#f87171'}}>-₹{deds.toLocaleString()}</div></div>
              <div><div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Net Salary</div><div style={{fontSize:16,fontWeight:800,color:'#818cf8'}}>₹{net.toLocaleString()}</div></div>
            </div>
          );
        })()}
      </Modal>

      {/* ── GENERATE PAYSLIP MODAL ── */}
      <Modal open={showGen} onClose={() => { setShowGen(false); setSaveErr(''); }}
        title="📄 Generate Payslip" width="440px"
        footer={<>
          <button className="btn-ghost" onClick={() => { setShowGen(false); setSaveErr(''); }}>Cancel</button>
          <button className="btn-primary" onClick={handleGenerate} disabled={saving}>
            {saving ? <><div className="spin"/>Generating…</> : '🚀 Generate'}
          </button>
        </>}>

        {saveErr && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,padding:'10px 14px',color:'#fca5a5',fontSize:13,marginBottom:16}}>⚠ {saveErr}</div>}

        <div style={{background:'rgba(99,102,241,.08)',border:'1px solid rgba(99,102,241,.2)',borderRadius:10,padding:'10px 14px',color:'#a5b4fc',fontSize:12,marginBottom:18}}>
          ⚠ Employee must have a salary structure set before generating a payslip.
        </div>

        <div className="field" style={{marginBottom:18}}>
          <label>Employee *</label>
          <select value={genForm.user} onChange={e => setGenForm(p => ({...p, user: e.target.value}))}>
            <option value="">Select employee…</option>
            {employees.length === 0
              ? <option disabled>No employees found</option>
              : employees.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.employee_id})</option>)
            }
          </select>
        </div>

        <div className="two-col">
          <div className="field">
            <label>Month</label>
            <select value={genForm.month} onChange={e => setGenForm(p => ({...p, month: Number(e.target.value)}))}>
              {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Year</label>
            <input type="number" min="2020" max="2099" value={genForm.year}
              onChange={e => setGenForm(p => ({...p, year: Number(e.target.value)}))}/>
          </div>
          <div className="field">
            <label>Days Worked</label>
            <input type="number" min="1" max="31" value={genForm.days_worked}
              onChange={e => setGenForm(p => ({...p, days_worked: Number(e.target.value)}))}/>
          </div>
        </div>
      </Modal>
    </div>
  );
}