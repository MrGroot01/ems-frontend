import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach JWT to every request ──────────────────────────────
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('access_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Auto-refresh access token on 401 ─────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE}/auth/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return api(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post('/auth/register/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login:          (data) => api.post('/auth/login/', data),
  logout:         (refresh) => api.post('/auth/logout/', { refresh }),
  getProfile:     () => api.get('/auth/profile/'),
  updateProfile:  (data) => api.patch('/auth/profile/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data) => api.post('/auth/change-password/', data),
  forgotPassword: (email) => api.post('/auth/forgot-password/', { email }),
  verifyOTP:      (data)  => api.post('/auth/verify-otp/', data),
  resetPassword:  (data)  => api.post('/auth/reset-password/', data),
  getUsers:       () => api.get('/auth/users/'),
};

// ── EMPLOYEES ─────────────────────────────────────────────────
export const employeesAPI = {
  getAll:         (params) => api.get('/employees/', { params }),
  getById:        (id)     => api.get(`/employees/${id}/`),
  create:         (data)   => api.post('/employees/', data),        // creates User + Employee
  update:         (id, data) => api.patch(`/employees/${id}/`, data),
  delete:         (id)     => api.delete(`/employees/${id}/`),
  getDashboardStats: () => api.get('/employees/dashboard-stats/'),
};

// ── ATTENDANCE ─────────────────────────────────────────────
export const attendanceAPI = {
  checkIn:          () => api.post('/attendance/check_in/'),
  checkOut:         () => api.post('/attendance/check_out/'),
  getMine:          (params) => api.get('/attendance/', { params }),
  getAll:           (params) => api.get('/attendance/', { params }),
  todaySummary:     () => api.get('/attendance/today_summary/'),

  // ── Face Recognition ──────────────────────────────────
  faceStatus:       () => api.get('/attendance/face-status/'),
  registerFace:     (image) => api.post('/attendance/register-face/', { image }),
  faceCheckIn:      (image) => api.post('/attendance/face-checkin/', { image }),
};

// ── LEAVES ────────────────────────────────────────────────────
export const leavesAPI = {
  apply:        (data)     => api.post('/leaves/', data),
  getMine:      (params)   => api.get('/leaves/', { params }),
  getAll:       (params)   => api.get('/leaves/', { params }),
  updateStatus: (id, data) => api.patch(`/leaves/${id}/update_status/`, data),
};

// ── TASKS ─────────────────────────────────────────────────────
export const tasksAPI = {
  create:         (data)     => api.post('/tasks/', data),
  getMine:        (params)   => api.get('/tasks/', { params }),
  getAll:         (params)   => api.get('/tasks/', { params }),
  update:         (id, data) => api.patch(`/tasks/${id}/`, data),
  updateProgress: (id, data) => api.patch(`/tasks/${id}/update_progress/`, data),
  delete:         (id)       => api.delete(`/tasks/${id}/`),
};

// ── PAYROLL ───────────────────────────────────────────────────
export const payrollAPI = {
  getMySalary:     () => api.get('/payroll/salary/'),
  getMyPayslips:   () => api.get('/payroll/payslips/'),
  getAllPayslips:   () => api.get('/payroll/payslips/'),
  setSalary:       (data) => api.post('/payroll/salary/', data),
  generatePayslip: (data) => api.post('/payroll/payslips/', data),
  markPaid:        (id)   => api.patch(`/payroll/payslips/${id}/mark_paid/`),
};
 

// ── NOTIFICATIONS ─────────────────────────────────────────────
export const notificationsAPI = {
  getAll:      () => api.get('/notifications/'),
  markRead:    (id) => api.patch(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.patch('/notifications/mark_all_read/'),
  broadcast:   (data) => api.post('/notifications/broadcast/', data),
  unreadCount: () => api.get('/notifications/unread_count/'),
};
// ── COURSES ───────────────────────────────────────────────
export const coursesAPI = {
  getAll:          (params) => api.get('/learning/courses/', { params }),
  getByDept:       (dept)   => api.get(`/learning/courses/by-department/?dept=${dept}`),
  create:          (data)   => api.post('/learning/courses/', data),
  update:          (id, data) => api.patch(`/learning/courses/${id}/`, data),
  delete:          (id)     => api.delete(`/learning/courses/${id}/`),
  enroll:          (id, data) => api.post(`/learning/courses/${id}/enroll/`, data),

  getMyEnrollments: ()      => api.get('/learning/enrollments/'),
  getAllEnrollments: ()      => api.get('/learning/enrollments/'),
  getStats:         ()      => api.get('/learning/enrollments/stats/'),
  completeLesson:  (id, lesson_index) =>
    api.post(`/learning/enrollments/${id}/complete-lesson/`, { lesson_index }),
  submitQuiz:      (id, answers) =>
    api.post(`/learning/enrollments/${id}/submit-quiz/`, { answers }),
};


export default api;
