import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { AttendanceBarChart, SalaryLineChart, DepartmentPieChart, TaskStatusChart } from '../../components/Charts/Charts';
import { employeesAPI, attendanceAPI, leavesAPI, tasksAPI, payrollAPI } from '../../services/api';
import '../AdminDashboard/AdminDashboard.css';
import './Reports.css';

const ATTEND_DATA = [
  { month:'Jan', present:85, absent:15 }, { month:'Feb', present:78, absent:22 },
  { month:'Mar', present:90, absent:10 }, { month:'Apr', present:88, absent:12 },
  { month:'May', present:82, absent:18 }, { month:'Jun', present:95, absent:5  },
  { month:'Jul', present:88, absent:12 }, { month:'Aug', present:91, absent:9  },
];
const SALARY_DATA = [
  { month:'Jan', amount:420000 }, { month:'Feb', amount:438000 },
  { month:'Mar', amount:415000 }, { month:'Apr', amount:452000 },
  { month:'May', amount:448000 }, { month:'Jun', amount:465000 },
  { month:'Jul', amount:471000 }, { month:'Aug', amount:480000 },
];
const DEPT_DATA = [
  { name:'Engineering', value:14 }, { name:'HR', value:5 },
  { name:'Finance', value:7 },     { name:'Marketing', value:8 },
  { name:'Design', value:4 },      { name:'Sales', value:10 },
];
const TASK_DATA = [
  { status:'Completed', count:34 }, { status:'In Progress', count:18 },
  { status:'To Do', count:12 },     { status:'Review', count:8 },
  { status:'Cancelled', count:3 },
];
const SUMMARY_STATS = [
  { label:'Total Payroll YTD',   value:'₹38.9L', icon:'💰', color:'#818cf8' },
  { label:'Avg Attendance Rate', value:'88.4%',  icon:'📅', color:'#34d399' },
  { label:'Tasks Completed',     value:'128',    icon:'✅', color:'#60a5fa' },
  { label:'Leave Days Taken',    value:'247',    icon:'🏖️', color:'#fbbf24' },
];

