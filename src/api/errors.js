/**
 * ApiClientError — única forma de error que escapa de la capa de servicio.
 * (docs/SPEC.md §4)
 *
 * @property {number|null} status - HTTP de la respuesta (null si no hubo respuesta)
 * @property {string} message     - Mensaje legible en español
 * @property {boolean} isNetworkError - true si no hubo respuesta (red caída, timeout, DNS)
 */
export class ApiClientError extends Error {
  constructor(message, status = null, isNetworkError = false) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.isNetworkError = isNetworkError;
  }
}

/**
 * Reglas de mapeo de errores del backend a campos del formulario.
 * El backend NO envía campo `field` (AGENTS.md §1): se asigna por palabra clave
 * en el mensaje, en el mismo orden de prioridad definido en SPEC.md §4.
 */
const FIELD_RULES = [
  { field: 'title', pattern: /t[ií]tulo/i },
  { field: 'name', pattern: /nombre/i },
  { field: 'description', pattern: /descripci[oó]n/i },
];

/**
 * ¿Es un ApiClientError?
 * @param {unknown} error
 * @returns {boolean}
 */
export function isApiClientError(error) {
  return error instanceof ApiClientError;
}

/**
 * Mapea un error del backend a un error de formulario de React Hook Form.
 * (docs/SPEC.md §4 — mapApiErrorToForm)
 *
 * - 400/409 con mensaje que contenga "título"/"nombre"/"descripción" → setError de ese campo.
 * - 400/409 sin coincidencia → error general del formulario (`root.server`).
 * - 404/500/red → NO se asigna a campos (se muestra Toast o estado de error); devuelve false.
 *
 * @param {ApiClientError} error
 * @param {Function} setError - setError de React Hook Form
 * @returns {boolean} true si el error se asignó al formulario
 */
export function mapApiErrorToForm(error, setError) {
  if (!(error instanceof ApiClientError)) return false;
  if (error.status !== 400 && error.status !== 409) return false;

  const rule = FIELD_RULES.find((r) => r.pattern.test(error.message));
  if (rule) {
    setError(rule.field, { type: 'server', message: error.message });
  } else {
    setError('root.server', { type: 'server', message: error.message });
  }
  return true;
}
