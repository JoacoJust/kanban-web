# REVIEW.md — Revisión de especificaciones (Fase 0)

> Rol: agente **REVISOR** (segundo agente). Este documento compara `AGENTS.md`, `docs/REQUIREMENTS.md` y `docs/SPEC.md` contra el **código real del backend** `kanban-api` y entre sí. No se escribió código de la aplicación.

## 1. Alcance de la revisión

- **Documentos leídos completos:** `AGENTS.md`, `docs/REQUIREMENTS.md`, `docs/SPEC.md`.
- **Código del backend revisado (fuente de verdad):** `kanban-api` — local en `kanban-api-main/` y remoto en <https://github.com/JoacoJust/kanban-api> (verificado: el código local coincide en estructura y contenido con el repositorio publicado).
  Archivos auditados: `src/app.js`, `src/server.js`, `src/routes/*` (3), `src/controllers/*` (3), `src/models/*` (3), `src/middlewares/*` (4), `src/errors/ApiError.js`, `src/services/entityManager.js`, `src/config/db.js`, `package.json`, `README.md`.
- **Método:** lectura estática de todo el código del backend (no hay tests automatizados en el backend; la colección Postman documenta los mismos caminos).

## 2. Veredicto general

✅ **El contrato de `docs/SPEC.md` §2 es correcto.** Las 15 rutas, los códigos de éxito, el formato `{ "error": "mensaje" }`, el modelo de datos de §3 y los límites de §3 coinciden exactamente con el código real. **No se encontró ningún error factual en los documentos que requiera corregir el texto fuente** (por eso no se modificó ninguno de los 3 documentos; se copiaron byte a byte idénticos).

Las secciones siguientes detallan la verificación, las inconsistencias entre documentos (resueltas con criterio), las ambigüedades y las preguntas que requieren decisión humana antes de implementar.

## 3. Verificación del contrato (SPEC §2 vs código real)

### 3.1 Boards — ✅ todo coincide

| Afirmación SPEC | Código real | Resultado |
|---|---|---|
| POST `/api/boards` → 201 con `columns` (3) | `boardController.createBoard`: crea tablero + `insertMany` de `DEFAULT_COLUMNS` ("Qué hacer", "Haciendo", "Hecho") + `populate('columns')` | ✅ |
| POST `/api/boards` sin `name` → 400 | `Board.name` required con mensaje en español → `errorHandler` (ValidationError) → 400 con mensajes unidos por `,` | ✅ |
| GET `/api/boards` → 200 `Board[]` (sin columnas) | `getBoards` con `.sort({ createdAt: -1 })`; el virtual `columns` **no** se serializa (no hay `virtuals: true`) → RF-01 "del más nuevo al más antiguo" se cumple en el backend | ✅ |
| GET `/api/boards/:boardId` → 200 con `columns[].tickets[]` ordenados por `position` | `getBoard` con populate anidado y `options: { sort: { position: 1, createdAt: 1 } }` en ambos niveles | ✅ |
| GET con id inválido → 400; inexistente → 404 | `validateObjectId` (regex 24 hex) → 400 `El parámetro boardId tiene un formato inválido`; `loadBoard` → 404 `Tablero no encontrado` | ✅ |
| PATCH con body sin campos útiles → 400 | `updateBoard`: `pick(['name','description'])` y si queda vacío → 400 `Debe proporcionar al menos un campo para actualizar` | ✅ |
| DELETE → 204 en cascada | `board.deleteOne()` dispara hook `pre('deleteOne')` que borra columnas una a una y tickets huérfanos | ✅ |

### 3.2 Columns — ✅ todo coincide

| Afirmación SPEC | Código real | Resultado |
|---|---|---|
| POST `{ name, position? }` → 201; sin `position` va al final | `createColumn`: si falta `position`, `nextPosition` (= `countDocuments` del tablero) | ✅ |
| GET lista → 200; 400/404 | `getColumns` ordena `{ position: 1, createdAt: 1 }`; errores vía `loadBoard`/`validateObjectId` | ✅ |
| PATCH `{ name?, position? }` (≥1) → 200 | `updateColumn` con `pick` + chequeo de vacío → 400 | ✅ |
| DELETE → 204 borrando sus tickets | `column.deleteOne()` → hook `pre('deleteOne')` → `Ticket.deleteMany({ column })` | ✅ |
| Columna de otro tablero → 404 (aislamiento) | `loadColumn`: si `column.board !== req.board._id` → 404 `Columna no encontrada` | ✅ |

### 3.3 Tickets — ✅ todo coincide

