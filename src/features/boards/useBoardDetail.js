import { useState } from 'react';
import { useDeleteBoard } from './queries.js';
import { useDeleteColumn } from '../columns/queries.js';
import { useDeleteTicket } from '../tickets/queries.js';
import { useMoveTicket } from '../tickets/useMoveTicket.js';
import { useToast } from '../../hooks/useToast.js';

/**
 * useBoardDetail — estado y acciones del detalle del tablero (contenedor).
 * Mantiene la página por debajo de ~150 líneas y concentra la lógica de
 * diálogos y mutaciones en la capa de features (AGENTS.md §4).
 */
export function useBoardDetail(boardId) {
  const deleteBoard = useDeleteBoard();
  const deleteColumn = useDeleteColumn();
  const deleteTicket = useDeleteTicket();
  const moveTicket = useMoveTicket(boardId);
  const { showToast } = useToast();

  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [isColumnFormOpen, setIsColumnFormOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null); // { column, ticketCount }
  const [ticketTarget, setTicketTarget] = useState(null); // { columnId } al crear
  const [editingTicket, setEditingTicket] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(null);

  /** Mover con el menú "Mover a…" (SPEC §7.5: misma columna no llama a la API). */
  function handleMoveTicket(ticket, toColumnId) {
    if (!ticket || ticket.column === toColumnId) return;
    moveTicket.mutate({
      ticketId: ticket._id,
      fromColumnId: ticket.column,
      toColumnId,
    });
  }

  /** Mover con drag & drop (nativo). */
  function handleDropTicket(toColumnId, payload) {
    if (!payload?.ticketId || !payload?.fromColumnId) return;
    if (payload.fromColumnId === toColumnId) return;
    moveTicket.mutate({
      ticketId: payload.ticketId,
      fromColumnId: payload.fromColumnId,
      toColumnId,
    });
  }

  function handleDeleteBoardConfirm() {
    deleteBoard.mutate(boardId, {
      onSuccess: () => setIsDeletingBoard(false),
      onError: (err) => {
        setIsDeletingBoard(false);
        showToast(err.message, 'error');
      },
    });
  }

  function handleDeleteColumnConfirm() {
    const { column } = deletingColumn;
    deleteColumn.mutate(
      { boardId, columnId: column._id },
      {
        onSuccess: () => setDeletingColumn(null),
        onError: (err) => {
          setDeletingColumn(null);
          showToast(err.message, 'error');
        },
      }
    );
  }

  function handleDeleteTicketConfirm() {
    const ticket = deletingTicket;
    deleteTicket.mutate(
      { boardId, columnId: ticket.column, ticketId: ticket._id },
      {
        onSuccess: () => setDeletingTicket(null),
        onError: (err) => {
          setDeletingTicket(null);
          showToast(err.message, 'error');
        },
      }
    );
  }

  return {
    // Diálogos
    isBoardFormOpen,
    isDeletingBoard,
    isColumnFormOpen,
    editingColumn,
    deletingColumn,
    ticketTarget,
    editingTicket,
    deletingTicket,
    // Mutaciones (para estados de carga de los botones)
    deleteBoard,
    deleteColumn,
    deleteTicket,
    // Acciones
    openBoardForm: () => setIsBoardFormOpen(true),
    closeBoardForm: () => setIsBoardFormOpen(false),
    openDeleteBoard: () => setIsDeletingBoard(true),
    closeDeleteBoard: () => setIsDeletingBoard(false),
    confirmDeleteBoard: handleDeleteBoardConfirm,
    openColumnForm: () => setIsColumnFormOpen(true),
    closeColumnForm: () => setIsColumnFormOpen(false),
    startRenameColumn: setEditingColumn,
    closeRenameColumn: () => setEditingColumn(null),
    startDeleteColumn: (column, ticketCount) =>
      setDeletingColumn({ column, ticketCount }),
    cancelDeleteColumn: () => setDeletingColumn(null),
    confirmDeleteColumn: handleDeleteColumnConfirm,
    startCreateTicket: (column) => setTicketTarget({ columnId: column._id }),
    closeCreateTicket: () => setTicketTarget(null),
    startEditTicket: setEditingTicket,
    closeEditTicket: () => setEditingTicket(null),
    startDeleteTicket: setDeletingTicket,
    cancelDeleteTicket: () => setDeletingTicket(null),
    confirmDeleteTicket: handleDeleteTicketConfirm,
    // Movimiento
    moveByMenu: handleMoveTicket,
    dropTicket: handleDropTicket,
    isTicketBusy: (ticketId) =>
      moveTicket.isPending && moveTicket.variables?.ticketId === ticketId,
  };
}
