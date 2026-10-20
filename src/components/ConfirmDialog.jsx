import Modal from './Modal.jsx';
import Button from './Button.jsx';

/**
 * ConfirmDialog — diálogo de confirmación derivado de Modal. (docs/SPEC.md §9)
 * Presentacional: `message` puede incluir contexto (RF-08/CA-12: al eliminar
 * una columna se indica cuántos tickets se perderán).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
