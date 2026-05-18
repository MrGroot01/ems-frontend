import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { AttendanceBarChart, SalaryLineChart, DepartmentPieChart, TaskStatusChart } from '../../components/Charts/Charts';
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

export default function Reports() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState('6m');

  const handleExport = (type) => {
    alert(`Exporting ${type} report as CSV…`);
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
            <div style={{display:'flex',gap:10}}>
              {/* Period selector */}
              <div style={{display:'flex',background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:10,padding:4,gap:4}}>
                {['1m','3m','6m','1y'].map(p => (
                  <button key={p}
                    style={{padding:'6px 14px',border:'none',borderRadius:8,cursor:'pointer',
                      fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:12,fontWeight:700,
                      background: period===p ? 'rgba(99,102,241,.25)':'none',
                      color: period===p ? '#fff':'rgba(255,255,255,.4)',transition:'all .2s'}}
                    onClick={() => setPeriod(p)}>{p}</button>
                ))}
              </div>
              <button className="qa-btn" onClick={() => handleExport('full')}>⬇ Export CSV</button>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="stats-grid" style={{marginBottom:28}}>
            {SUMMARY_STATS.map(s => (
              <div key={s.label} className="section-card" style={{padding:'20px 22px'}}>
                <div style={{fontSize:28,marginBottom:10}}>{s.icon}</div>
                <div style={{fontSize:28,fontWeight:800,color:s.color,letterSpacing:'-1px'}}>{s.value}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,.4)',marginTop:4}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div className="charts-grid">
            <AttendanceBarChart data={ATTEND_DATA} />
            <DepartmentPieChart data={DEPT_DATA} />
            <SalaryLineChart    data={SALARY_DATA} />
            <TaskStatusChart    data={TASK_DATA} />
          </div>

          {/* Download report cards */}
          <div className="section-card" style={{marginTop:4}}>
            <div className="section-card-head"><h3>📥 Download Reports</h3></div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:14}}>
              {[
                { icon:'📅', title:'Attendance Report',  desc:'Monthly check-in/out records',   type:'attendance'  },
                { icon:'💰', title:'Payroll Report',     desc:'Salary & payslip summary',        type:'payroll'    },
                { icon:'🏖️', title:'Leave Report',       desc:'Leave taken by all employees',    type:'leave'      },
                { icon:'✅', title:'Task Report',        desc:'Task completion statistics',       type:'tasks'      },
                { icon:'👥', title:'Employee Report',    desc:'Full employee directory',          type:'employees'  },
                { icon:'📊', title:'Performance Report', desc:'KPIs & productivity overview',    type:'performance'},
              ].map(r => (
                <div key={r.type} style={{
                  background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',
                  borderRadius:14,padding:18,cursor:'pointer',transition:'all .2s'
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(99,102,241,.3)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}
                  onClick={() => handleExport(r.type)}>
                  <div style={{fontSize:26,marginBottom:10}}>{r.icon}</div>
                  <div style={{fontSize:14,fontWeight:800,color:'#fff',marginBottom:4}}>{r.title}</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,.35)',marginBottom:14}}>{r.desc}</div>
                  <button className="payslip-dl" style={{fontSize:12,padding:'6px 14px'}}>⬇ Download CSV</button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
