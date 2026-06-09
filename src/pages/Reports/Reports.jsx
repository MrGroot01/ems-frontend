import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { AttendanceBarChart, SalaryLineChart, DepartmentPieChart, TaskStatusChart } from '../../components/Charts/Charts';
import { employeesAPI, attendanceAPI, leavesAPI, tasksAPI, payrollAPI } from '../../services/api';
import '../AdminDashboard/AdminDashboard.css';
import './Reports.css';

// ── CSV helper ─────────────────────────────────────────────
function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) { alert('No data found.'); return; }
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

// ── Download functions ─────────────────────────────────────
async function dlAttendance() {
  const { data } = await attendanceAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(a => ({
    Employee:        a.employee_name || a.employee || '—',
    Date:            a.date         || '—',
    Status:          a.status       || '—',
    CheckIn:         a.check_in     || '—',
    CheckOut:        a.check_out    || '—',
    WorkingHours:    a.working_hours|| '—',
    AttendanceType:  a.attendance_type || '—',
  }));
  downloadCSV('attendance_report.csv', rows);
}
async function dlPayroll() {
  const { data } = await payrollAPI.getAllPayslips();
  const rows = (Array.isArray(data) ? data : data.results || []).map(p => ({
    Employee: p.user_name || '—', Month: p.month || '—', Year: p.year || '—',
    Basic: p.basic || '—', Gross: p.gross || '—',
    Deductions: p.deductions || '—', Net: p.net || '—',
    DaysWorked: p.days_worked || '—', Paid: p.paid ? 'Yes' : 'No',
  }));
  downloadCSV('payroll_report.csv', rows);
}
async function dlLeaves() {
  const { data } = await leavesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(l => ({
    Employee: l.user_name || '—', LeaveType: l.leave_type || '—',
    StartDate: l.start_date || '—', EndDate: l.end_date || '—',
    Days: l.days || '—', Status: l.status || '—',
  }));
  downloadCSV('leave_report.csv', rows);
}
async function dlTasks() {
  const { data } = await tasksAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(t => ({
    Title: t.title || '—', AssignedTo: t.assigned_to_name || '—',
    Status: t.status || '—', Priority: t.priority || '—', DueDate: t.due_date || '—',
  }));
  downloadCSV('task_report.csv', rows);
}
async function dlEmployees() {
  const { data } = await employeesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(e => ({
    FullName: e.user?.full_name || '—', Email: e.user?.email || '—',
    EmployeeID: e.user?.employee_id || '—', Department: e.department || '—',
    Designation: e.designation || '—', Status: e.status || '—',
  }));
  downloadCSV('employee_report.csv', rows);
}

const REPORTS = [
  { icon:'📅', title:'Attendance Report',   desc:'Monthly check-in/out records',  fn: dlAttendance },
  { icon:'💰', title:'Payroll Report',      desc:'Salary & payslip summary',       fn: dlPayroll    },
  { icon:'🏖️', title:'Leave Report',        desc:'Leave taken by all employees',   fn: dlLeaves     },
  { icon:'✅', title:'Task Report',         desc:'Task completion statistics',      fn: dlTasks      },
  { icon:'👥', title:'Employee Report',    desc:'Full employee directory',          fn: dlEmployees  },
];

