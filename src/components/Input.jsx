import { forwardRef } from 'react';

/**
 * Input — campo de texto con etiqueta y error. (docs/SPEC.md §9)
 * Presentacional: recibe `label`, `error` y las props que devuelve `register`
 * de React Hook Form (incluido el `ref`, por eso usa forwardRef).
 */
const Input = forwardRef(function Input({ label, error, required, ...props }, ref) {
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
      <input
        ref={ref}
        id={inputId}
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

export default Input;
