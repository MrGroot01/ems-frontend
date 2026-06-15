import { useState, useEffect, useRef } from 'react';

const COMPANY_UPDATES = [
  '🏢 Q2 targets achieved ahead of schedule!',
  '🎉 EMS Pro system upgraded with new features',
  '📊 Monthly performance review this Friday',
  '🚀 New project kickoff meeting tomorrow 10 AM',
  '💡 Innovation challenge submissions open',
  '🏆 Employee of the month voting now open',
  '📅 Team outing planned for next Saturday',
  '🔒 Security audit completed successfully',
  '🌟 New HR policies effective from next month',
  '📱 Mobile app update available now',
];

const MOCK_NEWS = [
  { type:'news', icon:'📈', title:'Sensex rises 300 points on strong earnings', time:'10:30 AM', source:'Economic Times', url:'#' },
  { type:'news', icon:'💹', title:'India GDP growth forecast upgraded to 7.2%',  time:'09:15 AM', source:'Business Standard', url:'#' },
  { type:'news', icon:'🚀', title:'Tech startups raise record funding in Q2',    time:'08:45 AM', source:'Mint', url:'#' },
  { type:'news', icon:'🏭', title:'Manufacturing sector shows strong recovery',  time:'11:00 AM', source:'Hindu BL', url:'#' },
  { type:'news', icon:'💡', title:'AI adoption accelerating across industries',  time:'12:30 PM', source:'TechCrunch', url:'#' },
  { type:'news', icon:'🌐', title:'Global markets stable amid economic signals', time:'01:15 PM', source:'Reuters', url:'#' },
  { type:'news', icon:'💰', title:'RBI holds repo rate steady at 6.5%',         time:'02:00 PM', source:'Moneycontrol', url:'#' },
];

const TYPE_COLORS = {
  news:    '#60a5fa',
  checkin: '#34d399',
  joiner:  '#a78bfa',
  company: '#fbbf24',
};

