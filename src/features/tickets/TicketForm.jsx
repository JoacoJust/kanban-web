import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import Button from '../../components/Button.jsx';
import { mapApiErrorToForm } from '../../api/errors.js';
import { useCreateTicket, useUpdateTicket } from './queries.js';
import { ticketSchema, ticketDefaultValues } from './schemas.js';

/**
 * TicketForm — formulario contenedor para crear/editar tickets (RF-09, RF-10).
 * En edición, `columnId` es la columna actual del ticket; en creación, la
 * columna destino. RHF + Zod, errores del backend en el formulario, spinner y
 * botón deshabilitado mientras se guarda (RF-14, RF-15).
 */
export default function TicketForm({ open, boardId, columnId, ticket, onClose }) {
  const isEdit = Boolean(ticket);
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: ticket
      ? { title: ticket.title, description: ticket.description ?? '' }
      : ticketDefaultValues,
  });

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await updateTicket.mutateAsync({
          boardId,
          columnId: ticket.column,
          ticketId: ticket._id,
          data: values,
        });
      } else {
        await createTicket.mutateAsync({ boardId, columnId, data: values });
      }
      onClose();
    } catch (error) {
      mapApiErrorToForm(error, setError);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar ticket' : 'Crear ticket'}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root?.server?.message && (
          <p className="form__general-error" role="alert">
            {errors.root.server.message}
          </p>
        )}
        <Input
          label="Título"
          required
          placeholder="Descripción corta de la tarea"
          error={errors.title?.message}
          {...register('title')}
        />
        <Textarea
          label="Descripción"
          placeholder="Opcional"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="form__actions">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
