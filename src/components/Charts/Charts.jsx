import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import './Charts.css';

const COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#f43f5e','#a855f7'];

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tt-label">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="tt-row">
          <span className="tt-dot" style={{ background: p.color }} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ── BAR CHART ─────────────────────────────────────────────────────────
export function AttendanceBarChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>📅 Monthly Attendance</h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{background:'#6366f1'}}/> Present</span>
          <span className="legend-item"><span className="legend-dot" style={{background:'#f43f5e'}}/> Absent</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barSize={14} barGap={4}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="present" name="Present" fill="#6366f1" radius={[6,6,0,0]} />
          <Bar dataKey="absent"  name="Absent"  fill="#f43f5e" radius={[6,6,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── LINE CHART ────────────────────────────────────────────────────────
export function SalaryLineChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>💰 Salary Expense Trend</h3>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot" style={{background:'#06b6d4'}}/> Total Expense</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#6366f1" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="amount" name="Expense" stroke="url(#lineGrad)"
            strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#8b5cf6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── PIE CHART ─────────────────────────────────────────────────────────
export function DepartmentPieChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>🏬 By Department</h3>
      </div>
      <div className="pie-wrap">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
              dataKey="value" paddingAngle={3}>
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

// ── TASK PROGRESS BAR CHART ───────────────────────────────────────────
export function TaskStatusChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-card-head">
        <h3>✅ Task Overview</h3>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" barSize={12}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="status" tick={{ fill: 'rgba(255,255,255,.4)', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,.04)' }} />
          <Bar dataKey="count" name="Tasks" radius={[0,6,6,0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
