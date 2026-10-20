import { z } from 'zod';

/** Esquema Zod del formulario de ticket (límites del backend, SPEC.md §3). */
export const ticketSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .trim()
    .max(2000, 'La descripción no puede exceder 2000 caracteres')
    .optional(),
});

export const ticketDefaultValues = { title: '', description: '' };
