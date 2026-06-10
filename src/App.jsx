import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './routes/AppRoutes';
import AIChat from './components/AIChat/AIChat';
import './index.css';

// ── Restore saved appearance settings on every page load ───
const RGB_MAP = {
  '#6366f1': '99,102,241',
  '#3b82f6': '59,130,246',
  '#06b6d4': '6,182,212',
  '#10b981': '16,185,129',
  '#f59e0b': '245,158,11',
  '#f43f5e': '244,63,94',
  '#a855f7': '168,85,247',
  '#ec4899': '236,72,153',
};

function restoreAppearance() {
  const root = document.documentElement;

  // ── Accent colour ──────────────────────────────────────
  const accent = localStorage.getItem('accent_color');
  if (accent && RGB_MAP[accent]) {
    const rgb = RGB_MAP[accent];
    root.style.setProperty('--accent',      accent);
    root.style.setProperty('--accent-rgb',  rgb);
    root.style.setProperty('--accent-glow', `rgba(${rgb},0.18)`);
    root.style.setProperty('--accent-dim',  `rgba(${rgb},0.08)`);
    root.style.setProperty('--border-glow', `rgba(${rgb},0.3)`);
  }

  // ── Font size ──────────────────────────────────────────
  const fontSize = localStorage.getItem('font_size');
  if (fontSize) root.style.setProperty('--base-font-size', fontSize);

  // ── Rounded corners ────────────────────────────────────
  const rounded = localStorage.getItem('rounded');
  if (rounded === 'false') {
    root.style.setProperty('--radius-lg', '8px');
    root.style.setProperty('--radius-md', '6px');
    root.style.setProperty('--radius-sm', '4px');
  } else {
    root.style.setProperty('--radius-lg', '16px');
    root.style.setProperty('--radius-md', '10px');
    root.style.setProperty('--radius-sm', '6px');
  }
}

// Run immediately before render
restoreAppearance();

export default function App() {
  // Re-apply on hot reload / dev mode
  useEffect(() => { restoreAppearance(); }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <AIChat />
      </AuthProvider>
    </ThemeProvider>
  );
}