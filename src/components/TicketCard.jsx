import { useState } from 'react';
import Button from './Button.jsx';

/**
 * TicketCard — tarjeta de ticket. (docs/SPEC.md §9)
 * Presentacional: SIN useEffect ni llamadas a la API.
 *
 * - Drag & drop nativo (HTML5): `draggable` + `onDragStart` publica
 *   `{ ticketId, fromColumnId }` en el dataTransfer.
 * - Menú "Mover a…": alternativa accesible con teclado (RNF-02 / CA-09).
 */
export default function TicketCard({
  ticket,
  columns = [],
  onEdit,
  onDelete,
  onMove,
  isBusy = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleDragStart(e) {
    const payload = JSON.stringify({ ticketId: ticket._id, fromColumnId: ticket.column });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.effectAllowed = 'move';
  }

  // Destinos posibles: todas las columnas menos la actual
  const destinations = columns.filter((c) => c._id !== ticket.column);

  return (
    <article
      className={`ticket-card${isBusy ? ' ticket-card--busy' : ''}`}
      draggable={!isBusy}
      onDragStart={handleDragStart}
      aria-label={`Ticket ${ticket.title}`}
    >
      <h4 className="ticket-card__title">{ticket.title}</h4>
      {ticket.description && (
        <p className="ticket-card__description">{ticket.description}</p>
      )}
      <div className="ticket-card__actions">
        <Button
          variant="ghost"
          iconOnly
          onClick={() => onEdit?.(ticket)}
          disabled={isBusy}
          aria-label={`Editar ticket ${ticket.title}`}
          title="Editar"
        >
          ✎
        </Button>
        <Button
          variant="ghost"
          iconOnly
          onClick={() => onDelete?.(ticket)}
          disabled={isBusy}
          aria-label={`Eliminar ticket ${ticket.title}`}
          title="Eliminar"
        >
          🗑
        </Button>
        <Button
          variant="ghost"
          onClick={() => setMenuOpen((v) => !v)}
          disabled={isBusy || destinations.length === 0}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          title="Mover a otra columna"
        >
          Mover a…
        </Button>
      </div>
      {menuOpen && (
        <div className="ticket-card__menu" role="menu" aria-label="Mover ticket a…">
          <span className="ticket-card__menu-label">Mover a…</span>
          {destinations.map((col) => (
            <button
              key={col._id}
              type="button"
              role="menuitem"
              className="ticket-card__menu-item"
              onClick={() => {
                setMenuOpen(false);
                onMove?.(col._id);
              }}
            >
              {col.name}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
