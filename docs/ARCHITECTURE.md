# Arquitectura del frontend — DevBoard

Documento de decisiones técnicas del SPA. La fuente de verdad funcional sigue
siendo [`REQUIREMENTS.md`](./REQUIREMENTS.md) y [`SPEC.md`](./SPEC.md); este
archivo explica **cómo** se implementaron.

## 1. Principios

- **Separación estricta por capas**: red → estado del servidor → estado de UI →
  presentación. Ningún componente presentacional conoce Axios ni TanStack Query.
- **Un solo camino para los datos**: todo pasa por `boardService` y por las
  query keys de TanStack Query.
- **Errores con forma única**: cualquier fallo de red se convierte en
  `ApiClientError`; el resto del código no maneja `AxiosError`.
- **Sin dependencias extra**: modales, toasts y drag & drop usan la API nativa
  (HTML5 + React) para respetar el stack fijo de `AGENTS.md`.

## 2. Capas

| Capa | Ubicación | Responsabilidad |
|---|---|---|
| HTTP | `src/api/httpClient.js` | Instancia única de Axios, `baseURL` desde `VITE_API_URL`, timeout 60 s, interceptor de errores, activación de mocks |
| Errores | `src/api/errors.js` | `ApiClientError { status, message, isNetworkError }` y `mapApiErrorToForm` |
| Servicio | `src/api/boardService.js` | Una función por endpoint; devuelve `response.data`; propaga `ApiClientError` |
| Datos/estado del servidor | `src/features/*/queries.js`, `useMoveTicket.js` | Query keys, invalidaciones y mutaciones |
| Formularios | `src/features/*/Form.jsx`, `schemas.js` | RHF + Zod, mapeo de errores del backend, estados de envío |
| Diálogos | `src/features/*/*Dialogs.jsx`, `useBoardDetail.js` | Estado de apertura/confirmación y llamadas a mutaciones |
| Presentación | `src/components` | Props y callbacks; sin `useEffect` de datos, sin red, sin `localStorage` |
| Páginas | `src/pages` | Composición de la vista, `useParams`, estados loading/error/data |
| Rutas | `src/routes/AppRoutes.jsx` | Matriz de rutas pública |

### Flujo típico

```
Componente (click) → hook de mutación (features)
  → boardService → Axios → API
  → onSuccess: invalidateQueries(['boards' | 'board', boardId])
  → TanStack Query refetch → render
```

### Query keys

| Key | Datos |
|---|---|
| `['boards']` | Lista de tableros (sin columnas, como devuelve el backend) |
| `['board', boardId]` | Tablero con columnas y tickets anidados |

## 3. Estado

| Tipo de estado | Dónde vive | Ejemplos |
|---|---|---|
| Servidor | TanStack Query | Tableros, columnas, tickets |
| UI efímera | `useState` local | Modal abierto, menú “Mover a…”, drag-over |
| Tema | `<html class="dark">` + `localStorage['devboard-theme']` | `useTheme` |
| Avisos | Contexto `ToastProvider` | Errores de mutaciones no ligadas a un formulario |

No se usa Redux ni Context para datos del servidor: TanStack Query ya es la
caché y la fuente de verdad.

## 4. Manejo de errores

1. El interceptor de respuesta:
   - con respuesta HTTP → `new ApiClientError(data.error, status, false)`;
   - sin respuesta (timeout, DNS, red) → `ApiClientError('No se pudo conectar
     con el servidor', null, true)`.
2. En formularios, `mapApiErrorToForm` asigna:
   - 400/409 cuyo mensaje contiene “título”, “nombre” o “descripción” → campo
     correspondiente con `setError`;
   - 400/409 sin coincidencia → `root.server`;
   - 404/500/red → **no** se asignan a campos; se muestran como Toast o estado
     de error de la vista.
3. El backend no envía `field`: el mapeo es por palabra clave, tal como define
   `SPEC.md` §4.

## 5. Movimiento optimista

`src/features/tickets/moveCache.js` es una función **pura**:

- recibe el tablero y `{ ticketId, fromColumnId, toColumnId }`;
- no muta el objeto original (rollback seguro);
- agrega el ticket al final de la columna destino;
- devuelve el mismo objeto si origen = destino, si el ticket no está en el
  origen o si el tablero es inválido.

`useMoveTicket`:

1. `onMutate`: cancela queries del tablero, guarda el estado previo y aplica el
   movimiento en caché.
2. `onError`: restaura el estado previo **exacto** y muestra un Toast con el
   mensaje del backend. El alcance incluye 400, 404, 500 y fallos de red
   (ampliación aprobada en `REVIEW.md`, I-1).
3. `onSettled`: invalida `['board', boardId]` para reconciliar `position`.

Soltar un ticket sobre su misma columna no llama a la API (`SPEC.md` §7.5).
No se envía `position`: lo asigna el backend.

El resto de las mutaciones es estándar (esperar éxito → invalidar).

## 6. Tema y tokens

