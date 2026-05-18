import React, { useState, useEffect } from 'react';
import Sidebar  from '../../components/Sidebar/Sidebar';
import Navbar   from '../../components/Navbar/Navbar';
import StatCard from '../../components/StatCard/StatCard';
import { TaskStatusChart } from '../../components/Charts/Charts';
import { attendanceAPI, leavesAPI, tasksAPI, payrollAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './EmployeeDashboard.css';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [checkedIn,    setCheckedIn]    = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [tasks,        setTasks]        = useState([]);
  const [leaves,       setLeaves]       = useState([]);
  const [salary,       setSalary]       = useState(null);
  const [notifs,       setNotifs]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [now,          setNow]          = useState(new Date());
  const [clockMsg,     setClockMsg]     = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tRes, lRes, sRes, nRes, aRes] = await Promise.allSettled([
        tasksAPI.getMine(),
        leavesAPI.getMine(),
        payrollAPI.getMySalary(),
        notificationsAPI.getAll(),
        attendanceAPI.getMine(),
      ]);
      if (tRes.status==='fulfilled') {
        const data = Array.isArray(tRes.value.data) ? tRes.value.data : (tRes.value.data.results || []);
        setTasks(data);
      }
      if (lRes.status==='fulfilled') {
        const data = Array.isArray(lRes.value.data) ? lRes.value.data : (lRes.value.data.results || []);
        setLeaves(data);
      }
      if (sRes.status==='fulfilled') {
        const data = Array.isArray(sRes.value.data) ? sRes.value.data : (sRes.value.data.results || []);
        setSalary(Array.isArray(data) ? data[0] : data);
      }
      if (nRes.status==='fulfilled') {
        const data = Array.isArray(nRes.value.data) ? nRes.value.data : (nRes.value.data.results || []);
        setNotifs(data);
        // Check if already checked in today
      }
      if (aRes.status==='fulfilled') {
        const data = Array.isArray(aRes.value.data) ? aRes.value.data : (aRes.value.data.results || []);
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = data.find(r => r.date === today);
        if (todayRecord?.check_in && !todayRecord?.check_out) setCheckedIn(true);
      }
    } finally { setLoading(false); }
  };

  const handleCheckIn = async () => {
    setCheckLoading(true); setClockMsg('');
    try {
      await attendanceAPI.checkIn();
      setCheckedIn(true);
      setClockMsg('✅ Checked in successfully!');
      setTimeout(() => setClockMsg(''), 3000);
    } catch (e) {
      const msg = e.response?.data?.error || '';
      if (msg.includes('Already')) { setCheckedIn(true); setClockMsg('Already checked in today'); }
      else setClockMsg('Check-in failed. Try again.');
    } finally { setCheckLoading(false); }
  };

  const handleCheckOut = async () => {
    setCheckLoading(true); setClockMsg('');
    try {
      await attendanceAPI.checkOut();
      setCheckedIn(false);
      setClockMsg('✅ Checked out successfully!');
      setTimeout(() => setClockMsg(''), 3000);
    } catch (e) {
      setClockMsg(e.response?.data?.error || 'Check-out failed.');
    } finally { setCheckLoading(false); }
  };

  const timeStr  = now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const dateStr  = now.toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'});
  const initials = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
  const unread   = notifs.filter(n => !n.is_read).length;

  const activeTasks    = tasks.filter(t => t.status !== 'completed');
  const pendingLeaves  = leaves.filter(l => l.status === 'pending').length;
  const completedPct   = tasks.length > 0
    ? Math.round(tasks.filter(t=>t.status==='completed').length/tasks.length*100) : 0;

  const TASK_CHART = [
    { status:'Completed',   count: tasks.filter(t=>t.status==='completed').length  },
    { status:'In Progress', count: tasks.filter(t=>t.status==='in_progress').length},
    { status:'Pending',     count: tasks.filter(t=>t.status==='todo').length       },
  ];

  const NOTIF_ICONS = {info:'ℹ️',success:'✅',warning:'⚠️',leave:'🏖️',task:'✅',payroll:'💰',announcement:'📢'};

  return (
    <div className="dash-layout">
      <Sidebar unreadNotifs={unread} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="My Dashboard" subtitle="Employee Overview" unreadNotifs={unread}
          onMenuClick={() => setMobileOpen(true)} />
        <div className="dash-content">

          {/* Profile mini */}
          <div className="profile-mini">
            <div className="profile-mini-av">
              {user?.profile_image ? <img src={user.profile_image} alt="av"/> : initials}
            </div>
            <div>
              <div className="profile-mini-name">{user?.full_name}</div>
              <div className="profile-mini-role">{user?.department} · {user?.employee_id}</div>
              <div className="profile-mini-tags">
                <span className="profile-mini-tag">👤 Employee</span>
                <span className="profile-mini-tag">✉️ {user?.email}</span>
                {user?.phone && <span className="profile-mini-tag">📱 {user?.phone}</span>}
              </div>
            </div>
          </div>

          {/* Clock card */}
          <div className="clock-card">
            <div className="clock-left">
              <div className="clock-time">{timeStr}</div>
              <div className="clock-date">{dateStr}</div>
              <div className="clock-status">
                <div className={`clock-dot ${checkedIn?'':'out'}`}/>
                <span className="clock-status-txt">{checkedIn ? 'You are checked in' : 'Not checked in yet'}</span>
              </div>
              {clockMsg && <div style={{fontSize:13,color:clockMsg.startsWith('✅')?'#34d399':'#f87171',marginTop:8}}>{clockMsg}</div>}
            </div>
            <div className="clock-actions">
              <button className="clock-btn in" onClick={handleCheckIn}
                disabled={checkedIn || checkLoading}>
                {checkLoading?'⏳':'🟢'} Check In
              </button>
              <button className="clock-btn out" onClick={handleCheckOut}
                disabled={!checkedIn || checkLoading}>
                {checkLoading?'⏳':'🔴'} Check Out
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="stats-grid" style={{marginBottom:28}}>
            <StatCard icon="✅" label="Tasks Completed" value={`${completedPct}%`} color="green"  trend="up"   trendVal="" barPercent={completedPct}/>
            <StatCard icon="🎯" label="Active Tasks"    value={activeTasks.length}  color="indigo" trend="flat" trendVal="" barPercent={60}/>
            <StatCard icon="🏖️" label="Pending Leave"   value={pendingLeaves}        color="amber"  trend="flat" trendVal="" barPercent={pendingLeaves*20}/>
            <StatCard icon="💰" label="Net Salary"
              value={salary ? `₹${Number(salary.net||0).toLocaleString()}` : 'Not set'}
              color="cyan" trend="up" trendVal="" barPercent={75}/>
          </div>

          <div className="charts-grid">
            {/* Tasks list */}
            <div className="section-card">
              <div className="section-card-head">
                <h3>🎯 My Tasks</h3>
                <a href="/employee/tasks" className="see-all">View All →</a>
              </div>
              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:60}}/>)}
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="empty-state"><div className="empty-ico">🎉</div><p>All tasks done!</p></div>
              ) : (
                <div className="task-list">
                  {activeTasks.slice(0,4).map(t => (
                    <div key={t.id} className="task-item">
                      <div className="task-item-head">
                        <div>
                          <div className="task-item-title">{t.title}</div>
                          <div className="task-item-meta">Due: {t.due_date}&nbsp;·&nbsp;
                            <span className={`pill ${t.priority==='urgent'?'pill-red':t.priority==='high'?'pill-amber':t.priority==='medium'?'pill-blue':'pill-gray'}`}>
                              {t.priority}
                            </span>
                          </div>
                        </div>
                        <span className={`pill ${t.status==='completed'?'pill-green':t.status==='in_progress'?'pill-blue':'pill-gray'}`}>
                          {t.status.replace('_',' ')}
                        </span>
                      </div>
                      <div className="task-prog-row">
                        <div className="task-prog-bar"><div className="task-prog-fill" style={{width:`${t.progress}%`}}/></div>
                        <span className="task-prog-val">{t.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <TaskStatusChart data={TASK_CHART}/>

            {/* Leave balance */}
            <div className="section-card">
              <div className="section-card-head">
                <h3>🏖️ Leave Balance</h3>
                <a href="/employee/leaves" className="see-all">Apply →</a>
              </div>
              <div className="leave-balance-grid">
                {[
                  {type:'Sick',   total:8,  used:leaves.filter(l=>l.leave_type==='sick'&&l.status==='approved').reduce((s,l)=>s+l.days,0)},
                  {type:'Casual', total:12, used:leaves.filter(l=>l.leave_type==='casual'&&l.status==='approved').reduce((s,l)=>s+l.days,0)},
                  {type:'Annual', total:20, used:leaves.filter(l=>l.leave_type==='annual'&&l.status==='approved').reduce((s,l)=>s+l.days,0)},
                  {type:'Unpaid', total:'∞',used:0},
                ].map(lb => (
                  <div key={lb.type} className="lb-item">
                    <div className="lb-val">{typeof lb.total==='number'?lb.total-lb.used:lb.total}</div>
                    <div className="lb-type">{lb.type}</div>
                    <div className="lb-used">{lb.used} used</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary */}
            <div className="section-card">
              <div className="section-card-head">
                <h3>💰 Salary Summary</h3>
                <a href="/employee/payroll" className="see-all">Payslips →</a>
              </div>
              {salary ? (
                <div className="salary-rows">
                  <div className="sal-row"><span className="sal-label">Basic</span><span className="sal-val">₹{Number(salary.basic||0).toLocaleString()}</span></div>
                  <div className="sal-row"><span className="sal-label">HRA</span><span className="sal-val green">+₹{Number(salary.hra||0).toLocaleString()}</span></div>
                  <div className="sal-row"><span className="sal-label">Transport</span><span className="sal-val green">+₹{Number(salary.transport||0).toLocaleString()}</span></div>
                  <div className="sal-row"><span className="sal-label">PF</span><span className="sal-val red">-₹{Number(salary.pf_deduction||0).toLocaleString()}</span></div>
                  <div className="sal-row"><span className="sal-label">Tax</span><span className="sal-val red">-₹{Number(salary.tax_deduction||0).toLocaleString()}</span></div>
                  <div className="sal-row" style={{borderTop:'1px solid rgba(255,255,255,.1)',paddingTop:12,marginTop:4}}>
                    <span style={{fontWeight:800,color:'#fff',fontSize:14}}>Net Salary</span>
                    <span className="sal-val total">₹{Number(salary.net||0).toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div className="empty-state"><div className="empty-ico">💰</div><p>Salary not configured yet</p></div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="section-card">
            <div className="section-card-head">
              <h3>🔔 Recent Notifications</h3>
              <a href="/employee/notifications" className="see-all">View All →</a>
            </div>
            {notifs.length === 0 ? (
              <div className="empty-state"><div className="empty-ico">🔕</div><p>No notifications yet</p></div>
            ) : (
              <div className="notif-list">
                {notifs.slice(0,5).map(n => (
                  <div key={n.id} className={`notif-item ${!n.is_read?'unread':''}`}>
                    <span className="notif-ico">{NOTIF_ICONS[n.type]||'🔔'}</span>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
