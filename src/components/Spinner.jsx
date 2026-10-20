/**
 * Spinner — indicador visual de carga. (docs/SPEC.md §9)
 * Presentacional: recibe props y renderiza. Sin estado de datos.
 */
export default function Spinner({ size = 'md', label }) {
  const sizeClass = {
    sm: 'spinner--sm',
    md: 'spinner--md',
    lg: 'spinner--lg',
  }[size];

  return (
    <span className="spinner-block" role="status" aria-live="polite">
      <span className={`spinner ${sizeClass}`} aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}
