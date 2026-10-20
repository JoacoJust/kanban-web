# Especificación Técnica — DevBoard Web

Fuente de verdad técnica del frontend. El contrato de API fue extraído del código real de `kanban-api` (Express 4 + Mongoose 8). Si el backend cambia, este documento se actualiza primero.

## 1. Arquitectura

```
Navegador (SPA React) ──Axios──▶ kanban-api (Express) ──▶ MongoDB Atlas
        │
        └─ TanStack Query (caché de servidor) · React Hook Form + Zod · CSS con tokens
```

Dos repositorios: `kanban-api` (existente) y `kanban-web` (nuevo, este).

## 2. Contrato de API (backend existente)

Base: `VITE_API_URL`. Todas las rutas cuelgan de `/api`. Sin autenticación.

### Boards
| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| POST | `/api/boards` | `{ name, description? }` | 201 tablero con `columns` (3) | 400 |
| GET | `/api/boards` | — | 200 `Board[]` (sin columnas) | — |
| GET | `/api/boards/:boardId` | — | 200 tablero con `columns[].tickets[]` ordenados por `position` | 400 id inválido, 404 |
| PATCH | `/api/boards/:boardId` | `{ name?, description? }` (≥1) | 200 tablero | 400, 404 |
| DELETE | `/api/boards/:boardId` | — | 204 (cascada) | 400, 404 |

