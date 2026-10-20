import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import * as boardService from '../../api/boardService.js';

/**
 * Queries y mutaciones de tableros. (docs/SPEC.md §6)
 * Query keys: ['boards'] y ['board', boardId].
 */

export function useBoardsQuery() {
  return useQuery({
    queryKey: ['boards'],
    queryFn: boardService.getBoards,
  });
}

export function useBoardQuery(boardId) {
  return useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardService.getBoardById(boardId),
    enabled: Boolean(boardId),
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: boardService.createBoard,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      // AGENTS.md §7: useNavigate SOLO después de una mutación exitosa (CA-02).
      navigate(`/boards/${data._id}`);
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ boardId, data }) => boardService.updateBoard(boardId, data),
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (boardId) => boardService.deleteBoard(boardId),
    onSuccess: (_data, boardId) => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      queryClient.removeQueries({ queryKey: ['board', boardId] });
      // SPEC.md §5: eliminar desde el detalle vuelve a /boards tras el éxito.
      navigate('/boards');
    },
  });
}
