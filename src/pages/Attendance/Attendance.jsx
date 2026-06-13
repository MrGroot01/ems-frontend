import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import Modal   from '../../components/Modal/Modal';
import { attendanceAPI, authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Attendance.css';

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const STATUS_META = {
  present:  { label:'Present',  color:'#34d399', bg:'rgba(16,185,129,.15)',  border:'rgba(16,185,129,.3)',  icon:'✅' },
  absent:   { label:'Absent',   color:'#f87171', bg:'rgba(239,68,68,.15)',   border:'rgba(239,68,68,.35)',  icon:'❌' },
  late:     { label:'Late',     color:'#fbbf24', bg:'rgba(245,158,11,.13)',  border:'rgba(245,158,11,.3)',  icon:'⏰' },
  wfh:      { label:'WFH',      color:'#818cf8', bg:'rgba(99,102,241,.14)',  border:'rgba(99,102,241,.3)',  icon:'🏠' },
  half_day: { label:'Half Day', color:'#fb923c', bg:'rgba(251,146,60,.13)',  border:'rgba(251,146,60,.3)',  icon:'🌗' },
};

const normalizeStatus = (raw) => {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  if (s === 'present')                        return 'present';
  if (s === 'absent')                         return 'absent';
  if (s === 'late' || s === 'late_arrival')   return 'late';
  if (s === 'wfh'  || s === 'work_from_home') return 'wfh';
  if (s === 'half_day')                       return 'half_day';
  return null;
};

const normalizeDate = (raw) => {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(raw))) return raw;
  if (String(raw).includes('T')) return String(raw).split('T')[0];
  return String(raw);
};

// Extract employee ID from a record regardless of how backend returns it
// Handles: r.employee = 5  OR  r.employee = {id:5}  OR  r.employee_id = 5  OR  r.user = 5
const getEmpId = (r) => {
  if (r.employee && typeof r.employee === 'object') return String(r.employee.id || '');
  if (r.employee)    return String(r.employee);
  if (r.employee_id) return String(r.employee_id);
  if (r.user && typeof r.user === 'object') return String(r.user.id || '');
  if (r.user)        return String(r.user);
  return null;
};

const pillClass = (s) => ({
  present:'pill-green', absent:'pill-red', late:'pill-amber',
  wfh:'pill-blue', half_day:'pill-amber',
})[s] || 'pill-gray';

// Is this date in the future (after today)?
const isFutureDate = (year, month, day) => {
  const today = new Date();
  today.setHours(0,0,0,0);
  const d = new Date(year, month, day);
  return d > today;
};

const isWeekendDay = (year, month, day) =>
  new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

