import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Button from '../../components/Button.jsx';
import { mapApiErrorToForm } from '../../api/errors.js';
import { useCreateColumn, useUpdateColumn } from './queries.js';
import { columnSchema, columnDefaultValues } from './schemas.js';

/**
 * ColumnForm — formulario contenedor para crear/renombrar columnas (RF-06, RF-07).
 * Mismas reglas que BoardForm: RHF + Zod, errores del backend en el formulario,
 * spinner y botón deshabilitado mientras se guarda (RF-14, RF-15).
 */
export default function ColumnForm({ open, boardId, column, onClose }) {
  const isEdit = Boolean(column);
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(columnSchema),
    defaultValues: column ? { name: column.name } : columnDefaultValues,
  });

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await updateColumn.mutateAsync({
          boardId,
          columnId: column._id,
          data: values,
        });
      } else {
        await createColumn.mutateAsync({ boardId, data: values });
      }
      onClose();
    } catch (error) {
      mapApiErrorToForm(error, setError);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Renombrar columna' : 'Crear columna'}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {errors.root?.server?.message && (
          <p className="form__general-error" role="alert">
            {errors.root.server.message}
          </p>
        )}
        <Input
          label="Nombre"
          required
          placeholder="En revisión"
          error={errors.name?.message}
          {...register('name')}
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
