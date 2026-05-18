import React, { useState, useEffect } from 'react';
import Sidebar   from '../../components/Sidebar/Sidebar';
import Navbar    from '../../components/Navbar/Navbar';
import StatCard  from '../../components/StatCard/StatCard';
import { AttendanceBarChart, SalaryLineChart, DepartmentPieChart, TaskStatusChart } from '../../components/Charts/Charts';
import { employeesAPI, leavesAPI, tasksAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AdminDashboard.css';

const ATTEND_DATA = [
  {month:'Jan',present:85,absent:15},{month:'Feb',present:78,absent:22},
  {month:'Mar',present:90,absent:10},{month:'Apr',present:88,absent:12},
  {month:'May',present:82,absent:18},{month:'Jun',present:95,absent:5},
];
const SALARY_DATA = [
  {month:'Jan',amount:420000},{month:'Feb',amount:438000},
  {month:'Mar',amount:415000},{month:'Apr',amount:452000},
  {month:'May',amount:448000},{month:'Jun',amount:465000},
];
const TASK_DATA = [
  {status:'Completed',count:0},{status:'In Progress',count:0},
  {status:'Pending',count:0}
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats,  setStats]  = useState({ total_employees:0, present_today:0, on_leave:0, pending_leaves:0, active_tasks:0 });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentLeaves,    setRecentLeaves]    = useState([]);
  const [deptData,   setDeptData]   = useState([]);
  const [taskData,   setTaskData]   = useState(TASK_DATA);
  const [loading,    setLoading]    = useState(true);
  const [unread,     setUnread]     = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, empRes, leaveRes, taskRes, notifRes] = await Promise.allSettled([
        employeesAPI.getDashboardStats(),
        employeesAPI.getAll(),
        leavesAPI.getAll({ status: 'pending' }),
        tasksAPI.getAll(),
        notificationsAPI.getAll(),
      ]);

      // Stats
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data);
      }

      // Employees
      if (empRes.status === 'fulfilled') {
        const emps = Array.isArray(empRes.value.data) ? empRes.value.data : (empRes.value.data.results || []);
        setRecentEmployees(emps.slice(0, 5));

        // Build dept chart data
        const deptMap = {};
        emps.forEach(e => {
          const d = e.department || 'other';
          deptMap[d] = (deptMap[d] || 0) + 1;
        });
        setDeptData(Object.entries(deptMap).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1), value
        })));
      }

      // Leaves
      if (leaveRes.status === 'fulfilled') {
        const leaves = Array.isArray(leaveRes.value.data) ? leaveRes.value.data : (leaveRes.value.data.results || []);
        setRecentLeaves(leaves.slice(0, 5));
      }

      // Tasks
      if (taskRes.status === 'fulfilled') {
        const tasks = Array.isArray(taskRes.value.data) ? taskRes.value.data : (taskRes.value.data.results || []);
        const completed   = tasks.filter(t => t.status === 'completed').length;
        const in_progress = tasks.filter(t => t.status === 'in_progress').length;
        const pending     = tasks.filter(t => t.status === 'todo').length;
        setTaskData([
          { status: 'Completed',   count: completed   },
          { status: 'In Progress', count: in_progress },
          { status: 'Pending',     count: pending     },
        ]);
      }

      // Notifications
      if (notifRes.status === 'fulfilled') {
        const notifs = Array.isArray(notifRes.value.data) ? notifRes.value.data : (notifRes.value.data.results || []);
        setUnread(notifs.filter(n => !n.is_read).length);
      }

    } catch (e) {
      console.error('Dashboard error', e);
    } finally { setLoading(false); }
  };

  const greetHour = new Date().getHours();
  const greeting  = greetHour < 12 ? 'Good Morning' : greetHour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="dash-layout">
      <Sidebar pendingLeaves={stats.pending_leaves} unreadNotifs={unread}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="Dashboard" subtitle="Admin Overview" unreadNotifs={unread}
          onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">
          <div className="welcome-banner">
            <div>
              <div className="welcome-title">{greeting}, {user?.full_name?.split(' ')[0]} 👋</div>
              <div className="welcome-sub">Here's what's happening with your team today.</div>
            </div>
            <div className="welcome-emoji">🏢</div>
          </div>

          {/* REAL STATS */}
          <div className="stats-grid">
            <StatCard icon="👥" label="Total Employees"  value={loading?'…':stats.total_employees} color="indigo" trend="up"   trendVal="+3 this month" barPercent={75}/>
            <StatCard icon="✅" label="Present Today"    value={loading?'…':stats.present_today}   color="green"  trend="up"   trendVal="92%"           barPercent={92}/>
            <StatCard icon="🏖️" label="On Leave"         value={loading?'…':stats.on_leave}        color="amber"  trend="flat" trendVal="same"          barPercent={30}/>
            <StatCard icon="📋" label="Pending Requests" value={loading?'…':stats.pending_leaves}  color="rose"   trend="down" trendVal="-2"            barPercent={stats.pending_leaves*10}/>
            <StatCard icon="💰" label="Salary Expense"   value="₹4.65L"                            color="cyan"   trend="up"   trendVal="+3.7%"         barPercent={68}/>
            <StatCard icon="🎯" label="Active Tasks"     value={loading?'…':stats.active_tasks}    color="purple" trend="up"   trendVal="+5"            barPercent={60}/>
          </div>

          {/* CHARTS */}
          <div className="charts-grid">
            <AttendanceBarChart data={ATTEND_DATA}/>
            <DepartmentPieChart data={deptData.length > 0 ? deptData : [{name:'No data',value:1}]}/>
            <SalaryLineChart    data={SALARY_DATA}/>
            <TaskStatusChart    data={taskData}/>
          </div>

          {/* RECENT TABLES */}
          <div className="charts-grid">
            <div className="section-card">
              <div className="section-card-head">
                <h3>👥 Recent Employees</h3>
                <a href="/admin/employees" className="see-all">View All →</a>
              </div>
              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:44}}/>)}
                </div>
              ) : recentEmployees.length === 0 ? (
                <div className="empty-state"><div className="empty-ico">👤</div><p>No employees yet. Add one!</p></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Employee</th><th>Department</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentEmployees.map((e,i) => {
                      const init = (e.user?.full_name||'').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <tr key={e.id||i}>
                          <td>
                            <div className="emp-mini">
                              <div className="emp-av">{e.user?.profile_image?<img src={e.user.profile_image} alt="av"/>:init}</div>
                              <div><div className="emp-name">{e.user?.full_name||'—'}</div><div className="emp-dept">{e.designation||'—'}</div></div>
                            </div>
                          </td>
                          <td style={{textTransform:'capitalize'}}>{e.department||'—'}</td>
                          <td><span className={`pill ${e.status==='active'?'pill-green':e.status==='on_leave'?'pill-amber':'pill-red'}`}>{e.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="section-card">
              <div className="section-card-head">
                <h3>🏖️ Pending Leave Requests</h3>
                <a href="/admin/leaves" className="see-all">View All →</a>
              </div>
              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:44}}/>)}
                </div>
              ) : recentLeaves.length === 0 ? (
                <div className="empty-state"><div className="empty-ico">🎉</div><p>No pending requests</p></div>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr></thead>
                  <tbody>
                    {recentLeaves.map((l,i) => (
                      <tr key={l.id||i}>
                        <td><span className="emp-name">{l.user_name||'—'}</span></td>
                        <td style={{textTransform:'capitalize'}}>{l.leave_type}</td>
                        <td>{l.days}d</td>
                        <td><span className="pill pill-amber">Pending</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
