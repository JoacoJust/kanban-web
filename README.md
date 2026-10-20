# DevBoard — Kanban Web

SPA en **React 18 + Vite** que consume la API Kanban existente
[`kanban-api`](https://github.com/JoacoJust/kanban-api).
Tableros, columnas y tickets con movimiento optimista, modo claro/oscuro y
estética **Minimalismo Developer** (IDE/Terminal).

> **Estado:** Fases 1 a 5 implementadas y verificadas en local. La Fase 6
> (documentación) está completa; el **despliegue público queda pendiente** de
> credenciales de Render y MongoDB Atlas (ver [Despliegue](#despliegue)).

## Documentación

| Documento | Contenido |
|---|---|
| [`AGENTS.md`](./AGENTS.md) | Instrucciones obligatorias: stack fijo, estructura, límites negativos, auditoría |
| [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) | Alcance, historias de usuario, RF/RNF y criterios CA-01 a CA-18 |
| [`docs/SPEC.md`](./docs/SPEC.md) | Contrato de API, modelo de datos, capas, tema y despliegue |
| [`docs/REVIEW.md`](./docs/REVIEW.md) | Revisión del contrato contra el backend real y resoluciones aprobadas |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Arquitectura del frontend: capas, estado, theming, tests y despliegue |
| [`docs/BACKEND_README_PROPOSAL.md`](./docs/BACKEND_README_PROPOSAL.md) | Propuesta de sección de arquitectura para el README del backend (para aprobar) |

## URLs públicas

| Servicio | URL | Estado |
|---|---|---|
| Backend (`kanban-api`) | _pendiente_ | Requiere MongoDB Atlas + Render (Fase 6) |
| Frontend (DevBoard) | _pendiente_ | Requiere Render Static Site + URL del backend |

Al desplegar, reemplazar los _pendientes_ por las URLs reales (CA-18).

## Requisitos

- Node.js 20 o superior (probado con Node 24).
- npm 10 o superior.
- Opcional: una instancia de `kanban-api` en marcha.

## Puesta en marcha

```powershell
npm install
Copy-Item .env.example .env    # editar VITE_API_URL
npm run dev                    # http://localhost:5173
```

`.env` (nunca se versiona):

```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCKS=false
```

### Sin backend (mocks en memoria)

`VITE_USE_MOCKS=true` activa el adaptador de Axios basado en
`src/mocks/mockData.js`, que replica el contrato real (incluido el 404 al mover
a una columna inexistente). Sirve para revisar la UI y el rollback sin MongoDB.

```powershell
$env:VITE_USE_MOCKS = 'true'
npm run dev
```

o en `.env.local` (ignorado por git):

```env
VITE_API_URL=http://localhost:3000
VITE_USE_MOCKS=true
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm test` | Ejecuta Vitest una vez (20 tests) |
| `npm run test:watch` | Vitest en modo watch |

## Stack

JavaScript (ESM, sin TypeScript) · React 18 · Vite 5 · React Router 6 ·
TanStack Query 5 · Axios 1 · React Hook Form 7 + Zod 3 · CSS propio con tokens ·
Vitest + Testing Library (solo desarrollo).

Detalle de cada decisión en [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Estructura

```
src/
├── api/          # httpClient, errors (ApiClientError, mapApiErrorToForm), boardService
├── components/   # Presentacionales: Button, Input, Modal, TicketCard, ...
├── features/     # boards/, columns/, tickets/, toast/: hooks de datos, formularios, diálogos
├── hooks/        # useTheme, useToast, useSlowFlag
├── pages/        # BoardsListPage, BoardDetailPage, NotFoundPage
├── routes/       # AppRoutes
├── mocks/        # mockData.js y mockAdapter.js
└── styles/       # tokens.css (único con colores hex), global.css, components.css, pages.css
```

## Rutas

| Ruta | Vista |
|---|---|
| `/` | Redirige a `/boards` |
| `/boards` | Lista de tableros |
| `/boards/:boardId` | Vista Kanban (columnas con tickets) |
| `*` | Página no encontrada |

## Funcionalidad

- CRUD de tableros, columnas y tickets.
- Confirmación al eliminar tableros y columnas: al borrar una columna se indica
  cuántos tickets se pierden.
- Mover tickets con **drag & drop** nativo o con el menú **“Mover a…”**
  (accesible con teclado).
- Movimiento **optimista** con rollback exacto ante 400/404/500/red y Toast con
  el motivo del backend.
- Errores 400/409 del backend dentro del formulario (campo o error general).
- Botones con spinner y deshabilitados durante POST/PATCH/DELETE.
- Tema claro/oscuro persistido en `localStorage`, sin parpadeo al cargar.

## Tests

```powershell
npm test
```

Cubren:

| Archivo | Qué verifica |
|---|---|
| `src/api/__tests__/errors.test.js` | Mapeo de 400/409 a `title`/`name`/`description`/`root.server`; 404/500/red no se asignan a campos |
| `src/features/tickets/__tests__/moveCache.test.js` | Función pura de movimiento: no muta el estado original, agrega al final, casos no-op |
| `src/features/tickets/__tests__/useMoveTicket.test.jsx` | Movimiento optimista y rollback exacto ante 404, 400 y fallo de red, con Toast |

## Audit

Fronteras auditadas al cierre de cada fase (AGENTS §11), sin violaciones:

1. Sin colores hex/`rgb()`/`hsl()` fuera de `src/styles/tokens.css`.
2. Sin `axios`/`fetch`/`useEffect`/TanStack Query en `src/components`.
3. Sin URLs hardcodeadas (única excepción: `xmlns` de los SVG).
4. `<Link>` solo para navegar; ninguna mutación disparada por un enlace.
5. `import.meta.env` solo en `src/api/httpClient.js`.

## Despliegue

### 1. Backend — Render Web Service + MongoDB Atlas

Seguir el README de [`kanban-api`](https://github.com/JoacoJust/kanban-api).
Resumen:

1. Crear un cluster gratuito **M0** en MongoDB Atlas y un usuario de base de
   datos; permitir el acceso desde Render (`0.0.0.0/0` en el entorno académico).
2. Crear un **Web Service** en Render apuntando al repo del backend.
   Build: `npm install`; Start: `npm start`.
3. Variable de entorno `MONGODB_URI` con la cadena de conexión de Atlas.
4. Verificar `GET /health` y la URL pública (por ejemplo,
   `https://kanban-api-xxxx.onrender.com`).

### 2. Frontend — Render Static Site

Opción A — Blueprint: [`render.yaml`](./render.yaml) define el sitio estático,
el comando de build y la regla de reescritura.

Opción B — Manual, en el dashboard de Render:

| Campo | Valor |
|---|---|
| Tipo | **Static Site** |
| Repositorio | `JoacoJust/kanban-web`, rama `main` |
| Build command | `npm ci && npm run build` |
| Publish directory | `dist` |
| Variable de entorno | `VITE_API_URL = https://<backend>.onrender.com` |
| Rewrite | `/*` → `/index.html` (necesaria para React Router) |

`VITE_API_URL` se incrusta en el build: **volver a desplegar** si cambia.

### 3. Verificación en producción (CA-18)

Con ambas URLs publicadas y registradas en la tabla de arriba:

1. Abrir `/boards`, crear un tablero y comprobar las 3 columnas.
2. Crear un ticket, moverlo con drag & drop y con “Mover a…”.
3. Recargar: el ticket permanece en la columna destino.
4. Cambiar el tema, recargar y confirmar que se mantiene sin parpadeo.
5. Abrir una URL inexistente (`/boards/000000000000000000000000`): debe verse
   “Tablero no encontrado” con enlace a la lista.

## Criterios de aceptación

Implementados CA-01 a CA-17 (CA-16 requiere una pasada visual final en un
dispositivo real). **CA-18 queda pendiente** hasta publicar frontend y backend
(requiere credenciales de Render y Atlas).

| Criterio | Estado |
|---|---|
| CA-01 Lista / vacío con “Crear tablero” | Implementado y verificado en local (mocks) |
| CA-02 Crear tablero → 3 columnas | Implementado (mutación + navegación) |
| CA-03 Error de nombre vacío en el formulario | Verificado en local (mocks) |
| CA-04 Eliminar tablero con confirmación | Implementado y verificado en código |
| CA-05 Tablero inexistente → mensaje + enlace | Implementado (`error.message` + enlace) |
| CA-06 Ticket sin título no se envía | Implementado (Zod + backend) |
| CA-07 Ticket nuevo aparece al final | Implementado (invalidación de caché) |
| CA-08 Drag & drop → persiste al recargar | Drag & drop implementado; menú verificado en navegador |
| CA-09 Mover con menú | Verificado en navegador (mocks) |
| CA-10 Rechazo 400/404 → rollback + Toast | Verificado con tests automatizados (404, 400, red) |
| CA-11 Spinner y botón deshabilitado | Implementado (`isSubmitting`) |
| CA-12 Confirmación indica tickets perdidos | Implementado |
| CA-13 Tema del sistema en la primera carga | Verificado en navegador (`.dark` inicial) |
| CA-14 Tema persistente sin parpadeo | Script inline + `localStorage` (SPEC §10) |
| CA-15 Contraste AA en ambos modos | Tokens calculados y documentados (ver ARCHITECTURE) |
| CA-16 Usable a 360 px sin scroll horizontal | Media queries en `pages.css`; verificación manual pendiente |
| CA-17 Auditoría de límites negativos limpia | Verificado en las 3 auditorías ejecutadas |
| CA-18 Flujo completo en producción | **Pendiente de despliegue** |

## Licencia

Proyecto académico (ITBA).
