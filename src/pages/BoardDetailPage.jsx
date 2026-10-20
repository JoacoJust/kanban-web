import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Spinner from '../components/Spinner.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import BoardForm from '../features/boards/BoardForm.jsx';
import { useBoardQuery, useDeleteBoard } from '../features/boards/queries.js';
import ColumnForm from '../features/columns/ColumnForm.jsx';
import ColumnsBoard from '../features/columns/ColumnsBoard.jsx';
import { useDeleteColumn } from '../features/columns/queries.js';
import TicketForm from '../features/tickets/TicketForm.jsx';
import { useDeleteTicket } from '../features/tickets/queries.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import useSlowFlag from '../hooks/useSlowFlag.js';

/**
 * BoardDetailPage — vista Kanban (/boards/:boardId). (RF-05 a RF-12, CA-05)
 * Contenedor: useParams + estados loading/error/data (SPEC.md §5).
 * El diálogo para eliminar el tablero se confirma aquí (RF-04) y, tras el
 * éxito, useDeleteBoard navega a /boards (AGENTS.md §7).
 */
export default function BoardDetailPage() {
  const { boardId } = useParams();
  const { data: board, isLoading, error } = useBoardQuery(boardId);
  const deleteBoard = useDeleteBoard();
  const deleteColumn = useDeleteColumn();
  const deleteTicket = useDeleteTicket();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const isSlowLoading = useSlowFlag();

  const [isBoardFormOpen, setIsBoardFormOpen] = useState(false);
  const [isColumnFormOpen, setIsColumnFormOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [deletingColumn, setDeletingColumn] = useState(null); // { column, ticketCount }
  const [ticketTarget, setTicketTarget] = useState(null); // { columnId } para crear
  const [editingTicket, setEditingTicket] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(null);

  function handleDeleteBoard() {
    deleteBoard.mutate(boardId, {
      onError: (err) => showToast(err.message, 'error'),
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

  /* ------------------------------ Estados ------------------------------ */

  if (isLoading) {
    return (
      <main>
        <Spinner
          label={isSlowLoading ? 'Conectando con el servidor…' : 'Cargando tablero…'}
        />
      </main>
    );
  }

  // CA-05: id inexistente (404) o mal formado (400) → mensaje del backend + enlace
  if (error) {
    return (
      <main>
        <div className="state-block state-block--error" role="alert">
          <span className="state-block__icon" aria-hidden="true">
            ⚠
          </span>
          <p className="state-block__title">{error.message}</p>
          <p className="state-block__text">
            No se pudo abrir este tablero. Puede que haya sido eliminado.
          </p>
          <Link className="btn btn--primary" to="/boards">
            Volver a la lista de tableros
          </Link>
        </div>
      </main>
    );
  }

  /* ------------------------------ Tablero ------------------------------ */

  return (
    <main>
      <div className="breadcrumb">
        <Link to="/boards">← Tableros</Link>
        <span aria-hidden="true">/</span>
        <span>{board.name}</span>
      </div>
      <header className="page-header">
        <div className="page-header__title-group">
          <h1>{board.name}</h1>
          {board.description && (
            <p className="page-header__subtitle">{board.description}</p>
          )}
        </div>
        <div className="page-header__actions">
          <Button variant="primary" onClick={() => setIsColumnFormOpen(true)}>
            Agregar columna
          </Button>
          <Button variant="secondary" onClick={() => setIsBoardFormOpen(true)}>
            Editar tablero
          </Button>
          <Button variant="ghost" onClick={handleDeleteBoard}>
            Eliminar tablero
          </Button>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <ColumnsBoard
        board={board}
        onAddTicket={(column) => setTicketTarget({ columnId: column._id })}
        onRenameColumn={(column) => setEditingColumn(column)}
        onDeleteColumn={(column, ticketCount) =>
          setDeletingColumn({ column, ticketCount })
        }
        onEditTicket={(ticket) => setEditingTicket(ticket)}
        onDeleteTicket={(ticket) => setDeletingTicket(ticket)}
      />

      {/* ------------------------------ Diálogos ------------------------------ */}

      <BoardForm
        key={`board-${boardId}`}
        open={isBoardFormOpen}
        board={board}
        onClose={() => setIsBoardFormOpen(false)}
      />
      <ColumnForm
        key={`create-column-${boardId}`}
        open={isColumnFormOpen}
        boardId={boardId}
        onClose={() => setIsColumnFormOpen(false)}
      />
      <ColumnForm
        key={editingColumn ? `rename-${editingColumn._id}` : 'rename-none'}
        open={Boolean(editingColumn)}
        boardId={boardId}
        column={editingColumn}
        onClose={() => setEditingColumn(null)}
      />
      <ConfirmDialog
        open={Boolean(deletingColumn)}
        title="Eliminar columna"
        message={
          deletingColumn
            ? deletingColumn.ticketCount > 0
              ? `¿Eliminar la columna "${deletingColumn.column.name}"? Se perderán ${deletingColumn.ticketCount} ${
                  deletingColumn.ticketCount === 1 ? 'ticket' : 'tickets'
                }.`
              : `¿Eliminar la columna "${deletingColumn.column.name}"?`
            : ''
        }
        confirmLabel="Eliminar"
        loading={deleteColumn.isPending}
        onConfirm={handleDeleteColumnConfirm}
        onCancel={() => setDeletingColumn(null)}
      />
      {ticketTarget?.columnId && (
        <TicketForm
          key={`create-ticket-${ticketTarget.columnId}`}
          open
          boardId={boardId}
          columnId={ticketTarget.columnId}
          onClose={() => setTicketTarget(null)}
        />
      )}
      <TicketForm
        key={editingTicket ? `edit-ticket-${editingTicket._id}` : 'edit-none'}
        open={Boolean(editingTicket)}
        boardId={boardId}
        columnId={editingTicket?.column}
        ticket={editingTicket}
        onClose={() => setEditingTicket(null)}
      />
      <ConfirmDialog
        open={Boolean(deletingTicket)}
        title="Eliminar ticket"
        message={deletingTicket ? `¿Eliminar el ticket "${deletingTicket.title}"?` : ''}
        confirmLabel="Eliminar"
        loading={deleteTicket.isPending}
        onConfirm={handleDeleteTicketConfirm}
        onCancel={() => setDeletingTicket(null)}
      />
    </main>
  );
}
