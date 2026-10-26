import { createMockDatabase } from './mockData.js';

/**
 * mockAdapter.js — adaptador de Axios en memoria. (docs/SPEC.md §8)
 * Responde según el contrato de SPEC.md §2, incluyendo los errores reales:
 * mover a una columna inexistente responde 404 (para probar el rollback).
 * Se activa solo con VITE_USE_MOCKS=true (ver httpClient.js).
 */

const db = createMockDatabase();
const DELAY_MS = 250;
const OID = /^[0-9a-fA-F]{24}$/;

/* ------------------------------ Helpers ------------------------------ */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ok = (config, status, data) => ({
  data,
  status,
  statusText: String(status),
  headers: {},
  config,
});

function httpError(status, message) {
  const error = new Error(message);
  error.isAxiosError = true;
  error.response = { status, data: { error: message }, headers: {}, config: {} };
  return error;
}

const now = () => new Date().toISOString();

function newId() {
  let id = '';
  for (let i = 0; i < 24; i += 1) id += Math.floor(Math.random() * 16).toString(16);
  return id;
}

function pick(obj, keys) {
  const out = {};
  for (const key of keys) if (obj[key] !== undefined) out[key] = obj[key];
  return out;
}

const byPosition = (a, b) =>
  a.position - b.position || new Date(a.createdAt) - new Date(b.createdAt);

const nextPosition = (items, filter) =>
  items.filter(filter).length;

/* ------------------------------ Serialización ------------------------------ */

function boardSummary(board) {
  const { columns: _omit, ...rest } = board; // GET /api/boards no incluye columnas
  return rest;
}

function boardWithColumns(boardId) {
  const board = db.boards.find((b) => b._id === boardId);
  if (!board) return null;
  const columns = db.columns
    .filter((c) => c.board === boardId)
    .sort(byPosition)
    .map((column) => ({
      ...column,
      tickets: db.tickets
        .filter((t) => t.column === column._id)
        .sort(byPosition),
    }));
  return { ...board, columns };
}

/* ------------------------------ Endpoints ------------------------------ */

function handleBoards(config, method, body) {
  if (method === 'get') {
    return ok(config, 200, [...db.boards].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(boardSummary));
  }
  if (method === 'post') {
    if (!body.name || body.name.trim().length === 0) {
      throw httpError(400, 'El nombre del tablero es obligatorio');
    }
    const board = { _id: newId(), name: body.name.trim(), description: body.description ?? '', createdAt: now(), updatedAt: now() };
    db.boards.push(board);
    const names = ['Qué hacer', 'Haciendo', 'Hecho'];
    names.forEach((name, i) => {
      db.columns.push({ _id: newId(), name, board: board._id, position: i, createdAt: now(), updatedAt: now() });
    });
    return ok(config, 201, boardWithColumns(board._id));
  }
  throw httpError(405, 'Método no soportado');
}

function handleBoard(config, method, body, boardId) {
  if (!OID.test(boardId)) throw httpError(400, 'El parámetro boardId tiene un formato inválido');
  const board = db.boards.find((b) => b._id === boardId);
  if (!board) throw httpError(404, 'Tablero no encontrado');

  if (method === 'get') return ok(config, 200, boardWithColumns(boardId));
  if (method === 'patch') {
    const data = pick(body, ['name', 'description']);
    if (Object.keys(data).length === 0) throw httpError(400, 'Debe proporcionar al menos un campo para actualizar');
    Object.assign(board, data, { updatedAt: now() });
    return ok(config, 200, boardSummary(board));
  }
  if (method === 'delete') {
    db.boards.splice(db.boards.indexOf(board), 1);
    db.columns = db.columns.filter((c) => c.board !== boardId);
    db.tickets = db.tickets.filter((t) => t.board !== boardId);
    return ok(config, 204, '');
  }
  throw httpError(405, 'Método no soportado');
}

function handleColumns(config, method, body, boardId) {
  if (!OID.test(boardId)) throw httpError(400, 'El parámetro boardId tiene un formato inválido');
  if (!db.boards.some((b) => b._id === boardId)) throw httpError(404, 'Tablero no encontrado');

  if (method === 'get') {
    return ok(config, 200, db.columns.filter((c) => c.board === boardId).sort(byPosition));
  }
  if (method === 'post') {
    if (!body.name || body.name.trim().length === 0) throw httpError(400, 'El nombre de la columna es obligatorio');
    const column = {
      _id: newId(),
      name: body.name.trim(),
      board: boardId,
      position: body.position ?? nextPosition(db.columns, (c) => c.board === boardId),
      createdAt: now(),
      updatedAt: now(),
    };
    db.columns.push(column);
    return ok(config, 201, column);
  }
  throw httpError(405, 'Método no soportado');
}

function loadColumn(columnId, boardId) {
  if (!OID.test(columnId)) throw httpError(400, 'El parámetro columnId tiene un formato inválido');
  const column = db.columns.find((c) => c._id === columnId);
  if (!column || column.board !== boardId) throw httpError(404, 'Columna no encontrada'); // aislamiento
  return column;
}

