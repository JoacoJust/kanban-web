import { useState } from 'react';
import Button from './Button.jsx';

/**
 * ColumnCard — columna del Kanban. (docs/SPEC.md §9)
 * Presentacional: recibe `column`, `children` (tickets) y callbacks.
 * El drag & drop usa la API nativa de HTML5 (SPEC §9): aquí sólo se maneja
 * el highlight visual local y la lectura del `dataTransfer` al soltar.
 */
export default function ColumnCard({
  column,
  children,
  onRename,
  onDelete,
  onAddTicket,
  onDropTicket,
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const ticketCount = Array.isArray(column.tickets) ? column.tickets.length : 0;

  function handleDragOver(e) {
    e.preventDefault();
    setIsDropTarget(true);
  }

  function handleDragLeave(e) {
    // Evita parpadear al moverse dentro de los hijos de la zona
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDropTarget(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDropTarget(false);
    try {
      const payload = JSON.parse(e.dataTransfer.getData('application/json'));
      onDropTicket?.(column._id, payload);
    } catch {
      /* payload inválido: se ignora el drop */
    }
  }

  return (
    <section
      className={`column-card${isDropTarget ? ' column-card--drop-target' : ''}`}
      aria-label={`Columna ${column.name}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <header className="column-card__header">
        <h3 className="column-card__name">{column.name}</h3>
        <span className="count-badge" aria-label={`${ticketCount} tickets`}>
          {ticketCount}
        </span>
        <div className="column-card__actions">
          <Button
            variant="ghost"
            iconOnly
            onClick={() => onAddTicket(column)}
            aria-label={`Agregar ticket en ${column.name}`}
            title="Agregar ticket"
          >
            +
          </Button>
          <Button
            variant="ghost"
            iconOnly
            onClick={() => onRename(column)}
            aria-label={`Renombrar columna ${column.name}`}
            title="Renombrar"
          >
            ✎
          </Button>
          <Button
            variant="ghost"
            iconOnly
            onClick={() => onDelete(column)}
            aria-label={`Eliminar columna ${column.name}`}
            title="Eliminar"
          >
            🗑
          </Button>
        </div>
      </header>
      <div className="column-card__tickets">
        {(!children || (Array.isArray(children) && children.length === 0)) && (
          <p className="column-card__empty">Sin tickets</p>
        )}
        {children}
      </div>
    </section>
  );
}
