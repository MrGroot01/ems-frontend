import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { coursesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';

const DEPT_COURSES = {
  engineering: {
    emoji: '💻',
    courses: [
      { title:'Python',       icon:'🐍', difficulty:'beginner',     duration:10 },
      { title:'Java',         icon:'☕', difficulty:'intermediate',  duration:12 },
      { title:'React JS',     icon:'⚛️', difficulty:'intermediate',  duration:8  },
      { title:'Django',       icon:'🎸', difficulty:'intermediate',  duration:8  },
      { title:'REST API',     icon:'🔌', difficulty:'intermediate',  duration:6  },
      { title:'Docker',       icon:'🐳', difficulty:'advanced',      duration:6  },
      { title:'AWS',          icon:'☁️', difficulty:'advanced',      duration:10 },
      { title:'DevOps',       icon:'⚙️', difficulty:'advanced',      duration:12 },
      { title:'System Design',icon:'🏗️', difficulty:'advanced',      duration:8  },
      { title:'SQL',          icon:'🗄️', difficulty:'beginner',      duration:6  },
      { title:'Git & GitHub', icon:'🐙', difficulty:'beginner',      duration:4  },
      { title:'Linux',        icon:'🐧', difficulty:'intermediate',  duration:6  },
    ],
  },
  hr: {
    emoji: '👥',
    courses: [
      { title:'Recruitment Process',    icon:'🔍', difficulty:'beginner',    duration:6  },
      { title:'Employee Onboarding',    icon:'🤝', difficulty:'beginner',    duration:4  },
      { title:'Payroll Management',     icon:'💰', difficulty:'intermediate',duration:8  },
      { title:'Performance Management', icon:'📊', difficulty:'intermediate',duration:6  },
      { title:'Labor Laws',             icon:'⚖️', difficulty:'intermediate',duration:8  },
      { title:'HR Analytics',           icon:'📈', difficulty:'advanced',    duration:10 },
      { title:'MS Excel',               icon:'📗', difficulty:'beginner',    duration:6  },
    ],
  },
  finance: {
    emoji: '💼',
    courses: [
      { title:'Accounting Basics',   icon:'📒', difficulty:'beginner',    duration:8  },
      { title:'GST',                 icon:'🏛️', difficulty:'intermediate',duration:6  },
      { title:'Tally',               icon:'🧮', difficulty:'intermediate',duration:8  },
      { title:'Financial Reporting', icon:'📊', difficulty:'intermediate',duration:6  },
      { title:'Advanced Excel',      icon:'📗', difficulty:'intermediate',duration:8  },
      { title:'Power BI',            icon:'📉', difficulty:'advanced',    duration:10 },
      { title:'SAP Finance',         icon:'🏢', difficulty:'advanced',    duration:12 },
    ],
  },
  operations: {
    emoji: '🔧',
    courses: [
      { title:'Manual Testing',    icon:'🧪', difficulty:'beginner',    duration:6  },
      { title:'Selenium',          icon:'🤖', difficulty:'intermediate',duration:10 },
      { title:'API Testing',       icon:'🔌', difficulty:'intermediate',duration:6  },
      { title:'Postman',           icon:'📮', difficulty:'beginner',    duration:4  },
      { title:'JMeter',            icon:'⚡', difficulty:'intermediate',duration:6  },
      { title:'Bug Tracking JIRA', icon:'🐛', difficulty:'beginner',    duration:4  },
      { title:'Agile Methodology', icon:'🔄', difficulty:'intermediate',duration:6  },
    ],
  },
  marketing: {
    emoji: '📣',
    courses: [
      { title:'Digital Marketing',    icon:'🌐', difficulty:'beginner',    duration:8  },
      { title:'SEO',                  icon:'🔍', difficulty:'intermediate',duration:6  },
      { title:'Google Ads',           icon:'📢', difficulty:'intermediate',duration:6  },
      { title:'Content Marketing',    icon:'✍️', difficulty:'beginner',    duration:6  },
      { title:'Social Media Marketing',icon:'📱',difficulty:'beginner',    duration:6  },
      { title:'Analytics',            icon:'📊', difficulty:'intermediate',duration:8  },
    ],
  },
  design: {
    emoji: '🎨',
    courses: [
      { title:'UI Design',      icon:'🖥️', difficulty:'beginner',    duration:8  },
      { title:'UX Design',      icon:'🎯', difficulty:'intermediate',duration:10 },
      { title:'Figma',          icon:'🎨', difficulty:'beginner',    duration:6  },
      { title:'Adobe XD',       icon:'✨', difficulty:'intermediate',duration:8  },
      { title:'Photoshop',      icon:'🖼️', difficulty:'intermediate',duration:8  },
      { title:'Design Systems', icon:'🔲', difficulty:'advanced',    duration:8  },
    ],
  },
  sales: {
    emoji: '💹',
    courses: [
      { title:'Sales Fundamentals',     icon:'💡', difficulty:'beginner',    duration:6  },
      { title:'Lead Generation',        icon:'🎯', difficulty:'beginner',    duration:4  },
      { title:'CRM Tools',              icon:'🔗', difficulty:'intermediate',duration:6  },
      { title:'Negotiation Skills',     icon:'🤝', difficulty:'intermediate',duration:6  },
      { title:'B2B Sales',              icon:'🏢', difficulty:'advanced',    duration:8  },
      { title:'Sales Analytics',        icon:'📊', difficulty:'advanced',    duration:8  },
    ],
  },
};

const DIFF_COLOR = {
  beginner:     { bg:'rgba(16,185,129,.15)', text:'#34d399', border:'rgba(16,185,129,.3)'  },
  intermediate: { bg:'rgba(99,102,241,.15)', text:'#a5b4fc', border:'rgba(99,102,241,.3)'  },
  advanced:     { bg:'rgba(239,68,68,.15)',  text:'#f87171', border:'rgba(239,68,68,.3)'   },
};

export default function Courses() {
  const { user, isAdmin } = useAuth();
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [enrollments,  setEnrollments]  = useState([]);
  const [allCourses,   setAllCourses]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [stats,        setStats]        = useState(null);

  // Modals
  const [activeView,   setActiveView]   = useState('my');  // my | all | admin
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [quizMode,     setQuizMode]     = useState(false);
  const [quizAnswers,  setQuizAnswers]  = useState({});
  const [quizResult,   setQuizResult]   = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [successMsg,   setSuccessMsg]   = useState('');

  // Admin create course
  const [showCreate,   setShowCreate]   = useState(false);
  const [createForm,   setCreateForm]   = useState({
    dept:'engineering', courseIdx:0,
  });

  const userDept = (user?.department || '').toLowerCase();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eRes, sRes] = await Promise.allSettled([
        coursesAPI.getMyEnrollments(),
        isAdmin() ? coursesAPI.getStats() : Promise.resolve(null),
      ]);
      if (eRes.status==='fulfilled') {
        const d = Array.isArray(eRes.value.data)
          ? eRes.value.data : (eRes.value.data.results||[]);
        setEnrollments(d);
      }
      if (sRes.status==='fulfilled' && sRes.value?.data) {
        setStats(sRes.value.data);
      }
    } finally { setLoading(false); }
  };

  // ── Complete a lesson ────────────────────────────────────
  const handleLessonComplete = async (enrollmentId, lessonIdx) => {
    try {
      const res = await coursesAPI.completeLesson(enrollmentId, lessonIdx);
      setEnrollments(prev =>
        prev.map(e => e.id === enrollmentId ? res.data : e)
      );
      if (selectedCourse) {
        setSelectedCourse(prev => ({
          ...prev,
          enrollment: res.data,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Submit quiz ──────────────────────────────────────────
  const handleQuizSubmit = async () => {
    setSaving(true);
    try {
      const res = await coursesAPI.submitQuiz(
        selectedCourse.enrollment.id, quizAnswers
      );
      setQuizResult(res.data);
      setEnrollments(prev =>
        prev.map(e =>
          e.id === selectedCourse.enrollment.id ? res.data.enrollment : e
        )
      );
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  // ── Admin: assign course to dept ─────────────────────────
  const handleAssignCourse = async () => {
    const dept     = createForm.dept;
    const deptData = DEPT_COURSES[dept];
    if (!deptData) return;

    const courseTemplate = deptData.courses[createForm.courseIdx];
    if (!courseTemplate) return;

    setSaving(true);
    try {
      // Create course
      const lessons = [
        `Introduction to ${courseTemplate.title}`,
        `${courseTemplate.title} Fundamentals`,
        `${courseTemplate.title} Practice`,
        `Advanced ${courseTemplate.title}`,
        `${courseTemplate.title} Projects`,
      ];

      const quiz = [
        { question: `What is ${courseTemplate.title}?`,
          options: ['A tool', 'A language', 'A framework', 'A concept'],
          answer:  '1' },
        { question: `${courseTemplate.title} is mainly used for?`,
          options: ['Gaming', 'Web Development', 'Both', 'None'],
          answer:  '2' },
        { question: `Which company created ${courseTemplate.title}?`,
          options: ['Google', 'Microsoft', 'Various', 'Apple'],
          answer:  '2' },
        { question: `Is ${courseTemplate.title} still relevant in 2025?`,
          options: ['Yes', 'No', 'Maybe', 'Partially'],
          answer:  '0' },
        { question: `${courseTemplate.title} certification helps in?`,
          options: ['Nothing', 'Career Growth', 'Salary Cut', 'Only fun'],
          answer:  '1' },
      ];

      const courseRes = await coursesAPI.create({
        title:        courseTemplate.title,
        description:  `Master ${courseTemplate.title} with this comprehensive course designed for ${dept} professionals.`,
        department:   dept,
        difficulty:   courseTemplate.difficulty,
        duration_hrs: courseTemplate.duration,
        thumbnail:    courseTemplate.icon,
        lessons,
        quiz,
        pass_score:   70,
      });

      // Enroll all dept employees
      await coursesAPI.enroll(courseRes.data.id, {});

      setSuccessMsg(`✅ "${courseTemplate.title}" course assigned to all ${dept} employees!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setShowCreate(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally { setSaving(false); }
  };

  // ── My dept courses (unenrolled ones shown as available) ─
  const myDeptCourses = DEPT_COURSES[userDept]?.courses || [];
  const enrolledTitles = enrollments.map(e => e.course_title);

  const diffBadge = (d) => {
    const c = DIFF_COLOR[d] || DIFF_COLOR.beginner;
    return (
      <span style={{
        padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
        background:c.bg, color:c.text, border:`1px solid ${c.border}`,
      }}>
        {d}
      </span>
    );
  };

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="Learning Center" subtitle="Courses & Certifications"
          onMenuClick={() => setMobileOpen(true)} />
        <div className="dash-content">

          {successMsg && (
            <div style={{
              background:'rgba(16,185,129,.12)',
              border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12, padding:'12px 18px',
              color:'#34d399', fontSize:14,
              fontWeight:600, marginBottom:20,
            }}>
              {successMsg}
            </div>
          )}

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <h1>🎓 Learning Center</h1>
              <p>
                {isAdmin()
                  ? `Manage courses for all departments`
                  : `${userDept.charAt(0).toUpperCase()+userDept.slice(1)} Department Courses`}
              </p>
            </div>
            {isAdmin() && (
              <button className="qa-btn primary"
                onClick={() => setShowCreate(true)}>
                ➕ Assign Course
              </button>
            )}
          </div>

          {/* ── Admin Stats ── */}
          {isAdmin() && stats && (
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',
              gap:12, marginBottom:24,
            }}>
              {[
                {label:'Total Enrollments', value:stats.total,       color:'#a5b4fc', icon:'📚'},
                {label:'Completed',         value:stats.completed,   color:'#34d399', icon:'✅'},
                {label:'In Progress',       value:stats.in_progress, color:'#60a5fa', icon:'🔄'},
                {label:'Certificates',      value:stats.certified,   color:'#fbbf24', icon:'🏆'},
              ].map(s => (
                <div key={s.label} style={{
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:14, padding:'16px', textAlign:'center',
                }}>
                  <div style={{fontSize:28, marginBottom:6}}>{s.icon}</div>
                  <div style={{color:s.color,fontSize:26,fontWeight:800}}>{s.value}</div>
                  <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={{
            display:'flex', gap:8, marginBottom:24,
            borderBottom:'1px solid rgba(255,255,255,0.06)',
            paddingBottom:0,
          }}>
            {[
              {key:'my',    label:'📚 My Courses'},
              ...(isAdmin() ? [{key:'all', label:'👥 All Enrollments'}] : []),
              {key:'browse', label:'🌐 Browse Courses'},
            ].map(tab => (
              <button key={tab.key}
                onClick={() => setActiveView(tab.key)}
                style={{
                  padding:'10px 18px', border:'none',
                  background:'transparent', cursor:'pointer',
                  fontSize:14, fontWeight:600,
                  color: activeView===tab.key ? '#a5b4fc' : '#64748b',
                  borderBottom: activeView===tab.key
                    ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom:-1,
                  transition:'all 0.2s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════
              TAB: MY COURSES
          ══════════════════════════════════════════════ */}
          {activeView === 'my' && (
            <div>
              {loading ? (
                <div style={{display:'flex',flexWrap:'wrap',gap:16}}>
                  {[1,2,3].map(i =>
                    <div key={i} className="skeleton"
                      style={{width:280,height:200,borderRadius:14}}/>
                  )}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="empty-state" style={{padding:60}}>
                  <div style={{fontSize:60,marginBottom:16}}>📚</div>
                  <h3 style={{color:'#e2e8f0',marginBottom:8}}>No courses yet</h3>
                  <p style={{color:'#64748b'}}>
                    {isAdmin()
                      ? 'Assign courses to employees from the Browse tab'
                      : 'Your admin will assign courses to you soon'}
                  </p>
                </div>
              ) : (
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                  gap:16,
                }}>
                  {enrollments.map(e => (
                    <div key={e.id}
                      onClick={() => setSelectedCourse({ enrollment: e })}
                      style={{
                        background:'rgba(255,255,255,0.04)',
                        border:`1px solid ${e.status==='completed'
                          ? 'rgba(16,185,129,0.3)'
                          : 'rgba(255,255,255,0.08)'}`,
                        borderRadius:16, padding:'20px', cursor:'pointer',
                        transition:'all 0.2s',
                      }}>
                      {/* Icon + Title */}
                      <div style={{
                        display:'flex', alignItems:'center',
                        gap:12, marginBottom:12,
                      }}>
                        <div style={{
                          fontSize:36, width:56, height:56,
                          background:'rgba(99,102,241,0.15)',
                          borderRadius:12,
                          display:'flex', alignItems:'center',
                          justifyContent:'center', flexShrink:0,
                        }}>
                          {e.course_thumbnail}
                        </div>
                        <div>
                          <div style={{
                            color:'#fff', fontWeight:700, fontSize:15,
                          }}>
                            {e.course_title}
                          </div>
                          <div style={{marginTop:4}}>
                            {diffBadge(e.course_difficulty)}
                          </div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div style={{marginBottom:10}}>
                        <div style={{
                          display:'flex',justifyContent:'space-between',
                          color:'#94a3b8',fontSize:12,marginBottom:4,
                        }}>
                          <span>Progress</span>
                          <span style={{color:'#a5b4fc',fontWeight:600}}>
                            {e.progress}%
                          </span>
                        </div>
                        <div style={{
                          height:6, background:'rgba(255,255,255,0.08)',
                          borderRadius:99,overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%', borderRadius:99,
                            width:`${e.progress}%`,
                            background: e.status==='completed'
                              ? '#10b981' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                            transition:'width 0.5s ease',
                          }}/>
                        </div>
                      </div>

                      {/* Meta */}
                      <div style={{
                        display:'flex', justifyContent:'space-between',
                        alignItems:'center', fontSize:12, color:'#64748b',
                      }}>
                        <span>⏱️ {e.course_duration}hrs</span>
                        {e.status === 'completed' && e.certificate_id ? (
                          <span style={{
                            color:'#fbbf24', fontWeight:600,
                          }}>
                            🏆 Certified
                          </span>
                        ) : (
                          <span style={{
                            color: e.status==='in_progress' ? '#60a5fa' : '#64748b',
                            textTransform:'capitalize',
                          }}>
                            {e.status.replace('_',' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB: ALL ENROLLMENTS (Admin)
          ══════════════════════════════════════════════ */}
          {activeView === 'all' && isAdmin() && (
            <div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {['Employee','Department','Course','Progress','Status','Certificate'].map(h => (
                      <th key={h} style={{
                        color:'#64748b',fontSize:12,fontWeight:600,
                        padding:'10px 12px',textAlign:'left',
                        textTransform:'uppercase',letterSpacing:'0.5px',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e,i) => (
                    <tr key={e.id||i} style={{
                      borderBottom:'1px solid rgba(255,255,255,0.04)',
                    }}>
                      <td style={{padding:'12px',color:'#e2e8f0',fontSize:14}}>
                        {e.user_name}
                      </td>
                      <td style={{
                        padding:'12px',color:'#94a3b8',
                        fontSize:13,textTransform:'capitalize',
                      }}>
                        {e.user_dept||e.course_dept}
                      </td>
                      <td style={{padding:'12px',color:'#e2e8f0',fontSize:13}}>
                        {e.course_thumbnail} {e.course_title}
                      </td>
                      <td style={{padding:'12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{
                            flex:1, height:6,
                            background:'rgba(255,255,255,0.08)',
                            borderRadius:99,overflow:'hidden',
                            minWidth:60,
                          }}>
                            <div style={{
                              height:'100%',
                              width:`${e.progress}%`,
                              background:'linear-gradient(90deg,#6366f1,#8b5cf6)',
                              borderRadius:99,
                            }}/>
                          </div>
                          <span style={{color:'#a5b4fc',fontSize:12}}>
                            {e.progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span style={{
                          padding:'3px 10px', borderRadius:20, fontSize:12,
                          fontWeight:600,
                          background: e.status==='completed'
                            ? 'rgba(16,185,129,.15)'
                            : e.status==='in_progress'
                            ? 'rgba(99,102,241,.15)'
                            : 'rgba(255,255,255,.05)',
                          color: e.status==='completed' ? '#34d399'
                               : e.status==='in_progress' ? '#a5b4fc'
                               : '#64748b',
                          border: `1px solid ${e.status==='completed'
                            ? 'rgba(16,185,129,.3)'
                            : e.status==='in_progress'
                            ? 'rgba(99,102,241,.3)'
                            : 'rgba(255,255,255,.08)'}`,
                          textTransform:'capitalize',
                        }}>
                          {e.status.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{padding:'12px',fontSize:13}}>
                        {e.certificate_id
                          ? <span style={{color:'#fbbf24',fontWeight:600}}>
                              🏆 {e.certificate_id}
                            </span>
                          : <span style={{color:'#475569'}}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              TAB: BROWSE COURSES
          ══════════════════════════════════════════════ */}
          {activeView === 'browse' && (
            <div>
              {Object.entries(DEPT_COURSES).map(([dept, deptInfo]) => {
                // Employees only see their own dept
                if (!isAdmin() && dept !== userDept) return null;
                return (
                  <div key={dept} style={{marginBottom:32}}>
                    <div style={{
                      display:'flex', alignItems:'center',
                      gap:10, marginBottom:16,
                    }}>
                      <span style={{fontSize:28}}>{deptInfo.emoji}</span>
                      <h2 style={{
                        color:'#fff', margin:0, fontSize:18,
                        textTransform:'capitalize',
                      }}>
                        {dept} Department
                      </h2>
                      <span style={{
                        padding:'2px 10px', borderRadius:20, fontSize:12,
                        background:'rgba(99,102,241,0.15)', color:'#a5b4fc',
                        border:'1px solid rgba(99,102,241,0.3)',
                      }}>
                        {deptInfo.courses.length} courses
                      </span>
                    </div>

                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',
                      gap:12,
                    }}>
                      {deptInfo.courses.map((c, idx) => {
                        const isEnrolled = enrolledTitles.includes(c.title);
                        return (
                          <div key={idx} style={{
                            background:'rgba(255,255,255,0.03)',
                            border:`1px solid ${isEnrolled
                              ? 'rgba(16,185,129,0.3)'
                              : 'rgba(255,255,255,0.06)'}`,
                            borderRadius:12, padding:'16px',
                            position:'relative',
                          }}>
                            <div style={{
                              fontSize:32, marginBottom:10,
                              textAlign:'center',
                            }}>
                              {c.icon}
                            </div>
                            <div style={{
                              color:'#fff', fontWeight:600,
                              fontSize:14, marginBottom:8,
                              textAlign:'center',
                            }}>
                              {c.title}
                            </div>
                            <div style={{
                              display:'flex', justifyContent:'center',
                              gap:6, marginBottom:10, flexWrap:'wrap',
                            }}>
                              {diffBadge(c.difficulty)}
                              <span style={{
                                padding:'2px 8px', borderRadius:20,
                                fontSize:11, color:'#64748b',
                                background:'rgba(255,255,255,0.04)',
                                border:'1px solid rgba(255,255,255,0.06)',
                              }}>
                                ⏱️ {c.duration}hrs
                              </span>
                            </div>
                            {isEnrolled ? (
                              <div style={{
                                textAlign:'center',fontSize:12,
                                color:'#34d399',fontWeight:600,
                              }}>
                                ✅ Enrolled
                              </div>
                            ) : isAdmin() ? (
                              <button
                                onClick={() => {
                                  setCreateForm({ dept, courseIdx: idx });
                                  setShowCreate(true);
                                }}
                                style={{
                                  width:'100%', padding:'8px',
                                  borderRadius:8, border:'none',
                                  background:'rgba(99,102,241,0.2)',
                                  color:'#a5b4fc', cursor:'pointer',
                                  fontSize:13, fontWeight:600,
                                }}>
                                ➕ Assign
                              </button>
                            ) : (
                              <div style={{
                                textAlign:'center',fontSize:12,color:'#64748b',
                              }}>
                                Not yet assigned
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          COURSE DETAIL MODAL
      ══════════════════════════════════════════════════════ */}
      {selectedCourse && !quizMode && !quizResult && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.85)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:20,
        }} onClick={() => setSelectedCourse(null)}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:700,
            maxHeight:'90vh',overflow:'hidden',
            display:'flex',flexDirection:'column',
          }} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{
              padding:'24px', borderBottom:'1px solid rgba(255,255,255,0.06)',
              display:'flex',alignItems:'center',gap:16,
            }}>
              <div style={{
                fontSize:44, width:64, height:64,
                background:'rgba(99,102,241,0.15)',
                borderRadius:14,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                {selectedCourse.enrollment.course_thumbnail}
              </div>
              <div style={{flex:1}}>
                <h2 style={{color:'#fff',margin:'0 0 6px',fontSize:20}}>
                  {selectedCourse.enrollment.course_title}
                </h2>
                <p style={{color:'#64748b',margin:'0 0 8px',fontSize:13}}>
                  {selectedCourse.enrollment.course_description}
                </p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {diffBadge(selectedCourse.enrollment.course_difficulty)}
                  <span style={{
                    padding:'2px 8px',borderRadius:20,fontSize:11,
                    color:'#64748b',background:'rgba(255,255,255,0.04)',
                    border:'1px solid rgba(255,255,255,0.06)',
                  }}>
                    ⏱️ {selectedCourse.enrollment.course_duration}hrs
                  </span>
                  <span style={{
                    padding:'2px 8px',borderRadius:20,fontSize:11,
                    color:'#a5b4fc',background:'rgba(99,102,241,0.1)',
                    border:'1px solid rgba(99,102,241,0.2)',
                  }}>
                    {selectedCourse.enrollment.progress}% complete
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedCourse(null)} style={{
                background:'rgba(255,255,255,0.06)',border:'none',
                borderRadius:8,color:'#94a3b8',width:32,height:32,
                cursor:'pointer',fontSize:18,flexShrink:0,
              }}>×</button>
            </div>

            {/* Body */}
            <div style={{overflowY:'auto',padding:'24px',flex:1}}>

              {/* Progress bar */}
              <div style={{marginBottom:24}}>
                <div style={{
                  display:'flex',justifyContent:'space-between',
                  marginBottom:8,color:'#94a3b8',fontSize:13,
                }}>
                  <span>Overall Progress</span>
                  <span style={{color:'#a5b4fc',fontWeight:600}}>
                    {selectedCourse.enrollment.progress}%
                  </span>
                </div>
                <div style={{
                  height:8,background:'rgba(255,255,255,0.08)',
                  borderRadius:99,overflow:'hidden',
                }}>
                  <div style={{
                    height:'100%',borderRadius:99,
                    width:`${selectedCourse.enrollment.progress}%`,
                    background:'linear-gradient(90deg,#6366f1,#8b5cf6)',
                    transition:'width 0.5s',
                  }}/>
                </div>
              </div>

              {/* Lessons */}
              <h3 style={{color:'#e2e8f0',marginBottom:12,fontSize:15}}>
                📋 Course Lessons
              </h3>
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:24}}>
                {(selectedCourse.enrollment.course_lessons||[]).map((lesson,idx) => {
                  const done = (selectedCourse.enrollment.lessons_done||[])
                    .includes(idx);
                  const locked = idx > 0 &&
                    !(selectedCourse.enrollment.lessons_done||[]).includes(idx-1) &&
                    !done;
                  return (
                    <div key={idx} style={{
                      display:'flex',alignItems:'center',gap:12,
                      padding:'12px 16px',borderRadius:10,
                      background: done
                        ? 'rgba(16,185,129,0.08)'
                        : 'rgba(255,255,255,0.03)',
                      border:`1px solid ${done
                        ? 'rgba(16,185,129,0.25)'
                        : 'rgba(255,255,255,0.06)'}`,
                      opacity: locked ? 0.4 : 1,
                    }}>
                      <div style={{
                        width:32,height:32,borderRadius:8,
                        background: done
                          ? 'rgba(16,185,129,0.2)'
                          : 'rgba(255,255,255,0.05)',
                        display:'flex',alignItems:'center',
                        justifyContent:'center',
                        fontSize:14,flexShrink:0,
                      }}>
                        {done ? '✅' : locked ? '🔒' : idx+1}
                      </div>
                      <span style={{
                        color: done ? '#34d399' : '#e2e8f0',
                        flex:1, fontSize:14,
                      }}>
                        {lesson}
                      </span>
                      {!done && !locked && (
                        <button
                          onClick={() => handleLessonComplete(
                            selectedCourse.enrollment.id, idx
                          )}
                          style={{
                            padding:'6px 14px',borderRadius:8,
                            background:'rgba(99,102,241,0.2)',
                            border:'1px solid rgba(99,102,241,0.3)',
                            color:'#a5b4fc',cursor:'pointer',
                            fontSize:12,fontWeight:600,
                          }}>
                          Mark Done
                        </button>
                      )}
                      {done && (
                        <span style={{color:'#34d399',fontSize:12}}>
                          Done ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quiz button — show when all lessons done */}
              {selectedCourse.enrollment.progress >= 100 &&
               !selectedCourse.enrollment.quiz_passed && (
                <div style={{
                  padding:'20px',borderRadius:14,textAlign:'center',
                  background:'rgba(99,102,241,0.08)',
                  border:'1px solid rgba(99,102,241,0.2)',
                }}>
                  <div style={{fontSize:40,marginBottom:8}}>🎯</div>
                  <h3 style={{color:'#e2e8f0',margin:'0 0 6px'}}>
                    Ready for the Quiz?
                  </h3>
                  <p style={{color:'#64748b',fontSize:13,margin:'0 0 16px'}}>
                    Pass with {selectedCourse.enrollment.course_pass_score}% to earn
                    your certificate!
                  </p>
                  <button
                    onClick={() => setQuizMode(true)}
                    style={{
                      padding:'12px 28px',borderRadius:10,
                      background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      border:'none',color:'#fff',cursor:'pointer',
                      fontSize:15,fontWeight:700,
                    }}>
                    🚀 Start Quiz
                  </button>
                </div>
              )}

              {/* Certificate */}
              {selectedCourse.enrollment.quiz_passed &&
               selectedCourse.enrollment.certificate_id && (
                <div style={{
                  padding:'24px',borderRadius:14,textAlign:'center',
                  background:'rgba(245,158,11,0.08)',
                  border:'2px solid rgba(245,158,11,0.3)',
                }}>
                  <div style={{fontSize:60,marginBottom:8}}>🏆</div>
                  <h3 style={{
                    color:'#fbbf24',margin:'0 0 6px',fontSize:18,
                  }}>
                    Certificate Earned!
                  </h3>
                  <p style={{
                    color:'#94a3b8',fontSize:13,margin:'0 0 4px',
                  }}>
                    {selectedCourse.enrollment.course_title}
                  </p>
                  <p style={{
                    color:'#64748b',fontSize:12,margin:'0 0 16px',
                  }}>
                    ID: {selectedCourse.enrollment.certificate_id}
                  </p>
                  <button
                    onClick={() => {
                      // Generate certificate
                      const cert = `
EMS Pro — Certificate of Completion

This is to certify that

${selectedCourse.enrollment.user_name || 'Employee'}

has successfully completed the course

"${selectedCourse.enrollment.course_title}"

Department: ${(selectedCourse.enrollment.course_dept||'').toUpperCase()}
Score: ${selectedCourse.enrollment.quiz_score}%
Certificate ID: ${selectedCourse.enrollment.certificate_id}
Date: ${new Date(selectedCourse.enrollment.completed_at||Date.now()).toLocaleDateString()}

Issued by EMS Pro Learning Center
                      `.trim();
                      const blob = new Blob([cert], {type:'text/plain'});
                      const a = document.createElement('a');
                      a.href = URL.createObjectURL(blob);
                      a.download = `Certificate_${selectedCourse.enrollment.certificate_id}.txt`;
                      a.click();
                    }}
                    style={{
                      padding:'12px 28px',borderRadius:10,
                      background:'linear-gradient(135deg,#f59e0b,#d97706)',
                      border:'none',color:'#fff',cursor:'pointer',
                      fontSize:14,fontWeight:700,
                    }}>
                    📥 Download Certificate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          QUIZ MODAL
      ══════════════════════════════════════════════════════ */}
      {selectedCourse && quizMode && !quizResult && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.9)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:20,
        }}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:600,
            maxHeight:'90vh',overflow:'hidden',
            display:'flex',flexDirection:'column',
          }}>
            {/* Quiz header */}
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
              display:'flex',justifyContent:'space-between',alignItems:'center',
            }}>
              <div>
                <h2 style={{color:'#fff',margin:'0 0 4px',fontSize:18}}>
                  🎯 Quiz: {selectedCourse.enrollment.course_title}
                </h2>
                <p style={{color:'#64748b',margin:0,fontSize:13}}>
                  Answer all questions — pass with {selectedCourse.enrollment.course_pass_score}%
                </p>
              </div>
              <span style={{
                color:'#a5b4fc',fontSize:13,
                background:'rgba(99,102,241,0.1)',
                padding:'4px 12px',borderRadius:20,
                border:'1px solid rgba(99,102,241,0.2)',
              }}>
                {Object.keys(quizAnswers).length} /
                {(selectedCourse.enrollment.course_quiz||[]).length} answered
              </span>
            </div>

            <div style={{overflowY:'auto',padding:'24px',flex:1}}>
              {(selectedCourse.enrollment.course_quiz||[]).map((q,qi) => (
                <div key={qi} style={{marginBottom:28}}>
                  <p style={{
                    color:'#e2e8f0',fontWeight:600,
                    fontSize:15,marginBottom:14,
                  }}>
                    Q{qi+1}. {q.question}
                  </p>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {(q.options||[]).map((opt,oi) => (
                      <label key={oi} style={{
                        display:'flex',alignItems:'center',gap:12,
                        padding:'12px 16px',borderRadius:10,cursor:'pointer',
                        background: quizAnswers[String(qi)] === String(oi)
                          ? 'rgba(99,102,241,0.15)'
                          : 'rgba(255,255,255,0.03)',
                        border:`1px solid ${quizAnswers[String(qi)] === String(oi)
                          ? 'rgba(99,102,241,0.5)'
                          : 'rgba(255,255,255,0.06)'}`,
                        transition:'all 0.15s',
                      }}>
                        <input
                          type="radio"
                          name={`q${qi}`}
                          value={String(oi)}
                          checked={quizAnswers[String(qi)] === String(oi)}
                          onChange={() => setQuizAnswers(prev => ({
                            ...prev, [String(qi)]: String(oi),
                          }))}
                          style={{accentColor:'#6366f1'}}
                        />
                        <span style={{
                          color: quizAnswers[String(qi)] === String(oi)
                            ? '#a5b4fc' : '#94a3b8',
                          fontSize:14,
                        }}>
                          {opt}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleQuizSubmit}
                disabled={
                  saving ||
                  Object.keys(quizAnswers).length 
                  (selectedCourse.enrollment.course_quiz||[]).length
                }
                style={{
                  width:'100%',padding:'14px',borderRadius:12,
                  background: Object.keys(quizAnswers).length ===
                    (selectedCourse.enrollment.course_quiz||[]).length
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  border:'none',color:'#fff',cursor:'pointer',
                  fontSize:15,fontWeight:700,
                  opacity: saving ? 0.7 : 1,
                }}>
                {saving ? '⏳ Submitting...' : '🚀 Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          QUIZ RESULT MODAL
      ══════════════════════════════════════════════════════ */}
      {quizResult && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.9)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:20,
        }}>
          <div style={{
            background:'#0f172a',
            border:`2px solid ${quizResult.passed
              ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius:20,width:'100%',maxWidth:480,
            padding:'40px',textAlign:'center',
          }}>
            <div style={{fontSize:80,marginBottom:16}}>
              {quizResult.passed ? '🏆' : '😔'}
            </div>
            <h2 style={{
              color: quizResult.passed ? '#34d399' : '#f87171',
              fontSize:24,margin:'0 0 8px',
            }}>
              {quizResult.passed ? 'Congratulations!' : 'Not Quite There'}
            </h2>
            <p style={{color:'#94a3b8',fontSize:14,margin:'0 0 24px'}}>
              {quizResult.passed
                ? 'You passed! Your certificate has been generated.'
                : 'Keep learning and try again. You can do it!'}
            </p>

            {/* Score circle */}
            <div style={{
              width:120,height:120,borderRadius:'50%',
              background: quizResult.passed
                ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              border:`4px solid ${quizResult.passed ? '#10b981' : '#ef4444'}`,
              display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              margin:'0 auto 24px',
            }}>
              <span style={{
                fontSize:36,fontWeight:900,
                color: quizResult.passed ? '#34d399' : '#f87171',
              }}>
                {quizResult.score}%
              </span>
              <span style={{color:'#64748b',fontSize:11}}>
                {quizResult.correct}/{quizResult.total} correct
              </span>
            </div>

            <div style={{
              padding:'12px',borderRadius:10,marginBottom:20,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              color:'#64748b',fontSize:13,
            }}>
              Pass score: {quizResult.pass_score}% •
              Your score: {quizResult.score}%
            </div>

            {quizResult.passed && quizResult.certificate_id && (
              <div style={{
                padding:'12px',borderRadius:10,marginBottom:20,
                background:'rgba(245,158,11,0.1)',
                border:'1px solid rgba(245,158,11,0.3)',
                color:'#fbbf24',fontSize:13,fontWeight:600,
              }}>
                🏆 Certificate ID: {quizResult.certificate_id}
              </div>
            )}

            <button
              onClick={() => {
                setQuizResult(null);
                setQuizMode(false);
                setQuizAnswers({});
                if (!quizResult.passed) {
                  setSelectedCourse(null);
                } else {
                  // Refresh enrollment
                  fetchData();
                }
              }}
              style={{
                width:'100%',padding:'14px',borderRadius:12,
                background: quizResult.passed
                  ? 'linear-gradient(135deg,#10b981,#059669)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none',color:'#fff',cursor:'pointer',
                fontSize:15,fontWeight:700,
              }}>
              {quizResult.passed ? '🎉 View Certificate' : '📚 Back to Course'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ADMIN: ASSIGN COURSE MODAL
      ══════════════════════════════════════════════════════ */}
      {showCreate && isAdmin() && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.8)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:20,
        }} onClick={() => setShowCreate(false)}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:500,
            padding:'28px',
          }} onClick={e=>e.stopPropagation()}>

            <div style={{
              display:'flex',justifyContent:'space-between',
              alignItems:'center',marginBottom:24,
            }}>
              <h2 style={{color:'#fff',margin:0,fontSize:18}}>
                ➕ Assign Course
              </h2>
              <button onClick={() => setShowCreate(false)} style={{
                background:'rgba(255,255,255,0.06)',border:'none',
                borderRadius:8,color:'#94a3b8',width:32,height:32,
                cursor:'pointer',fontSize:18,
              }}>×</button>
            </div>

            {/* Department select */}
            <div style={{marginBottom:16}}>
              <label style={{
                color:'#94a3b8',fontSize:12,fontWeight:600,
                textTransform:'uppercase',letterSpacing:'0.5px',
                display:'block',marginBottom:6,
              }}>
                Department
              </label>
              <select
                value={createForm.dept}
                onChange={e => setCreateForm(p => ({
                  ...p, dept:e.target.value, courseIdx:0,
                }))}
                style={{
                  width:'100%',padding:'10px 14px',borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  color:'#e2e8f0',fontSize:14,cursor:'pointer',
                }}>
                {Object.keys(DEPT_COURSES).map(d => (
                  <option key={d} value={d} style={{background:'#1e293b'}}>
                    {DEPT_COURSES[d].emoji} {d.charAt(0).toUpperCase()+d.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Course select */}
            <div style={{marginBottom:16}}>
              <label style={{
                color:'#94a3b8',fontSize:12,fontWeight:600,
                textTransform:'uppercase',letterSpacing:'0.5px',
                display:'block',marginBottom:6,
              }}>
                Course
              </label>
              <select
                value={createForm.courseIdx}
                onChange={e => setCreateForm(p => ({
                  ...p, courseIdx:Number(e.target.value),
                }))}
                style={{
                  width:'100%',padding:'10px 14px',borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  color:'#e2e8f0',fontSize:14,cursor:'pointer',
                }}>
                {(DEPT_COURSES[createForm.dept]?.courses||[]).map((c,i) => (
                  <option key={i} value={i} style={{background:'#1e293b'}}>
                    {c.icon} {c.title} ({c.difficulty}, {c.duration}hrs)
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {(() => {
              const c = DEPT_COURSES[createForm.dept]?.courses[createForm.courseIdx];
              if (!c) return null;
              return (
                <div style={{
                  padding:'14px',borderRadius:10,marginBottom:20,
                  background:'rgba(99,102,241,0.08)',
                  border:'1px solid rgba(99,102,241,0.2)',
                }}>
                  <div style={{
                    display:'flex',alignItems:'center',gap:10,marginBottom:8,
                  }}>
                    <span style={{fontSize:28}}>{c.icon}</span>
                    <div>
                      <div style={{color:'#fff',fontWeight:600}}>{c.title}</div>
                      <div style={{color:'#64748b',fontSize:12}}>
                        {diffBadge(c.difficulty)}
                        <span style={{marginLeft:8}}>⏱️ {c.duration}hrs</span>
                      </div>
                    </div>
                  </div>
                  <p style={{color:'#64748b',fontSize:12,margin:0}}>
                    This course will be assigned to all{' '}
                    <strong style={{color:'#a5b4fc'}}>
                      {createForm.dept}
                    </strong>{' '}
                    department employees automatically.
                  </p>
                </div>
              );
            })()}

            <button
              onClick={handleAssignCourse}
              disabled={saving}
              style={{
                width:'100%',padding:'14px',borderRadius:12,
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none',color:'#fff',cursor:'pointer',
                fontSize:15,fontWeight:700,
                opacity:saving?0.7:1,
              }}>
              {saving ? '⏳ Assigning...' : '🚀 Assign to All Department Employees'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}