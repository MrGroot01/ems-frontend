import React from 'react';
import './StatCard.css';

/**
 * StatCard — reusable dashboard metric card
 * Props: icon, label, value, trend (up/down/flat), trendVal, barPercent, color
 */
export default function StatCard({ icon, label, value, trend = 'flat', trendVal = '', barPercent = 0, color = 'indigo' }) {
  const colors = {
    indigo: { glow:'rgba(99,102,241,.06)',  iconBg:'rgba(99,102,241,.15)', shadow:'rgba(99,102,241,.3)',  bar:'linear-gradient(90deg,#6366f1,#8b5cf6)' },
    cyan:   { glow:'rgba(6,182,212,.06)',   iconBg:'rgba(6,182,212,.15)',  shadow:'rgba(6,182,212,.3)',   bar:'linear-gradient(90deg,#06b6d4,#0891b2)' },
    green:  { glow:'rgba(16,185,129,.06)',  iconBg:'rgba(16,185,129,.15)', shadow:'rgba(16,185,129,.3)',  bar:'linear-gradient(90deg,#10b981,#059669)' },
    amber:  { glow:'rgba(245,158,11,.06)',  iconBg:'rgba(245,158,11,.15)', shadow:'rgba(245,158,11,.3)',  bar:'linear-gradient(90deg,#f59e0b,#d97706)' },
    rose:   { glow:'rgba(244,63,94,.06)',   iconBg:'rgba(244,63,94,.15)',  shadow:'rgba(244,63,94,.3)',   bar:'linear-gradient(90deg,#f43f5e,#e11d48)' },
    purple: { glow:'rgba(168,85,247,.06)',  iconBg:'rgba(168,85,247,.15)', shadow:'rgba(168,85,247,.3)',  bar:'linear-gradient(90deg,#a855f7,#9333ea)' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className="stat-card" style={{
      '--sc-glow':    c.glow,
      '--sc-icon-bg': c.iconBg,
      '--sc-shadow':  c.shadow,
      '--sc-bar':     c.bar,
    }}>
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>
        {trendVal && (
          <div className={`stat-trend ${trend}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendVal}
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
      {barPercent > 0 && (
        <div className="stat-bar">
          <div className="stat-bar-fill" style={{ width: `${Math.min(100, barPercent)}%` }} />
        </div>
      )}
    </div>
  );
}