export default function LiveUpdates({ employees = [], attendance = [] }) {
  const [allItems,   setAllItems]   = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused,   setIsPaused]   = useState(false);
  const [showPanel,  setShowPanel]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('all');
  const timerRef = useRef(null);

  // ── Build combined feed ───────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Today's check-ins from live attendance data
    const checkIns = attendance
      .filter(a => a.date === today && a.check_in)
      .map(a => ({
        type:   'checkin',
        icon:   '✅',
        title:  `${a.user_name || a.employee_name || 'Someone'} checked in at ${a.check_in}`,
        time:   a.check_in,
        source: 'Attendance',
        url:    null,
      }));

    // New joiners today
    const joiners = employees
      .filter(e => {
        const joined = e.date_joined || e.user?.date_joined || '';
        return joined.startsWith(today);
      })
      .map(e => ({
        type:   'joiner',
        icon:   '👋',
        title:  `Welcome ${e.user?.full_name || e.full_name}! New ${e.designation || 'Employee'} joined today`,
        time:   'Today',
        source: 'HR',
        url:    null,
      }));

    // Company updates
    const companyItems = COMPANY_UPDATES.map(u => ({
      type:   'company',
      icon:   '🏢',
      title:  u,
      time:   '',
      source: 'Company',
      url:    null,
    }));

    const combined = [
      ...joiners,
      ...checkIns.slice(0, 5),
      ...MOCK_NEWS,
      ...companyItems,
    ];

    setAllItems(combined.length > 0 ? combined : [
      { type:'company', icon:'🏢', title:'Welcome to EMS Pro — your smart HR platform', time:'', source:'Company' },
      { type:'company', icon:'🎯', title:'Check your tasks and stay productive today!',  time:'', source:'Company' },
    ]);
  }, [employees, attendance]);

  // ── Auto-rotate ticker ────────────────────────────────
  useEffect(() => {
    if (!allItems.length || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIdx(i => (i + 1) % allItems.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [allItems, isPaused]);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e) => {
      if (!e.target.closest('.live-updates-root')) setShowPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  const current = allItems[currentIdx] || {};

  const tabCounts = {
    all:     allItems.length,
    news:    allItems.filter(i => i.type === 'news').length,
    checkin: allItems.filter(i => i.type === 'checkin').length,
    company: allItems.filter(i => i.type === 'company').length,
  };

  const visibleItems = activeTab === 'all'
    ? allItems
    : allItems.filter(i => i.type === activeTab);

  return (
    <div className="live-updates-root" style={{ position:'relative' }}>

      {/* ── Ticker Bar ── */}
      <div
        onClick={() => setShowPanel(p => !p)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{
          display:'flex', alignItems:'center', gap:10,
          background:'rgba(255,255,255,.04)',
          border:'1px solid rgba(255,255,255,.08)',
          borderRadius:99, padding:'6px 14px',
          maxWidth:400, overflow:'hidden',
          cursor:'pointer', userSelect:'none',
        }}
      >
        {/* Type badge */}
        <span style={{
          fontSize:10, fontWeight:700, flexShrink:0,
          color: TYPE_COLORS[current.type] || '#94a3b8',
          background:`${TYPE_COLORS[current.type] || '#94a3b8'}20`,
          border:`1px solid ${TYPE_COLORS[current.type] || '#94a3b8'}40`,
          padding:'2px 8px', borderRadius:20,
          textTransform:'uppercase', letterSpacing:'.5px',
        }}>
          {current.icon}{' '}
          {current.type === 'news'    ? 'NEWS'
         : current.type === 'checkin' ? 'LIVE'
         : current.type === 'joiner'  ? 'NEW'
         : 'UPDATE'}
        </span>

        {/* Scrolling title */}
        <div style={{ flex:1, overflow:'hidden' }}>
          <div key={currentIdx} style={{
            color:'#e2e8f0', fontSize:12, fontWeight:500,
            whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
            animation:'luFadeIn .5s ease',
          }}>
            {current.title}
          </div>
        </div>

        {/* Live dot */}
        <span style={{
          width:7, height:7, borderRadius:'50%', flexShrink:0,
          background:'#34d399', boxShadow:'0 0 6px #34d399',
          display:'inline-block', animation:'luPulse 1.5s infinite',
        }}/>

        <span style={{ color:'#64748b', fontSize:11, flexShrink:0 }}>
          {showPanel ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Dropdown Panel ── */}
      {showPanel && (
        <div style={{
          position:'absolute', top:44, right:0, zIndex:9999,
          width:420, maxHeight:520,
          background:'#0f172a',
          border:'1px solid rgba(255,255,255,.1)',
          borderRadius:16, overflow:'hidden',
          boxShadow:'0 20px 60px rgba(0,0,0,.7)',
        }}>
          {/* Header */}
          <div style={{
            padding:'14px 18px',
            borderBottom:'1px solid rgba(255,255,255,.06)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <div>
              <div style={{ color:'#fff', fontWeight:700, fontSize:14 }}>📡 Live Updates</div>
              <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>
                Real-time news &amp; company activity
              </div>
            </div>
            <button onClick={() => setShowPanel(false)} style={{
              background:'rgba(255,255,255,.06)', border:'none',
              borderRadius:8, color:'#94a3b8',
              width:28, height:28, cursor:'pointer', fontSize:16,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{
            display:'flex',
            borderBottom:'1px solid rgba(255,255,255,.06)',
          }}>
            {[
              { key:'all',     label:'All' },
              { key:'news',    label:'📰 News' },
              { key:'checkin', label:'✅ Live' },
              { key:'company', label:'🏢 Company' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex:1, padding:'9px 4px', border:'none',
                background:'transparent', cursor:'pointer',
                fontSize:11, fontWeight:600,
                color: activeTab === tab.key ? '#a5b4fc' : '#64748b',
                borderBottom: activeTab === tab.key
                  ? '2px solid #6366f1' : '2px solid transparent',
                transition:'color .2s',
              }}>
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span style={{
                    marginLeft:4, padding:'1px 5px', borderRadius:99,
                    background:'rgba(99,102,241,.2)', color:'#a5b4fc', fontSize:10,
                  }}>
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Items */}
          <div style={{ maxHeight:360, overflowY:'auto', padding:'6px 0' }}>
            {visibleItems.length === 0 ? (
              <div style={{
                textAlign:'center', padding:'32px 20px',
                color:'#64748b', fontSize:13,
              }}>
                No {activeTab} updates yet
              </div>
            ) : visibleItems.map((item, i) => (
              <div key={i}
                onClick={() => item.url && item.url !== '#' && window.open(item.url,'_blank')}
                style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'10px 18px',
                  borderBottom:'1px solid rgba(255,255,255,.04)',
                  cursor: item.url && item.url !== '#' ? 'pointer' : 'default',
                  transition:'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                {/* Icon box */}
                <div style={{
                  width:32, height:32, borderRadius:8, flexShrink:0,
                  background:`${TYPE_COLORS[item.type]||'#94a3b8'}18`,
                  border:`1px solid ${TYPE_COLORS[item.type]||'#94a3b8'}30`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15,
                }}>
                  {item.icon}
                </div>

                {/* Text */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    color:'#e2e8f0', fontSize:12, lineHeight:1.5,
                    marginBottom:4,
                    display:'-webkit-box',
                    WebkitLineClamp:2,
                    WebkitBoxOrient:'vertical',
                    overflow:'hidden',
                  }}>
                    {item.title}
                  </div>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{
                      color: TYPE_COLORS[item.type]||'#64748b',
                      fontSize:10, fontWeight:600,
                      textTransform:'uppercase', letterSpacing:'.5px',
                    }}>
                      {item.source}
                    </span>
                    {item.time && (
                      <span style={{ color:'#475569', fontSize:10 }}>· {item.time}</span>
                    )}
                    {item.url && item.url !== '#' && (
                      <span style={{ color:'#6366f1', fontSize:10 }}>· Read more →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding:'10px 18px',
            borderTop:'1px solid rgba(255,255,255,.06)',
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <span style={{ color:'#475569', fontSize:11 }}>
              {attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} check-ins today
            </span>
            <span style={{
              color:'#34d399', fontSize:11, fontWeight:600,
              display:'flex', alignItems:'center', gap:4,
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%',
                background:'#34d399', display:'inline-block',
                animation:'luPulse 1.5s infinite',
              }}/>
              LIVE
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes luFadeIn {
          from { opacity:0; transform:translateY(3px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes luPulse {
          0%,100% { opacity:1;   transform:scale(1);   }
          50%      { opacity:.5; transform:scale(1.25); }
        }
      `}</style>
    </div>
  );
}