import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart,
} from 'recharts';
import './Charts.css';

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#a855f7'];

// ── Currency formatter ────────────────────────────────────────────────
function fmtINR(val) {
  if (!val && val !== 0) return '—';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000)   return `₹${(val / 100000).toFixed(1)}L`;
  if (val >= 1000)     return `₹${(val / 1000).toFixed(0)}K`;
  return `₹${val}`;
}

// ── Custom tooltip ─────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tt-label">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="tt-row">
          <span className="tt-dot" style={{ background: p.color }} />
          {p.name}:{' '}
          <strong>{formatter ? formatter(p.value, p.name) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── ATTENDANCE BAR CHART ──────────────────────────────────────────────
export function AttendanceBarChart({ data = [] }) {
  const isEmpty = data.length === 0;

  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>📅 Monthly Attendance</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#6366f1' }}/> Present
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#f43f5e' }}/> Absent
          </span>
        </div>
      </div>
      {isEmpty ? (
        <div className="chart-empty">No attendance data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barSize={16} barGap={4}
            margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,.04)' }}
            />
            <Bar dataKey="present" name="Present" fill="#6366f1" radius={[6,6,0,0]} />
            <Bar dataKey="absent"  name="Absent"  fill="#f43f5e" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── SALARY LINE CHART (with INR Y-axis) ──────────────────────────────
export function SalaryLineChart({ data = [] }) {
  const isEmpty = data.length === 0;

  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>💰 Salary Expense Trend</h3>
        <div className="chart-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: '#06b6d4' }}/> Total Expense
          </span>
        </div>
      </div>
      {isEmpty ? (
        <div className="chart-empty">No payroll data for this period</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="salaryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              dataKey="month"
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
            />
            {/* ── THIS is the fix: tickFormatter converts raw numbers to ₹L/K ── */}
            <YAxis
              tickFormatter={fmtINR}
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
              width={60}
            />
            <Tooltip
              content={
                <CustomTooltip formatter={(val) => fmtINR(val)} />
              }
            />
            <Area
              type="monotone"
              dataKey="amount"
              name="Expense"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              fill="url(#salaryGrad)"
              dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: '#8b5cf6', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── DEPARTMENT PIE CHART ──────────────────────────────────────────────
export function DepartmentPieChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>🏬 By Department</h3>
      </div>
      <div className="pie-wrap">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={50} outerRadius={80}
              dataKey="value"
              paddingAngle={3}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-labels">
          {data.map((d, i) => (
            <div key={i} className="pie-label-item">
              <span className="pie-label-swatch" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="pie-label-text">{d.name}</span>
              <span className="pie-label-val">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TASK STATUS HORIZONTAL BAR CHART ─────────────────────────────────
export function TaskStatusChart({ data = [] }) {
  const TASK_COLORS = {
    'Completed':   '#10b981',
    'In Progress': '#6366f1',
    'To Do':       '#f59e0b',
    'Overdue':     '#ef4444',
  };

  const isEmpty = data.every(d => d.count === 0);

  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>✅ Task Overview</h3>
      </div>
      {isEmpty ? (
        <div className="chart-empty">No task data available</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            layout="vertical"
            barSize={14}
            margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,.06)" />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="status"
              tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12, fontFamily: 'Plus Jakarta Sans' }}
              axisLine={false} tickLine={false}
              width={85}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,.04)' }}
            />
            <Bar dataKey="count" name="Tasks" radius={[0,6,6,0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={TASK_COLORS[d.status] || COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}