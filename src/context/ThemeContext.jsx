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
      root.style.setProperty('--bg-primary',   '#080b14');
      root.style.setProperty('--bg-secondary', '#0a0d1a');
      root.style.setProperty('--bg-card',      'rgba(255,255,255,.04)');
      root.style.setProperty('--border',       'rgba(255,255,255,.08)');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-muted',   'rgba(255,255,255,.45)');
    } else {
      root.setAttribute('data-theme', 'light');
      root.style.setProperty('--bg-primary',   '#f1f5f9');
      root.style.setProperty('--bg-secondary', '#ffffff');
      root.style.setProperty('--bg-card',      'rgba(0,0,0,.03)');
      root.style.setProperty('--border',       'rgba(0,0,0,.1)');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-muted',   'rgba(0,0,0,.5)');
    }
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