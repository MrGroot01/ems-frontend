import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.setAttribute('data-theme', 'dark');

      // ── Backgrounds — layered for depth ─────────────────
      // sidebar/navbar (darkest) < page bg < cards (lightest)
      root.style.setProperty('--bg-primary',   '#0b0e14');   // page bg
      root.style.setProperty('--bg-secondary', '#0d0f16');   // sidebar/navbar
      root.style.setProperty('--bg-card',      '#181c27');   // cards — pop forward
      root.style.setProperty('--bg-card-hover','#1f2430');
      root.style.setProperty('--bg-input',     '#15181f');

      // ── Borders — slightly more visible ─────────────────
      root.style.setProperty('--border',       'rgba(255,255,255,.10)');
      root.style.setProperty('--border-strong','rgba(255,255,255,.16)');

      // ── Text ─────────────────────────────────────────
      root.style.setProperty('--text-primary', '#f1f3f9');
      root.style.setProperty('--text-secondary','#c2c7d6');
      root.style.setProperty('--text-muted',   '#7d8597');
      root.style.setProperty('--text-dim',     '#4b5366');

      // ── Shadow ───────────────────────────────────────
      root.style.setProperty('--shadow-card',  '0 1px 2px rgba(0,0,0,.3), 0 4px 16px rgba(0,0,0,.24)');
      root.style.setProperty('--shadow-lg',    '0 12px 40px rgba(0,0,0,.5)');

    } else {
      root.setAttribute('data-theme', 'light');

      // ── Backgrounds ──────────────────────────────────
      root.style.setProperty('--bg-primary',   '#f7f8fa');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-card',      '#ffffff');
      root.style.setProperty('--bg-card-hover','#f4f5f7');
      root.style.setProperty('--bg-input',     '#f4f5f7');

      // ── Borders ──────────────────────────────────────
      root.style.setProperty('--border',       '#e4e7ec');
      root.style.setProperty('--border-strong','#d1d5db');

      // ── Text ─────────────────────────────────────────
      root.style.setProperty('--text-primary', '#0d1117');
      root.style.setProperty('--text-secondary','#3d4451');
      root.style.setProperty('--text-muted',   '#6b7280');
      root.style.setProperty('--text-dim',     '#9ca3af');

      // ── Shadow ───────────────────────────────────────
      root.style.setProperty('--shadow-card',  '0 1px 3px rgba(16,24,40,.06), 0 1px 2px rgba(16,24,40,.04)');
      root.style.setProperty('--shadow-lg',    '0 8px 24px rgba(16,24,40,.08)');
    }

    // ── Shared accent (works for both themes) ───────────
    root.style.setProperty('--accent',        '#5b5bf6');
    root.style.setProperty('--accent-rgb',    '91,91,246');
    root.style.setProperty('--accent-hover',  '#4747e8');
    root.style.setProperty('--accent-light',  'rgba(91,91,246,.1)');
    root.style.setProperty('--success',       '#16a34a');
    root.style.setProperty('--success-rgb',   '22,163,74');
    root.style.setProperty('--danger',        '#e11d48');
    root.style.setProperty('--danger-rgb',    '225,29,72');
    root.style.setProperty('--warning',       '#d97706');
    root.style.setProperty('--warning-rgb',   '217,119,6');
    root.style.setProperty('--info',          '#0891b2');
    root.style.setProperty('--info-rgb',      '8,145,178');

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);