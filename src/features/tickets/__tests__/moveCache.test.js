import { describe, expect, it } from 'vitest';
import { moveTicketInCache } from '../moveCache.js';

function createBoard() {
  return {
    _id: 'board-1',
    name: 'Tablero',
    columns: [
      {
        _id: 'col-a',
        name: 'Qué hacer',
        position: 0,
        tickets: [
          { _id: 't1', title: 'Uno', column: 'col-a', position: 0 },
          { _id: 't2', title: 'Dos', column: 'col-a', position: 1 },
        ],
      },
      {
        _id: 'col-b',
        name: 'Haciendo',
        position: 1,
        tickets: [{ _id: 't3', title: 'Tres', column: 'col-b', position: 0 }],
      },
      { _id: 'col-c', name: 'Hecho', position: 2 }, // sin campo tickets
    ],
  };
}

const move = { ticketId: 't1', fromColumnId: 'col-a', toColumnId: 'col-b' };

describe('moveTicketInCache — función pura', () => {
  it('mueve el ticket y lo agrega AL FINAL de la columna destino', () => {
    const board = createBoard();
    const next = moveTicketInCache(board, move);

    expect(next.columns[0].tickets.map((t) => t._id)).toEqual(['t2']);
    expect(next.columns[1].tickets.map((t) => t._id)).toEqual(['t3', 't1']);
  });

  it('actualiza el campo column del ticket movido', () => {
    const next = moveTicketInCache(createBoard(), move);
    const moved = next.columns[1].tickets.find((t) => t._id === 't1');

    expect(moved.column).toBe('col-b');
  });

  it('NO muta el tablero original (rollback seguro)', () => {
    const board = createBoard();
    const originalTicketsA = board.columns[0].tickets;
    const originalTicketsB = board.columns[1].tickets;

    const next = moveTicketInCache(board, move);

    // El original conserva sus tickets intactos
    expect(board.columns[0].tickets).toBe(originalTicketsA);
    expect(board.columns[0].tickets.map((t) => t._id)).toEqual(['t1', 't2']);
    expect(board.columns[1].tickets).toEqual(originalTicketsB);
    expect(board.columns[0].tickets[0].column).toBe('col-a');

    // Y las columnas afectadas son objetos nuevos
    expect(next).not.toBe(board);
    expect(next.columns[0]).not.toBe(board.columns[0]);
    expect(next.columns[1]).not.toBe(board.columns[1]);
    expect(next.columns[2]).toBe(board.columns[2]); // no afectada: misma referencia
  });

  it('es no-op si origen y destino son la misma columna', () => {
    const board = createBoard();
    const next = moveTicketInCache(board, {
      ticketId: 't1',
      fromColumnId: 'col-a',
      toColumnId: 'col-a',
    });

    expect(next).toBe(board);
  });

  it('es no-op si el ticket no existe en la columna origen', () => {
    const board = createBoard();
    const next = moveTicketInCache(board, { ...move, ticketId: 'inexistente' });

    expect(next).toBe(board);
  });

  it('tolera columnas sin tickets (undefined) al mover', () => {
    const board = createBoard();
    // mover t1 desde col-a hacia col-c que no tiene campo tickets
    const next = moveTicketInCache(board, {
      ticketId: 't1',
      fromColumnId: 'col-a',
      toColumnId: 'col-c',
    });

    expect(next.columns[2].tickets.map((t) => t._id)).toEqual(['t1']);
    expect(board.columns[2].tickets).toBeUndefined();
  });

  it('tolera tableros inválidos sin lanzar excepciones', () => {
    expect(moveTicketInCache(null, move)).toBeNull();
    expect(moveTicketInCache({}, move)).toEqual({});
  });
});