- Todos los colores viven en `src/styles/tokens.css`; el resto de los archivos
  usa `var(--token)`. La auditoría verifica que no haya hex/`rgb()`/`hsl()`
  fuera de ese archivo.
- El script inline de `index.html` aplica `.dark` **antes** del bundle, leyendo
  `localStorage` o `prefers-color-scheme`; así no hay parpadeo (FOUC).
- `useTheme` parte de la clase ya aplicada, alterna la clase y persiste la
  elección. Si nunca hubo elección, escucha cambios del sistema.

### Contraste verificado (WCAG AA)

Fórmula de luminancia relativa WCAG 2.x; AA exige ≥ 4.5:1 para texto normal.

| Modo | Combinación | Ratio | Resultado |
|---|---|---|---|
| Claro | `--text-primary` #111827 sobre `--bg-primary` #F9FAFB | > 15:1 | AAA |
| Claro | `--text-muted` #6B7280 sobre `--bg-card` #FFFFFF | 4.83:1 | AA |
| Claro | `--accent-contrast` #FFFFFF sobre `--accent-color` #4F46E5 | 6.29:1 | AA / AAA grande |
| Claro | `--danger-contrast` #FFFFFF sobre `--danger-color` #DC2626 | 4.83:1 | AA |
| Oscuro | `--text-primary` #F8FAFC sobre `--bg-primary` #0F172A | > 15:1 | AAA |
| Oscuro | `--text-muted` #94A3B8 sobre `--bg-card` #1E293B | 5.7:1 | AA |
| Oscuro | `--accent-contrast` #0F172A sobre `--accent-color` #818CF8 | 6.11:1 | AA |
| Oscuro | `--danger-color` #F87171 sobre `--bg-card` #1E293B | 5.29:1 | AA |
| Oscuro | `--success-color` #4ADE80 sobre `--bg-card` #1E293B | 8.4:1 | AAA |

Sobre `#818CF8` el texto blanco **no** cumple AA (2.98:1); por eso el modo
oscuro usa `--accent-contrast: #0F172A`.

## 7. Accesibilidad y responsive

- Foco visible global (`:focus-visible`) y `aria-invalid`/`aria-describedby` en
  campos con error.
- Modales con `role="dialog"`, `aria-modal` y cierre con ESC o clic en el fondo.
- Menú “Mover a…” operable con teclado (botones reales) como alternativa al
  drag & drop.
- Toasts: región `aria-live="assertive"` para errores.
- `prefers-reduced-motion` reduce la animación del spinner.
- Columnas apiladas en pantallas angostas; a partir de 720 px se disponen en
  fila con scroll **interno** del tablero (nunca de la página).

## 8. Decisiones y desviaciones documentadas

| Tema | Decisión |
|---|---|
| `BoardCard.onOpen` (SPEC §9) | Se implementa como `<Link>` interno: `AGENTS.md` §7/§10.1 reserva `useNavigate` para después de mutaciones |
| Archivos CSS | Además de `tokens.css` y `global.css`, se agregan `components.css` y `pages.css` para mantener archivos cortos y cohesivos |
| `useSlowFlag` | Hook propio para mostrar “Conectando con el servidor…” solo si la carga supera 3 s (`REVIEW.md` A-5) |
| Rollback | Se revierte ante cualquier error, no solo 400/404 (`REVIEW.md` I-1, aprobado) |
| Formularios | Se montan solo al abrirse: no arrastran valores previos y evitan `useEffect` de reset |
| `position` de columnas | Se ordena defensivamente en el cliente (`REVIEW.md` I-2) porque el backend no garantiza el orden al crear tableros |

## 9. Tests

Vitest + Testing Library, entorno `jsdom`, setup en `src/test/setup.js`.
No se testean componentes presentacionales de forma aislada: se prioriza la
lógica con riesgo (mapeo de errores y rollback), según la justificación de
`AGENTS.md` §12.

## 10. Mocks

`src/mocks/mockAdapter.js` implementa un adaptador de Axios en memoria con la
misma forma de respuesta que la API real:

- IDs de 24 caracteres hexadecimales;
- errores `{ error: "mensaje" }`;
- orden por `position` (y `createdAt` como desempate);
- validaciones de movimiento (formato, existencia, pertenencia al tablero);
- 404 al mover a una columna inexistente, para poder probar el rollback sin
  backend.

Se activa **solo** con `VITE_USE_MOCKS=true` y se importa de forma perezosa
desde `httpClient.js`, por lo que el bundle de producción no lo incluye cuando
la variable está apagada.

## 11. Build y despliegue

- `vite build` → `dist/` con assets versionados.
- Render Static Site: build `npm ci && npm run build`, publish `dist`, rewrite
  `/*` → `/index.html` y `VITE_API_URL` como variable de build.
- `VITE_API_URL` se incrusta en el bundle: cambiarla exige redeploy.
- El blueprint está en `render.yaml`.

## 12. Pendientes

- Desplegar backend (Render + Atlas) y frontend, y ejecutar la verificación
  CA-18 en producción.
- Registrar ambas URLs públicas en el README raíz.
