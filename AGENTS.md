# AGENTS.md — DevBoard Web (Frontend)

> **Instrucción obligatoria para cualquier agente de IA:** leé este archivo, `docs/REQUIREMENTS.md` y `docs/SPEC.md` completos **antes de cada tarea** y no los contradigas. Si algo es ambiguo o choca con lo pedido, frená y preguntá. No implementes nada fuera del alcance.

## 1. Contexto

DevBoard es el frontend (SPA) de una API Kanban ya existente y desplegable: repositorio `kanban-api` (Node + Express + MongoDB/Mongoose).

Jerarquía del dominio: **Board (tablero) → Column (columna) → Ticket**. Cada tablero nace con 3 columnas: "Qué hacer", "Haciendo", "Hecho".

Hechos del backend que condicionan este proyecto (ver `docs/SPEC.md`):
- **NO hay autenticación ni usuarios.** No existe login, token ni rutas protegidas.
- Los IDs son `_id` (ObjectId de 24 caracteres hexadecimales).
- Todo error responde `{ "error": "mensaje en español" }` (sin campo `field`).
- Los tickets tienen `title`, `description`, `column`, `board`, `position`. **No existe `priority`.**
- Mover un ticket: `PATCH /api/boards/:boardId/columns/:columnId/tickets/:ticketId` con body `{ "columnId": "<destino>" }`. Es idempotente.

## 2. Stack fijo

| Área | Tecnología | Versión |
|---|---|---|
| Lenguaje | JavaScript (ESM), sin TypeScript | — |
| UI | React | 18.x |
| Build | Vite | 5.x |
| Rutas | React Router DOM | 6.x |
| Datos del servidor | TanStack Query | 5.x |
| HTTP | Axios | 1.x |
| Formularios | React Hook Form + `@hookform/resolvers` | 7.x |
| Validación | Zod | 3.x |
| Estilos | **CSS propio** con variables CSS (sin Tailwind ni Bootstrap) | — |
| Tests (solo dev) | Vitest + Testing Library | última estable |

Librerías extra **prohibidas** salvo que se agreguen a la tabla de la sección 12 con justificación. Toasts, modal y drag & drop se implementan sin librerías (API nativa de HTML5).

## 3. Estructura de directorios obligatoria

```
src/
├── api/          # Funciones aisladas de llamada al backend (httpClient, boardService, errors)
├── components/   # UI reutilizable y PRESENTACIONAL (Button, Input, Modal, Spinner, Toast, ThemeToggle, TicketCard, ColumnCard, BoardCard)
├── features/     # Módulos por dominio: boards/, columns/, tickets/ (hooks de TanStack Query, formularios contenedores, schemas Zod)
├── hooks/        # Hooks reutilizables (useTheme, useToast)
├── pages/        # Vistas asociadas a rutas (BoardsListPage, BoardDetailPage, NotFoundPage)
├── routes/       # Configuración de React Router
├── mocks/        # mockData.js (datos sintéticos con la forma real de la API)
└── styles/       # tokens.css (ÚNICO lugar con colores hex) y global.css
```

## 4. Patrón de componentes

- **Presentacionales** (`src/components`): reciben props y renderizan. Sin `useEffect` de datos, sin Axios, sin TanStack Query, sin acceso a `localStorage`. Comunican acciones solo con callbacks (`onDelete`, `onEdit`, `onMove`).
- **Contenedores / Páginas** (`src/pages`, `src/features`): manejan estado, llamadas a la API y mutaciones, y pasan datos a los presentacionales.
- Un componente que supere ~150 líneas se divide.

## 5. Rutas (sin autenticación)

| Ruta | Componente | Acceso | Descripción |
|---|---|---|---|
| `/` | — | Público | Redirige a `/boards` |
| `/boards` | `BoardsListPage` | Público | Lista de tableros |
| `/boards/:boardId` | `BoardDetailPage` | Público | Vista Kanban: columnas con sus tickets anidados |
| `*` | `NotFoundPage` | Público | Ruta inexistente |

## 6. Formularios y UX

- Todo formulario usa **React Hook Form + Zod**. Los límites de Zod replican los del backend (ver `docs/SPEC.md` §3).
- Los errores del backend (400/409) se muestran **dentro del formulario**, sin recargar: si el mensaje permite identificar el campo (título, nombre, descripción) se asigna a ese input con `setError`; si no, se muestra como error general del formulario.
- Todo formulario o acción que haga POST, PATCH o DELETE: botón con `disabled={isSubmitting}` (o `isPending`) y **spinner** mientras dura la petición.
- Los textos de la interfaz están en español.

## 7. Mutaciones y Optimistic UI

- **Optimista solo al mover un ticket** entre columnas: actualizar la caché al instante; si el backend responde 400 o 404, **revertir** el ticket a su columna original y mostrar un **Toast** con el error.
- El resto de las mutaciones (crear, editar, eliminar) son **estándar**: se espera la respuesta exitosa, luego se invalida la caché.
- Navegación programática (`useNavigate`) solo **después** de una mutación exitosa.

## 8. Tema claro / oscuro (obligatorio)

