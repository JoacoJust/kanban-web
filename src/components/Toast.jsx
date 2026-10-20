/**
 * Toast (vista) — lista de avisos flotantes. (docs/SPEC.md §9)
 * Presentacional: recibe `toasts` y `onDismiss`; la lógica vive en
 * ToastProvider + useToast (contenedores, Fase 3).
 * Los errores usan aria-live="assertive" (RNF-02).
 */
export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-viewport">
      <div aria-live="assertive" className="sr-only">
        {toasts
          .filter((t) => t.type === 'error')
          .map((t) => (
            <span key={t.id}>{t.message}</span>
          ))}
      </div>
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.type}`}>
          <span className="toast__message">{toast.message}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