export default function Attendance() {
  const { isAdmin } = useAuth();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [records,     setRecords]     = useState([]);      // employee own records
  const [allRecords,  setAllRecords]  = useState([]);      // admin: all employees
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [month,       setMonth]       = useState(new Date().getMonth());
  const [year,        setYear]        = useState(new Date().getFullYear());
  const [selectedEmp, setSelectedEmp] = useState('all');

  // Day modal
  const [dayModal,    setDayModal]    = useState(false);
  const [clickedDate, setClickedDate] = useState(null);
  const [dayRecords,  setDayRecords]  = useState([]);

  const today = new Date();
  today.setHours(0,0,0,0);

  // ── Fetch employees (admin) ───────────────────────────────
  useEffect(() => {
    if (isAdmin()) {
      authAPI.getUsers().then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setEmployees(data.filter(u => u.role === 'employee'));
      }).catch(console.error);
    }
  }, []);

  useEffect(() => { fetchAttendance(); }, [month, year, selectedEmp]);

  // ── Fetch attendance ──────────────────────────────────────
  const fetchAttendance = async () => {
    setLoading(true);
    setRecords([]); setAllRecords([]);
    try {
      let raw = [];
      if (isAdmin()) {
        const params = { month: month + 1, year };
        if (selectedEmp !== 'all') params.employee = selectedEmp;
        const res = await attendanceAPI.getAll(params);
        raw = Array.isArray(res.data) ? res.data : (res.data.results || res.data.data || []);
        // Log raw so you can inspect field names in DevTools
        console.log('[Attendance] raw admin records sample:', raw[0]);
        const norm = raw.map(r => ({
          ...r,
          _empId:  getEmpId(r),
          date:    normalizeDate(r.date),
          status:  normalizeStatus(r.status),
        }));
        setAllRecords(norm);
      } else {
        const res = await attendanceAPI.getMine({ month: month + 1, year });
        raw = Array.isArray(res.data) ? res.data : (res.data.results || res.data.data || []);
        console.log('[Attendance] raw employee records sample:', raw[0]);
        const norm = raw.map(r => ({
          ...r,
          date:   normalizeDate(r.date),
          status: normalizeStatus(r.status),
        }));
        setRecords(norm);
      }
    } catch (err) { console.error('[Attendance] fetch error:', err); }
    finally { setLoading(false); }
  };

  // ── Calendar setup ────────────────────────────────────────
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const fmtDate = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

  // Employee: status for one day
  const getEmployeeStatus = (day) => {
    const d = fmtDate(day);
    return records.find(r => r.date === d)?.status || null;
  };

  // Admin: summary counts for one day (only past/today dates)
  const getAdminDaySummary = (day) => {
    if (isFutureDate(year, month, day)) return null;   // ← KEY FIX: never show future
    const d = fmtDate(day);
    const recs = allRecords.filter(r => r.date === d);
    if (!recs.length) return null;
    return {
      present:  recs.filter(r => r.status === 'present').length,
      absent:   recs.filter(r => r.status === 'absent').length,
      late:     recs.filter(r => r.status === 'late').length,
      wfh:      recs.filter(r => r.status === 'wfh').length,
      half_day: recs.filter(r => r.status === 'half_day').length,
      total:    recs.length,
    };
  };

  // Admin: click a day → build employee list for that date
  const handleDayClick = (day) => {
    if (!isAdmin()) return;
    if (isFutureDate(year, month, day)) return;   // ← ignore future clicks

    const dateStr = fmtDate(day);
    const recs    = allRecords.filter(r => r.date === dateStr);

    const list = employees.map(emp => {
      const rec = recs.find(r => r._empId === String(emp.id));
      return {
        ...emp,
        status:        rec ? rec.status || 'absent' : null,  // null = no record at all
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

  // ── Stats — only count records that exist (no future padding) ──
  const activeRecords = isAdmin() ? allRecords : records;

  // For admin stats: only records on or before today
  const validRecords = isAdmin()
    ? activeRecords.filter(r => {
        const d = new Date(r.date + 'T00:00:00');
        return d <= today;
      })
    : activeRecords;

  const stats = {
    present:  validRecords.filter(r => r.status === 'present').length,
    absent:   validRecords.filter(r => r.status === 'absent').length,
    late:     validRecords.filter(r => r.status === 'late').length,
    wfh:      validRecords.filter(r => r.status === 'wfh').length,
  };

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

  const formatDate = (d) => {
    if (!d) return '';
    const dt = new Date(d + 'T00:00:00');
    return `${DAY_LABELS[dt.getDay()]}, ${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  // Modal summary
  const dayModalStats = {
    present:  dayRecords.filter(r => r.status === 'present').length,
    absent:   dayRecords.filter(r => r.status === 'absent' || (r.hasRecord && !r.status)).length,
    late:     dayRecords.filter(r => r.status === 'late').length,
    wfh:      dayRecords.filter(r => r.status === 'wfh').length,
    half_day: dayRecords.filter(r => r.status === 'half_day').length,
    no_record: dayRecords.filter(r => !r.hasRecord).length,
  };

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar
          title="Attendance"
          subtitle={isAdmin() ? 'Click any past date to see employee details' : 'My attendance records'}
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
                💡 Click any past date to view details
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid" style={{marginBottom:24}}>
            {[
              {label:'✅ Present', value:stats.present, color:'#34d399'},
              {label:'❌ Absent',  value:stats.absent,  color:'#f87171'},
              {label:'⏰ Late',    value:stats.late,    color:'#fbbf24'},
              {label:'🏠 WFH',    value:stats.wfh,     color:'#818cf8'},
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
              <span style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(255,255,255,.3)'}}>
                <span style={{width:10,height:10,borderRadius:3,background:'rgba(255,255,255,.15)',display:'inline-block',flexShrink:0}}/>
                Future
              </span>
            </div>

            {loading ? (
              <div className="skeleton" style={{height:360,borderRadius:12}}/>
            ) : (
              <div className={`attend-calendar ${isAdmin()?'admin-calendar':''}`}>
                {DAY_LABELS.map(d=><div key={d} className="attend-day-label">{d}</div>)}
                {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} className="attend-day empty"/>)}

                {Array.from({length:daysInMonth}).map((_,i)=>{
                  const day     = i + 1;
                  const future  = isFutureDate(year, month, day);
                  const weekend = isWeekendDay(year, month, day);
                  const isToday = new Date(year,month,day).getTime() === today.getTime();

                  if (isAdmin()) {
                    const summary = getAdminDaySummary(day);  // null for future
                    // Dominant color: if any absent → show absent tint; if all present → green
                    let dominant = '';
                    if (!future && summary) {
                      if (summary.absent > 0 && summary.present === 0) dominant = 'absent';
                      else if (summary.present > 0) dominant = 'present';
                    }

                    return (
                      <div key={day}
                        className={[
                          'attend-day admin-day',
                          future   ? 'future'  : '',
                          weekend && future ? 'weekend-future' : '',
                          !future && !summary && !weekend ? 'no-record' : '',
                          !future && !summary && weekend  ? 'weekend'   : '',
                          dominant,
                          isToday ? 'today' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={() => !future && handleDayClick(day)}
                        style={{ cursor: future ? 'default' : 'pointer' }}
                        title={future ? 'Future date' : summary ? `Click to view — ${summary.total} records` : 'No records — click to view'}
                      >
                        <span className="attend-day-num">{day}</span>
                        {!future && summary && (
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
                          future  ? 'future'  : '',
                          status  ? status    : '',
                          isToday ? 'today'   : '',
                          !future && !status && !weekend ? 'no-record' : '',
                          !future && !status && weekend  ? 'weekend'   : '',
                        ].filter(Boolean).join(' ')}
                        title={future ? 'Future date' : status ? STATUS_META[status]?.label : weekend ? 'Weekend' : 'No record'}
                      >
                        <span className="attend-day-num">{day}</span>
                        {status && <span className="attend-day-dot"/>}
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
                    <thead>
                      <tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
                    </thead>
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
                          <td>
                            <span className={`pill ${pillClass(r.status)}`}>
                              {STATUS_META[r.status]?.label||r.status||'Unknown'}
                            </span>
                          </td>
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

      {/* ── DAY DETAIL MODAL ───────────────────────────────── */}
      <Modal
        open={dayModal}
        onClose={()=>setDayModal(false)}
        title={`📅 ${formatDate(clickedDate)}`}
        width="620px"
        footer={<button className="btn-ghost" onClick={()=>setDayModal(false)}>Close</button>}
      >
        {/* Summary count pills */}
        <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
          {Object.entries(dayModalStats).map(([key,count])=>{
            if (!count) return null;
            const meta = key === 'no_record'
              ? {label:'No Record', color:'rgba(255,255,255,.3)', bg:'rgba(255,255,255,.05)', border:'rgba(255,255,255,.1)', icon:'➖'}
              : STATUS_META[key];
            if (!meta) return null;
            return (
              <div key={key} style={{display:'flex',alignItems:'center',gap:8,
                padding:'10px 16px',borderRadius:12,
                background:meta.bg, border:`1px solid ${meta.border}`}}>
                <span style={{fontSize:18}}>{meta.icon}</span>
                <div>
                  <div style={{fontSize:22,fontWeight:800,color:meta.color,lineHeight:1}}>{count}</div>
                  <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:1}}>{meta.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Employee rows grouped by status */}
        {['present','absent','late','wfh','half_day'].map(status=>{
          // For "absent": include both employees with absent record AND employees with no record
          const group = status === 'absent'
            ? dayRecords.filter(r => r.status === 'absent' || !r.hasRecord)
            : dayRecords.filter(r => r.status === status);
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
                    background: emp.hasRecord ? meta.bg : 'rgba(239,68,68,.08)',
                    border:`1px solid ${emp.hasRecord ? meta.border : 'rgba(239,68,68,.15)'}`}}>
                    {/* Avatar */}
                    <div style={{width:34,height:34,borderRadius:10,flexShrink:0,
                      background:'rgba(99,102,241,.3)',overflow:'hidden',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:800,color:'#a5b4fc'}}>
                      {emp.profile_image
                        ?<img src={emp.profile_image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                        :(emp.full_name||'?').charAt(0).toUpperCase()}
                    </div>
                    {/* Name + ID */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#e8eaf2',
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {emp.full_name||'—'}
                        {!emp.hasRecord && (
                          <span style={{fontSize:10,color:'rgba(255,255,255,.25)',marginLeft:8,fontWeight:400}}>
                            (no record)
                          </span>
                        )}
                      </div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,.35)',marginTop:1}}>
                        {emp.employee_id||''}{emp.department?` · ${emp.department}`:''}
                      </div>
                    </div>
                    {/* Times */}
                    {(emp.check_in||emp.check_out)&&(
                      <div style={{textAlign:'right',flexShrink:0}}>
                        {emp.check_in&&<div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>In: <span style={{color:'#e8eaf2',fontWeight:600}}>{emp.check_in}</span></div>}
                        {emp.check_out&&<div style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>Out: <span style={{color:'#e8eaf2',fontWeight:600}}>{emp.check_out}</span></div>}
                        {emp.working_hours&&<div style={{fontSize:11,color:meta.color,fontWeight:700,marginTop:2}}>{emp.working_hours}h</div>}
                      </div>
                    )}
                    <span className={`pill ${pillClass(emp.hasRecord ? status : 'absent')}`} style={{flexShrink:0}}>
                      {emp.hasRecord ? meta.icon : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {dayRecords.length===0&&(
          <div className="empty-state">
            <div className="empty-ico">📅</div>
            <p>No employees found</p>
          </div>
        )}
      </Modal>
    </div>
  );
}