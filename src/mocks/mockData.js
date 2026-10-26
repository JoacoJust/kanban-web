/**
 * mockData.js — datos sintéticos con la forma REAL de la API. (docs/SPEC.md §8)
 * 2 tableros: uno con tickets (incluyendo una columna vacía) y uno sin tickets.
 * IDs de 24 caracteres hexadecimales, como los ObjectIds del backend.
 */

const T0 = '2026-01-05T10:00:00.000Z';
const T1 = '2026-01-06T09:30:00.000Z';
const T2 = '2026-01-07T18:45:00.000Z';

export const mockBoards = [
  {
    _id: '653f1a2b9c8d7e6f5a4b3c2d',
    name: 'Proyecto DevBoard',
    description: 'Tablero de ejemplo con tickets de prueba.',
    createdAt: T0,
    updatedAt: T2,
  },
  {
    _id: '653f1a2b9c8d7e6f5a4b4c2d',
    name: 'Infraestructura del equipo',
    description: 'Tablero sin tickets: sirve para probar estados vacíos.',
    createdAt: T1,
    updatedAt: T1,
  },
];

export const mockColumns = [
  // Tablero DevBoard
  { _id: '653f1a2b9c8d7e6f5a4b3c01', name: 'Qué hacer', board: '653f1a2b9c8d7e6f5a4b3c2d', position: 0, createdAt: T0, updatedAt: T0 },
  { _id: '653f1a2b9c8d7e6f5a4b3c02', name: 'Haciendo', board: '653f1a2b9c8d7e6f5a4b3c2d', position: 1, createdAt: T0, updatedAt: T0 },
  { _id: '653f1a2b9c8d7e6f5a4b3c03', name: 'Hecho', board: '653f1a2b9c8d7e6f5a4b3c2d', position: 2, createdAt: T0, updatedAt: T0 },
  // Tablero Infraestructura (también vacío)
  { _id: '653f1a2b9c8d7e6f5a4b4c01', name: 'Qué hacer', board: '653f1a2b9c8d7e6f5a4b4c2d', position: 0, createdAt: T1, updatedAt: T1 },
  { _id: '653f1a2b9c8d7e6f5a4b4c02', name: 'Haciendo', board: '653f1a2b9c8d7e6f5a4b4c2d', position: 1, createdAt: T1, updatedAt: T1 },
  { _id: '653f1a2b9c8d7e6f5a4b4c03', name: 'Hecho', board: '653f1a2b9c8d7e6f5a4b4c2d', position: 2, createdAt: T1, updatedAt: T1 },
];

export const mockTickets = [
  {
    _id: '653f1a2b9c8d7e6f5a4b3e01',
    title: 'Definir wireframes',
    description: 'Bocetos de las dos pantallas principales.',
    column: '653f1a2b9c8d7e6f5a4b3c01',
    board: '653f1a2b9c8d7e6f5a4b3c2d',
    position: 0,
    createdAt: T0,
    updatedAt: T0,
  },
  {
    _id: '653f1a2b9c8d7e6f5a4b3e02',
    title: 'Preparar backlog del sprint',
    description: '',
    column: '653f1a2b9c8d7e6f5a4b3c01',
    board: '653f1a2b9c8d7e6f5a4b3c2d',
    position: 1,
    createdAt: T0,
    updatedAt: T0,
  },
  {
    _id: '653f1a2b9c8d7e6f5a4b3e03',
    title: 'Implementar capa de servicio',
    description: 'httpClient, errors y boardService.',
    column: '653f1a2b9c8d7e6f5a4b3c02',
    board: '653f1a2b9c8d7e6f5a4b3c2d',
    position: 0,
    createdAt: T1,
    updatedAt: T1,
  },
  {
    _id: '653f1a2b9c8d7e6f5a4b3e04',
    title: 'Revisar contraste de la paleta',
    description: 'Verificar AA en ambos modos.',
    column: '653f1a2b9c8d7e6f5a4b3c02',
    board: '653f1a2b9c8d7e6f5a4b3c2d',
    position: 1,
    createdAt: T1,
    updatedAt: T1,
  },
];

/**
 * Devuelve una copia profunda e independiente de la base simulada.
 * Estructura plana equivalente a MongoDB (boards / columns / tickets).
 */
export function createMockDatabase() {
  return structuredClone({ boards: mockBoards, columns: mockColumns, tickets: mockTickets });
}
