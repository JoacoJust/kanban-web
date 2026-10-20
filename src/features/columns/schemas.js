import { z } from 'zod';

/** Esquema Zod del formulario de columna (límites del backend, SPEC.md §3). */
export const columnSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
});

export const columnDefaultValues = { name: '' };
