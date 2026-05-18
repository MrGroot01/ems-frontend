import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import './Navbar.css';

export default function Navbar({ title = 'Dashboard', subtitle = '', unreadNotifs = 0, onMenuClick }) {
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const notifPath   = isAdmin() ? '/admin/notifications'  : '/employee/notifications';
  const profilePath = isAdmin() ? '/admin/settings'       : '/employee/profile';
  const initials    = user?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <nav className="navbar">
      <div className="nb-left">
        <button className="nb-menu-btn" onClick={onMenuClick}>☰</button>
        <div>
          <div className="nb-title">{title}</div>
          {subtitle && <div className="nb-sub">{subtitle}</div>}
        </div>
      </div>

      <div className="nb-right">
        {/* Search */}
        <div className="nb-search">
          <span className="nb-search-ico">🔍</span>
          <input type="text" placeholder="Search anything…" />
        </div>

        {/* Theme toggle — fixed: removed duplicate className + style={{}} */}
        <button className={`theme-tog ${isDark ? 'dark' : ''}`} onClick={toggleTheme}>
          <div className="theme-knob">{isDark ? '🌙' : '☀️'}</div>
        </button>

        {/* Notifications */}
        <button className="nb-btn" onClick={() => navigate(notifPath)}>
          🔔
          {unreadNotifs > 0 && <span className="nb-dot" />}
        </button>

        {/* Clock */}
        <div className="nb-time">
          <div className="nb-time-val">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="nb-date-val">
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Profile */}
        <div className="nb-profile" onClick={() => navigate(profilePath)}>
          <div className="nb-av">
            {user?.profile_image
              ? <img src={user.profile_image} alt="av" />
              : initials
            }
          </div>
          <span className="nb-name">{user?.full_name?.split(' ')[0]}</span>
        </div>
      </div>
    </nav>
  );
}