| Afirmación SPEC | Código real | Resultado |
|---|---|---|
| POST `{ title, description?, position? }` → 201; sin título → 400 `El título del ticket es obligatorio` | `createTicket`: chequeo explícito de `title` + `nextPosition` por columna | ✅ |
| `title` 1–200 y `description` ≤2000 con `trim` | Esquema `Ticket.js` (`minlength` 1, `maxlength` 200/2000, mensajes en español) | ✅ |
| PATCH `{ title?, description?, position?, columnId? }` (≥1) → 200/400/404 | `updateTicket` con `pick` de esos 4 campos y chequeo de vacío | ✅ |
| DELETE → 204; 404 si no existe | `deleteTicket` con `findOne({ _id, board })` | ✅ |

### 3.4 Mover un ticket — ✅ todo coincide

`PATCH /api/boards/:boardId/columns/:columnOrigenId/tickets/:ticketId` con `{ "columnId": "<destino>" }`:

| Afirmación SPEC | Código real | Resultado |
|---|---|---|
| Sin `position`, el backend lo coloca al final del destino | Sólo si es movimiento real (`isInSourceColumn && !isInTargetColumn`) y no viene `position` | ✅ |
| Frontend **no** envía `position` | Lo permite el contrato; el backend lo asigna | ✅ (regla AGENTS §10.8 verificada) |
| 400: `columnId` con formato inválido | `El columnId tiene un formato inválido` | ✅ |
| 400: columna destino de otro tablero | `La columna destino pertenece a otro tablero` | ✅ |
| 404: columna destino inexistente | `Columna destino no encontrada` | ✅ |
| 404: ticket que no está ni en origen ni en destino | `Ticket no encontrado en esta columna` | ✅ |
| Idempotente (reenviar el mismo PATCH deja el mismo estado; 200 si ya está en destino) | Si `isInTargetColumn`, pasa sin reasignar posición; `findOneAndUpdate` con `$set` de valores absolutos (sin `$push`/`$inc`) | ✅ |

### 3.5 Errores — ✅ todo coincide

- Formato único `{ "error": "mensaje en español" }` — `errorHandler.js` es el único emisor; **no existe campo `field`**. ✅
- 400: ValidationError de Mongoose (mensajes unidos por coma), `CastError` (`ID con formato inválido`), JSON malformado (`JSON malformado en el cuerpo de la solicitud`), PATCH vacío, columna de otro tablero. ✅
- 404: `Tablero no encontrado`, `Columna no encontrada`, `Ticket no encontrado`, y ruta inexistente → `Ruta no encontrada`. ✅
- 409: código 11000 → `El campo X ya existe`. **Confirmado que no puede ocurrir**: ningún esquema define índices únicos ni `unique`. ✅
- 500: `Error interno del servidor` genérico (sin filtrar detalles). ✅
- `GET /health` → `{ status: "ok", timestamp }` y `GET /api` → `{ message: "Kanban API", version: "1.0.0" }`. ✅
- CORS: `app.use(cors())` sin restricciones → suficiente para el frontend en otro dominio (SPEC §11 lo anticipa). ✅

### 3.6 Modelo de datos (SPEC §3) — ✅ todo coincide

- `Board { _id, name, description?, createdAt, updatedAt, columns? }` — `id: false` (no aparece `id`) y `toJSON` elimina `__v`. ✅
- `Column { _id, name, board, position, createdAt, updatedAt, tickets? }` — virtual `tickets`. ✅
- `Ticket { _id, title, description?, column, board, position, createdAt, updatedAt }` — **no existe `priority` ni ningún campo extra**. ✅
- Límites (Zod): `Board.name` 1–100, `Board.description` ≤500, `Column.name` 1–100, `Ticket.title` 1–200, `Ticket.description` ≤2000, todos con `trim`. ✅ (§3 de SPEC = esquemas reales = Supuesto 4 de REQUIREMENTS).

## 4. Inconsistencias (documento vs documento) y resolución

| # | Inconsistencia | Detalle | Resolución propuesta |
|---|---|---|---|
| I-1 | **Alcance del rollback al mover** | `AGENTS.md` §7 dice "si el backend responde **400 o 404**, revertir"; `SPEC.md` §7.3 amplía a "**400, 404, 500 y red**". `REQUIREMENTS.md` §8 (riesgos) exige rollback ante **falla de red**. | Adoptar el alcance amplio de SPEC (rollback ante **cualquier** error). No contradice AGENTS (que sólo obliga en 400/404) y cumple el riesgo mitigado de REQUIREMENTS. ⚠️ Requiere visto bueno explícito. |
| I-2 | **Orden de columnas tras crear un tablero** | `GET /api/boards/:boardId` ordena por `position`, pero el `populate('columns')` del **POST** de creación no aplica sort (devuelve orden natural de inserción, usualmente correcto pero no garantizado). CA-02 exige ver las 3 columnas **en orden**. | El frontend ordena **defensivamente** columnas y tickets por `position` antes de renderizar (no depende del orden del backend). Sin cambio en el backend. |
| I-3 | **Inventario de componentes** | El prompt de fases menciona 9 componentes; SPEC §9 incluye además `Textarea`, `ConfirmDialog` y `ToastProvider`/`useToast`. | Seguir SPEC §9 (inventario completo). `ConfirmDialog` se implementa como diálogo derivado de `Modal`. |

