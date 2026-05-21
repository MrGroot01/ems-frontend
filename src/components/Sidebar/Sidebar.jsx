import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';
import { Link } from 'react-router-dom'
const ADMIN_MENU = [
  { section: 'Main' },
  { ico:'📊', txt:'Dashboard',      path:'/admin',               end:true },
  { section: 'Management' },
  { ico:'👥', txt:'Employees',       path:'/admin/employees' },
  { ico:'📅', txt:'Attendance',      path:'/admin/attendance' },
  { ico:'🏖️', txt:'Leave Requests',  path:'/admin/leaves',       badge:'leave' },
  { ico:'✅', txt:'Tasks',           path:'/admin/tasks' },
  { section: 'Finance' },
  { ico:'💰', txt:'Payroll',         path:'/admin/payroll' },
  { ico:'📈', txt:'Reports',         path:'/admin/reports' },
  { section: 'System' },
  { ico:'🔔', txt:'Notifications',   path:'/admin/notifications', badge:'notif' },
  { ico:'⚙️', txt:'Settings',        path:'/admin/settings' },
  { ico:'🤖', txt:'AI Assistant', path:'/admin/ai-assistant' },  // ✅ ADDED
];

const EMP_MENU = [
  { section: 'Main' },
  { ico:'🏠', txt:'Dashboard',    path:'/employee',                  end:true },
  { section: 'Work' },
  { ico:'👤', txt:'My Profile',   path:'/employee/profile' },
  { ico:'📅', txt:'Attendance',   path:'/employee/attendance' },
  { ico:'✅', txt:'My Tasks',     path:'/employee/tasks' },
  { section: 'HR' },
  { ico:'🏖️', txt:'Leave',        path:'/employee/leaves' },
  { ico:'💰', txt:'Payroll',      path:'/employee/payroll' },
  { section: 'More' },
  { ico:'🔔', txt:'Notifications',path:'/employee/notifications', badge:'notif' },
  { ico:'🤖', txt:'AI Assistant', path:'/employee/ai-assistant' },  // ✅ ADDED
];

export default function Sidebar({ pendingLeaves = 0, unreadNotifs = 0, mobileOpen, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const menu = isAdmin() ? ADMIN_MENU : EMP_MENU;

  const badgeCount = (b) => b === 'leave' ? pendingLeaves : b === 'notif' ? unreadNotifs : 0;

  const initials = user?.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <>
      {mobileOpen && <div className="sb-overlay" onClick={onMobileClose} />}

      <aside className={`sidebar ${collapsed?'collapsed':''} ${mobileOpen?'mob-open':''}`}>
        <button className="sb-toggle" onClick={() => setCollapsed(p=>!p)}>
          {collapsed ? '›' : '‹'}
        </button>

        {/* Brand */}
        <div className="sb-brand">
          <div className="sb-brand-ico">🏢</div>
          <div className="sb-brand-txt">EMS <span>Pro</span></div>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar">
            {user?.profile_image ? <img src={user.profile_image} alt="av"/> : initials}
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.full_name}</div>
            <div className="sb-user-role">{user?.role === 'admin' ? '🛡️ Admin':'👤 Employee'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          {menu.map((item, i) => {
            if (item.section) return <div key={i} className="sb-label">{item.section}</div>;
            const cnt = item.badge ? badgeCount(item.badge) : 0;
            return (
              <NavLink key={item.path} to={item.path} end={!!item.end} onClick={onMobileClose}
                className={({isActive}) => `sb-item ${isActive?'active':''}`}>
                <span className="sb-ico">{item.ico}</span>
                <span className="sb-txt">{item.txt}</span>
                {cnt > 0 && <span className="sb-badge">{cnt}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="sb-bottom">
          <button className="sb-logout" onClick={handleLogout}>
            <span className="sb-ico">🚪</span>
            <span className="sb-logout-txt sb-txt">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
