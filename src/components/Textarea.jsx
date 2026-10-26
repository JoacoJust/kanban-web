import { forwardRef } from 'react';

/**
 * Textarea — área de texto multilinea con etiqueta y error. (docs/SPEC.md §9)
 * Presentacional; misma convención que Input (forwardRef para `register`).
 */
const Textarea = forwardRef(function Textarea(
  { label, error, rows = 4, required, ...props },
  ref
) {
  const inputId = props.name ? `field-${props.name}` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`field${error ? ' field--error' : ''}`}>
      <label className="field__label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="field__required" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className="field__input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId}
        {...props}
      />
      {error && (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
});

export default Textarea;
