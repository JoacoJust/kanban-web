/**
 * moveCache.js — función PURA que mueve un ticket dentro del tablero en caché.
 * (docs/SPEC.md §7.1)
 *
 * No muta el objeto original: devuelve un tablero nuevo con las columnas
 * afectadas copiadas. Si origen = destino, o el ticket no está en el origen,
 * devuelve el MISMO objeto (no-op).
 *
 * @param {object} board - tablero con columns[].tickets[] (forma de la API)
 * @param {{ ticketId: string, fromColumnId: string, toColumnId: string }} move
 * @returns {object} tablero actualizado (o el original si no hay cambios)
 */
export function moveTicketInCache(board, { ticketId, fromColumnId, toColumnId }) {
  if (!board || !Array.isArray(board.columns)) return board;
  if (!fromColumnId || !toColumnId || fromColumnId === toColumnId) return board;

  const sourceColumn = board.columns.find((column) => column._id === fromColumnId);
  const targetColumn = board.columns.find((column) => column._id === toColumnId);
  if (!sourceColumn || !targetColumn) return board;

  const ticket = (sourceColumn.tickets ?? []).find((item) => item._id === ticketId);
  if (!ticket) return board;

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column._id === fromColumnId) {
        return {
          ...column,
          tickets: (column.tickets ?? []).filter((item) => item._id !== ticketId),
        };
      }
      if (column._id === toColumnId) {
        return {
          ...column,
          // Al final de la columna destino (el backend asigna la position real)
          tickets: [...(column.tickets ?? []), { ...ticket, column: toColumnId }],
        };
      }
      return column;
    }),
  };
}
