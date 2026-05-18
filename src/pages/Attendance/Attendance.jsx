import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { attendanceAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';
import './Attendance.css';

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_COLOR = { present:'present', absent:'absent', late:'late', wfh:'wfh', half_day:'late' };

export default function Attendance() {
  const { isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [month,      setMonth]      = useState(new Date().getMonth());
  const [year,       setYear]       = useState(new Date().getFullYear());

  useEffect(() => { fetchAttendance(); }, [month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res  = await attendanceAPI.getMine();
      setRecords(res.data.results || res.data || []);
    } catch {} finally { setLoading(false); }
  };

  // Build calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const today       = new Date();

  const getStatus = (day) => {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const rec = records.find(r => r.date === dateStr);
    return rec ? rec.status : null;
  };

  const stats = {
    present: records.filter(r=>r.status==='present').length,
    absent:  records.filter(r=>r.status==='absent').length,
    late:    records.filter(r=>r.status==='late').length,
    wfh:     records.filter(r=>r.status==='wfh').length,
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <div className="dash-main">
        <Navbar title="Attendance" onMenuClick={() => setMobileOpen(true)} />

        <div className="dash-content">
          <div className="page-header">
            <div><h1>📅 Attendance Tracker</h1><p>View monthly attendance records</p></div>
          </div>

          {/* Stats row */}
          <div className="stats-grid" style={{marginBottom:24}}>
            <div className="section-card" style={{padding:'18px 20px'}}>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:4}}>✅ Present Days</div>
              <div style={{color:'#34d399',fontSize:28,fontWeight:800}}>{stats.present}</div>
            </div>
            <div className="section-card" style={{padding:'18px 20px'}}>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:4}}>❌ Absent Days</div>
              <div style={{color:'#f87171',fontSize:28,fontWeight:800}}>{stats.absent}</div>
            </div>
            <div className="section-card" style={{padding:'18px 20px'}}>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:4}}>⏰ Late Days</div>
              <div style={{color:'#fbbf24',fontSize:28,fontWeight:800}}>{stats.late}</div>
            </div>
            <div className="section-card" style={{padding:'18px 20px'}}>
              <div style={{color:'rgba(255,255,255,.4)',fontSize:12,marginBottom:4}}>🏠 WFH Days</div>
              <div style={{color:'#818cf8',fontSize:28,fontWeight:800}}>{stats.wfh}</div>
            </div>
          </div>

          {/* Calendar */}
          <div className="section-card">
            {/* Month nav */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div style={{fontSize:18,fontWeight:800,color:'#fff'}}>{MONTHS[month]} {year}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="act-btn" onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}>‹</button>
                <button className="act-btn" onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}>›</button>
              </div>
            </div>

            {/* Legend */}
            <div style={{display:'flex',gap:16,marginBottom:16,flexWrap:'wrap'}}>
              {[['present','✅','#34d399'],['absent','❌','#f87171'],['late','⏰','#fbbf24'],['wfh','🏠','#818cf8']].map(([s,i,c])=>(
                <span key={s} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'rgba(255,255,255,.45)'}}>
                  <span style={{width:10,height:10,borderRadius:3,background:c,display:'inline-block'}}/>
                  {i} {s.charAt(0).toUpperCase()+s.slice(1)}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="attend-calendar">
              {DAY_LABELS.map(d => <div key={d} className="attend-day-label">{d}</div>)}
              {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} className="attend-day empty"/>)}
              {Array.from({length: daysInMonth}).map((_,i) => {
                const day    = i + 1;
                const status = getStatus(day);
                const isToday= today.getDate()===day && today.getMonth()===month && today.getFullYear()===year;
                return (
                  <div key={day} className={`attend-day ${status ? STATUS_COLOR[status]||'' : ''} ${isToday?'today':''}`}
                    title={status || 'No record'}>
                    {day}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Records table */}
          <div className="section-card" style={{marginTop:20}}>
            <div className="section-card-head"><h3>📋 Detailed Records</h3></div>
            {loading ? (
              <div className="skeleton" style={{height:120,borderRadius:10}}/>
            ) : records.length === 0 ? (
              <div className="empty-state"><div className="empty-ico">📅</div><p>No attendance records</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                <tbody>
                  {records.slice(0,20).map(r => (
                    <tr key={r.id}>
                      <td>{r.date}</td>
                      <td>{r.check_in || '—'}</td>
                      <td>{r.check_out || '—'}</td>
                      <td>{r.working_hours ? `${r.working_hours}h` : '—'}</td>
                      <td><span className={`pill ${r.status==='present'?'pill-green':r.status==='absent'?'pill-red':r.status==='late'?'pill-amber':'pill-blue'}`}>{r.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