- Estilo elegido: **Minimalismo Developer (IDE/Terminal)**.
- Todos los colores salen de variables CSS definidas en `src/styles/tokens.css`. Tokens mínimos: `--bg-primary`, `--bg-card`, `--text-primary`, `--text-muted`, `--accent-color`, `--accent-contrast`, `--border-color`, `--danger-color`.

| Token | Claro | Oscuro (`.dark`) |
|---|---|---|
| `--bg-primary` | `#F9FAFB` | `#0F172A` |
| `--bg-card` | `#FFFFFF` | `#1E293B` |
| `--text-primary` | `#111827` | `#F8FAFC` |
| `--accent-color` | `#4F46E5` | `#818CF8` |

- Los demás tokens (borde, texto atenuado, peligro, contraste de acento) los define el agente, verificando contraste **WCAG AA** en ambos modos. Atención: sobre `#818CF8` el texto blanco NO cumple AA; usar `--accent-contrast` oscuro en modo oscuro.
- Primer ingreso: respetar `@media (prefers-color-scheme: dark)`.
- El interruptor agrega/quita la clase `.dark` en `<html>` y guarda la elección en `localStorage` (clave `devboard-theme`).
- Un **script inline en `index.html`**, antes del render, aplica el tema guardado para evitar el parpadeo (FOUC).

## 9. Variables de entorno

- `VITE_API_URL`: URL base del backend (sin `/` final). **Único lugar** donde aparece la URL de la API; se lee solo en `src/api/httpClient.js`.
- `VITE_USE_MOCKS` (opcional): `true` usa el adaptador en memoria basado en `mockData.js`.
- Mantener `.env.example`. Nunca subir `.env`.

## 10. LÍMITES NEGATIVOS (prohibido)

1. ❌ **NO** usar `<Link>` ni `<a>` para acciones de mutación (crear, editar, borrar, mover). `<Link>` solo para navegar.
2. ❌ **NO** poner `useEffect`, `fetch`, Axios ni TanStack Query dentro de componentes presentacionales.
3. ❌ **NO** mezclar lógica de red con JSX en componentes gigantes.
4. ❌ **NO** escribir colores hexadecimales (ni `rgb()`/`hsl()`) fuera de `src/styles/tokens.css`.
5. ❌ **NO** hardcodear URLs de la API ni `localhost`; solo `import.meta.env.VITE_API_URL`.
6. ❌ **NO** implementar login, tokens, usuarios ni rutas protegidas (el backend no los tiene).
7. ❌ **NO** inventar campos que el backend no devuelve (ej. `priority`).
8. ❌ **NO** enviar `position` al mover un ticket (el backend lo asigna al final).
9. ❌ **NO** subir `.env`, secretos ni credenciales.
10. ❌ **NO** agregar librerías fuera del stack sin justificarlas en la sección 12.
11. ❌ **NO** implementar funcionalidades fuera de `docs/REQUIREMENTS.md`.
12. ❌ **NO** avanzar de fase sin cumplir los criterios de aceptación de la anterior.
13. ❌ **NO** modificar el repositorio del backend sin aprobación explícita.

## 11. Método de trabajo por fases

Contratos primero, luego una fase a la vez; al terminar cada una, **detenerse y esperar "validado"**. Un commit (o PR) por fase.

1. **Servicio API**: `src/api/boardService.js` + `httpClient.js` + `errors.js` (Axios, manejo de errores, propagación de excepciones). Solo eso.
2. **Componentes atómicos**: biblioteca de componentes tontos + `tokens.css` + `ThemeToggle`. Sin API.
3. **Vistas y rutas**: páginas, formularios, rutas, estados `loading` / `error` / `data`.
4. **Optimistic UI**: mover tickets (drag & drop + menú "Mover a…") con rollback y Toast.
5. **Pulido**: tema, accesibilidad (AA), responsive, estados vacíos.
6. **Despliegue y documentación**.

Conventional Commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`.

### Auditoría de límites negativos (correr antes de cerrar cada fase)

```bash
# 4. Colores fuera de tokens
grep -rEn "#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(" src index.html | grep -v "src/styles/tokens.css"
# 2. Red/efectos en presentacionales
grep -rEn "axios|fetch\(|useEffect|useQuery|useMutation" src/components
# 5. URLs hardcodeadas (revisar excepciones como xmlns de SVG)
grep -rEn "https?://|localhost" src | grep -v "src/mocks"
# 1. Links: revisar que ninguno dispare una mutación
grep -rn "<Link" src
# Variable de entorno solo en httpClient
grep -rn "import.meta.env" src
```

Reportar el resultado de cada comando en el PR.

## 12. Librerías justificadas fuera del núcleo

| Librería | Justificación |
|---|---|
| Vitest + Testing Library (devDependencies) | Probar mapeo de errores del backend, rollback de la mutación optimista y componentes tontos |

## 13. Entregables

`README.md` raíz, `docs/REQUIREMENTS.md`, `docs/SPEC.md`, `docs/REVIEW.md`, `.env.example`, y un README de arquitectura del frontend (decisiones, librerías, theming, estado, despliegue).
