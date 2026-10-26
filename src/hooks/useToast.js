import { useContext } from 'react';
import { ToastContext } from '../features/toast/ToastProvider.jsx';

/**
 * useToast — hook consumidor del contexto de avisos. (SPEC.md §9)
 * Uso: const { showToast } = useToast(); showToast('mensaje', 'error'|'success');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return context;
}
