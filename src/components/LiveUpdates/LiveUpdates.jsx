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
];

export default function LiveUpdates({ employees = [], attendance = [] }) {
  const [news,       setNews]       = useState([]);
  const [allItems,   setAllItems]   = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused,   setIsPaused]   = useState(false);
  const [showPanel,  setShowPanel]  = useState(false);
  const [activeTab,  setActiveTab]  = useState('all');
  const tickerRef = useRef(null);
  const timerRef  = useRef(null);

  // ── Fetch news ────────────────────────────────────────
  useEffect(() => {
    const fetchNews = async () => {
      const key = process.env.REACT_APP_NEWS_API_KEY;
      if (!key) {
        // Use mock news if no API key
        setNews(getMockNews());
        return;
      }
      try {
        const res = await fetch(
          `https://newsapi.org/v2/top-headlines?category=business&country=in&pageSize=10&apiKey=${key}`
        );
        const data = await res.json();
        if (data.status === 'ok' && data.articles?.length) {
          setNews(data.articles.map(a => ({
            type:  'news',
            icon:  '📰',
            title: a.title?.replace(' - ' + a.source?.name, '') || '',
            url:   a.url,
            time:  new Date(a.publishedAt).toLocaleTimeString([], {
              hour:'2-digit', minute:'2-digit'
            }),
            source: a.source?.name,
          })));
        } else {
          setNews(getMockNews());
        }
      } catch {
        setNews(getMockNews());
      }
    };
    fetchNews();
    // Refresh every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Build combined feed ───────────────────────────────
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];

    // Today's check-ins
    const checkIns = attendance
      .filter(a => a.date === today && a.check_in)
      .map(a => ({
        type:   'checkin',
        icon:   '✅',
        title:  `${a.user_name} checked in at ${a.check_in}`,
        time:   a.check_in,
        source: 'Attendance',
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
      }));

    // Company updates
    const companyItems = COMPANY_UPDATES.map((u, i) => ({
      type:   'company',
      icon:   '🏢',
      title:  u,
      time:   '',
      source: 'Company',
    }));

    const combined = [
      ...joiners,
      ...checkIns.slice(0, 5),
      ...news.slice(0, 8),
      ...companyItems.slice(0, 4),
    ];

    setAllItems(combined.length > 0 ? combined : getDefaultItems());
  }, [news, employees, attendance]);

  // ── Auto-rotate ticker ────────────────────────────────
  useEffect(() => {
    if (!allItems.length || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIdx(i => (i + 1) % allItems.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [allItems, isPaused]);

  const getMockNews = () => [
    { type:'news', icon:'📈', title:'Sensex rises 300 points on strong earnings', time:'10:30 AM', source:'Economic Times', url:'#' },
    { type:'news', icon:'💹', title:'India GDP growth forecast upgraded to 7.2%', time:'09:15 AM', source:'Business Standard', url:'#' },
    { type:'news', icon:'🚀', title:'Tech startups raise record funding in Q2', time:'08:45 AM', source:'Mint', url:'#' },
    { type:'news', icon:'🏭', title:'Manufacturing sector shows strong recovery', time:'11:00 AM', source:'Hindu BL', url:'#' },
    { type:'news', icon:'💡', title:'AI adoption accelerating across industries', time:'12:30 PM', source:'TechCrunch', url:'#' },
  ];

  const getDefaultItems = () => [
    { type:'company', icon:'🏢', title:'Welcome to EMS Pro — your smart HR platform', time:'', source:'Company' },
    { type:'company', icon:'🎯', title:'Check your tasks and stay productive today!', time:'', source:'Company' },
    { type:'company', icon:'📊', title:'View your attendance and performance reports', time:'', source:'Company' },
  ];

  const current = allItems[currentIdx] || {};

  const typeColors = {
    news:    '#60a5fa',
    checkin: '#34d399',
    joiner:  '#a78bfa',
    company: '#fbbf24',
  };

  return (
    <>
      {/* ── Ticker Bar ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:12,
        background:'rgba(255,255,255,0.04)',
        border:'1px solid rgba(255,255,255,0.08)',
        borderRadius:99, padding:'6px 14px',
        maxWidth:420, overflow:'hidden',
        cursor:'pointer',
        position:'relative',
      }}
        onClick={() => setShowPanel(p => !p)}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Type badge */}
        <span style={{
          fontSize:11, fontWeight:700,
          color: typeColors[current.type] || '#94a3b8',
          background:`${typeColors[current.type] || '#94a3b8'}22`,
          padding:'2px 8px', borderRadius:20, flexShrink:0,
          border:`1px solid ${typeColors[current.type] || '#94a3b8'}44`,
          textTransform:'uppercase', letterSpacing:'0.5px',
        }}>
          {current.icon} {current.type === 'news' ? 'NEWS'
            : current.type === 'checkin' ? 'LIVE'
            : current.type === 'joiner' ? 'NEW'
            : 'UPDATE'}
        </span>

        {/* Scrolling text */}
        <div style={{
          flex:1, overflow:'hidden', position:'relative',
        }}>
          <div key={currentIdx} style={{
            color:'#e2e8f0', fontSize:12, fontWeight:500,
            whiteSpace:'nowrap', overflow:'hidden',
            textOverflow:'ellipsis',
            animation:'fadeIn 0.5s ease',
          }}>
            {current.title}
          </div>
        </div>

        {/* Live dot */}
        <div style={{
          width:7, height:7, borderRadius:'50%',
          background: '#34d399',
          boxShadow:'0 0 6px #34d399',
          animation:'pulse 1.5s infinite',
          flexShrink:0,
        }}/>

        {/* Chevron */}
        <span style={{color:'#64748b',fontSize:12,flexShrink:0}}>
          {showPanel ? '▲' : '▼'}
        </span>
      </div>

      {/* ── Dropdown Panel ── */}
      {showPanel && (
        <div style={{
          position:'absolute', top:60, right:16, zIndex:9999,
          width:420, maxHeight:520,
          background:'#0f172a',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:16, overflow:'hidden',
          boxShadow:'0 20px 60px rgba(0,0,0,0.6)',
        }}>
          {/* Panel header */}
          <div style={{
            padding:'16px 20px',
            borderBottom:'1px solid rgba(255,255,255,0.06)',
            display:'flex', justifyContent:'space-between',
            alignItems:'center',
          }}>
            <div>
              <h3 style={{color:'#fff',margin:0,fontSize:15,fontWeight:700}}>
                📡 Live Updates
              </h3>
              <p style={{color:'#64748b',margin:0,fontSize:11}}>
                Real-time news & company activity
              </p>
            </div>
            <button onClick={() => setShowPanel(false)} style={{
              background:'rgba(255,255,255,0.06)',border:'none',
              borderRadius:8,color:'#94a3b8',width:28,height:28,
              cursor:'pointer',fontSize:16,
            }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{
            display:'flex',gap:0,
            borderBottom:'1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              {key:'all',     label:'All',     count:allItems.length},
              {key:'news',    label:'📰 News',  count:news.length},
              {key:'checkin', label:'✅ Live',  count:attendance.filter(a=>a.date===new Date().toISOString().split('T')[0]).length},
              {key:'company', label:'🏢 Company',count:COMPANY_UPDATES.length},
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  flex:1, padding:'10px 6px', border:'none',
                  background:'transparent', cursor:'pointer',
                  fontSize:11, fontWeight:600,
                  color: activeTab===tab.key ? '#a5b4fc' : '#64748b',
                  borderBottom: activeTab===tab.key ? '2px solid #6366f1' : '2px solid transparent',
                }}>
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    marginLeft:4, padding:'1px 5px', borderRadius:99,
                    background:'rgba(99,102,241,0.2)', color:'#a5b4fc',
                    fontSize:10,
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div style={{
            maxHeight:360, overflowY:'auto', padding:'8px 0',
          }}>
            {allItems
              .filter(item => activeTab === 'all' || item.type === activeTab)
              .map((item, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  padding:'10px 20px',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  cursor: item.url && item.url !== '#' ? 'pointer' : 'default',
                  transition:'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  onClick={() => item.url && item.url !== '#' && window.open(item.url,'_blank')}
                >
                  {/* Icon */}
                  <div style={{
                    width:32, height:32, borderRadius:8, flexShrink:0,
                    background:`${typeColors[item.type]||'#94a3b8'}15`,
                    border:`1px solid ${typeColors[item.type]||'#94a3b8'}33`,
                    display:'flex', alignItems:'center',
                    justifyContent:'center', fontSize:15,
                  }}>
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{
                      color:'#e2e8f0', fontSize:12, margin:'0 0 4px',
                      lineHeight:1.5,
                      display:'-webkit-box',
                      WebkitLineClamp:2,
                      WebkitBoxOrient:'vertical',
                      overflow:'hidden',
                    }}>
                      {item.title}
                    </p>
                    <div style={{
                      display:'flex', gap:8, alignItems:'center',
                    }}>
                      <span style={{
                        color: typeColors[item.type]||'#64748b',
                        fontSize:10, fontWeight:600,
                        textTransform:'uppercase', letterSpacing:'0.5px',
                      }}>
                        {item.source}
                      </span>
                      {item.time && (
                        <span style={{color:'#475569',fontSize:10}}>
                          · {item.time}
                        </span>
                      )}
                      {item.url && item.url !== '#' && (
                        <span style={{color:'#6366f1',fontSize:10}}>
                          · Read more →
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {allItems.filter(item => activeTab === 'all' || item.type === activeTab).length === 0 && (
              <div style={{
                textAlign:'center', padding:'30px 20px',
                color:'#64748b', fontSize:13,
              }}>
                No {activeTab} updates yet
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding:'10px 20px',
            borderTop:'1px solid rgba(255,255,255,0.06)',
            display:'flex', justifyContent:'space-between',
            alignItems:'center',
          }}>
            <span style={{color:'#475569',fontSize:11}}>
              🔄 Auto-refreshes every 30 min
            </span>
            <span style={{
              color:'#34d399', fontSize:11, fontWeight:600,
              display:'flex', alignItems:'center', gap:4,
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%',
                background:'#34d399',
                display:'inline-block',
                animation:'pulse 1.5s infinite',
              }}/>
              LIVE
            </span>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        @keyframes pulse {
          0%, 100% { opacity:1;   transform:scale(1);   }
          50%       { opacity:0.5; transform:scale(1.2); }
        }
      `}</style>
    </>
  );
}