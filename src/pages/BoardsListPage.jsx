import { useState } from 'react';
import BoardCard from '../components/BoardCard.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Spinner from '../components/Spinner.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import BoardForm from '../features/boards/BoardForm.jsx';
import { useBoardsQuery, useDeleteBoard } from '../features/boards/queries.js';
import { useTheme } from '../hooks/useTheme.js';
import { useToast } from '../hooks/useToast.js';
import useSlowFlag from '../hooks/useSlowFlag.js';

/**
 * BoardsListPage — lista de tableros (/boards). (RF-01 a RF-04, CA-01, CA-04)
 * Contenedor: estado, mutaciones y diálogos; los componentes son presentacionales.
 */
export default function BoardsListPage() {
  const { data: boards, isLoading, error, refetch } = useBoardsQuery();
  const deleteBoard = useDeleteBoard();
  const { theme, toggle } = useTheme();
  const { showToast } = useToast();
  const isSlowLoading = useSlowFlag();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [deletingBoard, setDeletingBoard] = useState(null);

  function handleDeleteConfirm() {
    const board = deletingBoard;
    deleteBoard.mutate(board._id, {
      onSuccess: () => setDeletingBoard(null),
      onError: (err) => {
        setDeletingBoard(null);
        showToast(err.message, 'error');
      },
    });
  }

  return (
    <main>
      <header className="page-header">
        <div className="page-header__title-group">
          <h1>DevBoard</h1>
          <p className="page-header__subtitle">Tus tableros Kanban</p>
        </div>
        <div className="page-header__actions">
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Crear tablero
          </Button>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      {isLoading && (
        <Spinner
          label={isSlowLoading ? 'Conectando con el servidor…' : 'Cargando tableros…'}
        />
      )}

      {error && (
        <div className="state-block state-block--error" role="alert">
          <span className="state-block__icon" aria-hidden="true">
            ⚠
          </span>
          <p className="state-block__title">No se pudo cargar la lista de tableros</p>
          <p className="state-block__text">{error.message}</p>
          <Button variant="primary" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !error && boards?.length === 0 && (
        <div className="state-block">
          <span className="state-block__icon" aria-hidden="true">
            ▦
          </span>
          <p className="state-block__title">No hay tableros todavía</p>
          <p className="state-block__text">
            Creá tu primer tablero para empezar a organizar tareas.
          </p>
          <Button variant="primary" onClick={() => setIsFormOpen(true)}>
            Crear tablero
          </Button>
        </div>
      )}

      {!isLoading && !error && boards?.length > 0 && (
        <div className="boards-grid">
          {boards.map((board) => (
            <BoardCard
              key={board._id}
              board={board}
              onEdit={(b) => setEditingBoard(b)}
              onDelete={(b) => setDeletingBoard(b)}
            />
          ))}
        </div>
      )}

      {/* Se montan solo al abrirse: los formularios arrancan con valores limpios */}
      {isFormOpen && <BoardForm open onClose={() => setIsFormOpen(false)} />}
      {editingBoard && (
        <BoardForm
          key={editingBoard._id}
          open
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deletingBoard)}
        title="Eliminar tablero"
        message={
          deletingBoard
            ? `¿Eliminar el tablero "${deletingBoard.name}"? Se borrarán también sus columnas y tickets.`
            : ''
        }
        confirmLabel="Eliminar"
        loading={deleteBoard.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBoard(null)}
      />
    </main>
  );
}
