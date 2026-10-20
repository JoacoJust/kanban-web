import { z } from 'zod';

/**
 * Esquema Zod del formulario de tablero.
 * Límites replicados del backend (SPEC.md §3, AGENTS.md §6).
 * `description` acepta vacío para poder borrarla (REVIEW.md A-2, aprobado).
 */
export const boardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z
    .string()
    .trim()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
});

export const boardDefaultValues = { name: '', description: '' };
