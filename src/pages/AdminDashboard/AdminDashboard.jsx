import React, { useState, useEffect } from 'react';
import Sidebar   from '../../components/Sidebar/Sidebar';
import Navbar    from '../../components/Navbar/Navbar';
import StatCard  from '../../components/StatCard/StatCard';
import { AttendanceBarChart, SalaryLineChart, DepartmentPieChart, TaskStatusChart } from '../../components/Charts/Charts';
import { employeesAPI, leavesAPI, tasksAPI, notificationsAPI, attendanceAPI } from '../../services/api';
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

// ── Detail Modal ────────────────────────────────────────────
function DetailModal({ title, onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.75)',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20,
    }} onClick={onClose}>
      <div style={{
        background:'#0f172a',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:20, width:'100%', maxWidth:800,
        maxHeight:'85vh', overflow:'hidden',
        display:'flex', flexDirection:'column',
        boxShadow:'0 25px 60px rgba(0,0,0,0.6)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display:'flex', alignItems:'center',
          justifyContent:'space-between',
          padding:'20px 24px',
          borderBottom:'1px solid rgba(255,255,255,0.06)',
          flexShrink:0,
        }}>
          <h2 style={{ color:'#fff', margin:0, fontSize:18, fontWeight:700 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            background:'rgba(255,255,255,0.06)',
            border:'none', borderRadius:8, color:'#94a3b8',
            width:32, height:32, cursor:'pointer', fontSize:18,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>
        {/* Body */}
        <div style={{ overflowY:'auto', padding:'20px 24px', flex:1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Badge component ──────────────────────────────────────────
function Badge({ text, color }) {
  const colors = {
    green:  { bg:'rgba(16,185,129,.15)', text:'#34d399', border:'rgba(16,185,129,.3)' },
    red:    { bg:'rgba(239,68,68,.15)',  text:'#f87171', border:'rgba(239,68,68,.3)'  },
    amber:  { bg:'rgba(245,158,11,.15)', text:'#fbbf24', border:'rgba(245,158,11,.3)' },
    blue:   { bg:'rgba(99,102,241,.15)', text:'#a5b4fc', border:'rgba(99,102,241,.3)' },
    gray:   { bg:'rgba(255,255,255,.06)',text:'#94a3b8', border:'rgba(255,255,255,.1)' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      padding:'3px 10px', borderRadius:20, fontSize:12,
      fontWeight:600, background:c.bg, color:c.text,
      border:`1px solid ${c.border}`,
    }}>{text}</span>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats,  setStats]  = useState({
    total_employees:0, present_today:0,
    on_leave:0, pending_leaves:0, active_tasks:0,
  });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentLeaves,    setRecentLeaves]    = useState([]);
  const [deptData,   setDeptData]   = useState([]);
  const [taskData,   setTaskData]   = useState([
    {status:'Completed',count:0},{status:'In Progress',count:0},{status:'Pending',count:0}
  ]);
  const [loading,    setLoading]    = useState(true);
  const [unread,     setUnread]     = useState(0);

  // ── Modal state ──────────────────────────────────────────
  const [modal,       setModal]       = useState(null);
  const [modalData,   setModalData]   = useState([]);
  const [modalLoad,   setModalLoad]   = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allLeaves,    setAllLeaves]    = useState([]);
  const [allTasks,     setAllTasks]     = useState([]);
  const [attendance,   setAttendance]   = useState([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, empRes, leaveRes, taskRes, notifRes, attRes] =
        await Promise.allSettled([
          employeesAPI.getDashboardStats(),
          employeesAPI.getAll(),
          leavesAPI.getAll(),
          tasksAPI.getAll(),
          notificationsAPI.getAll(),
          attendanceAPI.getAll(),
        ]);

      if (statsRes.status==='fulfilled') setStats(statsRes.value.data);

      if (empRes.status==='fulfilled') {
        const emps = Array.isArray(empRes.value.data)
          ? empRes.value.data : (empRes.value.data.results||[]);
        setRecentEmployees(emps.slice(0,5));
        setAllEmployees(emps);
        const deptMap = {};
        emps.forEach(e => {
          const d = e.department||'other';
          deptMap[d] = (deptMap[d]||0)+1;
        });
        setDeptData(Object.entries(deptMap).map(([name,value])=>({
          name: name.charAt(0).toUpperCase()+name.slice(1), value,
        })));
      }

      if (leaveRes.status==='fulfilled') {
        const leaves = Array.isArray(leaveRes.value.data)
          ? leaveRes.value.data : (leaveRes.value.data.results||[]);
        setAllLeaves(leaves);
        setRecentLeaves(leaves.filter(l=>l.status==='pending').slice(0,5));
      }

      if (taskRes.status==='fulfilled') {
        const tasks = Array.isArray(taskRes.value.data)
          ? taskRes.value.data : (taskRes.value.data.results||[]);
        setAllTasks(tasks);
        setTaskData([
          {status:'Completed',   count:tasks.filter(t=>t.status==='completed').length},
          {status:'In Progress', count:tasks.filter(t=>t.status==='in_progress').length},
          {status:'Pending',     count:tasks.filter(t=>t.status==='todo').length},
        ]);
      }

      if (notifRes.status==='fulfilled') {
        const n = Array.isArray(notifRes.value.data)
          ? notifRes.value.data : (notifRes.value.data.results||[]);
        setUnread(n.filter(x=>!x.is_read).length);
      }

      if (attRes.status==='fulfilled') {
        const att = Array.isArray(attRes.value.data)
          ? attRes.value.data : (attRes.value.data.results||[]);
        setAttendance(att);
      }

    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Open modals ──────────────────────────────────────────
  const openModal = (type) => {
    setModal(type);
    setModalLoad(false);
  };

  const greetHour = new Date().getHours();
  const greeting  = greetHour<12?'Good Morning':greetHour<17?'Good Afternoon':'Good Evening';
  const today     = new Date().toISOString().split('T')[0];

  // ── Computed modal data ───────────────────────────────────
  const presentToday  = attendance.filter(a => a.date === today && a.check_in);
  const onLeaveEmps   = allLeaves.filter(l =>
    l.status === 'approved' &&
    l.start_date <= today && l.end_date >= today
  );
  const pendingLeaves = allLeaves.filter(l => l.status === 'pending');

  return (
    <div className="dash-layout">
      <Sidebar pendingLeaves={stats.pending_leaves} unreadNotifs={unread}
        mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="Dashboard" subtitle="Admin Overview"
          unreadNotifs={unread} onMenuClick={() => setMobileOpen(true)} employees={allEmployees} attendance={attendance}  />

        <div className="dash-content">
          <div className="welcome-banner">
            <div>
              <div className="welcome-title">
                {greeting}, {user?.full_name?.split(' ')[0]} 👋
              </div>
              <div className="welcome-sub">
                Here's what's happening with your team today.
              </div>
            </div>
            <div className="welcome-emoji">🏢</div>
          </div>

          {/* STATS — each card is clickable */}
          <div className="stats-grid">
            <div onClick={() => openModal('employees')} style={{cursor:'pointer'}}>
              <StatCard icon="👥" label="Total Employees"
                value={loading?'…':stats.total_employees}
                color="indigo" trend="up" trendVal="+3 this month" barPercent={75}/>
            </div>
            <div onClick={() => openModal('present')} style={{cursor:'pointer'}}>
              <StatCard icon="✅" label="Present Today"
                value={loading?'…':stats.present_today}
                color="green" trend="up" trendVal="92%" barPercent={92}/>
            </div>
            <div onClick={() => openModal('leave')} style={{cursor:'pointer'}}>
              <StatCard icon="🏖️" label="On Leave"
                value={loading?'…':stats.on_leave}
                color="amber" trend="flat" trendVal="same" barPercent={30}/>
            </div>
            <div onClick={() => openModal('pending')} style={{cursor:'pointer'}}>
              <StatCard icon="📋" label="Pending Requests"
                value={loading?'…':stats.pending_leaves}
                color="rose" trend="down" trendVal="-2"
                barPercent={stats.pending_leaves*10}/>
            </div>
            <div onClick={() => openModal('salary')} style={{cursor:'pointer'}}>
              <StatCard icon="💰" label="Salary Expense"
                value="₹4.65L" color="cyan" trend="up"
                trendVal="+3.7%" barPercent={68}/>
            </div>
            <div onClick={() => openModal('tasks')} style={{cursor:'pointer'}}>
              <StatCard icon="🎯" label="Active Tasks"
                value={loading?'…':stats.active_tasks}
                color="purple" trend="up" trendVal="+5" barPercent={60}/>
            </div>
          </div>

          {/* CHARTS — also clickable */}
          <div className="charts-grid">
            <div onClick={() => openModal('attendance_chart')}
              style={{cursor:'pointer'}}>
              <AttendanceBarChart data={ATTEND_DATA}/>
            </div>
            <DepartmentPieChart
              data={deptData.length>0 ? deptData : [{name:'No data',value:1}]}/>
            <SalaryLineChart data={SALARY_DATA}/>
            <div onClick={() => openModal('tasks')} style={{cursor:'pointer'}}>
              <TaskStatusChart data={taskData}/>
            </div>
          </div>

          {/* RECENT TABLES */}
          <div className="charts-grid">
            <div className="section-card">
              <div className="section-card-head">
                <h3>👥 Recent Employees</h3>
                <button onClick={() => openModal('employees')}
                  className="see-all" style={{background:'none',border:'none',cursor:'pointer'}}>
                  View All →
                </button>
              </div>
              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:44}}/>)}
                </div>
              ) : recentEmployees.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-ico">👤</div>
                  <p>No employees yet.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentEmployees.map((e,i) => {
                      const init = (e.user?.full_name||'')
                        .split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                      return (
                        <tr key={e.id||i}
                          style={{cursor:'pointer'}}
                          onClick={() => openModal('employees')}>
                          <td>
                            <div className="emp-mini">
                              <div className="emp-av">
                                {e.user?.profile_image
                                  ? <img src={e.user.profile_image} alt="av"/>
                                  : init}
                              </div>
                              <div>
                                <div className="emp-name">{e.user?.full_name||'—'}</div>
                                <div className="emp-dept">{e.designation||'—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{textTransform:'capitalize'}}>{e.department||'—'}</td>
                          <td>
                            <Badge text={e.status}
                              color={e.status==='active'?'green':e.status==='on_leave'?'amber':'red'}/>
                          </td>
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
                <button onClick={() => openModal('pending')}
                  className="see-all" style={{background:'none',border:'none',cursor:'pointer'}}>
                  View All →
                </button>
              </div>
              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:44}}/>)}
                </div>
              ) : recentLeaves.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-ico">🎉</div>
                  <p>No pending requests</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr><th>Employee</th><th>Type</th><th>Days</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((l,i) => (
                      <tr key={l.id||i} style={{cursor:'pointer'}}
                        onClick={() => openModal('pending')}>
                        <td><span className="emp-name">{l.user_name||'—'}</span></td>
                        <td style={{textTransform:'capitalize'}}>{l.leave_type}</td>
                        <td>{l.days}d</td>
                        <td><Badge text="Pending" color="amber"/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════ */}

      {/* ── Total Employees Modal ── */}
      {modal === 'employees' && (
        <DetailModal title="👥 All Employees" onClose={() => setModal(null)}>
          <div style={{marginBottom:16,color:'#64748b',fontSize:13}}>
            {allEmployees.length} total employees
          </div>
          {allEmployees.length === 0 ? (
            <p style={{color:'#64748b',textAlign:'center'}}>No employees found</p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {allEmployees.map((e,i) => {
                const init = (e.user?.full_name||'')
                  .split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
                return (
                  <div key={e.id||i} style={{
                    background:'rgba(255,255,255,0.03)',
                    border:'1px solid rgba(255,255,255,0.06)',
                    borderRadius:12, padding:'16px',
                  }}>
                    <div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                      {/* Avatar */}
                      <div style={{
                        width:48,height:48,borderRadius:'50%',
                        background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        color:'#fff',fontWeight:700,fontSize:16,flexShrink:0,
                      }}>
                        {e.user?.profile_image
                          ? <img src={e.user.profile_image} alt="av"
                              style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}}/>
                          : init}
                      </div>
                      {/* Info */}
                      <div style={{flex:1,minWidth:200}}>
                        <div style={{
                          color:'#fff',fontWeight:700,
                          fontSize:15,marginBottom:4,
                        }}>
                          {e.user?.full_name||'—'}
                        </div>
                        <div style={{
                          display:'flex',flexWrap:'wrap',gap:8,
                          color:'#94a3b8',fontSize:12,
                        }}>
                          <span>🪪 {e.user?.employee_id||'—'}</span>
                          <span>💼 {e.designation||'—'}</span>
                          <span>🏬 {e.department||'—'}</span>
                          {e.user?.email && <span>✉️ {e.user.email}</span>}
                          {e.user?.phone && <span>📱 {e.user.phone}</span>}
                        </div>
                        <div style={{
                          display:'flex',flexWrap:'wrap',gap:8,
                          marginTop:6,color:'#64748b',fontSize:12,
                        }}>
                          <span>📅 Joined: {e.date_joined||'—'}</span>
                          {e.manager && <span>👤 Manager: {e.manager}</span>}
                        </div>
                      </div>
                      {/* Status */}
                      <Badge text={e.status||'active'}
                        color={e.status==='active'?'green':e.status==='on_leave'?'amber':'red'}/>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DetailModal>
      )}

      {/* ── Present Today Modal ── */}
      {modal === 'present' && (
        <DetailModal title="✅ Present Today" onClose={() => setModal(null)}>
          <div style={{marginBottom:16,color:'#64748b',fontSize:13}}>
            {presentToday.length} employees checked in today ({today})
          </div>
          {presentToday.length === 0 ? (
            <p style={{color:'#64748b',textAlign:'center'}}>
              No check-ins recorded today
            </p>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Employee','Check In','Check Out','Hours','Type','Status'].map(h => (
                    <th key={h} style={{
                      color:'#64748b',fontSize:12,fontWeight:600,
                      padding:'8px 12px',textAlign:'left',
                      textTransform:'uppercase',letterSpacing:'0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {presentToday.map((a,i) => (
                  <tr key={a.id||i} style={{
                    borderBottom:'1px solid rgba(255,255,255,0.04)',
                  }}>
                    <td style={{padding:'12px',color:'#e2e8f0',fontSize:14}}>
                      {a.user_name||'—'}
                    </td>
                    <td style={{padding:'12px',color:'#34d399',fontSize:13,fontWeight:600}}>
                      {a.check_in||'—'}
                    </td>
                    <td style={{padding:'12px',color:a.check_out?'#f87171':'#64748b',fontSize:13}}>
                      {a.check_out||'Not yet'}
                    </td>
                    <td style={{padding:'12px',color:'#a5b4fc',fontSize:13}}>
                      {a.working_hours ? `${a.working_hours}h` : '—'}
                    </td>
                    <td style={{padding:'12px'}}>
                      <Badge
                        text={a.attendance_type==='face_scan'?'📷 Face':'✋ Manual'}
                        color={a.attendance_type==='face_scan'?'blue':'gray'}/>
                    </td>
                    <td style={{padding:'12px'}}>
                      <Badge text={a.status} color="green"/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DetailModal>
      )}

      {/* ── On Leave Modal ── */}
      {modal === 'leave' && (
        <DetailModal title="🏖️ Employees On Leave" onClose={() => setModal(null)}>
          <div style={{marginBottom:16,color:'#64748b',fontSize:13}}>
            Approved leaves active today
          </div>
          {onLeaveEmps.length === 0 ? (
            <p style={{color:'#64748b',textAlign:'center'}}>
              No employees on leave today
            </p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {onLeaveEmps.map((l,i) => {
                const totalDays = Math.ceil(
                  (new Date(l.end_date) - new Date(l.start_date)) / (1000*60*60*24) + 1
                );
                // Leave balances (estimated)
                const leaveBalance = {
                  sick: 8, casual: 12, annual: 20, unpaid: 999,
                };
                const used = allLeaves
                  .filter(x => x.user_name === l.user_name
                    && x.leave_type === l.leave_type
                    && x.status === 'approved')
                  .reduce((sum, x) => sum + (x.days||0), 0);
                const remaining = (leaveBalance[l.leave_type]||0) - used;

                return (
                  <div key={l.id||i} style={{
                    background:'rgba(245,158,11,0.06)',
                    border:'1px solid rgba(245,158,11,0.2)',
                    borderRadius:12, padding:16,
                  }}>
                    <div style={{
                      display:'flex',justifyContent:'space-between',
                      alignItems:'flex-start',flexWrap:'wrap',gap:10,
                    }}>
                      <div>
                        <div style={{color:'#fff',fontWeight:700,fontSize:15,marginBottom:6}}>
                          {l.user_name||'—'}
                        </div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:13}}>
                          <span style={{color:'#94a3b8'}}>
                            📋 Type: <span style={{color:'#fbbf24',textTransform:'capitalize'}}>
                              {l.leave_type}
                            </span>
                          </span>
                          <span style={{color:'#94a3b8'}}>
                            📅 From: <span style={{color:'#e2e8f0'}}>{l.start_date}</span>
                          </span>
                          <span style={{color:'#94a3b8'}}>
                            📅 To: <span style={{color:'#e2e8f0'}}>{l.end_date}</span>
                          </span>
                          <span style={{color:'#94a3b8'}}>
                            ⏱️ Duration: <span style={{color:'#fbbf24'}}>{totalDays} days</span>
                          </span>
                        </div>
                        {l.reason && (
                          <div style={{marginTop:8,color:'#64748b',fontSize:13}}>
                            💬 Reason: <span style={{color:'#94a3b8'}}>{l.reason}</span>
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{color:'#64748b',fontSize:12,marginBottom:4}}>
                          Remaining Balance
                        </div>
                        <div style={{
                          color: remaining > 3 ? '#34d399' : '#f87171',
                          fontSize:22, fontWeight:800,
                        }}>
                          {remaining >= 0 ? remaining : 0}
                        </div>
                        <div style={{color:'#64748b',fontSize:11}}>days left</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DetailModal>
      )}

      {/* ── Pending Requests Modal ── */}
      {modal === 'pending' && (
        <DetailModal title="📋 Pending Leave Requests" onClose={() => setModal(null)}>
          <div style={{marginBottom:16,color:'#64748b',fontSize:13}}>
            {pendingLeaves.length} requests awaiting approval
          </div>
          {pendingLeaves.length === 0 ? (
            <p style={{color:'#34d399',textAlign:'center',fontSize:15}}>
              🎉 No pending requests!
            </p>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {pendingLeaves.map((l,i) => {
                const leaveBalance = { sick:8, casual:12, annual:20, unpaid:999 };
                const used = allLeaves
                  .filter(x => x.user_name === l.user_name
                    && x.leave_type === l.leave_type
                    && x.status === 'approved')
                  .reduce((sum,x) => sum+(x.days||0), 0);
                const remaining = (leaveBalance[l.leave_type]||0) - used;
                const canApprove = remaining >= (l.days||0);

                return (
                  <div key={l.id||i} style={{
                    background:'rgba(99,102,241,0.06)',
                    border:'1px solid rgba(99,102,241,0.2)',
                    borderRadius:12, padding:16,
                  }}>
                    <div style={{
                      display:'flex',justifyContent:'space-between',
                      alignItems:'flex-start',flexWrap:'wrap',gap:12,
                    }}>
                      <div style={{flex:1}}>
                        <div style={{
                          color:'#fff',fontWeight:700,
                          fontSize:15,marginBottom:8,
                        }}>
                          {l.user_name||'—'}
                        </div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:13}}>
                          <span style={{color:'#94a3b8'}}>
                            📋 <span style={{color:'#a5b4fc',textTransform:'capitalize'}}>
                              {l.leave_type}
                            </span>
                          </span>
                          <span style={{color:'#94a3b8'}}>
                            📅 {l.start_date} → {l.end_date}
                          </span>
                          <span style={{color:'#94a3b8'}}>
                            ⏱️ <span style={{color:'#fbbf24'}}>{l.days} days</span>
                          </span>
                        </div>
                        {l.reason && (
                          <div style={{
                            marginTop:10, padding:'10px 14px',
                            background:'rgba(255,255,255,0.04)',
                            borderRadius:8, fontSize:13,
                            borderLeft:'3px solid rgba(99,102,241,0.5)',
                          }}>
                            <span style={{color:'#64748b'}}>💬 Reason: </span>
                            <span style={{color:'#e2e8f0'}}>{l.reason}</span>
                          </div>
                        )}

                        {/* Remaining balance warning */}
                        <div style={{
                          marginTop:10,
                          display:'flex',alignItems:'center',gap:8,
                          fontSize:12,
                          color: canApprove ? '#34d399' : '#f87171',
                        }}>
                          {canApprove
                            ? `✅ Has ${remaining} days remaining — can be approved`
                            : `⚠️ Only ${remaining} days remaining — requested ${l.days} days`
                          }
                        </div>
                      </div>

                      <div style={{
                        display:'flex',flexDirection:'column',gap:8,
                      }}>
                        <Badge text="⏳ Pending" color="amber"/>
                        <div style={{
                          textAlign:'center',
                          color:'#64748b',fontSize:11,
                        }}>
                          Applied: {l.created_at
                            ? new Date(l.created_at).toLocaleDateString()
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DetailModal>
      )}

      {/* ── Monthly Attendance Chart Modal ── */}
      {modal === 'attendance_chart' && (
        <DetailModal title="📅 Monthly Attendance Details" onClose={() => setModal(null)}>
          <div style={{marginBottom:16,color:'#64748b',fontSize:13}}>
            All employee attendance records
          </div>
          {attendance.length === 0 ? (
            <p style={{color:'#64748b',textAlign:'center'}}>No attendance records</p>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  {['Employee','Date','Check In','Check Out','Hours','Status','Type'].map(h => (
                    <th key={h} style={{
                      color:'#64748b',fontSize:11,fontWeight:600,
                      padding:'8px 10px',textAlign:'left',
                      textTransform:'uppercase',letterSpacing:'0.5px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendance.slice(0,50).map((a,i) => (
                  <tr key={a.id||i} style={{
                    borderBottom:'1px solid rgba(255,255,255,0.03)',
                  }}>
                    <td style={{padding:'10px',color:'#e2e8f0',fontSize:13}}>
                      {a.user_name||'—'}
                    </td>
                    <td style={{padding:'10px',color:'#94a3b8',fontSize:12}}>
                      {a.date}
                    </td>
                    <td style={{padding:'10px',color:'#34d399',fontSize:12}}>
                      {a.check_in||'—'}
                    </td>
                    <td style={{padding:'10px',color:'#f87171',fontSize:12}}>
                      {a.check_out||'—'}
                    </td>
                    <td style={{padding:'10px',color:'#a5b4fc',fontSize:12}}>
                      {a.working_hours ? `${a.working_hours}h` : '—'}
                    </td>
                    <td style={{padding:'10px'}}>
                      <Badge text={a.status}
                        color={a.status==='present'?'green':a.status==='absent'?'red':'amber'}/>
                    </td>
                    <td style={{padding:'10px'}}>
                      <Badge
                        text={a.attendance_type==='face_scan'?'📷 Face':'✋ Manual'}
                        color={a.attendance_type==='face_scan'?'blue':'gray'}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DetailModal>
      )}

      {/* ── Tasks Modal ── */}
      {modal === 'tasks' && (
        <DetailModal title="🎯 All Tasks" onClose={() => setModal(null)}>
          <div style={{
            display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',
          }}>
            {[
              {label:'Total',     value:allTasks.length,                                        color:'#a5b4fc'},
              {label:'Completed', value:allTasks.filter(t=>t.status==='completed').length,      color:'#34d399'},
              {label:'In Progress',value:allTasks.filter(t=>t.status==='in_progress').length,   color:'#60a5fa'},
              {label:'Pending',   value:allTasks.filter(t=>t.status==='todo').length,           color:'#fbbf24'},
            ].map(s => (
              <div key={s.label} style={{
                flex:1,minWidth:100,
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12,padding:'14px',textAlign:'center',
              }}>
                <div style={{color:s.color,fontSize:24,fontWeight:800}}>{s.value}</div>
                <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {allTasks.map((t,i) => (
              <div key={t.id||i} style={{
                background:'rgba(255,255,255,0.03)',
                border:'1px solid rgba(255,255,255,0.06)',
                borderRadius:10, padding:'14px 16px',
                display:'flex',justifyContent:'space-between',
                alignItems:'center',flexWrap:'wrap',gap:10,
              }}>
                <div style={{flex:1}}>
                  <div style={{color:'#e2e8f0',fontWeight:600,marginBottom:4}}>
                    {t.title}
                  </div>
                  <div style={{
                    display:'flex',flexWrap:'wrap',gap:8,
                    color:'#64748b',fontSize:12,
                  }}>
                    <span>👤 {t.assigned_to_name||'—'}</span>
                    <span>📅 Due: {t.due_date}</span>
                    <span>
                      🔥 Priority:{' '}
                      <span style={{
                        color: t.priority==='urgent'?'#f87171':
                               t.priority==='high'?'#fbbf24':
                               t.priority==='medium'?'#60a5fa':'#94a3b8',
                        textTransform:'capitalize',
                      }}>
                        {t.priority}
                      </span>
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    marginTop:8,height:4,
                    background:'rgba(255,255,255,0.08)',
                    borderRadius:99,overflow:'hidden',
                  }}>
                    <div style={{
                      height:'100%',
                      width:`${t.progress||0}%`,
                      background: t.status==='completed'?'#10b981':
                                  t.status==='in_progress'?'#6366f1':'#64748b',
                      borderRadius:99,
                    }}/>
                  </div>
                  <div style={{
                    color:'#64748b',fontSize:11,marginTop:4,
                  }}>
                    {t.progress||0}% complete
                  </div>
                </div>
                <Badge
                  text={t.status==='completed'?'✅ Done':
                        t.status==='in_progress'?'🔄 In Progress':'⏳ Pending'}
                  color={t.status==='completed'?'green':
                         t.status==='in_progress'?'blue':'amber'}/>
              </div>
            ))}
          </div>
        </DetailModal>
      )}

      {/* ── Salary Modal ── */}
      {modal === 'salary' && (
        <DetailModal title="💰 Salary Overview" onClose={() => setModal(null)}>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',
            gap:12,marginBottom:20,
          }}>
            {[
              {label:'Total Expense',  value:'₹4,65,000', color:'#34d399'},
              {label:'Avg Salary',     value:'₹58,125',   color:'#a5b4fc'},
              {label:'Highest',        value:'₹1,20,000', color:'#fbbf24'},
              {label:'Lowest',         value:'₹25,000',   color:'#94a3b8'},
            ].map(s => (
              <div key={s.label} style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                borderRadius:12,padding:'16px',textAlign:'center',
              }}>
                <div style={{color:s.color,fontSize:22,fontWeight:800}}>{s.value}</div>
                <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{
            color:'#64748b',fontSize:13,textAlign:'center',
            padding:'20px',
            background:'rgba(255,255,255,0.03)',
            borderRadius:12,
          }}>
            📊 Go to <a href="/admin/payroll"
              style={{color:'#6366f1',textDecoration:'none'}}>
              Payroll section
            </a> to see detailed salary breakdown per employee.
          </p>
        </DetailModal>
      )}

    </div>
  );
}