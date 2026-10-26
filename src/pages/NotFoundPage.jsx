import { Link } from 'react-router-dom';

/**
 * NotFoundPage — ruta inexistente (*). (docs/SPEC.md §5)
 */
export default function NotFoundPage() {
  return (
    <main>
      <div className="state-block">
        <span className="state-block__icon" aria-hidden="true">
          ?
        </span>
        <h1>Página no encontrada</h1>
        <p className="state-block__text">
          La dirección que buscás no existe en DevBoard.
        </p>
        <Link className="btn btn--primary" to="/boards">
          Ir a mis tableros
        </Link>
      </div>
    </main>
  );
}
