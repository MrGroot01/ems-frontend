import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import {
  AttendanceBarChart,
  SalaryLineChart,
  DepartmentPieChart,
  TaskStatusChart,
} from '../../components/Charts/Charts';
import {
  employeesAPI,
  attendanceAPI,
  leavesAPI,
  tasksAPI,
  payrollAPI,
} from '../../services/api';
import '../AdminDashboard/AdminDashboard.css';
import './Reports.css';

// ══════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

function getPeriodCutoff(p) {
  const d = new Date();
  if      (p === '1m') d.setMonth(d.getMonth() - 1);
  else if (p === '3m') d.setMonth(d.getMonth() - 3);
  else if (p === '6m') d.setMonth(d.getMonth() - 6);
  else if (p === '1y') d.setFullYear(d.getFullYear() - 1);
  return d;
}

function fmtCurrency(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`;
  return `₹${n}`;
}

// Safely get employee name from any attendance record shape
function getEmpName(a) {
  return (
    a.employee_name      ||   // most common
    a.user_name          ||   // alternative
    a.full_name          ||   // flat
    a.employee           ||   // your API may use this
    a.user?.full_name    ||   // nested object
    a.user?.username     ||   // nested username
    (a.user && typeof a.user === 'string' ? a.user : null) ||
    null                      // will be grouped as "Unknown"
  );
}

// Map any status string to 'present' | 'absent' | 'late'
function normaliseStatus(raw) {
  const s = (raw || '').toLowerCase().trim();
  if (s === 'present')                                return 'present';
  if (s === 'late' || s === 'late_arrival')           return 'late';
  if (['absent','leave','on_leave','holiday',
       'sick','unpaid','casual'].includes(s))          return 'absent';
  if (s === '')                                        return 'absent';
  // anything else — treat as present (e.g. 'work_from_home')
  console.log('[Reports] unmapped attendance status:', JSON.stringify(s));
  return 'present';
}

// ── CSV helpers ───────────────────────────────────────────────
function downloadCSV(filename, rows) {
  if (!rows?.length) { alert('No data found.'); return; }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const v = String(row[h] ?? '');
        return v.includes(',') ? `"${v.replace(/"/g,'""')}"` : v;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

async function dlAttendance() {
  const { data } = await attendanceAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(a => ({
    Employee:       getEmpName(a) || '—',
    Date:           a.date          || '—',
    Status:         a.status        || '—',
    CheckIn:        a.check_in      || '—',
    CheckOut:       a.check_out     || '—',
    WorkingHours:   a.working_hours || '—',
  }));
  downloadCSV('attendance_report.csv', rows);
}
async function dlPayroll() {
  const { data } = await payrollAPI.getAllPayslips();
  const rows = (Array.isArray(data) ? data : data.results || []).map(p => ({
    Employee:   p.user_name   || '—', Month: p.month || '—',
    Basic:      p.basic       || '—', Gross: p.gross || '—',
    Deductions: p.deductions  || '—', Net:   p.net   || '—',
    DaysWorked: p.days_worked || '—', Paid:  p.paid ? 'Yes' : 'No',
  }));
  downloadCSV('payroll_report.csv', rows);
}
async function dlLeaves() {
  const { data } = await leavesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(l => ({
    Employee:  l.user_name   || '—', LeaveType: l.leave_type || '—',
    StartDate: l.start_date  || '—', EndDate:   l.end_date   || '—',
    Days:      l.days        || '—', Status:    l.status     || '—',
  }));
  downloadCSV('leave_report.csv', rows);
}
async function dlTasks() {
  const { data } = await tasksAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(t => ({
    Title:      t.title            || '—',
    AssignedTo: t.assigned_to_name || '—',
    Status:     t.status           || '—',
    Priority:   t.priority         || '—',
    DueDate:    t.due_date         || '—',
    Progress:   `${t.progress || 0}%`,
  }));
  downloadCSV('task_report.csv', rows);
}
async function dlEmployees() {
  const { data } = await employeesAPI.getAll();
  const rows = (Array.isArray(data) ? data : data.results || []).map(e => ({
    FullName:    e.user?.full_name   || e.full_name   || '—',
    Email:       e.user?.email       || e.email       || '—',
    EmployeeID:  e.user?.employee_id || e.employee_id || '—',
    Department:  e.department        || '—',
    Designation: e.designation       || '—',
    Status:      e.status            || '—',
  }));
  downloadCSV('employee_report.csv', rows);
}

