import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { attendanceAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Attendance.css';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const normalizeStatus = (raw) => {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s === 'present')                        return 'present';
  if (s === 'absent')                         return 'absent';
  if (s === 'late' || s === 'late_arrival')   return 'late';
  if (s === 'wfh'  || s === 'work_from_home') return 'wfh';
  if (s === 'half_day')                       return 'half_day';
  return null;
};

const normalizeDate = (raw) => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (raw.includes('T')) return raw.split('T')[0];
  return raw;
};

const STATUS_META = {
  present:  { label:'Present',  color:'#34d399', bg:'rgba(16,185,129,.15)',  border:'rgba(16,185,129,.3)',  icon:'✅' },
  absent:   { label:'Absent',   color:'#f87171', bg:'rgba(239,68,68,.15)',   border:'rgba(239,68,68,.35)',  icon:'❌' },
  late:     { label:'Late',     color:'#fbbf24', bg:'rgba(245,158,11,.13)',  border:'rgba(245,158,11,.3)',  icon:'⏰' },
  wfh:      { label:'WFH',      color:'#818cf8', bg:'rgba(99,102,241,.14)',  border:'rgba(99,102,241,.3)',  icon:'🏠' },
  half_day: { label:'Half Day', color:'#fb923c', bg:'rgba(251,146,60,.13)',  border:'rgba(251,146,60,.3)',  icon:'🌗' },
};

const pillClass = (s) => ({
  present:'pill-green', absent:'pill-red', late:'pill-amber',
  wfh:'pill-blue', half_day:'pill-amber',
})[s] || 'pill-gray';

