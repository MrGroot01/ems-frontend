import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar/Sidebar';
import Navbar  from '../../components/Navbar/Navbar';
import { coursesAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import '../AdminDashboard/AdminDashboard.css';

// ── Department Course Data with YouTube videos ─────────────
const DEPT_COURSES = {
  engineering: {
    emoji: '💻', label: 'Engineering',
    courses: [
      {
        title:'Python', icon:'🐍', difficulty:'beginner', duration:10, price:0,
        description:'Learn Python from scratch — variables, loops, functions, OOP and more.',
        videos:[
          {title:'Python Full Course',  url:'https://www.youtube.com/embed/rfscVS0vtbw', duration:'4:26:52'},
          {title:'Python OOP',          url:'https://www.youtube.com/embed/JeznW_7DlB0', duration:'1:55:00'},
          {title:'Python Projects',     url:'https://www.youtube.com/embed/8ext9G7xspg', duration:'1:00:00'},
        ],
        coding:{ platform:'HackerRank', url:'https://www.hackerrank.com/domains/python', label:'Python Challenges' },
      },
      {
        title:'React JS', icon:'⚛️', difficulty:'intermediate', duration:8, price:0,
        description:'Build modern UIs with React — components, hooks, state management.',
        videos:[
          {title:'React JS Full Course', url:'https://www.youtube.com/embed/w7ejDZ8SWv8', duration:'1:49:37'},
          {title:'React Hooks',          url:'https://www.youtube.com/embed/TNhaISOUy6Q', duration:'1:00:00'},
        ],
        coding:{ platform:'LeetCode',   url:'https://leetcode.com/tag/dynamic-programming/', label:'Frontend Challenges' },
      },
      {
        title:'Django', icon:'🎸', difficulty:'intermediate', duration:8, price:0,
        description:'Build powerful web apps with Django REST Framework.',
        videos:[
          {title:'Django Crash Course', url:'https://www.youtube.com/embed/UmljXZIypDc', duration:'1:11:39'},
          {title:'Django REST API',     url:'https://www.youtube.com/embed/i5JykvxUk_A', duration:'2:00:00'},
        ],
        coding:{ platform:'HackerRank', url:'https://www.hackerrank.com/domains/python', label:'Python/Django Challenges' },
      },
      {
        title:'SQL', icon:'🗄️', difficulty:'beginner', duration:6, price:0,
        description:'Master SQL — queries, joins, indexes and database design.',
        videos:[
          {title:'SQL Full Course', url:'https://www.youtube.com/embed/HXV3zeQKqGY', duration:'4:20:00'},
        ],
        coding:{ platform:'HackerRank', url:'https://www.hackerrank.com/domains/sql', label:'SQL Challenges' },
      },
      {
        title:'Docker & DevOps', icon:'🐳', difficulty:'advanced', duration:10, price:299,
        description:'Master containerization, CI/CD, and cloud deployment.',
        videos:[
          {title:'Docker Full Course', url:'https://www.youtube.com/embed/fqMOX6JJhGo', duration:'2:10:00'},
          {title:'DevOps Roadmap',     url:'https://www.youtube.com/embed/0yWAtQ6wYNM', duration:'1:00:00'},
        ],
        coding:{ platform:'KodeKloud', url:'https://kodekloud.com/', label:'DevOps Labs' },
      },
      {
        title:'System Design', icon:'🏗️', difficulty:'advanced', duration:12, price:499,
        description:'Design scalable systems — a must for senior engineers.',
        videos:[
          {title:'System Design Basics', url:'https://www.youtube.com/embed/MbjObHmDbZo', duration:'1:00:00'},
          {title:'System Design Interview', url:'https://www.youtube.com/embed/UzLMhqg3_Wc', duration:'1:30:00'},
        ],
        coding:{ platform:'LeetCode', url:'https://leetcode.com/discuss/interview-question?currentPage=1&orderBy=hot&query=system+design', label:'System Design Questions' },
      },
    ],
  },
  hr: {
    emoji: '👥', label: 'HR',
    courses: [
      {
        title:'Recruitment Process', icon:'🔍', difficulty:'beginner', duration:6, price:0,
        description:'Learn end-to-end recruitment — sourcing, screening, and hiring.',
        videos:[
          {title:'Recruitment 101', url:'https://www.youtube.com/embed/2pB5n0l9T6Q', duration:'45:00'},
        ],
        coding: null,
      },
      {
        title:'HR Analytics', icon:'📈', difficulty:'advanced', duration:10, price:299,
        description:'Use data to make better HR decisions.',
        videos:[
          {title:'HR Analytics Course', url:'https://www.youtube.com/embed/YRp_7nEbM98', duration:'1:30:00'},
        ],
        coding:{ platform:'Kaggle', url:'https://www.kaggle.com/learn', label:'Data Practice' },
      },
      {
        title:'MS Excel for HR', icon:'📗', difficulty:'beginner', duration:6, price:0,
        description:'Excel skills every HR professional needs.',
        videos:[
          {title:'Excel Full Tutorial', url:'https://www.youtube.com/embed/Vl0H-qTclOg', duration:'2:00:00'},
        ],
        coding: null,
      },
    ],
  },
  finance: {
    emoji: '💼', label: 'Finance',
    courses: [
      {
        title:'Accounting Basics', icon:'📒', difficulty:'beginner', duration:8, price:0,
        description:'Understand debits, credits, and financial statements.',
        videos:[
          {title:'Accounting Basics', url:'https://www.youtube.com/embed/yYX4bvQSqbo', duration:'1:45:00'},
        ],
        coding: null,
      },
      {
        title:'Power BI', icon:'📉', difficulty:'advanced', duration:10, price:399,
        description:'Create stunning dashboards with Microsoft Power BI.',
        videos:[
          {title:'Power BI Full Course', url:'https://www.youtube.com/embed/TmhQCQr_Qqc', duration:'3:00:00'},
        ],
        coding:{ platform:'Kaggle', url:'https://www.kaggle.com/learn/data-visualization', label:'Data Viz Practice' },
      },
    ],
  },
  operations: {
    emoji: '🔧', label: 'Operations',
    courses: [
      {
        title:'Manual Testing', icon:'🧪', difficulty:'beginner', duration:6, price:0,
        description:'Learn software testing fundamentals and test case writing.',
        videos:[
          {title:'Manual Testing Full Course', url:'https://www.youtube.com/embed/Nd7SnZjDfNg', duration:'3:00:00'},
        ],
        coding:{ platform:'HackerRank', url:'https://www.hackerrank.com/', label:'Practice Challenges' },
      },
      {
        title:'Selenium Automation', icon:'🤖', difficulty:'intermediate', duration:10, price:0,
        description:'Automate browser testing with Selenium WebDriver.',
        videos:[
          {title:'Selenium Full Course', url:'https://www.youtube.com/embed/j7VZsCCnptM', duration:'4:00:00'},
        ],
        coding:{ platform:'LeetCode', url:'https://leetcode.com/', label:'Coding Challenges' },
      },
      {
        title:'API Testing with Postman', icon:'📮', difficulty:'beginner', duration:4, price:0,
        description:'Test REST APIs professionally using Postman.',
        videos:[
          {title:'Postman Tutorial', url:'https://www.youtube.com/embed/VywxIQ2ZXw4', duration:'1:30:00'},
        ],
        coding:{ platform:'Postman', url:'https://learning.postman.com/', label:'Postman Learning' },
      },
    ],
  },
  marketing: {
    emoji: '📣', label: 'Marketing',
    courses: [
      {
        title:'Digital Marketing', icon:'🌐', difficulty:'beginner', duration:8, price:0,
        description:'Master SEO, social media, email marketing and analytics.',
        videos:[
          {title:'Digital Marketing Full Course', url:'https://www.youtube.com/embed/nU-IIXBWlS4', duration:'4:40:00'},
        ],
        coding: null,
      },
      {
        title:'Google Ads', icon:'📢', difficulty:'intermediate', duration:6, price:199,
        description:'Run profitable Google Ads campaigns.',
        videos:[
          {title:'Google Ads Tutorial', url:'https://www.youtube.com/embed/cLlE_CgMELc', duration:'2:00:00'},
        ],
        coding: null,
      },
    ],
  },
  design: {
    emoji: '🎨', label: 'Design',
    courses: [
      {
        title:'UI Design', icon:'🖥️', difficulty:'beginner', duration:8, price:0,
        description:'Learn UI design principles, color theory, and typography.',
        videos:[
          {title:'UI Design Tutorial', url:'https://www.youtube.com/embed/c9Wg6Cb_YlU', duration:'2:00:00'},
          {title:'UI Design Principles', url:'https://www.youtube.com/embed/tRpoI6vkoxI', duration:'1:00:00'},
        ],
        coding: null,
      },
      {
        title:'Figma', icon:'🎨', difficulty:'beginner', duration:6, price:0,
        description:'Design beautiful interfaces with Figma.',
        videos:[
          {title:'Figma Full Course', url:'https://www.youtube.com/embed/1pW_sk-2y40', duration:'3:00:00'},
        ],
        coding: null,
      },
      {
        title:'UX Design Advanced', icon:'🎯', difficulty:'advanced', duration:10, price:399,
        description:'Advanced UX research, usability testing and design systems.',
        videos:[
          {title:'UX Design Course', url:'https://www.youtube.com/embed/uL2ZB7XXIgg', duration:'2:00:00'},
        ],
        coding: null,
      },
    ],
  },
  sales: {
    emoji: '💹', label: 'Sales',
    courses: [
      {
        title:'Sales Fundamentals', icon:'💡', difficulty:'beginner', duration:6, price:0,
        description:'Master the art of selling — prospecting, pitching, and closing.',
        videos:[
          {title:'Sales Training', url:'https://www.youtube.com/embed/mTRqVCBXHg8', duration:'1:30:00'},
        ],
        coding: null,
      },
      {
        title:'CRM Tools', icon:'🔗', difficulty:'intermediate', duration:6, price:199,
        description:'Use Salesforce and HubSpot to manage your sales pipeline.',
        videos:[
          {title:'CRM Tutorial', url:'https://www.youtube.com/embed/TGBQ0c1xMQg', duration:'1:00:00'},
        ],
        coding: null,
      },
    ],
  },
};

// ── Coding platforms ────────────────────────────────────────
const CODING_PLATFORMS = [
  { name:'LeetCode',   url:'https://leetcode.com/',                    icon:'⚡', color:'#FFA116', desc:'Algorithm challenges' },
  { name:'HackerRank', url:'https://www.hackerrank.com/',              icon:'💚', color:'#00EA64', desc:'Coding certifications' },
  { name:'CodeChef',   url:'https://www.codechef.com/',                icon:'👨‍🍳', color:'#5B4638', desc:'Competitive programming' },
  { name:'Codeforces', url:'https://codeforces.com/',                  icon:'🔵', color:'#1194F6', desc:'Math & algorithms' },
  { name:'GeeksForGeeks', url:'https://practice.geeksforgeeks.org/',   icon:'🟢', color:'#2F8D46', desc:'CS fundamentals' },
  { name:'Kaggle',     url:'https://www.kaggle.com/learn',             icon:'🔷', color:'#20BEFF', desc:'Data science' },
  { name:'SQLZoo',     url:'https://sqlzoo.net/',                      icon:'🗄️', color:'#4CAF50', desc:'SQL practice' },
  { name:'Exercism',   url:'https://exercism.org/',                    icon:'🟣', color:'#A400FF', desc:'Multi-language practice' },
];

const DIFF_COLOR = {
  beginner:     { bg:'rgba(16,185,129,.15)', text:'#34d399', border:'rgba(16,185,129,.3)'  },
  intermediate: { bg:'rgba(99,102,241,.15)', text:'#a5b4fc', border:'rgba(99,102,241,.3)'  },
  advanced:     { bg:'rgba(239,68,68,.15)',  text:'#f87171', border:'rgba(239,68,68,.3)'   },
};

function DiffBadge({ d }) {
  const c = DIFF_COLOR[d] || DIFF_COLOR.beginner;
  return (
    <span style={{
      padding:'2px 8px', borderRadius:20, fontSize:11, fontWeight:600,
      background:c.bg, color:c.text, border:`1px solid ${c.border}`,
    }}>{d}</span>
  );
}

export default function Courses() {
  const { user, isAdmin } = useAuth();
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [enrollments,   setEnrollments]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [stats,         setStats]         = useState(null);
  const [activeView,    setActiveView]    = useState('my');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [errorMsg,      setErrorMsg]      = useState('');

  // Course detail modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeVideo,    setActiveVideo]    = useState(0);

  // Quiz
  const [quizMode,    setQuizMode]    = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult,  setQuizResult]  = useState(null);
  const [saving,      setSaving]      = useState(false);

  // Admin assign modal
  const [showAssign,  setShowAssign]  = useState(false);
  const [assignForm,  setAssignForm]  = useState({ dept:'engineering', courseIdx:0 });

  // Pending paid requests (admin)
  const [paidRequests, setPaidRequests] = useState([]);

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

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // ── Complete lesson ──────────────────────────────────────
  const handleLessonComplete = async (enrollmentId, lessonIdx) => {
    try {
      const res = await coursesAPI.completeLesson(enrollmentId, lessonIdx);
      setEnrollments(prev =>
        prev.map(e => e.id === enrollmentId ? res.data : e)
      );
      if (selectedCourse?.enrollment?.id === enrollmentId) {
        setSelectedCourse(prev => ({ ...prev, enrollment: res.data }));
      }
    } catch (err) { console.error(err); }
  };

  // ── Submit quiz ──────────────────────────────────────────
  const handleQuizSubmit = async () => {
    const quiz = selectedCourse?.enrollment?.course_quiz || [];
    if (Object.keys(quizAnswers).length < quiz.length) {
      showError('Please answer all questions before submitting!');
      return;
    }
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
      showError(err.response?.data?.error || 'Quiz submission failed');
    } finally { setSaving(false); }
  };

  // ── Request paid course ──────────────────────────────────
  const handleRequestPaidCourse = async (course, dept) => {
    try {
      // Send notification to admin
      await notificationsAPI.broadcast({
        title:   `💳 Paid Course Request: ${course.title}`,
        message: `${user?.full_name} (${user?.department}) has requested access to the paid course "${course.title}" (₹${course.price}). Please review and assign.`,
        type:    'task',
      });
      showSuccess(`✅ Request sent! Admin will review your request for "${course.title}"`);
    } catch {
      showError('Failed to send request. Please try again.');
    }
  };

  // ── Admin assign course ──────────────────────────────────
  const handleAssignCourse = async () => {
    const dept       = assignForm.dept;
    const courseData = DEPT_COURSES[dept]?.courses[assignForm.courseIdx];
    if (!courseData) return;

    setSaving(true);
    try {
      const lessons = [
        `Introduction to ${courseData.title}`,
        `${courseData.title} Fundamentals`,
        `${courseData.title} Practice`,
        `Advanced ${courseData.title}`,
        `${courseData.title} Projects`,
      ];

      // Generate proper quiz questions based on course
      const quiz = generateQuiz(courseData.title, courseData.videos);

      const courseRes = await coursesAPI.create({
        title:        courseData.title,
        description:  courseData.description,
        department:   dept,
        difficulty:   courseData.difficulty,
        duration_hrs: courseData.duration,
        thumbnail:    courseData.icon,
        lessons,
        quiz,
        pass_score:   70,
      });

      await coursesAPI.enroll(courseRes.data.id, {});
      showSuccess(`✅ "${courseData.title}" assigned to all ${dept} employees!`);
      setShowAssign(false);
      fetchData();
    } catch (err) {
      showError('Failed to assign course');
      console.error(err);
    } finally { setSaving(false); }
  };

  // ── Generate proper quiz questions ───────────────────────
  const generateQuiz = (title, videos) => {
    const quizBank = {
      'Python': [
        { question:'What is Python primarily used for?',
          options:['Gaming only','Web & Data Science','MS Office only','Networking only'],
          answer:'1' },
        { question:'Which keyword defines a function in Python?',
          options:['func','define','def','function'],
          answer:'2' },
        { question:'What is the output of print(type([]))?',
          options:["<class 'dict'>",'<class "list">',"<class 'list'>","<class 'tuple'>"],
          answer:'2' },
        { question:'Which loop is used when iterations are unknown?',
          options:['for loop','while loop','do-while','foreach'],
          answer:'1' },
        { question:'What does OOP stand for?',
          options:['Object Oriented Programming','Open Object Protocol','Only One Process','None'],
          answer:'0' },
      ],
      'React JS': [
        { question:'What is JSX?',
          options:['JavaScript XML','Java Syntax Extension','jQuery X','None'],
          answer:'0' },
        { question:'Which hook manages state in React?',
          options:['useEffect','useRef','useState','useContext'],
          answer:'2' },
        { question:'What is a React component?',
          options:['A database','A reusable UI piece','A CSS file','A server'],
          answer:'1' },
        { question:'How do you pass data to a child component?',
          options:['Via state','Via props','Via context only','Via refs'],
          answer:'1' },
        { question:'What does useEffect do?',
          options:['Manages state','Handles side effects','Creates components','Styles elements'],
          answer:'1' },
      ],
      'Django': [
        { question:'Django is a framework for which language?',
          options:['JavaScript','Ruby','Python','Java'],
          answer:'2' },
        { question:'What does ORM stand for in Django?',
          options:['Object Relational Mapper','Online Resource Manager','Open REST Module','None'],
          answer:'0' },
        { question:'Which file defines URL patterns in Django?',
          options:['models.py','views.py','urls.py','settings.py'],
          answer:'2' },
        { question:'What is a Django serializer used for?',
          options:['CSS styling','Convert complex data to JSON','Database creation','URL routing'],
          answer:'1' },
        { question:'Which decorator restricts API access in DRF?',
          options:['@login','@permission_classes','@secure','@auth_required'],
          answer:'1' },
      ],
    };

    // Return specific quiz or generate generic one
    if (quizBank[title]) return quizBank[title];

    return [
      { question:`What is ${title} primarily used for?`,
        options:['Data storage','Core functionality','Gaming','None of these'],
        answer:'1' },
      { question:`${title} is classified as?`,
        options:['A hardware tool','A software tool','A protocol','A language'],
        answer:'1' },
      { question:`Who can benefit most from learning ${title}?`,
        options:['Only developers','All professionals','Only managers','Only designers'],
        answer:'1' },
      { question:`What skill does ${title} improve?`,
        options:['Physical fitness','Technical proficiency','Cooking','Driving'],
        answer:'1' },
      { question:`After completing ${title}, you can?`,
        options:['Do nothing new','Apply skills to real projects','Only teach others','Only read docs'],
        answer:'1' },
    ];
  };

  const enrolledTitles = enrollments.map(e => e.course_title);

  return (
    <div className="dash-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="dash-main">
        <Navbar title="🎓 Learning Center" subtitle="Courses & Certifications"
          onMenuClick={() => setMobileOpen(true)} />
        <div className="dash-content">

          {/* Messages */}
          {successMsg && (
            <div style={{
              background:'rgba(16,185,129,.12)',border:'1px solid rgba(16,185,129,.3)',
              borderRadius:12,padding:'12px 18px',color:'#34d399',
              fontSize:14,fontWeight:600,marginBottom:20,
            }}>{successMsg}</div>
          )}
          {errorMsg && (
            <div style={{
              background:'rgba(239,68,68,.12)',border:'1px solid rgba(239,68,68,.3)',
              borderRadius:12,padding:'12px 18px',color:'#f87171',
              fontSize:14,fontWeight:600,marginBottom:20,
            }}>{errorMsg}</div>
          )}

          {/* Header */}
          <div className="page-header">
            <div>
              <h1>🎓 Learning Center</h1>
              <p>{isAdmin() ? 'Manage all department courses' : `${userDept} department courses`}</p>
            </div>
            {isAdmin() && (
              <button className="qa-btn primary" onClick={() => setShowAssign(true)}>
                ➕ Assign Course
              </button>
            )}
          </div>

          {/* Admin stats */}
          {isAdmin() && stats && (
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',
              gap:12,marginBottom:24,
            }}>
              {[
                {label:'Enrollments', value:stats.total,       color:'#a5b4fc', icon:'📚'},
                {label:'Completed',   value:stats.completed,   color:'#34d399', icon:'✅'},
                {label:'In Progress', value:stats.in_progress, color:'#60a5fa', icon:'🔄'},
                {label:'Certified',   value:stats.certified,   color:'#fbbf24', icon:'🏆'},
              ].map(s => (
                <div key={s.label} style={{
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.08)',
                  borderRadius:14,padding:'16px',textAlign:'center',
                }}>
                  <div style={{fontSize:26}}>{s.icon}</div>
                  <div style={{color:s.color,fontSize:24,fontWeight:800}}>{s.value}</div>
                  <div style={{color:'#64748b',fontSize:12,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display:'flex',gap:4,marginBottom:24,
            borderBottom:'1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              {key:'my',      label:'📚 My Courses'},
              ...(isAdmin() ? [{key:'all', label:'👥 All Enrollments'}] : []),
              {key:'browse',  label:'🌐 Browse'},
              {key:'coding',  label:'💻 Coding Practice'},
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveView(tab.key)}
                style={{
                  padding:'10px 16px',border:'none',background:'transparent',
                  cursor:'pointer',fontSize:13,fontWeight:600,
                  color: activeView===tab.key ? '#a5b4fc' : '#64748b',
                  borderBottom: activeView===tab.key ? '2px solid #6366f1' : '2px solid transparent',
                  marginBottom:-1,
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ══ MY COURSES TAB ══ */}
          {activeView === 'my' && (
            <div>
              {loading ? (
                <div style={{display:'flex',flexWrap:'wrap',gap:16}}>
                  {[1,2,3].map(i =>
                    <div key={i} className="skeleton" style={{width:280,height:200,borderRadius:14}}/>
                  )}
                </div>
              ) : enrollments.length === 0 ? (
                <div style={{textAlign:'center',padding:60}}>
                  <div style={{fontSize:60,marginBottom:16}}>📚</div>
                  <h3 style={{color:'#e2e8f0'}}>No courses assigned yet</h3>
                  <p style={{color:'#64748b'}}>
                    {isAdmin() ? 'Use Browse tab to assign courses' : 'Your admin will assign courses soon'}
                  </p>
                </div>
              ) : (
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
                  gap:16,
                }}>
                  {enrollments.map(e => (
                    <div key={e.id} onClick={() => {
                      // Find course data for videos
                      const deptData = DEPT_COURSES[e.course_dept || e.user_dept];
                      const courseTemplate = deptData?.courses.find(c => c.title === e.course_title);
                      setSelectedCourse({
                        enrollment: e,
                        template: courseTemplate,
                      });
                      setActiveVideo(0);
                    }} style={{
                      background:'rgba(255,255,255,0.04)',
                      border:`1px solid ${e.status==='completed'
                        ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius:16,padding:20,cursor:'pointer',
                      transition:'all 0.2s',
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                        <div style={{
                          fontSize:36,width:56,height:56,
                          background:'rgba(99,102,241,0.15)',
                          borderRadius:12,display:'flex',
                          alignItems:'center',justifyContent:'center',
                        }}>
                          {e.course_thumbnail}
                        </div>
                        <div>
                          <div style={{color:'#fff',fontWeight:700,fontSize:15}}>
                            {e.course_title}
                          </div>
                          <div style={{marginTop:4}}>
                            <DiffBadge d={e.course_difficulty}/>
                          </div>
                        </div>
                      </div>
                      <div style={{marginBottom:10}}>
                        <div style={{
                          display:'flex',justifyContent:'space-between',
                          color:'#94a3b8',fontSize:12,marginBottom:4,
                        }}>
                          <span>Progress</span>
                          <span style={{color:'#a5b4fc',fontWeight:600}}>{e.progress}%</span>
                        </div>
                        <div style={{
                          height:6,background:'rgba(255,255,255,0.08)',
                          borderRadius:99,overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%',borderRadius:99,
                            width:`${e.progress}%`,
                            background: e.status==='completed'
                              ? '#10b981' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                            transition:'width 0.5s',
                          }}/>
                        </div>
                      </div>
                      <div style={{
                        display:'flex',justifyContent:'space-between',
                        fontSize:12,color:'#64748b',
                      }}>
                        <span>⏱️ {e.course_duration}hrs</span>
                        {e.certificate_id
                          ? <span style={{color:'#fbbf24',fontWeight:600}}>🏆 Certified</span>
                          : <span style={{textTransform:'capitalize'}}>
                              {e.status.replace('_',' ')}
                            </span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ALL ENROLLMENTS (Admin) ══ */}
          {activeView === 'all' && isAdmin() && (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                    {['Employee','Dept','Course','Progress','Status','Score','Certificate'].map(h => (
                      <th key={h} style={{
                        color:'#64748b',fontSize:11,fontWeight:600,
                        padding:'10px 12px',textAlign:'left',
                        textTransform:'uppercase',letterSpacing:'0.5px',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e,i) => (
                    <tr key={e.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <td style={{padding:'12px',color:'#e2e8f0',fontSize:13}}>{e.user_name}</td>
                      <td style={{padding:'12px',color:'#94a3b8',fontSize:12,textTransform:'capitalize'}}>
                        {e.user_dept||e.course_dept}
                      </td>
                      <td style={{padding:'12px',color:'#e2e8f0',fontSize:13}}>
                        {e.course_thumbnail} {e.course_title}
                      </td>
                      <td style={{padding:'12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{
                            flex:1,height:5,background:'rgba(255,255,255,0.08)',
                            borderRadius:99,overflow:'hidden',minWidth:60,
                          }}>
                            <div style={{
                              height:'100%',width:`${e.progress}%`,
                              background:'linear-gradient(90deg,#6366f1,#8b5cf6)',
                              borderRadius:99,
                            }}/>
                          </div>
                          <span style={{color:'#a5b4fc',fontSize:11}}>{e.progress}%</span>
                        </div>
                      </td>
                      <td style={{padding:'12px'}}>
                        <span style={{
                          padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,
                          background: e.status==='completed' ? 'rgba(16,185,129,.15)'
                            : e.status==='in_progress' ? 'rgba(99,102,241,.15)'
                            : 'rgba(255,255,255,.05)',
                          color: e.status==='completed' ? '#34d399'
                            : e.status==='in_progress' ? '#a5b4fc' : '#64748b',
                          border:`1px solid ${e.status==='completed' ? 'rgba(16,185,129,.3)'
                            : e.status==='in_progress' ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.08)'}`,
                          textTransform:'capitalize',
                        }}>
                          {e.status.replace('_',' ')}
                        </span>
                      </td>
                      <td style={{padding:'12px',color:'#94a3b8',fontSize:12}}>
                        {e.quiz_score != null ? `${e.quiz_score}%` : '—'}
                      </td>
                      <td style={{padding:'12px',fontSize:12}}>
                        {e.certificate_id
                          ? <span style={{color:'#fbbf24',fontWeight:600}}>🏆 {e.certificate_id}</span>
                          : <span style={{color:'#475569'}}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ══ BROWSE TAB ══ */}
          {activeView === 'browse' && (
            <div>
              {Object.entries(DEPT_COURSES).map(([dept, deptInfo]) => {
                if (!isAdmin() && dept !== userDept) return null;
                return (
                  <div key={dept} style={{marginBottom:36}}>
                    <div style={{
                      display:'flex',alignItems:'center',
                      gap:10,marginBottom:16,
                    }}>
                      <span style={{fontSize:28}}>{deptInfo.emoji}</span>
                      <h2 style={{
                        color:'#fff',margin:0,fontSize:18,textTransform:'capitalize',
                      }}>
                        {deptInfo.label}
                      </h2>
                      <span style={{
                        padding:'2px 10px',borderRadius:20,fontSize:12,
                        background:'rgba(99,102,241,0.15)',color:'#a5b4fc',
                        border:'1px solid rgba(99,102,241,0.3)',
                      }}>
                        {deptInfo.courses.length} courses
                      </span>
                    </div>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',
                      gap:14,
                    }}>
                      {deptInfo.courses.map((c, idx) => {
                        const isEnrolled = enrolledTitles.includes(c.title);
                        const isPaid     = c.price > 0;
                        return (
                          <div key={idx} style={{
                            background:'rgba(255,255,255,0.03)',
                            border:`1px solid ${isEnrolled
                              ? 'rgba(16,185,129,0.3)'
                              : isPaid
                              ? 'rgba(245,158,11,0.2)'
                              : 'rgba(255,255,255,0.06)'}`,
                            borderRadius:14,padding:'18px',
                            position:'relative',overflow:'hidden',
                          }}>
                            {/* Paid badge */}
                            {isPaid && (
                              <div style={{
                                position:'absolute',top:10,right:10,
                                padding:'2px 8px',borderRadius:20,fontSize:11,
                                background:'rgba(245,158,11,0.2)',
                                color:'#fbbf24',
                                border:'1px solid rgba(245,158,11,0.3)',
                                fontWeight:700,
                              }}>
                                💳 ₹{c.price}
                              </div>
                            )}
                            {!isPaid && (
                              <div style={{
                                position:'absolute',top:10,right:10,
                                padding:'2px 8px',borderRadius:20,fontSize:11,
                                background:'rgba(16,185,129,0.15)',
                                color:'#34d399',
                                border:'1px solid rgba(16,185,129,0.2)',
                                fontWeight:700,
                              }}>
                                FREE
                              </div>
                            )}

                            <div style={{fontSize:36,textAlign:'center',marginBottom:10}}>
                              {c.icon}
                            </div>
                            <div style={{
                              color:'#fff',fontWeight:600,fontSize:14,
                              textAlign:'center',marginBottom:8,
                            }}>
                              {c.title}
                            </div>
                            <p style={{
                              color:'#64748b',fontSize:12,textAlign:'center',
                              marginBottom:12,lineHeight:1.5,
                            }}>
                              {c.description}
                            </p>
                            <div style={{
                              display:'flex',justifyContent:'center',
                              gap:6,marginBottom:14,flexWrap:'wrap',
                            }}>
                              <DiffBadge d={c.difficulty}/>
                              <span style={{
                                padding:'2px 8px',borderRadius:20,fontSize:11,
                                color:'#64748b',background:'rgba(255,255,255,0.04)',
                                border:'1px solid rgba(255,255,255,0.06)',
                              }}>
                                ⏱️ {c.duration}hrs
                              </span>
                              <span style={{
                                padding:'2px 8px',borderRadius:20,fontSize:11,
                                color:'#94a3b8',background:'rgba(255,255,255,0.04)',
                                border:'1px solid rgba(255,255,255,0.06)',
                              }}>
                                🎬 {c.videos?.length||0} videos
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
                                  setAssignForm({ dept, courseIdx: idx });
                                  setShowAssign(true);
                                }}
                                style={{
                                  width:'100%',padding:'8px',borderRadius:8,
                                  border:'none',
                                  background: isPaid
                                    ? 'rgba(245,158,11,0.2)'
                                    : 'rgba(99,102,241,0.2)',
                                  color: isPaid ? '#fbbf24' : '#a5b4fc',
                                  cursor:'pointer',fontSize:13,fontWeight:600,
                                }}>
                                ➕ {isPaid ? 'Assign (Paid)' : 'Assign Free'}
                              </button>
                            ) : isPaid ? (
                              <button
                                onClick={() => handleRequestPaidCourse(c, dept)}
                                style={{
                                  width:'100%',padding:'8px',borderRadius:8,
                                  border:'1px solid rgba(245,158,11,0.3)',
                                  background:'rgba(245,158,11,0.1)',
                                  color:'#fbbf24',cursor:'pointer',
                                  fontSize:13,fontWeight:600,
                                }}>
                                💳 Request Access (₹{c.price})
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

          {/* ══ CODING PRACTICE TAB ══ */}
          {activeView === 'coding' && (
            <div>
              <div style={{marginBottom:28}}>
                <h2 style={{color:'#fff',fontSize:20,marginBottom:6}}>
                  💻 Coding Practice Platforms
                </h2>
                <p style={{color:'#64748b',fontSize:14}}>
                  Sharpen your skills with these top platforms
                </p>
              </div>

              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',
                gap:16,marginBottom:40,
              }}>
                {CODING_PLATFORMS.map((p,i) => (
                  <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                    style={{
                      textDecoration:'none',
                      display:'block',
                      background:'rgba(255,255,255,0.04)',
                      border:'1px solid rgba(255,255,255,0.08)',
                      borderRadius:16,padding:'24px',
                      transition:'all 0.2s',
                      cursor:'pointer',
                    }}>
                    <div style={{
                      fontSize:40,marginBottom:12,textAlign:'center',
                    }}>
                      {p.icon}
                    </div>
                    <div style={{
                      color:'#fff',fontWeight:700,fontSize:16,
                      textAlign:'center',marginBottom:6,
                    }}>
                      {p.name}
                    </div>
                    <div style={{
                      color:'#64748b',fontSize:12,
                      textAlign:'center',marginBottom:14,
                    }}>
                      {p.desc}
                    </div>
                    <div style={{
                      display:'flex',justifyContent:'center',
                    }}>
                      <span style={{
                        padding:'6px 16px',borderRadius:20,fontSize:12,
                        fontWeight:600,color:'#fff',
                        background:`${p.color}33`,
                        border:`1px solid ${p.color}55`,
                      }}>
                        Practice Now →
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Dept-specific coding links */}
              {(() => {
                const deptCourse = isAdmin() ? null : DEPT_COURSES[userDept];
                if (!deptCourse) return null;
                const coursesWithCoding = deptCourse.courses.filter(c => c.coding);
                if (!coursesWithCoding.length) return null;
                return (
                  <div>
                    <h3 style={{color:'#e2e8f0',marginBottom:16,fontSize:16}}>
                      🎯 Recommended for {userDept.charAt(0).toUpperCase()+userDept.slice(1)} Team
                    </h3>
                    <div style={{
                      display:'grid',
                      gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',
                      gap:12,
                    }}>
                      {coursesWithCoding.map((c,i) => (
                        <a key={i} href={c.coding.url}
                          target="_blank" rel="noopener noreferrer"
                          style={{
                            textDecoration:'none',
                            display:'flex',alignItems:'center',gap:12,
                            padding:'14px 16px',borderRadius:12,
                            background:'rgba(99,102,241,0.08)',
                            border:'1px solid rgba(99,102,241,0.2)',
                          }}>
                          <span style={{fontSize:24}}>{c.icon}</span>
                          <div>
                            <div style={{color:'#e2e8f0',fontWeight:600,fontSize:13}}>
                              {c.coding.label}
                            </div>
                            <div style={{color:'#64748b',fontSize:11}}>
                              via {c.coding.platform}
                            </div>
                          </div>
                          <span style={{marginLeft:'auto',color:'#a5b4fc',fontSize:16}}>
                            →
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          COURSE DETAIL MODAL WITH YOUTUBE VIDEOS
      ══════════════════════════════════════════════════════ */}
      {selectedCourse && !quizMode && !quizResult && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.9)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:16,
        }} onClick={() => { setSelectedCourse(null); setActiveVideo(0); }}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:800,
            maxHeight:'92vh',overflow:'hidden',
            display:'flex',flexDirection:'column',
          }} onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
              display:'flex',alignItems:'center',gap:14,flexShrink:0,
            }}>
              <div style={{
                fontSize:40,width:56,height:56,
                background:'rgba(99,102,241,0.15)',borderRadius:12,
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                {selectedCourse.enrollment.course_thumbnail}
              </div>
              <div style={{flex:1}}>
                <h2 style={{color:'#fff',margin:'0 0 4px',fontSize:18}}>
                  {selectedCourse.enrollment.course_title}
                </h2>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                  <DiffBadge d={selectedCourse.enrollment.course_difficulty}/>
                  <span style={{color:'#64748b',fontSize:12}}>
                    ⏱️ {selectedCourse.enrollment.course_duration}hrs
                  </span>
                  <span style={{
                    color:'#a5b4fc',fontSize:12,
                    background:'rgba(99,102,241,0.1)',
                    padding:'2px 8px',borderRadius:20,
                    border:'1px solid rgba(99,102,241,0.2)',
                  }}>
                    {selectedCourse.enrollment.progress}% done
                  </span>
                </div>
              </div>
              <button onClick={() => { setSelectedCourse(null); setActiveVideo(0); }}
                style={{
                  background:'rgba(255,255,255,0.06)',border:'none',
                  borderRadius:8,color:'#94a3b8',width:32,height:32,
                  cursor:'pointer',fontSize:18,flexShrink:0,
                }}>×</button>
            </div>

            <div style={{overflowY:'auto',flex:1,padding:'20px 24px'}}>

              {/* ── YouTube Video Section ── */}
              {selectedCourse.template?.videos?.length > 0 && (
                <div style={{marginBottom:24}}>
                  <h3 style={{color:'#e2e8f0',marginBottom:12,fontSize:15}}>
                    🎬 Course Videos
                  </h3>

                  {/* Video tabs */}
                  <div style={{
                    display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',
                  }}>
                    {selectedCourse.template.videos.map((v,i) => (
                      <button key={i}
                        onClick={() => setActiveVideo(i)}
                        style={{
                          padding:'6px 14px',borderRadius:20,border:'none',
                          background: activeVideo===i
                            ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                          color: activeVideo===i ? '#a5b4fc' : '#64748b',
                          cursor:'pointer',fontSize:12,fontWeight:600,
                          border:`1px solid ${activeVideo===i
                            ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                        }}>
                        {i+1}. {v.title}
                      </button>
                    ))}
                  </div>

                  {/* Video player */}
                  <div style={{
                    borderRadius:14,overflow:'hidden',
                    border:'1px solid rgba(255,255,255,0.1)',
                    background:'#000',
                  }}>
                    <iframe
                      width="100%"
                      height="380"
                      src={selectedCourse.template.videos[activeVideo]?.url}
                      title={selectedCourse.template.videos[activeVideo]?.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{display:'block'}}
                    />
                  </div>
                  <p style={{
                    color:'#64748b',fontSize:12,marginTop:8,textAlign:'center',
                  }}>
                    📺 {selectedCourse.template.videos[activeVideo]?.title} •
                    ⏱️ {selectedCourse.template.videos[activeVideo]?.duration}
                  </p>
                </div>
              )}

              {/* Progress bar */}
              <div style={{marginBottom:20}}>
                <div style={{
                  display:'flex',justifyContent:'space-between',
                  marginBottom:6,color:'#94a3b8',fontSize:12,
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
                  const done   = (selectedCourse.enrollment.lessons_done||[]).includes(idx);
                  const locked = idx > 0 &&
                    !(selectedCourse.enrollment.lessons_done||[]).includes(idx-1) && !done;
                  return (
                    <div key={idx} style={{
                      display:'flex',alignItems:'center',gap:12,
                      padding:'12px 16px',borderRadius:10,
                      background: done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                      border:`1px solid ${done ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      opacity: locked ? 0.45 : 1,
                    }}>
                      <div style={{
                        width:32,height:32,borderRadius:8,flexShrink:0,
                        background: done ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:14,
                      }}>
                        {done ? '✅' : locked ? '🔒' : idx+1}
                      </div>
                      <span style={{
                        color: done ? '#34d399' : '#e2e8f0',flex:1,fontSize:14,
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
                        <span style={{color:'#34d399',fontSize:12}}>Done ✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Coding Practice link */}
              {selectedCourse.template?.coding && (
                <div style={{
                  marginBottom:20,padding:'16px',borderRadius:12,
                  background:'rgba(99,102,241,0.08)',
                  border:'1px solid rgba(99,102,241,0.2)',
                }}>
                  <h3 style={{color:'#a5b4fc',margin:'0 0 8px',fontSize:14}}>
                    💻 Practice This Course
                  </h3>
                  <p style={{color:'#64748b',fontSize:12,margin:'0 0 12px'}}>
                    Apply what you learn with hands-on challenges!
                  </p>
                  <a href={selectedCourse.template.coding.url}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display:'inline-flex',alignItems:'center',gap:8,
                      padding:'8px 18px',borderRadius:10,
                      background:'rgba(99,102,241,0.2)',
                      border:'1px solid rgba(99,102,241,0.4)',
                      color:'#a5b4fc',textDecoration:'none',
                      fontSize:13,fontWeight:600,
                    }}>
                    🚀 {selectedCourse.template.coding.label}
                    <span style={{color:'#64748b'}}>
                      via {selectedCourse.template.coding.platform}
                    </span>
                  </a>
                </div>
              )}

              {/* Quiz section */}
              {selectedCourse.enrollment.progress >= 100 &&
               !selectedCourse.enrollment.quiz_passed && (
                <div style={{
                  padding:'24px',borderRadius:14,textAlign:'center',
                  background:'rgba(99,102,241,0.08)',
                  border:'1px solid rgba(99,102,241,0.2)',
                }}>
                  <div style={{fontSize:48,marginBottom:8}}>🎯</div>
                  <h3 style={{color:'#e2e8f0',margin:'0 0 6px'}}>
                    Ready for the Quiz?
                  </h3>
                  <p style={{color:'#64748b',fontSize:13,margin:'0 0 16px'}}>
                    Answer 5 questions — pass with{' '}
                    {selectedCourse.enrollment.course_pass_score}% to get certified!
                  </p>
                  <button
                    onClick={() => { setQuizMode(true); setQuizAnswers({}); }}
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
                  <h3 style={{color:'#fbbf24',margin:'0 0 4px',fontSize:18}}>
                    Certificate Earned!
                  </h3>
                  <p style={{color:'#94a3b8',fontSize:13,margin:'0 0 4px'}}>
                    {selectedCourse.enrollment.course_title}
                  </p>
                  <p style={{color:'#64748b',fontSize:12,margin:'0 0 16px'}}>
                    ID: {selectedCourse.enrollment.certificate_id}
                  </p>
                  <button onClick={() => {
                    const cert = [
                      '═══════════════════════════════════════════════════════',
                      '          EMS PRO — CERTIFICATE OF COMPLETION           ',
                      '═══════════════════════════════════════════════════════',
                      '',
                      '  This is to certify that',
                      '',
                      `      ${selectedCourse.enrollment.user_name || 'Employee'}`,
                      '',
                      '  has successfully completed the course:',
                      '',
                      `      "${selectedCourse.enrollment.course_title}"`,
                      '',
                      `  Department : ${(selectedCourse.enrollment.course_dept||'').toUpperCase()}`,
                      `  Difficulty : ${selectedCourse.enrollment.course_difficulty}`,
                      `  Duration   : ${selectedCourse.enrollment.course_duration} hours`,
                      `  Quiz Score : ${selectedCourse.enrollment.quiz_score}%`,
                      `  Cert ID    : ${selectedCourse.enrollment.certificate_id}`,
                      `  Date       : ${new Date(selectedCourse.enrollment.completed_at||Date.now()).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}`,
                      '',
                      '═══════════════════════════════════════════════════════',
                      '         Issued by EMS Pro Learning Center              ',
                      '═══════════════════════════════════════════════════════',
                    ].join('\n');
                    const blob = new Blob([cert], {type:'text/plain'});
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `Certificate_${selectedCourse.enrollment.certificate_id}.txt`;
                    a.click();
                  }} style={{
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
          QUIZ MODAL — FIXED
      ══════════════════════════════════════════════════════ */}
      {selectedCourse && quizMode && !quizResult && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.92)',
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:16,
        }}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:620,
            maxHeight:'92vh',overflow:'hidden',
            display:'flex',flexDirection:'column',
          }}>
            {/* Quiz header */}
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid rgba(255,255,255,0.06)',
              display:'flex',justifyContent:'space-between',
              alignItems:'center',flexShrink:0,
            }}>
              <div>
                <h2 style={{color:'#fff',margin:'0 0 4px',fontSize:18}}>
                  🎯 {selectedCourse.enrollment.course_title} — Quiz
                </h2>
                <p style={{color:'#64748b',margin:0,fontSize:13}}>
                  Pass with {selectedCourse.enrollment.course_pass_score}% to earn certificate
                </p>
              </div>
              <span style={{
                padding:'4px 12px',borderRadius:20,fontSize:13,
                background: Object.keys(quizAnswers).length ===
                  (selectedCourse.enrollment.course_quiz||[]).length
                  ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.1)',
                color: Object.keys(quizAnswers).length ===
                  (selectedCourse.enrollment.course_quiz||[]).length
                  ? '#34d399' : '#a5b4fc',
                border:`1px solid ${Object.keys(quizAnswers).length ===
                  (selectedCourse.enrollment.course_quiz||[]).length
                  ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.2)'}`,
                fontWeight:600,
              }}>
                {Object.keys(quizAnswers).length}/
                {(selectedCourse.enrollment.course_quiz||[]).length} answered
              </span>
            </div>

            <div style={{overflowY:'auto',padding:'24px',flex:1}}>
              {(selectedCourse.enrollment.course_quiz||[]).map((q,qi) => (
                <div key={qi} style={{marginBottom:28}}>
                  <div style={{
                    display:'flex',alignItems:'center',gap:10,marginBottom:14,
                  }}>
                    <span style={{
                      width:28,height:28,borderRadius:8,flexShrink:0,
                      background: quizAnswers[String(qi)] !== undefined
                        ? 'rgba(16,185,129,0.2)' : 'rgba(99,102,241,0.2)',
                      border:`1px solid ${quizAnswers[String(qi)] !== undefined
                        ? 'rgba(16,185,129,0.4)' : 'rgba(99,102,241,0.3)'}`,
                      display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:13,fontWeight:700,
                      color: quizAnswers[String(qi)] !== undefined
                        ? '#34d399' : '#a5b4fc',
                    }}>
                      {quizAnswers[String(qi)] !== undefined ? '✓' : qi+1}
                    </span>
                    <p style={{
                      color:'#e2e8f0',fontWeight:600,fontSize:15,margin:0,
                    }}>
                      {q.question}
                    </p>
                  </div>
                  <div style={{
                    display:'flex',flexDirection:'column',gap:8,paddingLeft:38,
                  }}>
                    {(q.options||[]).map((opt,oi) => (
                      <label key={oi} style={{
                        display:'flex',alignItems:'center',gap:12,
                        padding:'12px 16px',borderRadius:10,cursor:'pointer',
                        background: quizAnswers[String(qi)] === String(oi)
                          ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                        border:`1px solid ${quizAnswers[String(qi)] === String(oi)
                          ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        transition:'all 0.15s',
                      }}>
                        <input
                          type="radio"
                          name={`quiz-q${qi}`}
                          value={String(oi)}
                          checked={quizAnswers[String(qi)] === String(oi)}
                          onChange={() => setQuizAnswers(prev => ({
                            ...prev, [String(qi)]: String(oi),
                          }))}
                          style={{accentColor:'#6366f1',width:16,height:16}}
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

              {/* Error */}
              {errorMsg && (
                <div style={{
                  padding:'12px',borderRadius:10,marginBottom:16,
                  background:'rgba(239,68,68,0.1)',
                  border:'1px solid rgba(239,68,68,0.3)',
                  color:'#f87171',fontSize:13,textAlign:'center',
                }}>
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleQuizSubmit}
                disabled={saving}
                style={{
                  width:'100%',padding:'14px',borderRadius:12,
                  background: Object.keys(quizAnswers).length ===
                    (selectedCourse.enrollment.course_quiz||[]).length
                    ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                    : 'rgba(255,255,255,0.06)',
                  border:'none',color:'#fff',cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize:15,fontWeight:700,opacity:saving?0.7:1,
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
          background:'rgba(0,0,0,0.92)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:16,
        }}>
          <div style={{
            background:'#0f172a',
            border:`2px solid ${quizResult.passed
              ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius:20,width:'100%',maxWidth:480,padding:'40px',
            textAlign:'center',
          }}>
            <div style={{fontSize:80,marginBottom:12}}>
              {quizResult.passed ? '🏆' : '😔'}
            </div>
            <h2 style={{
              color: quizResult.passed ? '#34d399' : '#f87171',
              fontSize:24,margin:'0 0 8px',
            }}>
              {quizResult.passed ? 'Congratulations! You Passed!' : 'Better Luck Next Time'}
            </h2>
            <p style={{color:'#94a3b8',fontSize:14,margin:'0 0 24px'}}>
              {quizResult.passed
                ? '🎉 Your certificate has been generated!'
                : '📚 Review the course material and try again.'}
            </p>

            {/* Score */}
            <div style={{
              width:130,height:130,borderRadius:'50%',
              background: quizResult.passed
                ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border:`4px solid ${quizResult.passed ? '#10b981' : '#ef4444'}`,
              display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              margin:'0 auto 24px',
            }}>
              <span style={{
                fontSize:38,fontWeight:900,
                color: quizResult.passed ? '#34d399' : '#f87171',
                lineHeight:1,
              }}>
                {quizResult.score}%
              </span>
              <span style={{color:'#64748b',fontSize:12,marginTop:4}}>
                {quizResult.correct}/{quizResult.total} correct
              </span>
            </div>

            <div style={{
              padding:'12px',borderRadius:10,marginBottom:16,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)',
              color:'#64748b',fontSize:13,
            }}>
              Required: {quizResult.pass_score}% •
              Your score: {quizResult.score}% •
              {quizResult.passed ? ' ✅ Passed!' : ' ❌ Failed'}
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
                if (quizResult.passed) {
                  fetchData();
                  setSelectedCourse(prev => ({
                    ...prev,
                    enrollment: quizResult.enrollment,
                  }));
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
              {quizResult.passed
                ? '🎉 View My Certificate'
                : '📚 Back to Course & Retry'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          ASSIGN COURSE MODAL (Admin)
      ══════════════════════════════════════════════════════ */}
      {showAssign && isAdmin() && (
        <div style={{
          position:'fixed',inset:0,zIndex:9999,
          background:'rgba(0,0,0,0.8)',
          display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        }} onClick={() => setShowAssign(false)}>
          <div style={{
            background:'#0f172a',
            border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20,width:'100%',maxWidth:520,padding:'28px',
          }} onClick={e=>e.stopPropagation()}>

            <div style={{
              display:'flex',justifyContent:'space-between',
              alignItems:'center',marginBottom:24,
            }}>
              <h2 style={{color:'#fff',margin:0,fontSize:18}}>
                ➕ Assign Course to Department
              </h2>
              <button onClick={() => setShowAssign(false)} style={{
                background:'rgba(255,255,255,0.06)',border:'none',
                borderRadius:8,color:'#94a3b8',width:32,height:32,
                cursor:'pointer',fontSize:18,
              }}>×</button>
            </div>

            {/* Dept select */}
            <div style={{marginBottom:16}}>
              <label style={{
                color:'#94a3b8',fontSize:12,fontWeight:600,
                textTransform:'uppercase',letterSpacing:'0.5px',
                display:'block',marginBottom:6,
              }}>
                Department
              </label>
              <select value={assignForm.dept}
                onChange={e => setAssignForm(p=>({...p,dept:e.target.value,courseIdx:0}))}
                style={{
                  width:'100%',padding:'10px 14px',borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  color:'#e2e8f0',fontSize:14,
                }}>
                {Object.entries(DEPT_COURSES).map(([d,info]) => (
                  <option key={d} value={d} style={{background:'#1e293b'}}>
                    {info.emoji} {info.label}
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
              <select value={assignForm.courseIdx}
                onChange={e => setAssignForm(p=>({...p,courseIdx:Number(e.target.value)}))}
                style={{
                  width:'100%',padding:'10px 14px',borderRadius:10,
                  background:'rgba(255,255,255,0.05)',
                  border:'1px solid rgba(255,255,255,0.1)',
                  color:'#e2e8f0',fontSize:14,
                }}>
                {(DEPT_COURSES[assignForm.dept]?.courses||[]).map((c,i) => (
                  <option key={i} value={i} style={{background:'#1e293b'}}>
                    {c.icon} {c.title} • {c.difficulty} • {c.duration}hrs
                    {c.price > 0 ? ` • ₹${c.price}` : ' • FREE'}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {(() => {
              const c = DEPT_COURSES[assignForm.dept]?.courses[assignForm.courseIdx];
              if (!c) return null;
              return (
                <div style={{
                  padding:'16px',borderRadius:12,marginBottom:20,
                  background: c.price > 0
                    ? 'rgba(245,158,11,0.08)' : 'rgba(99,102,241,0.08)',
                  border:`1px solid ${c.price > 0
                    ? 'rgba(245,158,11,0.2)' : 'rgba(99,102,241,0.2)'}`,
                }}>
                  <div style={{
                    display:'flex',alignItems:'center',gap:12,marginBottom:10,
                  }}>
                    <span style={{fontSize:32}}>{c.icon}</span>
                    <div>
                      <div style={{color:'#fff',fontWeight:600,fontSize:15}}>
                        {c.title}
                      </div>
                      <div style={{display:'flex',gap:8,marginTop:4,flexWrap:'wrap'}}>
                        <DiffBadge d={c.difficulty}/>
                        <span style={{
                          color:'#64748b',fontSize:12,
                          background:'rgba(255,255,255,0.04)',
                          padding:'2px 8px',borderRadius:20,
                          border:'1px solid rgba(255,255,255,0.06)',
                        }}>
                          ⏱️ {c.duration}hrs
                        </span>
                        {c.price > 0 ? (
                          <span style={{
                            color:'#fbbf24',fontSize:12,fontWeight:700,
                            background:'rgba(245,158,11,0.15)',
                            padding:'2px 8px',borderRadius:20,
                            border:'1px solid rgba(245,158,11,0.3)',
                          }}>
                            💳 Paid • ₹{c.price}
                          </span>
                        ) : (
                          <span style={{
                            color:'#34d399',fontSize:12,fontWeight:700,
                            background:'rgba(16,185,129,0.15)',
                            padding:'2px 8px',borderRadius:20,
                            border:'1px solid rgba(16,185,129,0.3)',
                          }}>
                            ✅ Free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p style={{color:'#64748b',fontSize:12,margin:'0 0 6px'}}>
                    {c.description}
                  </p>
                  <p style={{color:'#94a3b8',fontSize:12,margin:0}}>
                    📌 Will be assigned to ALL{' '}
                    <strong style={{color:'#a5b4fc'}}>
                      {assignForm.dept}
                    </strong>{' '}
                    employees automatically.
                  </p>
                  {c.price > 0 && (
                    <p style={{
                      color:'#fbbf24',fontSize:12,margin:'8px 0 0',
                      padding:'8px 12px',borderRadius:8,
                      background:'rgba(245,158,11,0.1)',
                    }}>
                      ⚠️ This is a <strong>paid course</strong>.
                      Assigning it as admin confirms you've approved the cost.
                    </p>
                  )}
                </div>
              );
            })()}

            <button onClick={handleAssignCourse} disabled={saving} style={{
              width:'100%',padding:'14px',borderRadius:12,
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border:'none',color:'#fff',cursor:saving?'not-allowed':'pointer',
              fontSize:15,fontWeight:700,opacity:saving?0.7:1,
            }}>
              {saving ? '⏳ Assigning...' : '🚀 Assign to All Department Employees'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}