const REPORTS = [
  { icon:'📅', title:'Attendance Report', desc:'Daily check-in/out records with status', fn: dlAttendance },
  { icon:'💰', title:'Payroll Report',    desc:'Salary, payslips & deductions',          fn: dlPayroll    },
  { icon:'🏖️', title:'Leave Report',      desc:'All leave requests & approvals',         fn: dlLeaves     },
  { icon:'✅', title:'Task Report',       desc:'Task status, priority & progress',        fn: dlTasks      },
  { icon:'👥', title:'Employee Report',  desc:'Full employee directory & departments',    fn: dlEmployees  },
];

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════
function Skeleton({ h = 220 }) {
  return <div className="skeleton" style={{ height: h, borderRadius: 16 }} />;
}

function MiniBar({ pct, color = '#6366f1' }) {
  return (
    <div style={{ height: 5, background: 'rgba(255,255,255,.08)',
      borderRadius: 4, overflow: 'hidden', marginTop: 8 }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, pct))}%`,
        height: '100%', background: color,
        borderRadius: 4, transition: 'width .6s ease',
      }} />
    </div>
  );
}

function statusStyle(s) {
  if (s === 'approved') return { bg: 'rgba(16,185,129,.15)',  color: '#34d399' };
  if (s === 'pending')  return { bg: 'rgba(245,158,11,.15)',  color: '#fbbf24' };
  if (s === 'rejected') return { bg: 'rgba(239,68,68,.15)',   color: '#f87171' };
  return                       { bg: 'rgba(255,255,255,.06)', color: '#94a3b8' };
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function Reports() {
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [period,      setPeriod]      = useState('6m');
  const [downloading, setDownloading] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [attendData,   setAttendData]   = useState([]);
  const [salaryData,   setSalaryData]   = useState([]);
  const [deptData,     setDeptData]     = useState([]);
  const [taskData,     setTaskData]     = useState([]);
  const [topEmployees, setTopEmployees] = useState([]);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [taskBreakdown,setTaskBreakdown]= useState({ completed:0, inProgress:0, todo:0, overdue:0, total:0 });

  const [stats, setStats] = useState({
    totalPayroll: null, avgAttendance: null, absenceRate: null,
    tasksCompleted: null, taskCompRate: null,
    leaveDays: null, pendingLeaves: null, totalEmployees: null, overdueCount: null,
  });

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes, taskRes, payRes] = await Promise.allSettled([
        employeesAPI.getAll(),
        attendanceAPI.getAll(),
        leavesAPI.getAll(),
        tasksAPI.getAll(),
        payrollAPI.getAllPayslips(),
      ]);

      const cutoff = getPeriodCutoff(period);

      // ── EMPLOYEES → department pie ──────────────────────────
      let totalEmployees = 0;
      if (empRes.status === 'fulfilled') {
        const emps = Array.isArray(empRes.value.data)
          ? empRes.value.data : (empRes.value.data.results || []);
        totalEmployees = emps.length;
        const deptMap = {};
        emps.forEach(e => {
          const d = e.department || 'Other';
          deptMap[d] = (deptMap[d] || 0) + 1;
        });
        setDeptData(Object.entries(deptMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), value,
        })));
      }

      // ── ATTENDANCE → bar chart, KPIs, top employees ─────────
      if (attRes.status === 'fulfilled') {
        const atts = Array.isArray(attRes.value.data)
          ? attRes.value.data : (attRes.value.data.results || []);

        // Debug: log first record to see actual shape
        if (atts[0]) {
          console.log('[Reports] Attendance record shape:', JSON.stringify(atts[0]));
        }

        const filtered = atts.filter(a => a.date && new Date(a.date) >= cutoff);

        // ── Group by month ──────────────────────────────────────
        const monthMap = {};
        filtered.forEach(a => {
          const d    = new Date(a.date);
          const mKey = `${d.getFullYear()}-${d.getMonth()}`;
          if (!monthMap[mKey]) {
            monthMap[mKey] = {
              month:   MONTH_NAMES[d.getMonth()],
              order:   d.getMonth(),
              present: 0,
              absent:  0,
            };
          }
          const norm = normaliseStatus(a.status);
          if (norm === 'present' || norm === 'late') monthMap[mKey].present++;
          else                                        monthMap[mKey].absent++;
        });

        setAttendData(
          Object.values(monthMap).sort((a, b) => a.order - b.order)
        );

        // ── KPI rates ───────────────────────────────────────────
        const total   = filtered.length;
        const present = filtered.filter(a => {
          const n = normaliseStatus(a.status);
          return n === 'present' || n === 'late';
        }).length;
        const rate    = total > 0 ? Math.round((present / total) * 100) : 0;
        const absRate = total > 0 ? Math.round(((total - present) / total) * 100) : 0;

        // ── Top employees by attendance rate ────────────────────
        const empMap = {};
        filtered.forEach(a => {
          const name = getEmpName(a) || 'Unknown';
          if (!empMap[name]) empMap[name] = { name, present: 0, total: 0 };
          empMap[name].total++;
          const n = normaliseStatus(a.status);
          if (n === 'present' || n === 'late') empMap[name].present++;
        });

        const top = Object.values(empMap)
          .map(e => ({ ...e, rate: Math.round((e.present / e.total) * 100) }))
          .sort((a, b) => b.rate - a.rate)
          .slice(0, 5);
        setTopEmployees(top);

        setStats(p => ({ ...p, avgAttendance: rate, absenceRate: absRate }));
      }

      // ── LEAVES → KPI + recent table ─────────────────────────
      if (leaveRes.status === 'fulfilled') {
        const leaves = Array.isArray(leaveRes.value.data)
          ? leaveRes.value.data : (leaveRes.value.data.results || []);
        const approved  = leaves.filter(l => l.status === 'approved');
        const pending   = leaves.filter(l => l.status === 'pending');
        const totalDays = approved.reduce((s, l) => s + (Number(l.days) || 0), 0);

        setRecentLeaves(
          leaves.slice(0, 5).map(l => ({
            name:      l.user_name  || '—',
            type:      l.leave_type || '—',
            days:      l.days       || 0,
            status:    l.status     || '—',
            startDate: l.start_date || '—',
          }))
        );
        setStats(p => ({ ...p, leaveDays: totalDays, pendingLeaves: pending.length }));
      }

      // ── TASKS → task overview chart + KPI ───────────────────
      if (taskRes.status === 'fulfilled') {
        const tasks = Array.isArray(taskRes.value.data)
          ? taskRes.value.data : (taskRes.value.data.results || []);

        const completed  = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const todo       = tasks.filter(t => t.status === 'todo').length;
        const overdue    = tasks.filter(t =>
          t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()
        ).length;
        const compRate   = tasks.length > 0
          ? Math.round((completed / tasks.length) * 100) : 0;

        setTaskData([
          { status: 'Completed',   count: completed  },
          { status: 'In Progress', count: inProgress },
          { status: 'To Do',       count: todo       },
          { status: 'Overdue',     count: overdue    },
        ]);
        setTaskBreakdown({ completed, inProgress, todo, overdue, total: tasks.length });
        setStats(p => ({
          ...p, tasksCompleted: completed, taskCompRate: compRate, overdueCount: overdue,
        }));
      }

      // ── PAYROLL → salary trend + total YTD ──────────────────
      if (payRes.status === 'fulfilled') {
        const payslips = Array.isArray(payRes.value.data)
          ? payRes.value.data : (payRes.value.data.results || []);

        const salMap = {};
        payslips.forEach(p => {
          const mIdx = (p.month || 1) - 1;
          const key  = MONTH_NAMES[mIdx];
          if (!salMap[key]) salMap[key] = { month: key, order: mIdx, amount: 0 };
          salMap[key].amount += Number(p.net || 0);
        });
        setSalaryData(
          Object.values(salMap).sort((a, b) => a.order - b.order)
        );

        const ytd = payslips.reduce((s, p) => s + Number(p.net || 0), 0);
        setStats(p => ({ ...p, totalPayroll: ytd, totalEmployees }));
      }

    } catch (e) {
      console.error('Reports error:', e);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [period]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

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
    } catch { alert('Some exports failed.'); }
    finally { setDownloading(null); }
  };

  // ── KPI config ───────────────────────────────────────────────
  const KPI_CARDS = [
    {
      label: 'Total Payroll YTD',
      value: stats.totalPayroll !== null ? fmtCurrency(stats.totalPayroll) : '—',
      icon: '💰', color: '#818cf8',
      sub: stats.totalEmployees ? `${stats.totalEmployees} employees` : '',
      bar: null,
    },
    {
      label: 'Avg Attendance Rate',
      value: stats.avgAttendance !== null ? `${stats.avgAttendance}%` : '—',
      icon: '📅', color: '#34d399',
      sub: stats.absenceRate !== null ? `Absence: ${stats.absenceRate}%` : '',
      bar: stats.avgAttendance, barColor: '#34d399',
    },
    {
      label: 'Tasks Completed',
      value: stats.tasksCompleted !== null ? String(stats.tasksCompleted) : '—',
      icon: '✅', color: '#60a5fa',
      sub: stats.taskCompRate !== null ? `${stats.taskCompRate}% completion rate` : '',
      bar: stats.taskCompRate, barColor: '#60a5fa',
      badge: stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : null,
    },
    {
      label: 'Leave Days Taken',
      value: stats.leaveDays !== null ? String(stats.leaveDays) : '—',
      icon: '🏖️', color: '#fbbf24',
      sub: stats.pendingLeaves !== null ? `${stats.pendingLeaves} pending approval` : '',
      bar: null,
    },
  ];

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar
          title="Reports & Analytics"
          subtitle="Live business intelligence"
          onMenuClick={() => setMobileOpen(true)}
        />

        <div className="dash-content">

          {/* ── PAGE HEADER ──────────────────────────────── */}
          <div className="rp-header">
            <div>
              <h1 className="rp-title">📈 Reports & Analytics</h1>
              <p className="rp-sub">
                Live company-wide performance metrics
                {lastUpdated && (
                  <span className="rp-updated">
                    &nbsp;· Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="rp-controls">
              <div className="rp-period-group">
                {['1m','3m','6m','1y'].map(p => (
                  <button key={p}
                    className={`rp-period-btn ${period === p ? 'active' : ''}`}
                    onClick={() => setPeriod(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <button className="rp-btn-ghost" onClick={fetchAllData} disabled={loading}>
                {loading ? '⏳' : '🔄'} {loading ? 'Loading…' : 'Refresh'}
              </button>
              <button className="rp-btn-primary" onClick={handleExportAll}
                disabled={downloading === 'all'}>
                {downloading === 'all' ? '⏳ Exporting…' : '⬇ Export All'}
              </button>
            </div>
          </div>

          {/* ── KPI CARDS ─────────────────────────────────── */}
          <div className="rp-kpi-grid">
            {KPI_CARDS.map(k => (
              <div key={k.label} className="rp-kpi-card">
                <div className="rp-kpi-top">
                  <span className="rp-kpi-icon">{k.icon}</span>
                  {k.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px',
                      borderRadius: 20, background: 'rgba(239,68,68,.15)', color: '#f87171',
                    }}>
                      ⚠ {k.badge}
                    </span>
                  )}
                </div>
                {loading
                  ? <div className="skeleton" style={{ height:36, width:'60%', borderRadius:8, margin:'8px 0' }}/>
                  : <div className="rp-kpi-val" style={{ color: k.color }}>{k.value}</div>
                }
                <div className="rp-kpi-label">{k.label}</div>
                {k.sub && <div className="rp-kpi-sub">{k.sub}</div>}
                {k.bar !== null && k.bar !== undefined && (
                  <MiniBar pct={k.bar} color={k.barColor} />
                )}
              </div>
            ))}
          </div>

          {/* ── CHARTS ROW 1 ──────────────────────────────── */}
          <div className="charts-grid" style={{ marginBottom: 20 }}>
            {loading ? <Skeleton /> : (
              <div className="rp-chart-card">
                <div className="rp-chart-head">
                  <span>📅 Monthly Attendance</span>
                  <span className="rp-chart-badge">Present vs Absent</span>
                </div>
                <AttendanceBarChart data={attendData} />
              </div>
            )}
            {loading ? <Skeleton /> : (
              <div className="rp-chart-card">
                <div className="rp-chart-head">
                  <span>🏢 Headcount by Department</span>
                  <span className="rp-chart-badge">{stats.totalEmployees || 0} total</span>
                </div>
                <DepartmentPieChart
                  data={deptData.length > 0 ? deptData : [{ name: 'No data', value: 1 }]}
                />
              </div>
            )}
          </div>

          {/* ── CHARTS ROW 2 ──────────────────────────────── */}
          <div className="charts-grid" style={{ marginBottom: 24 }}>
            {loading ? <Skeleton /> : (
              <div className="rp-chart-card">
                <div className="rp-chart-head">
                  <span>💰 Salary Expense Trend</span>
                  <span className="rp-chart-badge">
                    {stats.totalPayroll !== null ? fmtCurrency(stats.totalPayroll) : '—'} YTD
                  </span>
                </div>
                <SalaryLineChart data={salaryData} />
              </div>
            )}
            {loading ? <Skeleton /> : (
              <div className="rp-chart-card">
                <div className="rp-chart-head">
                  <span>✅ Task Overview</span>
                  <span className="rp-chart-badge">{taskBreakdown.total || 0} tasks</span>
                </div>
                <TaskStatusChart data={taskData} />
              </div>
            )}
          </div>

          {/* ── DETAIL ROW ─────────────────────────────────── */}
          <div className="rp-detail-grid">

            {/* Top Attendance */}
            <div className="section-card rp-detail-card">
              <div className="rp-detail-head">
                <span>🏆 Top Attendance</span>
                <span className="rp-badge-gray">This period</span>
              </div>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="skeleton"
                    style={{ height:36, borderRadius:8, marginBottom:8 }}/>
                ))
              ) : topEmployees.length === 0 ? (
                <div className="rp-empty">No attendance data yet</div>
              ) : (
                topEmployees.map((e, i) => (
                  <div key={e.name} className="rp-rank-row">
                    <span className="rp-rank-num">{i + 1}</span>
                    <div className="rp-rank-av">
                      {(e.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="rp-rank-name">{e.name}</div>
                      <MiniBar
                        pct={e.rate}
                        color={i === 0 ? '#fbbf24' : '#6366f1'}
                      />
                    </div>
                    <span className="rp-rank-pct" style={{
                      color: e.rate >= 90 ? '#34d399'
                           : e.rate >= 75 ? '#fbbf24' : '#f87171',
                    }}>
                      {e.rate}%
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Recent Leaves */}
            <div className="section-card rp-detail-card">
              <div className="rp-detail-head">
                <span>🏖️ Recent Leaves</span>
                <span className="rp-badge-gray">Latest 5</span>
              </div>
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="skeleton"
                    style={{ height:36, borderRadius:8, marginBottom:8 }}/>
                ))
              ) : recentLeaves.length === 0 ? (
                <div className="rp-empty">No leave data yet</div>
              ) : (
                recentLeaves.map((l, i) => {
                  const sc = statusStyle(l.status);
                  return (
                    <div key={i} className="rp-leave-row">
                      <div className="rp-rank-av">
                        {(l.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="rp-rank-name">{l.name}</div>
                        <div className="rp-leave-meta">
                          {l.type} · {l.days}d · {l.startDate}
                        </div>
                      </div>
                      <span className="rp-status-pill"
                        style={{ background: sc.bg, color: sc.color }}>
                        {l.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Task Breakdown */}
            <div className="section-card rp-detail-card">
              <div className="rp-detail-head">
                <span>📋 Task Breakdown</span>
                <span className="rp-badge-gray">{taskBreakdown.total || 0} total</span>
              </div>
              {loading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="skeleton"
                    style={{ height:28, borderRadius:8, marginBottom:10 }}/>
                ))
              ) : (
                [
                  { label:'Completed',   count: taskBreakdown.completed  || 0, color:'#10b981' },
                  { label:'In Progress', count: taskBreakdown.inProgress || 0, color:'#6366f1' },
                  { label:'To Do',       count: taskBreakdown.todo       || 0, color:'#f59e0b' },
                  { label:'Overdue',     count: taskBreakdown.overdue    || 0, color:'#ef4444' },
                ].map(t => {
                  const pct = taskBreakdown.total > 0
                    ? Math.round((t.count / taskBreakdown.total) * 100) : 0;
                  return (
                    <div key={t.label} style={{ marginBottom: 14 }}>
                      <div style={{
                        display:'flex', justifyContent:'space-between',
                        fontSize:12, marginBottom:4,
                      }}>
                        <span style={{ color:'#94a3b8', fontWeight:600 }}>{t.label}</span>
                        <span style={{ color:'#e8eaf2', fontWeight:700 }}>
                          {t.count}{' '}
                          <span style={{ color:'#6b7280', fontWeight:400 }}>
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <MiniBar pct={pct} color={t.color} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── DOWNLOAD CARDS ─────────────────────────────── */}
          <div className="section-card" style={{ marginTop: 8 }}>
            <div className="rp-detail-head" style={{ marginBottom: 16 }}>
              <span>📥 Download Reports</span>
              <span className="rp-badge-gray">Live data · CSV format</span>
            </div>
            <div className="rp-download-grid">
              {REPORTS.map(r => (
                <div key={r.title} className="rp-download-card">
                  <div className="rp-dl-icon">{r.icon}</div>
                  <div className="rp-dl-title">{r.title}</div>
                  <div className="rp-dl-desc">{r.desc}</div>
                  <button
                    className="rp-dl-btn"
                    disabled={downloading === r.title}
                    onClick={() => handleDownload(r)}
                  >
                    {downloading === r.title ? '⏳ Downloading…' : '⬇ Download CSV'}
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