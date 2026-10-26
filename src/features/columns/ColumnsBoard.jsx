import ColumnCard from '../../components/ColumnCard.jsx';
import TicketCard from '../../components/TicketCard.jsx';

const byPosition = (a, b) =>
  a.position - b.position || new Date(a.createdAt) - new Date(b.createdAt);

/**
 * ColumnsBoard — contenedor que renderiza las columnas del tablero con sus
 * tickets. Ordena defensivamente por `position` sin mutar la caché de TanStack
 * (docs/REVIEW.md I-2, aprobado). El cableado del movimiento optimista
 * llega por props desde la página (Fase 4).
 */
export default function ColumnsBoard({
  board,
  onAddTicket,
  onRenameColumn,
  onDeleteColumn,
  onEditTicket,
  onDeleteTicket,
  onMoveTicket,
  onDropTicket,
  isTicketBusy,
}) {
  const columns = [...(board.columns ?? [])].sort(byPosition);

  return (
    <div className="kanban-board">
      {columns.map((column) => {
        const tickets = [...(column.tickets ?? [])].sort(byPosition);
        return (
          <ColumnCard
            key={column._id}
            column={{ ...column, tickets }}
            onAddTicket={onAddTicket}
            onRename={onRenameColumn}
            onDelete={(col) => onDeleteColumn(col, tickets.length)}
            onDropTicket={onDropTicket}
          >
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket._id}
                ticket={ticket}
                columns={columns}
                onEdit={onEditTicket}
                onDelete={onDeleteTicket}
                onMove={(toColumnId) => onMoveTicket?.(ticket, toColumnId)}
                isBusy={isTicketBusy?.(ticket._id) ?? false}
              />
            ))}
          </ColumnCard>
        );
      })}
    </div>
  );
}