// ── Month name helper ──────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [period,      setPeriod]      = useState('6m');
  const [downloading, setDownloading] = useState(null);
  const [loading,     setLoading]     = useState(true);

  // ── Live chart data ──────────────────────────────────────
  const [attendData,  setAttendData]  = useState([]);
  const [salaryData,  setSalaryData]  = useState([]);
  const [deptData,    setDeptData]    = useState([]);
  const [taskData,    setTaskData]    = useState([]);
  const [summaryStats,setSummaryStats]= useState({
    totalPayroll: '—', avgAttendance: '—', tasksCompleted: '—', leaveDays: '—',
  });

  useEffect(() => { fetchAllData(); }, [period]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes, taskRes, payRes] = await Promise.allSettled([
        employeesAPI.getAll(),
        attendanceAPI.getAll(),
        leavesAPI.getAll(),
        tasksAPI.getAll(),
        payrollAPI.getAllPayslips(),
      ]);

      // ── EMPLOYEES → Department pie chart ────────────────
      if (empRes.status === 'fulfilled') {
        const emps = Array.isArray(empRes.value.data)
          ? empRes.value.data : (empRes.value.data.results || []);
        const deptMap = {};
        emps.forEach(e => {
          const d = e.department || 'other';
          deptMap[d] = (deptMap[d] || 0) + 1;
        });
        setDeptData(Object.entries(deptMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), value,
        })));
      }

      // ── ATTENDANCE → Bar chart + avg rate ───────────────
      if (attRes.status === 'fulfilled') {
        const atts = Array.isArray(attRes.value.data)
          ? attRes.value.data : (attRes.value.data.results || []);

        // Filter by selected period
        const cutoff = getPeriodCutoff(period);
        const filtered = atts.filter(a => new Date(a.date) >= cutoff);

        // Group by month
        const monthMap = {};
        filtered.forEach(a => {
          const d     = new Date(a.date);
          const key   = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
          const short = MONTH_NAMES[d.getMonth()];
          if (!monthMap[key]) monthMap[key] = { month: short, present: 0, absent: 0 };
          if (a.status === 'present' || a.status === 'late') monthMap[key].present++;
          else monthMap[key].absent++;
        });

        const sorted = Object.values(monthMap).sort((a, b) => {
          const ai = MONTH_NAMES.indexOf(a.month);
          const bi = MONTH_NAMES.indexOf(b.month);
          return ai - bi;
        });
        setAttendData(sorted.length > 0 ? sorted : []);

        // Avg attendance rate
        const total   = filtered.length;
        const present = filtered.filter(a => a.status === 'present' || a.status === 'late').length;
        const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

        setSummaryStats(prev => ({ ...prev, avgAttendance: `${rate}%` }));
      }

      // ── LEAVES → leave days taken ────────────────────────
      if (leaveRes.status === 'fulfilled') {
        const leaves = Array.isArray(leaveRes.value.data)
          ? leaveRes.value.data : (leaveRes.value.data.results || []);
        const approved = leaves.filter(l => l.status === 'approved');
        const totalDays = approved.reduce((sum, l) => sum + (Number(l.days) || 0), 0);
        setSummaryStats(prev => ({ ...prev, leaveDays: String(totalDays) }));
      }

      // ── TASKS → status chart + completed count ───────────
      if (taskRes.status === 'fulfilled') {
        const tasks = Array.isArray(taskRes.value.data)
          ? taskRes.value.data : (taskRes.value.data.results || []);

        const completed  = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const todo       = tasks.filter(t => t.status === 'todo' || t.status === 'pending').length;
        const review     = tasks.filter(t => t.status === 'review').length;
        const cancelled  = tasks.filter(t => t.status === 'cancelled').length;

        setTaskData([
          { status: 'Completed',   count: completed  },
          { status: 'In Progress', count: inProgress },
          { status: 'To Do',       count: todo       },
          { status: 'Review',      count: review     },
          { status: 'Cancelled',   count: cancelled  },
        ]);
        setSummaryStats(prev => ({ ...prev, tasksCompleted: String(completed) }));
      }

      // ── PAYROLL → salary trend + total payroll ──────────
      if (payRes.status === 'fulfilled') {
        const payslips = Array.isArray(payRes.value.data)
          ? payRes.value.data : (payRes.value.data.results || []);

        // Group net salary by month
        const salMap = {};
        payslips.forEach(p => {
          const key = MONTH_NAMES[(p.month || 1) - 1];
          if (!salMap[key]) salMap[key] = { month: key, amount: 0 };
          salMap[key].amount += Number(p.net || 0);
        });

        // Sort by month order
        const salSorted = Object.values(salMap).sort(
          (a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month)
        );
        setSalaryData(salSorted.length > 0 ? salSorted : []);

        // Total payroll YTD
        const ytd = payslips.reduce((sum, p) => sum + Number(p.net || 0), 0);
        const formatted = ytd >= 100000
          ? `₹${(ytd / 100000).toFixed(1)}L`
          : `₹${(ytd / 1000).toFixed(0)}K`;
        setSummaryStats(prev => ({ ...prev, totalPayroll: formatted }));
      }

    } catch (e) {
      console.error('Reports fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── Period cutoff date ─────────────────────────────────
  const getPeriodCutoff = (p) => {
    const d = new Date();
    if (p === '1m') d.setMonth(d.getMonth() - 1);
    else if (p === '3m') d.setMonth(d.getMonth() - 3);
    else if (p === '6m') d.setMonth(d.getMonth() - 6);
    else if (p === '1y') d.setFullYear(d.getFullYear() - 1);
    return d;
  };

  const handleDownload = async (report) => {
    setDownloading(report.title);
    try { await report.fn(); }
    catch { alert(`Failed to download ${report.title}.`); }
    finally { setDownloading(null); }
  };

  const handleExportAll = async () => {
    setDownloading('all');
    try {
      await dlEmployees(); await dlAttendance();
      await dlLeaves();    await dlTasks(); await dlPayroll();
    } catch { alert('Some reports failed.'); }
    finally { setDownloading(null); }
  };

  const SUMMARY = [
    { label:'Total Payroll YTD',   value: summaryStats.totalPayroll,   icon:'💰', color:'#818cf8' },
    { label:'Avg Attendance Rate', value: summaryStats.avgAttendance,  icon:'📅', color:'#34d399' },
    { label:'Tasks Completed',     value: summaryStats.tasksCompleted, icon:'✅', color:'#60a5fa' },
    { label:'Leave Days Taken',    value: summaryStats.leaveDays,      icon:'🏖️', color:'#fbbf24' },
  ];

  const Skeleton = () => (
    <div className="skeleton" style={{height:180,borderRadius:16}}/>
  );

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Reports & Analytics" subtitle="Live business intelligence"
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">

          {/* ── Header ──────────────────────────────────── */}
          <div className="page-header">
            <div>
              <h1>📈 Reports & Analytics</h1>
              <p>Live company-wide performance metrics</p>
            </div>
            <div style={{display:'flex',gap:10,alignItems:'center'}}>
              {/* Period selector */}
              <div style={{display:'flex',background:'rgba(255,255,255,.04)',
                border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:4,gap:4}}>
                {['1m','3m','6m','1y'].map(p => (
                  <button key={p}
                    style={{padding:'6px 14px',border:'none',borderRadius:8,cursor:'pointer',
                      fontFamily:'inherit',fontSize:12,fontWeight:700,
                      background:period===p?'rgba(99,102,241,.25)':'none',
                      color:period===p?'#fff':'rgba(255,255,255,.4)',transition:'all .2s'}}
                    onClick={() => setPeriod(p)}>{p}
                  </button>
                ))}
              </div>

              {/* Refresh button */}
              <button
                onClick={fetchAllData}
                disabled={loading}
                style={{padding:'8px 16px',border:'1px solid rgba(255,255,255,.12)',
                  borderRadius:10,background:'transparent',color:'rgba(255,255,255,.6)',
                  cursor: loading?'not-allowed':'pointer',fontSize:12,fontFamily:'inherit',
                  display:'flex',alignItems:'center',gap:6}}>
                {loading ? '⏳' : '🔄'} {loading ? 'Loading…' : 'Refresh'}
              </button>

              <button className="qa-btn" onClick={handleExportAll}
                disabled={downloading==='all'}>
                {downloading==='all' ? '⏳ Exporting…' : '⬇ Export All'}
              </button>
            </div>
          </div>

          {/* ── KPI Cards (live) ─────────────────────────── */}
          <div className="stats-grid" style={{marginBottom:28}}>
            {SUMMARY.map(s => (
              <div key={s.label} className="section-card" style={{padding:'20px 22px'}}>
                <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                {loading
                  ? <div className="skeleton" style={{height:32,width:'60%',borderRadius:8,marginBottom:8}}/>
                  : <div style={{fontSize:28,fontWeight:800,color:s.color,letterSpacing:'-1px'}}>
                      {s.value}
                    </div>
                }
                <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Charts (live) ────────────────────────────── */}
          <div className="charts-grid">
            {loading ? <Skeleton/> : <AttendanceBarChart data={attendData}/>}
            {loading ? <Skeleton/> : <DepartmentPieChart
              data={deptData.length > 0 ? deptData : [{name:'No data',value:1}]}/>}
            {loading ? <Skeleton/> : <SalaryLineChart data={salaryData}/>}
            {loading ? <Skeleton/> : <TaskStatusChart data={taskData}/>}
          </div>

          {/* ── Download cards ───────────────────────────── */}
          <div className="section-card" style={{marginTop:4}}>
            <div className="section-card-head">
              <h3>📥 Download Reports</h3>
              <span style={{fontSize:12,color:'rgba(255,255,255,.35)'}}>
                Live data from database
              </span>
            </div>
            <div style={{display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {REPORTS.map(r => (
                <div key={r.title}
                  style={{background:'rgba(255,255,255,.04)',
                    border:'1px solid rgba(255,255,255,.08)',
                    borderRadius:14,padding:18,transition:'all .2s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,.3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}
                >
                  <div style={{fontSize:26,marginBottom:10}}>{r.icon}</div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:4}}>
                    {r.title}
                  </div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:14}}>
                    {r.desc}
                  </div>
                  <button
                    className="payslip-dl"
                    style={{fontSize:12,padding:'6px 14px',cursor:'pointer',
                      opacity: downloading===r.title ? 0.6 : 1}}
                    disabled={downloading===r.title}
                    onClick={() => handleDownload(r)}
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