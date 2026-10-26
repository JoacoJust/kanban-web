import BoardForm from './BoardForm.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

/** Diálogos del tablero: editar y eliminar con confirmación (RF-03, RF-04). */
export default function BoardDialogs({
  board,
  isEditOpen,
  onCloseEdit,
  isDeleteOpen,
  onCloseDelete,
  isDeleting,
  onConfirmDelete,
}) {
  return (
    <>
      {isEditOpen && <BoardForm open board={board} onClose={onCloseEdit} />}
      <ConfirmDialog
        open={isDeleteOpen}
        title="Eliminar tablero"
        message={
          board
            ? `¿Eliminar el tablero "${board.name}"? Se borrarán también sus columnas y tickets.`
            : ''
        }
        confirmLabel="Eliminar"
        loading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCloseDelete}
      />
    </>
  );
}