export default function Attendance() {
  const { isAdmin } = useAuth();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [records,     setRecords]     = useState([]);
  const [allRecords,  setAllRecords]  = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [month,       setMonth]       = useState(new Date().getMonth());
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [selectedEmp, setSelectedEmp] = useState('all');

  // Day-click modal
  const [dayModal,    setDayModal]    = useState(false);
  const [clickedDate, setClickedDate] = useState(null);
  const [dayRecords,  setDayRecords]  = useState([]);

  const today = new Date();

  useEffect(() => {
    if (isAdmin()) {
      authAPI.getUsers().then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setEmployees(data.filter(u => u.role === 'employee'));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => { fetchAttendance(); }, [month, year, selectedEmp]);

  const fetchAttendance = async () => {
    setLoading(true);
    setRecords([]); setAllRecords([]);
    try {
      if (isAdmin()) {
        const params = { month: month + 1, year };
        if (selectedEmp !== 'all') params.employee = selectedEmp;
        const res  = await attendanceAPI.getAll(params);
        const raw  = Array.isArray(res.data) ? res.data : (res.data.results || res.data.data || []);
        setAllRecords(raw.map(r => ({ ...r, date: normalizeDate(r.date), status: normalizeStatus(r.status) })));
      } else {
        const res  = await attendanceAPI.getMine({ month: month + 1, year });
        const raw  = Array.isArray(res.data) ? res.data : (res.data.results || res.data.data || []);
        setRecords(raw.map(r => ({ ...r, date: normalizeDate(r.date), status: normalizeStatus(r.status) })));
      }
    } catch (err) { console.error('[Attendance]', err); }
    finally { setLoading(false); }
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const getEmployeeStatus = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return records.find(r => r.date === d)?.status || null;
  };

  const getAdminDaySummary = (day) => {
    const d = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const recs = allRecords.filter(r => r.date === d);
    if (!recs.length) return null;
    return {
      present:  recs.filter(r=>r.status==='present').length,
      absent:   recs.filter(r=>r.status==='absent').length,
      late:     recs.filter(r=>r.status==='late').length,
      wfh:      recs.filter(r=>r.status==='wfh').length,
      half_day: recs.filter(r=>r.status==='half_day').length,
      total:    recs.length,
    };
  };

  const handleDayClick = (day) => {
    if (!isAdmin()) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const recs = allRecords.filter(r => r.date === dateStr);

    const list = employees.map(emp => {
      const rec = recs.find(r =>
        String(r.employee)    === String(emp.id) ||
        String(r.employee_id) === String(emp.id) ||
        String(r.user)        === String(emp.id)
      );
      return {
        ...emp,
        status:        rec?.status    || 'absent',
        check_in:      rec?.check_in  || rec?.check_in_time  || null,
        check_out:     rec?.check_out || rec?.check_out_time || null,
        working_hours: rec?.working_hours || rec?.hours || null,
        hasRecord:     !!rec,
      };
    });

    setClickedDate(dateStr);
    setDayRecords(list);
    setDayModal(true);
  };

  const activeRecords = isAdmin() ? allRecords : records;
  const stats = {
    present: activeRecords.filter(r=>r.status==='present').length,
    absent:  activeRecords.filter(r=>r.status==='absent').length,
    late:    activeRecords.filter(r=>r.status==='late').length,
    wfh:     activeRecords.filter(r=>r.status==='wfh').length,
  };

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return `${DAY_LABELS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  const dayModalStats = clickedDate ? {
    present:  dayRecords.filter(r=>r.status==='present').length,
    absent:   dayRecords.filter(r=>r.status==='absent').length,
    late:     dayRecords.filter(r=>r.status==='late').length,
    wfh:      dayRecords.filter(r=>r.status==='wfh').length,
    half_day: dayRecords.filter(r=>r.status==='half_day').length,
  } : {};

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar
          title="Attendance"
          subtitle={isAdmin() ? 'Click any date to see employee details' : 'My attendance records'}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="dash-content">

          {/* Admin filter bar */}
          {isAdmin() && (
            <div className="section-card" style={{padding:'14px 20px',marginBottom:20,
              display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <span style={{fontSize:13,color:'rgba(255,255,255,.45)',fontWeight:600}}>🔍 Filter:</span>
              <select value={selectedEmp} onChange={e=>setSelectedEmp(e.target.value)}
                style={{padding:'9px 14px',background:'rgba(255,255,255,.06)',
                  border:'1px solid rgba(255,255,255,.12)',borderRadius:10,
                  color:'#e8eaf2',fontSize:13,fontFamily:'inherit',cursor:'pointer',outline:'none',minWidth:220}}>
                <option value="all">👥 All Employees</option>
                {employees.map(e=>(
                  <option key={e.id} value={e.id}>{e.full_name} · {e.employee_id||''}</option>
                ))}
              </select>
              <button onClick={fetchAttendance}
                style={{padding:'9px 14px',background:'rgba(99,102,241,.15)',
                  border:'1px solid rgba(99,102,241,.3)',borderRadius:10,
                  color:'#818cf8',fontSize:13,fontFamily:'inherit',cursor:'pointer'}}>
                🔄 Refresh
              </button>
              <span style={{fontSize:12,color:'rgba(255,255,255,.25)',marginLeft:'auto'}}>
                💡 Click any date to view attendance breakdown
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid" style={{marginBottom:24}}>
            {[
              {label:'✅ Present',value:stats.present,color:'#34d399'},
              {label:'❌ Absent', value:stats.absent, color:'#f87171'},
              {label:'⏰ Late',   value:stats.late,   color:'#fbbf24'},
              {label:'🏠 WFH',   value:stats.wfh,    color:'#818cf8'},
            ].map(s=>(
              <div key={s.label} className="section-card" style={{padding:'18px 20px'}}>
                <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:4}}>{s.label}</div>
                <div style={{color:s.color,fontSize:28,fontWeight:800}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="section-card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{fontSize:18,fontWeight:800,color:'#fff'}}>{MONTHS[month]} {year}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="act-btn" onClick={prevMonth}>‹</button>
                <button className="act-btn" onClick={nextMonth}>›</button>
              </div>
            </div>

            {/* Legend */}
            <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
              {Object.entries(STATUS_META).map(([key,m])=>(
                <span key={key} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(255,255,255,.5)'}}>
                  <span style={{width:10,height:10,borderRadius:3,background:m.color,display:'inline-block',flexShrink:0}}/>
                  {m.icon} {m.label}
                </span>
              ))}
            </div>

            {loading ? (
              <div className="skeleton" style={{height:360,borderRadius:12}}/>
            ) : (
              <div className={`attend-calendar ${isAdmin() ? 'admin-calendar' : ''}`}>
                {DAY_LABELS.map(d=><div key={d} className="attend-day-label">{d}</div>)}
                {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} className="attend-day empty"/>)}
                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day      = i + 1;
                  const dateObj  = new Date(year, month, day);
                  const isToday  = today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
                  const isPast   = dateObj < new Date(today.getFullYear(),today.getMonth(),today.getDate());
                  const isWeekend= dateObj.getDay()===0 || dateObj.getDay()===6;

                  if (isAdmin()) {
                    const summary = getAdminDaySummary(day);
                    return (
                      <div key={day}
                        className={[
                          'attend-day admin-day',
                          summary ? (summary.absent>0&&summary.present===0?'absent':'present') : '',
                          isWeekend&&!summary?'weekend':'',
                          isPast&&!summary&&!isWeekend?'no-record':'',
                          isToday?'today':'',
                        ].filter(Boolean).join(' ')}
                        onClick={()=>handleDayClick(day)}
                      >
                        <span className="attend-day-num">{day}</span>
                        {summary && (
                          <div className="admin-day-pills">
                            {summary.present  >0&&<span className="adp present">{summary.present}</span>}
                            {summary.absent   >0&&<span className="adp absent">{summary.absent}</span>}
                            {summary.late     >0&&<span className="adp late">{summary.late}</span>}
                            {summary.wfh      >0&&<span className="adp wfh">{summary.wfh}</span>}
                            {summary.half_day >0&&<span className="adp half_day">{summary.half_day}</span>}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    const status = getEmployeeStatus(day);
                    return (
                      <div key={day}
                        className={[
                          'attend-day',
                          status||'',
                          isToday?'today':'',
                          isPast&&!status&&!isWeekend?'no-record':'',
                          isWeekend&&!status?'weekend':'',
                        ].filter(Boolean).join(' ')}
                        title={status?STATUS_META[status]?.label||status:isWeekend?'Weekend':'No record'}
                      >
                        <span className="attend-day-num">{day}</span>
                        {status&&<span className="attend-day-dot"/>}
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>

          {/* Employee records table */}
          {!isAdmin() && (
            <div className="section-card" style={{marginTop:20}}>
              <div className="section-card-head">
                <h3>📋 Detailed Records
                  <span style={{fontSize:12,color:'rgba(255,255,255,.3)',fontWeight:400,marginLeft:8}}>
                    {records.length} record{records.length!==1?'s':''} this month
                  </span>
                </h3>
              </div>
              {loading ? (
                <div className="skeleton" style={{height:120,borderRadius:10}}/>
              ) : records.length===0 ? (
                <div className="empty-state">
                  <div className="empty-ico">📅</div>
                  <p>No records for {MONTHS[month]} {year}</p>
                </div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                    <tbody>
                      {[...records].sort((a,b)=>a.date>b.date?-1:1).map(r=>(
                        <tr key={r.id||r.date}>
                          <td style={{fontWeight:600}}>{r.date||'—'}</td>
                          <td style={{color:'rgba(255,255,255,.4)'}}>
                            {r.date?DAY_LABELS[new Date(r.date+'T00:00:00').getDay()]:'—'}
                          </td>
                          <td>{r.check_in||r.check_in_time||'—'}</td>
                          <td>{r.check_out||r.check_out_time||'—'}</td>
                          <td>{r.working_hours||r.hours?`${r.working_hours||r.hours}h`:'—'}</td>
                          <td><span className={`pill ${pillClass(r.status)}`}>{STATUS_META[r.status]?.label||r.status||'Unknown'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Day detail modal */}
      <Modal
        open={dayModal}
        onClose={()=>setDayModal(false)}
        title={`📅 ${formatDate(clickedDate)}`}
        width="620px"
        footer={<button className="btn-ghost" onClick={()=>setDayModal(false)}>Close</button>}
      >
        {/* Summary counts */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
          {Object.entries(dayModalStats).map(([key,count])=>count>0?(
            <div key={key} style={{display:'flex',alignItems:'center',gap:8,
              padding:'10px 16px',borderRadius:12,
              background:STATUS_META[key]?.bg,
              border:`1px solid ${STATUS_META[key]?.border}`}}>
              <span style={{fontSize:18}}>{STATUS_META[key]?.icon}</span>
              <div>
                <div style={{fontSize:22,fontWeight:800,color:STATUS_META[key]?.color,lineHeight:1}}>{count}</div>
                <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:1}}>{STATUS_META[key]?.label}</div>
              </div>
            </div>
          ):null)}
        </div>

        {/* Grouped employee rows */}
        {['present','absent','late','wfh','half_day'].map(status=>{
          const group = dayRecords.filter(r=>r.status===status);
          if (!group.length) return null;
          const meta = STATUS_META[status];
          return (
            <div key={status} style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:.6,textTransform:'uppercase',
                color:meta.color,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:meta.color,display:'inline-block'}}/>
                {meta.icon} {meta.label} ({group.length})
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {group.map(emp=>(
                  <div key={emp.id} style={{display:'flex',alignItems:'center',gap:12,
                    padding:'10px 14px',borderRadius:12,
                    background:meta.bg,border:`1px solid ${meta.border}`}}>
                    {/* Avatar */}
                    <div style={{width:34,height:34,borderRadius:10,flexShrink:0,
                      background:'rgba(99,102,241,.3)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:800,color:'#a5b4fc',overflow:'hidden'}}>
                      {emp.profile_image
                        ?<img src={emp.profile_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :(emp.full_name||'?').charAt(0).toUpperCase()}
                    </div>
                    {/* Name */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#e8eaf2',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {emp.full_name||'—'}
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:1}}>
                        {emp.employee_id||''}{emp.department?` · ${emp.department}`:''}
                      </div>
                    </div>
                    {/* Times */}
                    {(emp.check_in||emp.check_out)&&(
                      <div style={{textAlign:'right',flexShrink:0}}>
                        {emp.check_in&&<div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>In: <span style={{color:'#e8eaf2',fontWeight:600}}>{emp.check_in}</span></div>}
                        {emp.check_out&&<div style={{fontSize:11,color:'rgba(255,255,255,.45)'}}>Out: <span style={{color:'#e8eaf2',fontWeight:600}}>{emp.check_out}</span></div>}
                        {emp.working_hours&&<div style={{fontSize:11,color:meta.color,fontWeight:700,marginTop:2}}>{emp.working_hours}h</div>}
                      </div>
                    )}
                    <span className={`pill ${pillClass(status)}`} style={{flexShrink:0}}>{meta.icon}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {dayRecords.length===0&&(
          <div className="empty-state">
            <div className="empty-ico">📅</div>
            <p>No attendance records for this date</p>
          </div>
        )}
      </Modal>
    </div>
  );
}