## 5. Ambigüedades y resolución propuesta

| # | Ambigüedad | Resolución propuesta (requiere aprobación) |
|---|---|---|
| A-1 | **CA-05 con ID malformado:** CA-05 define el caso `/boards/<id inexistente>` (404 → "Tablero no encontrado"), pero `/boards/xyz` responde **400** `El parámetro boardId tiene un formato inválido`. No se especifica qué mostrar. | Mostrar el estado de error con **el mensaje real del backend** y el enlace "Volver a la lista" (no inventar texto). La variante 404 de CA-05 queda intacta. |
| A-2 | **Vaciar la descripción de un tablero:** los modelos tratan `description` como opcional; no se dice si enviar `""` es válido para borrarla. | Enviar `description: ""` en el PATCH (el backend la triméa y guarda vacía). En Zod: `description` opcional que acepta `""` con máximo 500. |
| A-3 | **Dónde se edita/elimina un tablero:** CA-04 se verifica en la lista; SPEC §5 menciona navegación tras "eliminar tablero desde el detalle". No se aclara si hay edición en el detalle. | Editar y eliminar en la **lista** (BoardCard `onEdit`/`onDelete`) + eliminar también en el **detalle** (BoardDetailPage). **Sin** formulario de edición en el detalle (no está pedido; se evita scope creep). |
| A-4 | **Errores al eliminar** (tablero/columna/ticket fallido 404/500/red): ningún CA lo cubre. | Toast con el mensaje del backend + invalidar la query correspondiente para reconciliar el estado. |
| A-5 | **Copy del estado de carga lenta:** REQUIREMENTS §8 promete el mensaje "Conectando con el servidor…" que no aparece en SPEC. | Usar ese texto en el estado de carga inicial (tras umbral breve, ~3 s) y timeout de 60 s del httpClient de SPEC §4. |
| A-6 | **`useMoveTicket` cancelación:** SPEC §7.1 escribe `cancelQueries([...])` (notación abreviada); en TanStack Query v5 la API es `cancelQueries({ queryKey: [...] })`. | Implementar con la API real de v5 conservando la semántica del spec. Detalle de implementación, no de contrato. |

## 6. Requisitos faltantes (gaps detectados)

| # | Gap | Impacto | Mitigación propuesta |
|---|---|---|---|
| G-1 | No se define el **texto de los estados vacíos** (lista sin tableros, columna sin tickets). | CA-01 exige un mensaje vacío con botón "Crear tablero"; el resto no. | Definir copy sobrio en español en Fase 3/5: "No hay tableros todavía" + botón; "Sin tickets" en columnas vacías. |
| G-2 | No se define **duración ni dismiss** de los Toasts. | UX; riesgo de toast permanente. | Auto-cierre ~5 s + botón de cierre; `aria-live="assertive"` para errores (accesibilidad). |
| G-3 | CA-15 pide verificar contraste con "herramienta" sin definir cuál. | Reproducibilidad. | Fase 5: cálculo de razones de contraste WCAG documentado en el PR + auditoría Lighthouse del navegador. |
| G-4 | No se especifica el comportamiento de **`GET /api/boards` fallando** (red caída). | RNF-05 lo cubre genéricamente. | Estado de error con retry y mensaje "No se pudo conectar con el servidor" (texto fijado por SPEC §4 para fallo de red). |
| G-5 | **Backend sin desplegar:** el repo público no publica URL de sitio y no se indicó `VITE_API_URL` de producción. | Bloquea Fase 6 (CA-18) y el dato de "URL_BACKEND_DESPLEGADO" de la consigna. | Ver §8 P-1. |

## 7. Riesgos

| Riesgo | Impacto | Mitación |
|---|---|---|
| Backend aún sin desplegar (ver G-5) | No se puede verificar el contrato en vivo ni completar CA-18 | Desplegar `kanban-api` en Render (Web Service) + MongoDB Atlas M0 según el README del backend; verificar `GET /health` |
| Servicio gratuito "dormido" | Primera carga lenta (~1 min) | Timeout de 60 s (SPEC §4) + copy "Conectando con el servidor…" (A-5) |
| Sin tests automatizados en el backend | Regresiones del contrato invisibles | La revisión de este documento + colección Postman + mocks del frontend (SPEC §8) como red de seguridad |
| `cors()` abierto | Cualquier sitio puede llamar a la API | Aceptado y declarado (SPEC §11); cambio opcional `CORS_ORIGIN` solo con aprobación |
| Editar/dejar de lado los 3 documentos fuente por error | Pérdida de la fuente de verdad | Se copiaron byte a byte idénticos (SHA-256 verificados); no se modificaron |

