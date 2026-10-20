import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../toast/ToastProvider.jsx';
import { ApiClientError } from '../../../api/errors.js';
import { useMoveTicket } from '../useMoveTicket.js';
import * as boardService from '../../../api/boardService.js';

vi.mock('../../../api/boardService.js', () => ({
  moveTicket: vi.fn(),
}));

const BOARD_ID = 'board-1';

function createBoard() {
  return {
    _id: BOARD_ID,
    name: 'Tablero',
    columns: [
      {
        _id: 'col-a',
        name: 'Qué hacer',
        position: 0,
        tickets: [{ _id: 't1', title: 'Uno', column: 'col-a', position: 0 }],
      },
      { _id: 'col-b', name: 'Haciendo', position: 1, tickets: [] },
    ],
  };
}

const variables = { ticketId: 't1', fromColumnId: 'col-a', toColumnId: 'col-b' };

function renderUseMoveTicket(queryClient) {
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
  return renderHook(() => useMoveTicket(BOARD_ID), { wrapper });
}

describe('useMoveTicket — Optimistic UI con rollback (SPEC §7)', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: 0 }, mutations: { retry: 0 } },
    });
    queryClient.setQueryData(['board', BOARD_ID], createBoard());
    vi.clearAllMocks();
  });

  it('aplica el movimiento en caché al instante (antes de la respuesta)', async () => {
    boardService.moveTicket.mockResolvedValueOnce({ _id: 't1', column: 'col-b' });
    const { result } = renderUseMoveTicket(queryClient);

    await act(async () => {
      result.current.mutate(variables);
    });

    // El ticket ya está en destino mientras la mutación resolvía
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const cache = queryClient.getQueryData(['board', BOARD_ID]);
    expect(cache.columns[0].tickets).toHaveLength(0);
    expect(cache.columns[1].tickets.map((t) => t._id)).toEqual(['t1']);
    expect(cache.columns[1].tickets[0].column).toBe('col-b');
  });

  it('hace rollback al estado EXACTO previo si el servidor responde 404', async () => {
    const previous = queryClient.getQueryData(['board', BOARD_ID]);
    boardService.moveTicket.mockRejectedValueOnce(
      new ApiClientError('Columna destino no encontrada', 404)
    );
    const { result } = renderUseMoveTicket(queryClient);

    await act(async () => {
      result.current.mutate(variables);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    // Restauración exacta: mismo contenido que antes del intento
    expect(queryClient.getQueryData(['board', BOARD_ID])).toEqual(previous);
    // El ticket vuelve a su columna original
    const cache = queryClient.getQueryData(['board', BOARD_ID]);
    expect(cache.columns[0].tickets.map((t) => t._id)).toEqual(['t1']);
    expect(cache.columns[1].tickets).toHaveLength(0);
  });

  it('muestra un Toast con el motivo del error y revierte también en 400', async () => {
    const previous = queryClient.getQueryData(['board', BOARD_ID]);
    boardService.moveTicket.mockRejectedValueOnce(
      new ApiClientError('La columna destino pertenece a otro tablero', 400)
    );
    const { result } = renderUseMoveTicket(queryClient);

    await act(async () => {
      result.current.mutate(variables);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(['board', BOARD_ID])).toEqual(previous);
    // El mensaje aparece en el toast visible y en la región aria-live (a11y)
    const matches = await screen.findAllByText(
      'La columna destino pertenece a otro tablero'
    );
    expect(matches.some((el) => el.classList.contains('toast__message'))).toBe(true);
  });

  it('hace rollback también ante fallo de red (sin respuesta)', async () => {
    const previous = queryClient.getQueryData(['board', BOARD_ID]);
    boardService.moveTicket.mockRejectedValueOnce(
      new ApiClientError('No se pudo conectar con el servidor', null, true)
    );
    const { result } = renderUseMoveTicket(queryClient);

    await act(async () => {
      result.current.mutate(variables);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(['board', BOARD_ID])).toEqual(previous);
  });

  it('llama al servicio con los ids correctos y sin position', async () => {
    boardService.moveTicket.mockResolvedValueOnce({ _id: 't1', column: 'col-b' });
    const { result } = renderUseMoveTicket(queryClient);

    await act(async () => {
      result.current.mutate(variables);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(boardService.moveTicket).toHaveBeenCalledWith(
      BOARD_ID,
      'col-a',
      't1',
      'col-b'
    );
  });
});
