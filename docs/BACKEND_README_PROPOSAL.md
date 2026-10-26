# Propuesta de arquitectura — `kanban-api` (backend)

> **Estado:** propuesta **no aplicada**. El repositorio `kanban-api` no se
> modificó (AGENTS.md §10.13 exige aprobación explícita). Este documento
> describe qué se documentaría en su README y cómo se despliega para que
> DevBoard funcione en producción. El código del backend **no requiere
> cambios** para esta entrega.

## 1. Resumen de la arquitectura actual (verificada en la Fase 0)

`kanban-api` es una API REST en **Node.js 20 + Express 4 + MongoDB/Mongoose 8**
(CommonJS), organizada en capas:

```
src/
├── server.js        # arranque: conecta a MongoDB y escucha en PORT
├── app.js           # Express, middlewares globales y montaje de rutas
├── config/db.js     # conexión Mongoose a MONGODB_URI
├── routes/          # 3 routers: boards, columns, tickets
├── controllers/     # validación de entrada + respuesta HTTP
├── services/        # entityManager.js: CRUD genérico reutilizable
├── models/          # Board, Column, Ticket (+ hooks de cascada)
├── middlewares/     # validateObjectId, loadBoard, loadColumn, loadTicket
└── errors/          # ApiError + errorHandler centralizado
```

### Decisiones que ya están bien resueltas

| Decisión | Detalle |
|---|---|
| Jerarquía anidada | Board → Column → Ticket; rutas anidadas que verifican pertenencia |
| Borrado en cascada | Hooks `pre('deleteOne')` en Board y Column |
| Errores uniformes | Siempre `{ "error": "mensaje en español" }`, sin filtrar detalles internos |
| Aislamiento | Un recurso de otro tablero responde 404, no revela existencia |
| Idempotencia | `PATCH` con `$set` de valores absolutos; mover dos veces no corrompe el orden |
| Validación de IDs | `validateObjectId` antes de consultar MongoDB (400 en lugar de CastError) |

## 2. Cambios propuestos al README del backend

Secciones sugeridas para agregar al README existente (sin tocar el código):

### 2.1 Diagrama de capas

Incluir el árbol de `src/` de la sección anterior y una frase por capa. Ayuda a
quien consume el contrato a ubicar dónde vive cada validación.

### 2.2 Contrato de errores

Documentar explícitamente:

```
400  Validación / ID inválido / PATCH sin campos / columna de otro tablero
404  Recurso inexistente / ruta inexistente
409  Duplicado (código 11000) — hoy no puede ocurrir: no hay índices unique
500  Error interno del servidor
```

Formato único: `{ "error": "mensaje en español" }`. **No** existe campo `field`.

### 2.3 Despliegue en Render + MongoDB Atlas

1. **MongoDB Atlas**: cluster gratuito M0, usuario de base de datos con permiso
   `readWrite` sobre la base `kanban`, y regla de red `0.0.0.0/0` (Render no
   tiene IP fija en el plan gratuito).
2. **Render Web Service**:
   - Repositorio: `JoacoJust/kanban-api`, rama `main`.
   - Runtime: Node.
   - Build: `npm install`.
   - Start: `npm start`.
   - Variable: `MONGODB_URI` = cadena de conexión de Atlas (con `retryWrites=true&w=majority`).
   - `PORT`: Render lo inyecta; `server.js` ya lee `process.env.PORT`.
3. **Verificación**: `GET /health` → `{ "status": "ok", "timestamp": ... }`
   y `GET /api` → `{ "message": "Kanban API", "version": "1.0.0" }`.
4. **CORS**: `app.use(cors())` ya permite el origen del frontend. Mejora
   opcional (requiere aprobación): `CORS_ORIGIN` configurable por variable.

### 2.4 Notas operativas

- El plan gratuito de Render duerme el servicio tras inactividad: la primera
  petición puede tardar ~1 minuto. DevBoard usa timeout de 60 s y muestra
  “Conectando con el servidor…” pasado un umbral.
- No hay autenticación ni usuarios: cualquier cliente puede leer y escribir.
  Es una decisión del alcance actual y debe quedar declarada.
- No hay migraciones: Mongoose crea las colecciones al primer uso.

## 3. Qué **no** se propone cambiar

- **No** agregar autenticación, usuarios ni tokens (fuera de alcance).
- **No** agregar campos (`priority`, `field`, etc.) que el frontend ya asume
  inexistentes.
- **No** cambiar el formato de errores ni los códigos de éxito.
- **No** modificar `position` ni el algoritmo de orden: el frontend no envía
  `position` al mover.

## 4. Checklist para habilitar CA-18

- [ ] Cluster Atlas creado y `MONGODB_URI` disponible.
- [ ] Web Service desplegado y `GET /health` responde 200.
- [ ] URL pública del backend anotada.
- [ ] `VITE_API_URL` configurada en el Static Site del frontend.
- [ ] Rewrite `/* → /index.html` activo en el frontend.
- [ ] Flujo completo verificado desde la URL pública del frontend.