// ── CSV download helper ────────────────────────────────────
function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    alert('No data found to download.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = String(row[h] ?? '');
        return v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Per-report fetch + download functions ──────────────────
async function dlAttendance() {
  const { data } = await attendanceAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(a => ({
    Employee: a.employee_name || a.employee || '—',
    Date:     a.date    || '—',
    Status:   a.status  || '—',
    CheckIn:  a.check_in  || '—',
    CheckOut: a.check_out || '—',
  }));
  downloadCSV('attendance_report.csv', rows);
}

async function dlPayroll() {
  const { data } = await payrollAPI.getAllPayslips();
  const rows = (Array.isArray(data) ? data : data.results || []).map(p => ({
    Employee:   p.user_name || '—',
    Month:      p.month || '—',
    Year:       p.year  || '—',
    Basic:      p.basic || '—',
    Gross:      p.gross || '—',
    Deductions: p.deductions || '—',
    Net:        p.net   || '—',
    DaysWorked: p.days_worked || '—',
    Paid:       p.paid ? 'Yes' : 'No',
  }));
  downloadCSV('payroll_report.csv', rows);
}

async function dlLeaves() {
  const { data } = await leavesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(l => ({
    Employee:  l.user_name || '—',
    LeaveType: l.leave_type || '—',
    StartDate: l.start_date || '—',
    EndDate:   l.end_date   || '—',
    Days:      l.days || '—',
    Status:    l.status || '—',
  }));
  downloadCSV('leave_report.csv', rows);
}

async function dlTasks() {
  const { data } = await tasksAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(t => ({
    Title:      t.title || '—',
    AssignedTo: t.assigned_to_name || '—',
    Status:     t.status   || '—',
    Priority:   t.priority || '—',
    DueDate:    t.due_date || '—',
  }));
  downloadCSV('task_report.csv', rows);
}

async function dlEmployees() {
  const { data } = await employeesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(e => ({
    FullName:    e.user?.full_name   || '—',
    Email:       e.user?.email       || '—',
    EmployeeID:  e.user?.employee_id || '—',
    Department:  e.department  || '—',
    Designation: e.designation || '—',
    Status:      e.status      || '—',
  }));
  downloadCSV('employee_report.csv', rows);
}

function dlPerformance() {
  downloadCSV('performance_report.csv', TASK_DATA.map(t => ({
    Status: t.status, Count: t.count,
  })));
}

// ── Report config ──────────────────────────────────────────
const REPORTS = [
  { icon:'📅', title:'Attendance Report',  desc:'Monthly check-in/out records',  fn: dlAttendance  },
  { icon:'💰', title:'Payroll Report',     desc:'Salary & payslip summary',       fn: dlPayroll     },
  { icon:'🏖️', title:'Leave Report',       desc:'Leave taken by all employees',   fn: dlLeaves      },
  { icon:'✅', title:'Task Report',        desc:'Task completion statistics',      fn: dlTasks       },
  { icon:'👥', title:'Employee Report',   desc:'Full employee directory',          fn: dlEmployees   },
  { icon:'📊', title:'Performance Report',desc:'KPIs & productivity overview',    fn: dlPerformance },
];

export default function Reports() {
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [period,       setPeriod]       = useState('6m');
  const [downloading,  setDownloading]  = useState(null);

  const handleDownload = async (report) => {
    setDownloading(report.title);
    try { await report.fn(); }
    catch { alert(`Failed to download ${report.title}. Please try again.`); }
    finally { setDownloading(null); }
  };

  const handleExportAll = async () => {
    setDownloading('all');
    try {
      await dlEmployees();
      await dlAttendance();
      await dlLeaves();
      await dlTasks();
      await dlPayroll();
    } catch { alert('Some reports failed. Try downloading individually.'); }
    finally { setDownloading(null); }
  };

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Reports & Analytics" subtitle="Business intelligence overview"
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">
          <div className="page-header">
            <div>
              <h1>📈 Reports & Analytics</h1>
              <p>Company-wide performance metrics</p>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              <div style={{display:'flex',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:4,gap:4}}>
                {['1m','3m','6m','1y'].map(p => (
                  <button key={p}
                    style={{padding:'6px 14px',border:'none',borderRadius:8,cursor:'pointer',
                      fontFamily:'inherit',fontSize:12,fontWeight:700,
                      background:period===p?'rgba(99,102,241,.25)':'none',
                      color:period===p?'#fff':'rgba(255,255,255,.4)',transition:'all .2s'}}
                    onClick={()=>setPeriod(p)}>{p}
                  </button>
                ))}
              </div>
              <button className="qa-btn" onClick={handleExportAll} disabled={downloading==='all'}>
                {downloading==='all' ? '⏳ Exporting…' : '⬇ Export All'}
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="stats-grid" style={{marginBottom:28}}>
            {SUMMARY_STATS.map(s=>(
              <div key={s.label} className="section-card" style={{padding:'20px 22px'}}>
                <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:800,color:s.color,letterSpacing:'-1px'}}>{s.value}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="charts-grid">
            <AttendanceBarChart data={ATTEND_DATA}/>
            <DepartmentPieChart data={DEPT_DATA}/>
            <SalaryLineChart    data={SALARY_DATA}/>
            <TaskStatusChart    data={TASK_DATA}/>
          </div>

          {/* Download cards */}
          <div className="section-card" style={{marginTop:4}}>
            <div className="section-card-head"><h3>📥 Download Reports</h3></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {REPORTS.map(r=>(
                <div key={r.title}
                  style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
                    borderRadius:14,padding:18,transition:'all .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,.3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}
                >
                  <div style={{fontSize:26,marginBottom:10}}>{r.icon}</div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:4}}>{r.title}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:14}}>{r.desc}</div>
                  <button
                    className="payslip-dl"
                    style={{fontSize:12,padding:'6px 14px',cursor:'pointer',
                      opacity: downloading===r.title ? 0.6 : 1}}
                    disabled={downloading===r.title}
                    onClick={()=>handleDownload(r)}
                  >
                    {downloading===r.title ? '⏳ Downloading…' : '⬇ Download CSV'}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}