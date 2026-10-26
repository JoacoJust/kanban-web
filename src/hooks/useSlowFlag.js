import { useEffect, useState } from 'react';

/**
 * useSlowFlag — devuelve true luego de `ms` milisegundos.
 * Lo usan los estados de carga para mostrar "Conectando con el servidor…"
 * sólo cuando la petición se demora (REQUIREMENTS §8, REVIEW.md A-5).
 */
export default function useSlowFlag(ms = 3000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);

  return slow;
}
