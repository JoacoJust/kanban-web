import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button.jsx';
import Spinner from '../components/Spinner.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useBoardQuery } from '../features/boards/queries.js';
import BoardDialogs from '../features/boards/BoardDialogs.jsx';
import { useBoardDetail } from '../features/boards/useBoardDetail.js';
import ColumnDialogs from '../features/columns/ColumnDialogs.jsx';
import ColumnsBoard from '../features/columns/ColumnsBoard.jsx';
import TicketDialogs from '../features/tickets/TicketDialogs.jsx';
import { useTheme } from '../hooks/useTheme.js';
import useSlowFlag from '../hooks/useSlowFlag.js';

/**
 * BoardDetailPage — vista Kanban (/boards/:boardId). (RF-05 a RF-12, CA-05)
 * Contenedor: consulta + estados loading/error/data (SPEC.md §5).
 * La lógica de diálogos y movimiento vive en useBoardDetail (features/boards).
 */
export default function BoardDetailPage() {
  const { boardId } = useParams();
  const { data: board, isLoading, error } = useBoardQuery(boardId);
  const { theme, toggle } = useTheme();
  const isSlowLoading = useSlowFlag();
  const actions = useBoardDetail(boardId);

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

  const hasColumns = board.columns?.length > 0;

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
          <Button variant="primary" onClick={actions.openColumnForm}>
            Agregar columna
          </Button>
          <Button variant="secondary" onClick={actions.openBoardForm}>
            Editar tablero
          </Button>
          <Button variant="ghost" onClick={actions.openDeleteBoard}>
            Eliminar tablero
          </Button>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      {hasColumns ? (
        <ColumnsBoard
          board={board}
          onAddTicket={actions.startCreateTicket}
          onRenameColumn={actions.startRenameColumn}
          onDeleteColumn={actions.startDeleteColumn}
          onEditTicket={actions.startEditTicket}
          onDeleteTicket={actions.startDeleteTicket}
          onMoveTicket={actions.moveByMenu}
          onDropTicket={actions.dropTicket}
          isTicketBusy={actions.isTicketBusy}
        />
      ) : (
        <div className="state-block">
          <p className="state-block__title">Este tablero no tiene columnas</p>
          <p className="state-block__text">
            Creá una columna para empezar a agregar tickets.
          </p>
          <Button variant="primary" onClick={actions.openColumnForm}>
            Agregar columna
          </Button>
        </div>
      )}

      <BoardDialogs
        board={board}
        isEditOpen={actions.isBoardFormOpen}
        onCloseEdit={actions.closeBoardForm}
        isDeleteOpen={actions.isDeletingBoard}
        onCloseDelete={actions.closeDeleteBoard}
        isDeleting={actions.deleteBoard.isPending}
        onConfirmDelete={actions.confirmDeleteBoard}
      />
      <ColumnDialogs
        boardId={boardId}
        isCreateOpen={actions.isColumnFormOpen}
        onCloseCreate={actions.closeColumnForm}
        editingColumn={actions.editingColumn}
        onCloseEdit={actions.closeRenameColumn}
        deletingColumn={actions.deletingColumn}
        isDeleting={actions.deleteColumn.isPending}
        onConfirmDelete={actions.confirmDeleteColumn}
        onCancelDelete={actions.cancelDeleteColumn}
      />
      <TicketDialogs
        boardId={boardId}
        ticketTarget={actions.ticketTarget}
        onCloseCreate={actions.closeCreateTicket}
        editingTicket={actions.editingTicket}
        onCloseEdit={actions.closeEditTicket}
        deletingTicket={actions.deletingTicket}
        isDeleting={actions.deleteTicket.isPending}
        onConfirmDelete={actions.confirmDeleteTicket}
        onCancelDelete={actions.cancelDeleteTicket}
      />
    </main>
  );
}
