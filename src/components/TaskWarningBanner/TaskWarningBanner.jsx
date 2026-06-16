import React, {
  useState,
  useEffect,
  useCallback
} from 'react';

import { tasksAPI } from '../../services/api';

import './TaskWarningBanner.css';

/**
 * =========================================================
 * TaskWarningBanner
 * =========================================================
 *
 * Shows warning when employee has 2+ OVERDUE tasks
 * (due_date in the past AND not completed).
 *
 * Flow:
 * 1. Poll tasks every 60s
 * 2. If 2+ overdue → call backend check_overdue_meeting
 * 3. Backend creates Jitsi link, notifies employee + admins,
 *    sends email to both
 * 4. Frontend shows live countdown + Join button
 * =========================================================
 */
export default function TaskWarningBanner({ notifications = [] }) {

  // =======================================================
  // STATE
  // =======================================================
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [showBanner,   setShowBanner]   = useState(false);
  const [dismissed,    setDismissed]    = useState(false);
  const [meetingLink,  setMeetingLink]  = useState(null);
  const [meetingTime,  setMeetingTime]  = useState(null);
  const [minutesAway,  setMinutesAway]  = useState(null);
  const [secondsLeft,  setSecondsLeft]  = useState(null);
  const [emailSent,    setEmailSent]    = useState(false);
  const [checking,     setChecking]     = useState(false);

  // =======================================================
  // FETCH TASKS — detect overdue ones
  // =======================================================
  const checkTasks = useCallback(async () => {
    try {
      const res  = await tasksAPI.getMine();
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      const now = new Date();

      const overdue = data.filter((t) => {
        if (t.status === 'completed') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < now;
      });

      setOverdueTasks(overdue);

      if (overdue.length >= 2 && !dismissed) {
        setShowBanner(true);

        // Only call backend if we don't have a meeting link yet
        if (!meetingLink && !checking) {
          setChecking(true);
          try {
            const r = await tasksAPI.checkOverdueMeeting();
            const d = r.data;

            // ── Fresh meeting just created ──────────────────
            if (d.meeting_scheduled && d.meeting_link) {
              setMeetingLink(d.meeting_link);
              if (d.meeting_time) setMeetingTime(new Date(d.meeting_time));
              if (d.minutes_away) setMinutesAway(d.minutes_away);
              setEmailSent(true);
            }

            // ── Meeting already scheduled earlier ───────────
            // Return the existing link so user can still join
            else if (d.reason === 'already_scheduled' && d.meeting_link) {
              setMeetingLink(d.meeting_link);
              setMeetingTime(null);  // no countdown for old meeting
              setEmailSent(false);
            }

            // ── Fallback: link returned without meeting_scheduled flag ──
            else if (d.meeting_link) {
              setMeetingLink(d.meeting_link);
              if (d.meeting_time) setMeetingTime(new Date(d.meeting_time));
              if (d.minutes_away) setMinutesAway(d.minutes_away);
            }

          } catch (err) {
            console.error('check_overdue_meeting error:', err);
          } finally {
            setChecking(false);
          }
        }

      } else if (overdue.length < 2) {
        setShowBanner(false);
        setDismissed(false);
        setMeetingLink(null);
        setMeetingTime(null);
        setMinutesAway(null);
        setSecondsLeft(null);
        setEmailSent(false);
      }

    } catch (err) {
      console.error('TaskWarningBanner:', err);
    }
  }, [dismissed, meetingLink, checking]);

  // =======================================================
  // AUTO POLLING — every 60 seconds
  // =======================================================
  useEffect(() => {
    checkTasks();
    const iv = setInterval(checkTasks, 60000);
    return () => clearInterval(iv);
  }, [checkTasks]);

  // =======================================================
  // LIVE COUNTDOWN to meeting time
  // =======================================================
  useEffect(() => {
    if (!meetingTime) return;

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor((meetingTime.getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [meetingTime]);

  // =======================================================
  // FALLBACK — detect link from notification bell
  // (covers case where meeting was scheduled in a prev session)
  // =======================================================
  useEffect(() => {
    if (meetingLink) return;
    if (!notifications?.length) return;

    const n = notifications.find(
      (x) =>
        x.title?.includes('Meeting Scheduled') &&
        x.type === 'warning'
    );

    if (n) {
      const m = n.message?.match(/https:\/\/meet\.jit\.si\/\S+/);
      if (m) setMeetingLink(m[0]);
    }
  }, [notifications, meetingLink]);

  // =======================================================
  // HELPERS
  // =======================================================
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const overdueDays = (due) =>
    Math.ceil((new Date() - new Date(due)) / 86400000);

  const priorityClass = (p) =>
    p === 'urgent' ? 'urgent' : p === 'high' ? 'high' : '';

  const TIMER_MAX    = (minutesAway || 10) * 60;
  const timerPercent = secondsLeft !== null
    ? Math.min(100, ((TIMER_MAX - secondsLeft) / TIMER_MAX) * 100)
    : 0;

  // =======================================================
  // HIDE if nothing to show
  // =======================================================
  if (!showBanner && !meetingLink) return null;

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <>
      {/* ═══════════════════════════════════════════════════
          MEETING CARD — shown once backend returns a link
      ═══════════════════════════════════════════════════ */}
      {meetingLink && (
        <div className="meeting-notification">

          <div className="meeting-notification-head">
            <span className="meeting-icon">📅</span>
            <div className="meeting-notification-title">
              Meeting Scheduled — Overdue Tasks
            </div>
          </div>

          <p className="meeting-description">
            A meeting with your manager has been automatically
            scheduled because you have{' '}
            <strong>{overdueTasks.length} overdue tasks</strong>.
            {emailSent && (
              <span className="meeting-email-badge">
                📧 Email + notification sent to you &amp; admin
              </span>
            )}
          </p>

          {/* Countdown — only shown when we have a future meeting time */}
          {secondsLeft !== null && meetingTime && (
            <div className="twb-timer" style={{ marginBottom: 14 }}>
              <div className="twb-timer-top">
                <span>⏱ Meeting starts in:</span>
                <strong style={{
                  color: secondsLeft < 120 ? '#f87171' : '#fbbf24'
                }}>
                  {secondsLeft > 0
                    ? formatTime(secondsLeft)
                    : '🔴 Starting now!'}
                </strong>
              </div>
              <div className="twb-timer-bar">
                <div
                  className="twb-timer-fill"
                  style={{ width: `${timerPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Overdue task pills */}
          <div className="twb-tasks" style={{ marginBottom: 14 }}>
            {overdueTasks.slice(0, 5).map((t) => (
              <span
                key={t.id}
                className={`twb-task-pill ${priorityClass(t.priority)}`}
              >
                {t.priority === 'urgent' ? '🔴'
                  : t.priority === 'high' ? '🟠' : '🟡'}
                {t.title} ({overdueDays(t.due_date)}d overdue)
              </span>
            ))}
            {overdueTasks.length > 5 && (
              <span className="twb-task-pill">
                +{overdueTasks.length - 5} more
              </span>
            )}
          </div>

          {/* Meeting link */}
          <div className="meeting-link-box">
            <span className="video-icon">🎥</span>
            <span className="meeting-link-text">{meetingLink}</span>
            <a
              href={meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="meeting-join-btn"
            >
              🚀 Join Meeting Now
            </a>
          </div>

          <div className="meeting-footer">
            Complete your overdue tasks to dismiss this notice
            on future visits.
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          WARNING BANNER — shown before link is ready
      ═══════════════════════════════════════════════════ */}
      {showBanner && !meetingLink && (
        <div className="task-warning-banner">

          <div className="twb-icon">⚠️</div>

          <div className="twb-body">

            <div className="twb-title">
              Task Warning — {overdueTasks.length} Overdue Tasks
            </div>

            <div className="twb-message">
              You have{' '}
              <strong>{overdueTasks.length} overdue tasks</strong>{' '}
              that are past their due date. A meeting with your
              manager is being auto-scheduled — you and your admin
              will receive a notification and email with the link.
              {checking && (
                <span className="twb-checking">
                  {' '}⏳ Scheduling meeting...
                </span>
              )}
            </div>

            {/* Overdue task pills */}
            <div className="twb-tasks">
              {overdueTasks.slice(0, 5).map((t) => (
                <span
                  key={t.id}
                  className={`twb-task-pill ${priorityClass(t.priority)}`}
                >
                  {t.priority === 'urgent' ? '🔴'
                    : t.priority === 'high' ? '🟠' : '🟡'}
                  {t.title} ({overdueDays(t.due_date)}d overdue)
                </span>
              ))}
              {overdueTasks.length > 5 && (
                <span className="twb-task-pill">
                  +{overdueTasks.length - 5} more
                </span>
              )}
            </div>

            <div className="twb-actions">
              <a href="/employee/tasks" className="twb-btn primary">
                ✅ Complete Tasks Now
              </a>
              <button
                className="twb-btn secondary"
                onClick={() => setDismissed(true)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}