## 8. Preguntas abiertas (requieren tu decisión)

1. **P-1 — Backend desplegado:** la consigna trae `<URL_BACKEND_DESPLEGADO>` sin rellenar y el repo no publica URL. ¿Quién despliega el backend en Render y cuándo? ¿Procedo a Fase 1 sin ese dato y dejamos el despliegue del backend para Fase 6 (requiere tu aprobación para tocar el repo del backend)? *(Estado asumido provisoriamente: el backend se despliega en Fase 6 con tu supervisión.)*
2. **P-2 — I-1 (alcance del rollback):** ¿Apruebas rollback ante **cualquier** error (400/404/500/red), como propone SPEC §7.3, en lugar del mínimo 400/404 de AGENTS §7?
3. **P-3 — A-1:** ¿Apruebas mostrar el mensaje real del backend en el estado de error para IDs malformados (CA-05 extendido)?
4. **P-4 — A-2 y A-3:** ¿Apruebas las resoluciones de descripción vacía (`""`) y ubicación de edición de tableros?
5. **P-5 — Commit inicial:** este commit de Fase 0 incluye AGENTS.md, docs/REQUIREMENTS.md, docs/SPEC.md, docs/REVIEW.md, este README raíz provisorio y `.gitignore`. ¿Algo que ajustar antes de continuar?

## 9. Correcciones aplicadas

- **Ninguna corrección a los documentos fuente:** la verificación contra el código real no arrojó errores factuales (endpoints, códigos, mensajes, modelo de datos y límites son correctos). Los 3 documentos quedan en el repo **tal cual** (SHA-256 verificados contra los originales).
- Las inconsistencias de §4 y ambigüedades de §5 quedan **resueltas en este documento como propuestas**; se plasmarán en la implementación sólo tras tu aprobación de §8.

## 10. Criterio del revisor para avanzar

La Fase 0 se considera completa cuando:
- [x] Repo `kanban-web` creado con los 3 documentos originales.
- [x] Contrato verificado contra el código real del backend.
- [x] `docs/REVIEW.md` emitido con inconsistencias, ambigüedades, gaps, riesgos y preguntas.
- [x] **Aprobación humana** con las resoluciones de §8 (ver §11).

## 11. Resoluciones aprobadas (Fase 0 → implementación)

Aprobadas por el cliente sin condiciones. Rigen la implementación de las
Fases 1 a 6:

| # | Pregunta | Resolución aprobada |
|---|---|---|
| P-1 | Backend desplegado | El backend se despliega en la **Fase 6** (Render Web Service + Atlas M0). La URL pública queda pendiente hasta contar con credenciales; el frontend consume `VITE_API_URL` sin hardcodear nada. |
| P-2 | Alcance del rollback (I-1) | **Rollback ante cualquier error** (400, 404, 500 y red), con Toast que muestra el mensaje real del backend. |
| P-3 | CA-05 con ID malformado (A-1) | Mostrar **el mensaje real del backend** (`error.message`) en el estado de error, con enlace a la lista. |
| P-4 | Descripción vacía y ubicación de edición (A-2, A-3) | `description: ""` es válido para borrarla; edición y borrado de tablero desde la lista, borrado también desde el detalle (sin formulario de edición duplicado). |
| P-5 | Commit inicial de Fase 0 | Aprobado tal cual; se avanza a Fase 1 sin más cambios en los documentos fuente. |

### Resoluciones de implementación derivadas

| Tema | Resolución |
|---|---|
| Eliminar tablero/columna/ticket | Confirmación explícita previa (ConfirmDialog). Al borrar una columna se informa cuántos tickets se pierden. |
| Navegación al abrir un tablero | `<Link>` dentro de `BoardCard` en lugar de la prop `onOpen` de SPEC §9, para respetar AGENTS §7/§10.1 (`useNavigate` solo tras una mutación). |
| Mocks | `VITE_USE_MOCKS=true` activa un adaptador de Axios en memoria con el contrato real (incluye el 404 al mover a una columna inexistente). |
| Timeout HTTP | 60 s (SPEC §4), con copy “Conectando con el servidor…” tras ~3 s. |
| Despliegue | Render Static Site para el frontend con rewrite `/* → /index.html`; `render.yaml` incluido. |

### Verificación de los criterios de aceptación

El estado detallado de CA-01 a CA-18 (implementado, verificado con tests o
pendiente de producción) se mantiene en el `README.md` raíz. **CA-18 queda
pendiente** hasta publicar backend y frontend, por falta de credenciales de
Render/Atlas en el entorno de desarrollo.