### Columns
| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/boards/:boardId/columns` | — | 200 `Column[]` | 400, 404 |
| POST | `/api/boards/:boardId/columns` | `{ name, position? }` | 201 columna | 400, 404 |
| GET | `/api/boards/:boardId/columns/:columnId` | — | 200 | 400, 404 |
| PATCH | `/api/boards/:boardId/columns/:columnId` | `{ name?, position? }` (≥1) | 200 | 400, 404 |
| DELETE | `/api/boards/:boardId/columns/:columnId` | — | 204 (borra sus tickets) | 400, 404 |

### Tickets
| Método | Ruta | Body | Éxito | Errores |
|---|---|---|---|---|
| GET | `/api/boards/:boardId/columns/:columnId/tickets` | — | 200 `Ticket[]` | 400, 404 |
| POST | `.../tickets` | `{ title, description?, position? }` | 201 ticket | 400, 404 |
| GET | `.../tickets/:ticketId` | — | 200 | 400, 404 |
| **PATCH** | `.../tickets/:ticketId` | `{ title?, description?, position?, columnId? }` (≥1) | 200 ticket | 400, 404 |
| DELETE | `.../tickets/:ticketId` | — | 204 | 400, 404 |

Otros: `GET /health` → `{ status: "ok", timestamp }`; `GET /api` → `{ message, version }`.

### Mover un ticket
`PATCH /api/boards/:boardId/columns/:columnOrigenId/tickets/:ticketId` con `{ "columnId": "<destino>" }`.
- Sin `position`, el backend lo coloca al final de la columna destino (**el frontend no envía `position`**).
- Es **idempotente**: reenviar el mismo PATCH deja el mismo estado (si el ticket ya está en destino, responde 200).
- 400: `columnId` con formato inválido, o columna destino de otro tablero. 404: ticket o columna destino inexistentes, o ticket que no está ni en origen ni en destino.

### Errores
Siempre `{ "error": "mensaje en español" }`. **No hay campo `field`.**

| Código | Cuándo | Ejemplo de mensaje |
|---|---|---|
| 400 | Validación (mensajes unidos por coma), id inválido, JSON malformado, PATCH sin campos, columna de otro tablero | "El título del ticket es obligatorio" |
| 404 | Recurso inexistente, ruta inexistente | "Tablero no encontrado" |
| 409 | Valor duplicado (no ocurre con los modelos actuales) | "El campo X ya existe" |
| 500 | Error no controlado | "Error interno del servidor" |

> Nota: el backend **no impone títulos únicos**, por lo que "título duplicado" no existe. Los errores 400 reales de formularios son de validación (obligatorio, longitud máxima).

## 3. Modelo de datos (tal como llega al frontend)

```ts
Board  { _id, name, description?, createdAt, updatedAt, columns?: Column[] }
Column { _id, name, board, position, createdAt, updatedAt, tickets?: Ticket[] }
Ticket { _id, title, description?, column, board, position, createdAt, updatedAt }
```

Límites (se replican en Zod): `Board.name` 1–100, `Board.description` ≤500, `Column.name` 1–100, `Ticket.title` 1–200, `Ticket.description` ≤2000. Los textos se recortan (`trim`) antes de validar.

## 4. Capa de servicio (`src/api`)

- `httpClient.js`: instancia de Axios con `baseURL = import.meta.env.VITE_API_URL`, `timeout` de 60 s (arranque en frío del hosting) y un interceptor que convierte cualquier fallo en `ApiClientError { status, message, isNetworkError }`. Si no hay respuesta, `message` = "No se pudo conectar con el servidor".
- `errors.js`: `ApiClientError` y `mapApiErrorToForm(error, setError)`:
  - 400/409 con mensaje que contenga "título" → campo `title`; "nombre" → `name`; "descripción" → `description`.
  - Sin coincidencia → error general del formulario (`root.server`).
  - 404/500/red → no se asigna a campos; se muestra Toast o estado de error.
- `boardService.js` (todas devuelven `response.data`, propagan `ApiClientError`):
  - Tableros: `getBoards()`, `getBoardById(id)`, `createBoard(data)`, `updateBoard(id, data)`, `deleteBoard(id)`
  - Columnas: `createColumn(boardId, data)`, `updateColumn(boardId, columnId, data)`, `deleteColumn(boardId, columnId)`
  - Tickets: `createTicket(boardId, columnId, data)`, `updateTicket(boardId, columnId, ticketId, data)`, `moveTicket(boardId, fromColumnId, ticketId, toColumnId)`, `deleteTicket(boardId, columnId, ticketId)`

## 5. Rutas del frontend

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | `<Navigate to="/boards" replace />` | Público | Redirección |
| `/boards` | `BoardsListPage` | Público | Lista de tableros; crear tablero |
| `/boards/:boardId` | `BoardDetailPage` | Público | Kanban; usa `useParams`, estados `loading`/`error`/`data` |
| `*` | `NotFoundPage` | Público | 404 del frontend |

Navegación: `useNavigate` solo tras mutación exitosa (crear tablero → `/boards/:id`; eliminar tablero desde el detalle → `/boards`). `<Link>` solo para navegar (volver a la lista, abrir un tablero).

## 6. Estado del servidor (TanStack Query)

| Query key | Dato |
|---|---|
| `['boards']` | Lista de tableros |
| `['board', boardId]` | Tablero con columnas y tickets anidados |

Hooks en `src/features/*`: `useBoardsQuery`, `useBoardQuery`, `useCreateBoard`, `useUpdateBoard`, `useDeleteBoard`, `useCreateColumn`, `useUpdateColumn`, `useDeleteColumn`, `useCreateTicket`, `useUpdateTicket`, `useDeleteTicket`, `useMoveTicket`. Las mutaciones estándar invalidan `['board', boardId]` (o `['boards']`) en `onSuccess`. `retry` de queries: 1; de mutaciones: 0.

## 7. Optimistic UI — mover ticket (`useMoveTicket`)

1. `onMutate({ ticketId, fromColumnId, toColumnId })`: `cancelQueries(['board', boardId])`; guardar `previous = getQueryData(...)`; con `setQueryData`, quitar el ticket de la columna origen y agregarlo **al final** de la destino (con `column` actualizado). Si origen = destino, no hacer nada.
2. `mutationFn`: `boardService.moveTicket(...)`.
3. `onError`: `setQueryData(['board', boardId], previous)` (rollback a la columna original) + `Toast` de error con `error.message`. Aplica a 400, 404, 500 y red.
4. `onSettled`: `invalidateQueries(['board', boardId])` para reconciliar con el servidor (incluye `position` real).
5. Al soltar un ticket sobre su misma columna, no se llama a la API.

Pruebas obligatorias (Vitest): el rollback restaura el estado exacto previo; la función pura que mueve el ticket en la caché no muta el original.

## 8. Mocks y entorno

- `src/mocks/mockData.js`: 2 tableros de ejemplo con la forma de §3 (IDs de 24 hex, 3 columnas, varios tickets, incluyendo una columna vacía y un tablero sin tickets).
- `VITE_USE_MOCKS=true`: `httpClient` usa un adaptador de Axios en memoria que responde según §2 (incluye simular un 404 al mover a una columna inexistente, para probar el rollback).
- `.env.example`:
  ```
  VITE_API_URL=http://localhost:3000
  VITE_USE_MOCKS=false
  ```

## 9. Inventario de componentes

**Presentacionales (`src/components`)**
| Componente | Props principales |
|---|---|
| `Button` | `variant`, `loading`, `disabled`, `onClick`, `children` (muestra `Spinner` si `loading`) |
| `Input` / `Textarea` | `label`, `error`, props de `register` |
| `Modal`, `ConfirmDialog` | `open`, `title`, `onClose`, `onConfirm`, `loading`, `children` |
| `Spinner` | `size` |
| `Toast` (vista) | `toasts`, `onDismiss` |
| `ThemeToggle` | `theme`, `onToggle` |
| `BoardCard` | `board`, `onOpen`, `onEdit`, `onDelete` |
| `ColumnCard` | `column`, `children`, `onRename`, `onDelete`, `onAddTicket`, `onDropTicket` |
| `TicketCard` | `ticket { title, description }`, `columns` (destinos para "Mover a…"), `onEdit`, `onDelete`, `onMove(columnId)`, `isBusy` — **sin `useEffect` ni API** |

**Contenedores (`src/features`, `src/pages`)**: formularios de tablero/columna/ticket (React Hook Form + Zod), `BoardsListPage`, `BoardDetailPage`, `NotFoundPage`, `ToastProvider` + `useToast`.

Drag & drop con la API nativa de HTML5 (`draggable`, `onDragStart`, `onDragOver`, `onDrop`) y como alternativa accesible el menú "Mover a…" en cada tarjeta.

## 10. Tema (tokens)

`src/styles/tokens.css`: `:root { ... }` (claro) y `:root.dark { ... }` (oscuro) con los tokens de `AGENTS.md` §8. El resto de los estilos usa solo `var(--token)`.

Script inline en `<head>` de `index.html` (antes del bundle):
```js
(function () {
  try {
    var saved = localStorage.getItem('devboard-theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
```
`useTheme`: lee el estado inicial desde la clase de `<html>`, `toggle()` alterna la clase y guarda en `localStorage`; si no hay elección guardada, sigue los cambios del sistema.

## 11. Despliegue

- **Backend:** Render (Web Service) + MongoDB Atlas M0, según el README de `kanban-api`. Variables: `MONGODB_URI`. Verificar `GET /health`.
- **Frontend:** Render Static Site (o Vercel/Netlify). Build `npm run build`, publicar `dist`. Variable de build `VITE_API_URL` = URL pública del backend. Regla de reescritura `/*` → `/index.html` (necesaria para React Router).
- CORS: el backend actual usa `cors()` abierto, suficiente para esta entrega. Mejora opcional (requiere aprobación): `CORS_ORIGIN` configurable en `kanban-api`.
- Verificación en producción: ver CA-18. Registrar las URLs públicas en el README raíz.
