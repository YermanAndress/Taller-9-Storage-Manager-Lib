/**
 * Operaciones del servicio de LocalStorage que pueden fallar.
 */
export type StorageOperation =
  | 'set'
  | 'get'
  | 'update'
  | 'remove'
  | 'has'
  | 'clear'
  | 'serialize'
  | 'deserialize';

/**
 * Error lanzado por los servicios de la librería cuando una operación falla.
 *
 * Permite al consumidor distinguir qué operación falló y sobre qué clave,
 * y conserva el error original en la propiedad `cause`.
 */
export class StorageError extends Error {
  /**
   * @param message Descripción legible del error.
   * @param operation Operación que falló.
   * @param key Clave involucrada (si aplica).
   * @param cause Error original (si existe).
   */
  constructor(
    message: string,
    public readonly operation: StorageOperation,
    public readonly key?: string,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = 'StorageError';
  }
}