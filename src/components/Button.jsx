import Spinner from './Spinner.jsx';

/**
 * Button — botón reutilizable. (docs/SPEC.md §9)
 * Presentacional: `loading` muestra un Spinner y deshabilita el botón
 * (REQUIREMENTS RF-15 / CA-11: no se puede enviar dos veces).
 * `size="icon"` aplica el padding compacto para botones de un solo glifo.
 */
export default function Button({
  variant = 'secondary',
  loading = false,
  disabled = false,
  type = 'button',
  iconOnly = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant}${iconOnly ? ' btn--icon' : ''}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
