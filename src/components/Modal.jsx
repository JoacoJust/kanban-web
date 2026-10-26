/**
 * Modal — ventana superpuesta. (docs/SPEC.md §9)
 * Presentacional: recibe `open`, `title`, `onClose` y `children`/`footer`.
 * Sin useEffect: el cierre con ESC se maneja con onKeyDown en el overlay
 * (mantiene limpia la auditoría de AGENTS.md §11 sobre componentes).
 */
export default function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
