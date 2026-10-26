import ColumnForm from './ColumnForm.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

/**
 * Diálogos de columnas: crear, renombrar y eliminar.
 * RF-08/CA-12: al eliminar se indica cuántos tickets se perderán.
 */
export default function ColumnDialogs({
  boardId,
  isCreateOpen,
  onCloseCreate,
  editingColumn,
  onCloseEdit,
  deletingColumn,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}) {
  return (
    <>
      {isCreateOpen && (
        <ColumnForm open boardId={boardId} onClose={onCloseCreate} />
      )}
      {editingColumn && (
        <ColumnForm
          key={editingColumn._id}
          open
          boardId={boardId}
          column={editingColumn}
          onClose={onCloseEdit}
        />
      )}
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
        loading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  );
}