function handleColumn(config, method, body, boardId, columnId) {
  const column = loadColumn(columnId, boardId);

  if (method === 'get') return ok(config, 200, column);
  if (method === 'patch') {
    const data = pick(body, ['name', 'position']);
    if (Object.keys(data).length === 0) throw httpError(400, 'Debe proporcionar al menos un campo para actualizar');
    Object.assign(column, data, { updatedAt: now() });
    return ok(config, 200, column);
  }
  if (method === 'delete') {
    db.columns.splice(db.columns.indexOf(column), 1);
    db.tickets = db.tickets.filter((t) => t.column !== columnId);
    return ok(config, 204, '');
  }
  throw httpError(405, 'Método no soportado');
}

function handleTickets(config, method, body, boardId, columnId) {
  loadColumn(columnId, boardId);

  if (method === 'get') {
    return ok(config, 200, db.tickets.filter((t) => t.column === columnId).sort(byPosition));
  }
  if (method === 'post') {
    if (!body.title) throw httpError(400, 'El título del ticket es obligatorio');
    const ticket = {
      _id: newId(),
      title: body.title.trim(),
      description: body.description ?? '',
      column: columnId,
      board: boardId,
      position: body.position ?? nextPosition(db.tickets, (t) => t.column === columnId),
      createdAt: now(),
      updatedAt: now(),
    };
    db.tickets.push(ticket);
    return ok(config, 201, ticket);
  }
  throw httpError(405, 'Método no soportado');
}

function handleTicket(config, method, body, boardId, columnId, ticketId) {
  loadColumn(columnId, boardId);
  if (!OID.test(ticketId)) throw httpError(400, 'El parámetro ticketId tiene un formato inválido');
  const ticket = db.tickets.find((t) => t._id === ticketId && t.board === boardId);
  if (!ticket) throw httpError(404, 'Ticket no encontrado');

  if (method === 'get') return ok(config, 200, ticket);

  if (method === 'patch') {
    const data = pick(body, ['title', 'description', 'position', 'columnId']);
    if (Object.keys(data).length === 0) throw httpError(400, 'Debe proporcionar al menos un campo para actualizar');

    if (data.columnId) {
      if (!OID.test(data.columnId)) throw httpError(400, 'El columnId tiene un formato inválido');
      const target = db.columns.find((c) => c._id === data.columnId);
      if (!target) throw httpError(404, 'Columna destino no encontrada');
      if (target.board !== boardId) throw httpError(400, 'La columna destino pertenece a otro tablero');

      const isInSource = ticket.column === columnId;
      const isInTarget = ticket.column === data.columnId;
      if (!isInSource && !isInTarget) throw httpError(404, 'Ticket no encontrado en esta columna');

      // Movimiento real sin posición explícita: al final de la columna destino
      if (isInSource && !isInTarget && data.position === undefined) {
        data.position = nextPosition(db.tickets, (t) => t.column === data.columnId);
      }
      ticket.column = data.columnId;
    }
    const { columnId: _omit, ...rest } = data;
    Object.assign(ticket, rest, { updatedAt: now() });
    return ok(config, 200, ticket);
  }

  if (method === 'delete') {
    db.tickets.splice(db.tickets.indexOf(ticket), 1);
    return ok(config, 204, '');
  }
  throw httpError(405, 'Método no soportado');
}

/* ------------------------------ Adaptador ------------------------------ */

const ROUTES = [
  { re: /^\/api\/boards$/, fn: (c, m, b) => handleBoards(c, m, b) },
  { re: /^\/api\/boards\/([^/]+)$/, fn: (c, m, b, [id]) => handleBoard(c, m, b, id) },
  { re: /^\/api\/boards\/([^/]+)\/columns$/, fn: (c, m, b, [id]) => handleColumns(c, m, b, id) },
  { re: /^\/api\/boards\/([^/]+)\/columns\/([^/]+)$/, fn: (c, m, b, [id, cid]) => handleColumn(c, m, b, id, cid) },
  { re: /^\/api\/boards\/([^/]+)\/columns\/([^/]+)\/tickets$/, fn: (c, m, b, [id, cid]) => handleTickets(c, m, b, id, cid) },
  { re: /^\/api\/boards\/([^/]+)\/columns\/([^/]+)\/tickets\/([^/]+)$/, fn: (c, m, b, [id, cid, tid]) => handleTicket(c, m, b, id, cid, tid) },
];

export async function mockAdapter(config) {
  await delay(DELAY_MS); // simula latencia de red

  const method = (config.method || 'get').toLowerCase();
  const path = config.url || '';
  let body = {};
  if (typeof config.data === 'string' && config.data) {
    try {
      body = JSON.parse(config.data);
    } catch {
      throw httpError(400, 'JSON malformado en el cuerpo de la solicitud');
    }
  }

  const route = ROUTES.find((r) => r.re.test(path));
  if (!route) throw httpError(404, 'Ruta no encontrada');

  const [, ...groups] = path.match(route.re);
  return route.fn(config, method, body, groups);
}
