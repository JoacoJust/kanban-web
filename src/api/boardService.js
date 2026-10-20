import httpClient from './httpClient.js';

/**
 * Capa de servicio: funciones aisladas de llamada al backend.
 * (docs/SPEC.md §4 — todas devuelven response.data y propagan ApiClientError)
 *
 * Rutas verificadas contra el código real de kanban-api (docs/REVIEW.md §3).
 */

/* ------------------------------ Tableros ------------------------------ */

export function getBoards() {
  return httpClient.get('/api/boards').then((r) => r.data);
}

export function getBoardById(boardId) {
  return httpClient.get(`/api/boards/${boardId}`).then((r) => r.data);
}

export function createBoard(data) {
  return httpClient.post('/api/boards', data).then((r) => r.data);
}

export function updateBoard(boardId, data) {
  return httpClient.patch(`/api/boards/${boardId}`, data).then((r) => r.data);
}

export function deleteBoard(boardId) {
  return httpClient.delete(`/api/boards/${boardId}`).then((r) => r.data);
}

/* ------------------------------ Columnas ------------------------------ */

export function createColumn(boardId, data) {
  return httpClient
    .post(`/api/boards/${boardId}/columns`, data)
    .then((r) => r.data);
}

export function updateColumn(boardId, columnId, data) {
  return httpClient
    .patch(`/api/boards/${boardId}/columns/${columnId}`, data)
    .then((r) => r.data);
}

export function deleteColumn(boardId, columnId) {
  return httpClient
    .delete(`/api/boards/${boardId}/columns/${columnId}`)
    .then((r) => r.data);
}

/* ------------------------------ Tickets ------------------------------ */

export function createTicket(boardId, columnId, data) {
  return httpClient
    .post(`/api/boards/${boardId}/columns/${columnId}/tickets`, data)
    .then((r) => r.data);
}

export function updateTicket(boardId, columnId, ticketId, data) {
  return httpClient
    .patch(`/api/boards/${boardId}/columns/${columnId}/tickets/${ticketId}`, data)
    .then((r) => r.data);
}

/**
 * Mover un ticket a otra columna del mismo tablero.
 * El backend asigna la posición al final de la columna destino:
 * el frontend NUNCA envía `position` (AGENTS.md §10.8).
 */
export function moveTicket(boardId, fromColumnId, ticketId, toColumnId) {
  return httpClient
    .patch(`/api/boards/${boardId}/columns/${fromColumnId}/tickets/${ticketId}`, {
      columnId: toColumnId,
    })
    .then((r) => r.data);
}

export function deleteTicket(boardId, columnId, ticketId) {
  return httpClient
    .delete(`/api/boards/${boardId}/columns/${columnId}/tickets/${ticketId}`)
    .then((r) => r.data);
}
