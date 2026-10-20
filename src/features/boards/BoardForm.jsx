import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import Textarea from '../../components/Textarea.jsx';
import Button from '../../components/Button.jsx';
import { mapApiErrorToForm } from '../../api/errors.js';
import { useCreateBoard, useUpdateBoard } from './queries.js';
import { boardSchema, boardDefaultValues } from './schemas.js';

/**
 * BoardForm — formulario contenedor para crear/editar tableros.
 * React Hook Form + Zod; errores del backend dentro del formulario (RF-14);
 * botón deshabilitado con spinner mientras se guarda (RF-15).
 * El padre debe montarlo con `key` para reiniciar el formulario al cambiar
 * de tablero (evita useEffect presentacional).
 */
export default function BoardForm({ open, board, onClose }) {
  const isEdit = Boolean(board);
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(boardSchema),
    defaultValues: board
      ? { name: board.name, description: board.description ?? '' }
      : boardDefaultValues,
  });

  async function onSubmit(values) {
    try {
      if (isEdit) {
        await updateBoard.mutateAsync({ boardId: board._id, data: values });
      } else {
        await createBoard.mutateAsync(values);
      }
      onClose();
    } catch (error) {
      mapApiErrorToForm(error, setError);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar tablero' : 'Crear tablero'}
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
          placeholder="Mi tablero"
          error={errors.name?.message}
          {...register('name')}
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
