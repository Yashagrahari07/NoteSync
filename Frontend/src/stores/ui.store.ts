import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Initialize theme synchronously before React renders
const initializeTheme = (): Theme => {
  // Check localStorage first
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme === 'light' || savedTheme === 'dark') {
    // Apply theme to HTML immediately
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    return savedTheme;
  }
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const root = document.documentElement;
  if (prefersDark) {
    root.classList.add('dark');
    return 'dark';
  } else {
    root.classList.remove('dark');
    return 'light';
  }
};

export const useUIStore = create<UIState>((set) => ({
  theme: initializeTheme(),
  setTheme: (theme: Theme) => {
    set({ theme });
    // Apply theme to HTML immediately when state changes
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  },
}));