import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import Toast from '../../components/Toast.jsx';

/** Contexto de avisos (contenedor). SPEC.md §9. */
export const ToastContext = createContext(null);

// REVIEW.md G-2 (aprobado): auto-cierre a los 5 s + botón de cierre manual.
const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'error') => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast, dismiss }), [showToast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
