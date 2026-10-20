import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'devboard-theme'; // AGENTS.md §8

/**
 * useTheme — lógica del modo claro/oscuro. (AGENTS.md §8, SPEC.md §10)
 * El estado inicial se lee de la clase .dark que aplicó el script inline de
 * index.html (por eso no hay parpadeo al cargar).
 */
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  );

  // Si el usuario nunca eligió tema, seguimos los cambios del sistema.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(event) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return; // hay elección explícita: no tocamos nada
      const next = event.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      setTheme(next);
    }
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
