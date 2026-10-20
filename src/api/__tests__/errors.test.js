import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, mapApiErrorToForm } from '../errors.js';

describe('mapApiErrorToForm — mapeo de errores del backend a campos', () => {
  it('mapea 400 con "título" al campo title', () => {
    const setError = vi.fn();
    const mapped = mapApiErrorToForm(
      new ApiClientError('El título del ticket es obligatorio', 400),
      setError
    );

    expect(mapped).toBe(true);
    expect(setError).toHaveBeenCalledWith('title', {
      type: 'server',
      message: 'El título del ticket es obligatorio',
    });
  });

  it('mapea 400 con "nombre" al campo name', () => {
    const setError = vi.fn();
    mapApiErrorToForm(
      new ApiClientError('El nombre del tablero es obligatorio', 400),
      setError
    );

    expect(setError).toHaveBeenCalledWith('name', expect.objectContaining({
      message: 'El nombre del tablero es obligatorio',
    }));
  });

  it('mapea 400 con "descripción" al campo description', () => {
    const setError = vi.fn();
    mapApiErrorToForm(
      new ApiClientError('La descripción no puede exceder 500 caracteres', 400),
      setError
    );

    expect(setError).toHaveBeenCalledWith('description', expect.anything());
  });

  it('mapea 409 con palabra clave igual que 400', () => {
    const setError = vi.fn();
    mapApiErrorToForm(
      new ApiClientError('El campo nombre ya existe', 409),
      setError
    );

    expect(setError).toHaveBeenCalledWith('name', expect.anything());
  });

  it('sin coincidencia de campo, asigna el error general root.server', () => {
    const setError = vi.fn();
    mapApiErrorToForm(
      new ApiClientError('Debe proporcionar al menos un campo para actualizar', 400),
      setError
    );

    expect(setError).toHaveBeenCalledWith('root.server', {
      type: 'server',
      message: 'Debe proporcionar al menos un campo para actualizar',
    });
  });

  it('no asigna 404 a campos (va a Toast / estado de error)', () => {
    const setError = vi.fn();
    const mapped = mapApiErrorToForm(
      new ApiClientError('Tablero no encontrado', 404),
      setError
    );

    expect(mapped).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('no asigna 500 ni errores de red a campos', () => {
    const setError = vi.fn();

    expect(
      mapApiErrorToForm(new ApiClientError('Error interno del servidor', 500), setError)
    ).toBe(false);
    expect(
      mapApiErrorToForm(
        new ApiClientError('No se pudo conectar con el servidor', null, true),
        setError
      )
    ).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it('ignora errores que no son ApiClientError', () => {
    const setError = vi.fn();
    expect(mapApiErrorToForm(new Error('boom'), setError)).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
