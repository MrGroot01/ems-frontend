import React, { useState, useEffect, useCallback, useRef } from 'react';
import { tasksAPI, notificationsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './TaskWarningBanner.css';

const STORAGE_KEY = 'ems_meeting_link';
const DISMISS_KEY = 'ems_banner_dismissed_until';

const generateRoom = (userName) => {
  const clean = (userName || 'employee').replace(/\s+/g, '-').toLowerCase();
  const rand  = Math.random().toString(36).slice(2, 7);
  return `EMS-${clean}-${rand}`;
};

export default function TaskWarningBanner({ notifications = [] }) {
  const { user } = useAuth();

  const [pendingTasks,  setPendingTasks]  = useState([]);
  const [showBanner,    setShowBanner]    = useState(false);
  const [meetingLink,   setMeetingLink]   = useState(null);
  const [timerSeconds,  setTimerSeconds]  = useState(15 * 60);
  const [timerActive,   setTimerActive]   = useState(false);
  const [meetingSent,   setMeetingSent]   = useState(false);
  const [sending,       setSending]       = useState(false);

  const warningStarted = useRef(false);

  // ── On mount: restore meeting link from storage ───────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { link, empId, expires } = JSON.parse(saved);
        // Only restore if it's for this user and not expired (24h)
        if (empId === user?.employee_id && Date.now() < expires) {
          setMeetingLink(link);
          setMeetingSent(true);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
    }
  }, [user]);

  // ── Fetch tasks ─────────────────────────────────────────
  const checkTasks = useCallback(async () => {
    // Check if banner is dismissed
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      setShowBanner(false);
      return;
    }

    try {
      const res  = await tasksAPI.getMine();
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);

      // Only count truly pending/in-progress tasks
      const pending = data.filter(t =>
        t.status === 'todo' || t.status === 'in_progress'
      );

      setPendingTasks(pending);

      // ── KEY FIX: only show if 2+ PENDING tasks AND no meeting yet ──
      if (pending.length >= 2 && !meetingSent) {
        setShowBanner(true);
        if (!warningStarted.current) {
          warningStarted.current = true;
          setTimerSeconds(15 * 60);
          setTimerActive(true);
        }
      } else {
        // Tasks completed or less than 2 pending → hide banner
        setShowBanner(false);
        if (pending.length < 2) {
          setTimerActive(false);
          warningStarted.current = false;
          setTimerSeconds(15 * 60);
        }
      }
    } catch (err) {
      console.error('TaskWarningBanner:', err);
    }
  }, [meetingSent]);

  useEffect(() => {
    checkTasks();
    const interval = setInterval(checkTasks, 60000);
    return () => clearInterval(interval);
  }, [checkTasks]);

  // ── Countdown ─────────────────────────────────────────────
  useEffect(() => {
    if (!timerActive) return;
    const timer = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timerActive]);

  // ── Timer hits 0 → auto schedule ─────────────────────────
  useEffect(() => {
    if (timerSeconds === 0 && !meetingSent && pendingTasks.length >= 2) {
      scheduleMeeting();
    }
  }, [timerSeconds]);

  // ── Detect meeting link from notifications ────────────────
  useEffect(() => {
    if (!notifications?.length || meetingLink) return;
    const found = notifications.find(n =>
      n.message?.includes('meet.jit.si') && !n.is_read
    );
    if (found) {
      const match = found.message?.match(/https:\/\/meet\.jit\.si\/[^\s\n"]+/);
      if (match) {
        setMeetingLink(match[0]);
        setMeetingSent(true);
      }
    }
  }, [notifications, meetingLink]);

  // ── Schedule meeting ──────────────────────────────────────
  const scheduleMeeting = async () => {
    if (meetingSent || sending) return;
    setSending(true);
    try {
      const room = generateRoom(user?.full_name);
      const link = `https://meet.jit.si/${room}`;

      // Save to localStorage so it persists on refresh (24h)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        link,
        empId:   user?.employee_id,
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }));

      setMeetingLink(link);
      setMeetingSent(true);
      setShowBanner(false);
      setTimerActive(false);

      await notificationsAPI.broadcast({
        type:    'warning',
        title:   '⚠️ Meeting Scheduled — Pending Tasks',
        message: `${user?.full_name} has ${pendingTasks.length} incomplete tasks. Meeting scheduled.\n\nJoin: ${link}`,
      });
    } catch (err) {
      // Still show meeting even if notification fails
      const room = generateRoom(user?.full_name);
      const link = `https://meet.jit.si/${room}`;
      setMeetingLink(link);
      setMeetingSent(true);
    } finally {
      setSending(false);
    }
  };

  // ── Dismiss banner for 30 mins ────────────────────────────
  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 30 * 60 * 1000));
    setShowBanner(false);
    setTimerActive(false);
    warningStarted.current = false;
  };

  // ── Dismiss meeting card ──────────────────────────────────
  const handleDismissMeeting = () => {
    localStorage.removeItem(STORAGE_KEY);
    setMeetingLink(null);
    setMeetingSent(false);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s%60).toString().padStart(2,'0')}`;
  };

  const timerPercent = ((15 * 60 - timerSeconds) / (15 * 60)) * 100;
  const isUrgent     = timerSeconds < 300 && timerSeconds > 0;

  // ── Don't render anything if no banner and no meeting ─────
  if (!showBanner && !meetingLink) return null;

  return (
    <>
      {/* Meeting card */}
      {meetingLink && (
        <div className="meeting-notification">
          <div className="meeting-notification-head">
            <span className="meeting-icon">📅</span>
            <div className="meeting-notification-title">
              Meeting Scheduled — Pending Tasks
            </div>
          </div>
          <p className="meeting-description">
            A meeting has been automatically scheduled because you had{' '}
            <strong>{pendingTasks.length} incomplete task{pendingTasks.length!==1?'s':''}</strong>.
            Please join and discuss with your manager.
          </p>
          <div className="meeting-link-box">
            <span className="video-icon">🎥</span>
            <span className="meeting-link-text">{meetingLink}</span>
            <a href={meetingLink} target="_blank" rel="noopener noreferrer"
              className="meeting-join-btn">
              🚀 Join Meeting Now
            </a>
          </div>
          <div className="meeting-footer">
            Complete your tasks after the meeting.{' '}
            <button onClick={handleDismissMeeting}
              style={{background:'none',border:'none',color:'rgba(255,255,255,.35)',
                cursor:'pointer',fontSize:12,marginLeft:8}}>
              × Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Warning banner */}
      {showBanner && !meetingLink && (
        <div className={`task-warning-banner ${isUrgent?'urgent-pulse':''}`}>
          <div className="twb-icon">⚠️</div>
          <div className="twb-body">
            <div className="twb-title">
              Task Warning — {pendingTasks.length} Incomplete Task{pendingTasks.length!==1?'s':''}
            </div>
            <div className="twb-message">
              You have <strong>{pendingTasks.length} incomplete tasks</strong>.
              {timerActive && timerSeconds > 0 && (
                <> Complete them before the timer runs out or a meeting will be scheduled.</>
              )}
            </div>

            {/* Task pills */}
            <div className="twb-tasks">
              {pendingTasks.slice(0, 5).map(t => (
                <span key={t.id} className={`twb-task-pill ${
                  t.priority==='urgent'?'urgent':t.priority==='high'?'high':''}`}>
                  {t.priority==='urgent'?'🔴':t.priority==='high'?'🟠':'🟡'} {t.title}
                </span>
              ))}
              {pendingTasks.length > 5 && (
                <span className="twb-task-pill">+{pendingTasks.length-5} more</span>
              )}
            </div>

            {/* Timer */}
            {timerActive && timerSeconds > 0 && (
              <div className="twb-timer">
                <div className="twb-timer-top">
                  <span>⏱ Meeting schedules in:</span>
                  <strong style={{color: isUrgent?'#f87171':'#fbbf24'}}>
                    {formatTime(timerSeconds)}
                  </strong>
                </div>
                <div className="twb-timer-bar">
                  <div className="twb-timer-fill" style={{
                    width:`${timerPercent}%`,
                    background: isUrgent
                      ? 'linear-gradient(90deg,#ef4444,#f87171)'
                      : 'linear-gradient(90deg,#f59e0b,#fbbf24)',
                  }}/>
                </div>
              </div>
            )}

            {timerSeconds === 0 && (
              <div className="twb-timeup">
                {sending ? '⏳ Scheduling meeting...' : '⏰ Scheduling meeting...'}
              </div>
            )}

            <div className="twb-actions">
              <a href="/employee/tasks" className="twb-btn primary">
                ✅ Complete Tasks Now
              </a>
              <button className="twb-btn secondary" onClick={handleDismiss}>
                Dismiss (30 min)
              </button>
              <button className="twb-btn secondary"
                onClick={scheduleMeeting}
                disabled={sending || meetingSent}
                style={{opacity: sending?.6:1}}>
                {sending ? '⏳ Scheduling...' : '📅 Schedule Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}