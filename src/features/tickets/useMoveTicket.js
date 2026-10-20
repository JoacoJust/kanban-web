import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as boardService from '../../api/boardService.js';
import { useToast } from '../../hooks/useToast.js';
import { moveTicketInCache } from './moveCache.js';

/**
 * useMoveTicket — mutación optimista para mover tickets. (docs/SPEC.md §7)
 *
 * 1. onMutate: cancela queries, guarda el estado previo y mueve el ticket en
 *    la caché al instante.
 * 2. onError: restaura el estado previo EXACTO (rollback) y muestra un Toast
 *    con el motivo. Alcance ampliado a 500/red, aprobado en REVIEW.md I-1.
 * 3. onSettled: invalida la query para reconciliar con el servidor.
 */
export function useMoveTicket(boardId) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ ticketId, fromColumnId, toColumnId }) =>
      boardService.moveTicket(boardId, fromColumnId, ticketId, toColumnId),

    onMutate: async ({ ticketId, fromColumnId, toColumnId }) => {
      await queryClient.cancelQueries({ queryKey: ['board', boardId] });
      const previous = queryClient.getQueryData(['board', boardId]);
      queryClient.setQueryData(['board', boardId], (current) =>
        moveTicketInCache(current, { ticketId, fromColumnId, toColumnId })
      );
      return { previous };
    },

    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['board', boardId], context.previous);
      }
      showToast(error.message, 'error');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}
