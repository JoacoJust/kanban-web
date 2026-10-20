import axios from 'axios';
import { ApiClientError } from './errors.js';

/**
 * Instancia única de Axios. (docs/SPEC.md §4)
 *
 * AGENTS.md §10.5: ÚNICO lugar del proyecto donde aparece la URL de la API.
 * Se lee exclusivamente de import.meta.env.VITE_API_URL.
 */
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // 60 s: el hosting gratuito puede "despertar" en frío (SPEC.md §4, REQUIREMENTS §8)
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// SPEC.md §8: VITE_USE_MOCKS=true usa el adaptador en memoria basado en mockData.js.
// Se importa en forma perezosa para no cargar los mocks en el flujo normal.
if (import.meta.env.VITE_USE_MOCKS === 'true') {
  httpClient.defaults.adapter = (config) =>
    import('../mocks/mockAdapter.js').then((m) => m.mockAdapter(config));
}

/**
 * Interceptor: cualquier fallo se convierte en ApiClientError.
 * - Con respuesta HTTP: message = data.error del backend ("{ error: '...' }").
 * - Sin respuesta (red caída / timeout): message = "No se pudo conectar con el servidor".
 */
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message =
        data && typeof data.error === 'string' && data.error.length > 0
          ? data.error
          : 'Error inesperado del servidor';
      return Promise.reject(new ApiClientError(message, status, false));
    }
    return Promise.reject(
      new ApiClientError('No se pudo conectar con el servidor', null, true)
    );
  }
);

export default httpClient;
