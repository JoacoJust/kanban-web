import { Link } from 'react-router-dom';
import Button from './Button.jsx';

/**
 * BoardCard — tarjeta de tablero en la lista. (docs/SPEC.md §9)
 * Presentacional.
 *
 * Nota de revisión (docs/REVIEW.md, I-3/A-3): SPEC §9 lista la prop `onOpen`,
 * pero AGENTS §10.1/§7 exigen navegar con `<Link>` y reservan `useNavigate`
 * para mutaciones exitosas. Por eso la apertura se resuelve declarativamente
 * con `<Link to={/boards/:id}>` dentro de la tarjeta.
 */
export default function BoardCard({ board, onEdit, onDelete }) {
  return (
    <article className="board-card">
      <h3 className="board-card__title">
        <Link to={`/boards/${board._id}`}>{board.name}</Link>
      </h3>
      {board.description && (
        <p className="board-card__description">{board.description}</p>
      )}
      <div className="board-card__actions">
        <Link
          className="btn btn--secondary"
          to={`/boards/${board._id}`}
          aria-label={`Abrir tablero ${board.name}`}
        >
          Abrir
        </Link>
        <Button variant="ghost" onClick={() => onEdit(board)}>
          Editar
        </Button>
        <Button variant="ghost" onClick={() => onDelete(board)}>
          Eliminar
        </Button>
      </div>
    </article>
  );
}
