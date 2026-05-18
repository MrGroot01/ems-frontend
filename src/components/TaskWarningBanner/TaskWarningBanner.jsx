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
 * Shows warning when employee has
 * 2 or more incomplete tasks.
 *
 * Features:
 * ✅ Auto task polling
 * ✅ 15 minute countdown
 * ✅ Meeting notification
 * ✅ Auto Jitsi link detection
 * ✅ Responsive UI
 * =========================================================
 */

export default function TaskWarningBanner({
  notifications = []
}) {

  // =======================================================
  // STATES
  // =======================================================
  const [pendingTasks, setPendingTasks] = useState([]);

  const [showBanner, setShowBanner] = useState(false);

  const [dismissed, setDismissed] = useState(false);

  const [meetingLink, setMeetingLink] = useState(null);

  const [timerSeconds, setTimerSeconds] = useState(15 * 60);

  const [timerActive, setTimerActive] = useState(false);

  const [warningTime, setWarningTime] = useState(null);


  // =======================================================
  // FETCH TASKS
  // =======================================================
  const checkTasks = useCallback(async () => {

    try {

      const response = await tasksAPI.getMine();

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      // Filter pending tasks
      const pending = data.filter(

        (task) =>

          task.status === 'todo' ||
          task.status === 'in_progress'
      );

      setPendingTasks(pending);

      // Show warning if 2+ tasks
      if (pending.length >= 2 && !dismissed) {

        setShowBanner(true);

        // Start timer only once
        if (!warningTime) {

          setWarningTime(new Date());

          setTimerSeconds(15 * 60);

          setTimerActive(true);
        }
      }

      // Reset if tasks reduced
      else if (pending.length < 2) {

        setShowBanner(false);

        setDismissed(false);

        setTimerActive(false);

        setWarningTime(null);

        setTimerSeconds(15 * 60);
      }

    } catch (error) {

      console.error(
        'TaskWarningBanner Error:',
        error
      );
    }

  }, [dismissed, warningTime]);


  // =======================================================
  // AUTO POLLING
  // =======================================================
  useEffect(() => {

    checkTasks();

    const interval = setInterval(() => {

      checkTasks();

    }, 60000);

    return () => clearInterval(interval);

  }, [checkTasks]);


  // =======================================================
  // COUNTDOWN TIMER
  // =======================================================
  useEffect(() => {

    if (!timerActive) return;

    const timer = setInterval(() => {

      setTimerSeconds((prev) => {

        if (prev <= 1) {

          clearInterval(timer);

          return 0;
        }

        return prev - 1;
      });

    }, 1000);

    return () => clearInterval(timer);

  }, [timerActive]);


  // =======================================================
  // DETECT MEETING LINK
  // =======================================================
  useEffect(() => {

    if (!notifications?.length) return;

    const meetingNotification = notifications.find(

      (notification) =>

        (
          notification.title?.includes('Meeting') ||

          notification.message?.includes('meet.jit.si')
        ) &&

        notification.type === 'warning'
    );

    if (meetingNotification) {

      const match =
        meetingNotification.message?.match(
          /https:\/\/meet\.jit\.si\/[^\s\n]+/
        );

      if (match) {
        setMeetingLink(match[0]);
      }
    }

  }, [notifications]);


  // =======================================================
  // FORMAT TIMER
  // =======================================================
  const formatTime = (seconds) => {

    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');

    const secs = (seconds % 60)
      .toString()
      .padStart(2, '0');

    return `${minutes}:${secs}`;
  };


  // =======================================================
  // TIMER %
  // =======================================================
  const timerPercent =

    ((15 * 60 - timerSeconds) / (15 * 60)) * 100;


  // =======================================================
  // PRIORITY CLASS
  // =======================================================
  const priorityClass = (priority) => {

    if (priority === 'urgent') return 'urgent';

    if (priority === 'high') return 'high';

    return '';
  };


  // =======================================================
  // HIDE COMPONENT
  // =======================================================
  if (!showBanner && !meetingLink) {
    return null;
  }


  // =======================================================
  // UI
  // =======================================================
  return (
    <>

      {/* ===================================================
          MEETING NOTIFICATION
      =================================================== */}
      {meetingLink && (

        <div className="meeting-notification">

          <div className="meeting-notification-head">

            <span className="meeting-icon">
              📅
            </span>

            <div className="meeting-notification-title">

              Meeting Scheduled — Tasks Still Pending

            </div>
          </div>

          <p className="meeting-description">

            A meeting has been automatically scheduled
            because you currently have

            <strong>
              {' '}
              {pendingTasks.length} incomplete tasks
            </strong>.

            Please join immediately.

          </p>

          {/* Meeting Link */}
          <div className="meeting-link-box">

            <span className="video-icon">
              🎥
            </span>

            <span className="meeting-link-text">
              {meetingLink}
            </span>

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

            Complete your tasks after the meeting
            to dismiss this notice.

          </div>
        </div>
      )}


      {/* ===================================================
          WARNING BANNER
      =================================================== */}
      {showBanner && !meetingLink && (

        <div className="task-warning-banner">

          {/* Warning Icon */}
          <div className="twb-icon">
            ⚠️
          </div>

          {/* Content */}
          <div className="twb-body">

            {/* Title */}
            <div className="twb-title">

              Task Warning — {pendingTasks.length} Incomplete Tasks

            </div>

            {/* Message */}
            <div className="twb-message">

              You currently have

              <strong>
                {' '}
                {pendingTasks.length} incomplete tasks
              </strong>.

              Please complete them as soon as possible.

              If tasks are not completed within the
              allowed time, a meeting will automatically
              be scheduled with your manager.

            </div>


            {/* ===================================================
                TASK PILLS
            =================================================== */}
            <div className="twb-tasks">

              {pendingTasks
                .slice(0, 5)
                .map((task) => (

                <span
                  key={task.id}
                  className={`twb-task-pill ${priorityClass(task.priority)}`}
                >

                  {task.priority === 'urgent'
                    ? '🔴'
                    : task.priority === 'high'
                    ? '🟠'
                    : '🟡'}

                  {task.title}

                </span>
              ))}

              {pendingTasks.length > 5 && (

                <span className="twb-task-pill">

                  +{pendingTasks.length - 5} more

                </span>
              )}

            </div>


            {/* ===================================================
                TIMER
            =================================================== */}
            {timerActive && timerSeconds > 0 && (

              <div className="twb-timer">

                <div className="twb-timer-top">

                  <span>
                    ⏱ Meeting in:
                  </span>

                  <strong
                    style={{
                      color:
                        timerSeconds < 300
                          ? '#f87171'
                          : '#fbbf24'
                    }}
                  >
                    {formatTime(timerSeconds)}
                  </strong>

                </div>

                {/* Progress Bar */}
                <div className="twb-timer-bar">

                  <div
                    className="twb-timer-fill"
                    style={{
                      width: `${timerPercent}%`
                    }}
                  />

                </div>
              </div>
            )}


            {/* Time Up */}
            {timerSeconds === 0 && (

              <div className="twb-timeup">

                ⏰ Time's up! Meeting is being scheduled...

              </div>
            )}


            {/* ===================================================
                ACTION BUTTONS
            =================================================== */}
            <div className="twb-actions">

              <a
                href="/employee/tasks"
                className="twb-btn primary"
              >
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