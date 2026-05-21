import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Login           from '../pages/Login/Login';
import Register        from '../pages/Register/Register';
import ForgotPassword  from '../pages/ForgotPassword/ForgotPassword';
import AdminDashboard  from '../pages/AdminDashboard/AdminDashboard';
import EmployeeDashboard from '../pages/EmployeeDashboard/EmployeeDashboard';
import Employees       from '../pages/Employees/Employees';
import Attendance      from '../pages/Attendance/Attendance';
import LeaveRequests   from '../pages/LeaveRequests/LeaveRequests';
import Tasks           from '../pages/Tasks/Tasks';
import Payroll         from '../pages/Payroll/Payroll';
import Reports         from '../pages/Reports/Reports';
import Notifications   from '../pages/Notifications/Notifications';
import Settings        from '../pages/Settings/Settings';
import AIAssistant from '../pages/AIAssistant/AIAssistant';
import Profile         from '../pages/Profile/Profile';

const Guard = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner-lg" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employee'} replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const home = user ? (user.role === 'admin' ? '/admin' : '/employee') : '/login';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Navigate to={home} />} />
        <Route path="/login"         element={!user ? <Login /> : <Navigate to={home} />} />
        <Route path="/register"      element={!user ? <Register /> : <Navigate to={home} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin */}
        <Route path="/admin"                element={<Guard roles={['admin']}><AdminDashboard /></Guard>} />
        <Route path="/admin/employees"      element={<Guard roles={['admin']}><Employees /></Guard>} />
        <Route path="/admin/attendance"     element={<Guard roles={['admin']}><Attendance /></Guard>} />
        <Route path="/admin/leaves"         element={<Guard roles={['admin']}><LeaveRequests /></Guard>} />
        <Route path="/admin/tasks"          element={<Guard roles={['admin']}><Tasks /></Guard>} />
        <Route path="/admin/payroll"        element={<Guard roles={['admin']}><Payroll /></Guard>} />
        <Route path="/admin/reports"        element={<Guard roles={['admin']}><Reports /></Guard>} />
        <Route path="/admin/notifications"  element={<Guard roles={['admin']}><Notifications /></Guard>} />
        <Route path="/admin/settings"       element={<Guard roles={['admin']}><Settings /></Guard>} />
        <Route path="/admin/ai-assistant" element={<Guard roles={['admin']}><AIAssistant /></Guard>} />


        {/* Employee */}
        <Route path="/employee"                  element={<Guard roles={['employee']}><EmployeeDashboard /></Guard>} />
        <Route path="/employee/profile"          element={<Guard roles={['employee']}><Profile /></Guard>} />
        <Route path="/employee/attendance"       element={<Guard roles={['employee']}><Attendance /></Guard>} />
        <Route path="/employee/leaves"           element={<Guard roles={['employee']}><LeaveRequests /></Guard>} />
        <Route path="/employee/tasks"            element={<Guard roles={['employee']}><Tasks /></Guard>} />
        <Route path="/employee/payroll"          element={<Guard roles={['employee']}><Payroll /></Guard>} />
        <Route path="/employee/notifications"    element={<Guard roles={['employee']}><Notifications /></Guard>} />
        <Route path="/employee/ai-assistant" element={<Guard roles={['employee']}><AIAssistant /></Guard>} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
