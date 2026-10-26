import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as boardService from '../../api/boardService.js';

/**
 * Mutaciones de tickets (excepto mover: Fase 4). (docs/SPEC.md §6)
 * Todas invalidan ['board', boardId] en onSuccess.
 */

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, data }) =>
      boardService.createTicket(boardId, columnId, data),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, ticketId, data }) =>
      boardService.updateTicket(boardId, columnId, ticketId, data),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, ticketId }) =>
      boardService.deleteTicket(boardId, columnId, ticketId),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}
