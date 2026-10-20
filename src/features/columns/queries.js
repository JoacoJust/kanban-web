import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as boardService from '../../api/boardService.js';

/**
 * Mutaciones de columnas. (docs/SPEC.md §6)
 * Todas invalidan ['board', boardId] en onSuccess.
 */

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, data }) => boardService.createColumn(boardId, data),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId, data }) =>
      boardService.updateColumn(boardId, columnId, data),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, columnId }) => boardService.deleteColumn(boardId, columnId),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}
