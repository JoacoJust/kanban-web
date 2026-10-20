import TicketForm from './TicketForm.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';

/** Diálogos de tickets: crear, editar y eliminar (RF-09 a RF-11). */
export default function TicketDialogs({
  boardId,
  ticketTarget,
  onCloseCreate,
  editingTicket,
  onCloseEdit,
  deletingTicket,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
}) {
  return (
    <>
      {ticketTarget?.columnId && (
        <TicketForm
          key={`create-${ticketTarget.columnId}`}
          open
          boardId={boardId}
          columnId={ticketTarget.columnId}
          onClose={onCloseCreate}
        />
      )}
      {editingTicket && (
        <TicketForm
          key={editingTicket._id}
          open
          boardId={boardId}
          columnId={editingTicket.column}
          ticket={editingTicket}
          onClose={onCloseEdit}
        />
      )}
      <ConfirmDialog
        open={Boolean(deletingTicket)}
        title="Eliminar ticket"
        message={
          deletingTicket ? `¿Eliminar el ticket "${deletingTicket.title}"?` : ''
        }
        confirmLabel="Eliminar"
        loading={isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />
    </>
  );
}
