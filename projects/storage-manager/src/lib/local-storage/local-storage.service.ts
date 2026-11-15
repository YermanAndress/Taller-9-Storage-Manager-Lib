import { Injectable, inject } from '@angular/core';
import { LOCAL_STORAGE_OPTIONS } from './models/storage-options';
import { StorageError, StorageOperation } from './models/storage-error';

/**
 * Servicio tipado para administrar información en `localStorage`.
 *
 * - Los valores (primitivos, objetos y arreglos) se guardan serializados con JSON.
 * - Una clave inexistente devuelve `null` al consultarla.
 * - Cualquier fallo (cuota, acceso bloqueado, JSON inválido) se reporta
 *   como {@link StorageError}.
 *
 * @example
 * const storage = inject(LocalStorageService);
 * storage.set('user', { name: 'Ana' });
 * const user = storage.get<{ name: string }>('user');
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {
  private readonly prefix = inject(LOCAL_STORAGE_OPTIONS, { optional: true })?.prefix ?? '';

  /**
   * Guarda un valor bajo una clave. Si la clave ya existe, se sobrescribe.
   *
   * @param key Clave del elemento.
   * @param value Valor a guardar. No puede ser `null` ni `undefined`.
   * @throws {StorageError} Si el valor es nulo, no es serializable o localStorage falla.
   */
  set<T>(key: string, value: T): void {
    if (value === null || value === undefined) {
      throw new StorageError('No se puede guardar un valor null o undefined.', 'set', key);
    }
    const serialized = this.serialize(value, key);
    this.run('set', key, (storage) => storage.setItem(this.fullKey(key), serialized));
  }

  /**
   * Consulta el valor asociado a una clave.
   *
   * @param key Clave del elemento.
   * @returns El valor deserializado, o `null` si la clave no existe.
   * @throws {StorageError} Si el contenido no es JSON válido o localStorage falla.
   */
  get<T>(key: string): T | null {
    const raw = this.run('get', key, (storage) => storage.getItem(this.fullKey(key)));
    if (raw === null) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      throw new StorageError(`El valor de "${key}" no es JSON válido.`, 'deserialize', key, error);
    }
  }

  /**
   * Actualiza el valor de una clave que ya existe.
   *
   * @param key Clave del elemento.
   * @param value Nuevo valor.
   * @throws {StorageError} Si la clave no existe o la escritura falla.
   */
  update<T>(key: string, value: T): void {
    if (!this.has(key)) {
      throw new StorageError(`La clave "${key}" no existe.`, 'update', key);
    }
    this.set(key, value);
  }

  /**
   * Elimina un elemento. Si la clave no existe, no hace nada.
   *
   * @param key Clave del elemento.
   * @throws {StorageError} Si localStorage falla.
   */
  remove(key: string): void {
    this.run('remove', key, (storage) => storage.removeItem(this.fullKey(key)));
  }

  /**
   * Indica si existe una clave.
   *
   * @param key Clave a verificar.
   * @throws {StorageError} Si localStorage falla.
   */
  has(key: string): boolean {
    return this.run('has', key, (storage) => storage.getItem(this.fullKey(key))) !== null;
  }

  /**
   * Limpia el almacenamiento.
   * Con prefijo configurado elimina solo las claves que lo usan;
   * sin prefijo vacía todo `localStorage`.
   *
   * @throws {StorageError} Si localStorage falla.
   */
  clear(): void {
    this.run('clear', undefined, (storage) => {
      if (this.prefix === '') {
        storage.clear();
        return;
      }
      Object.keys(storage)
        .filter((key) => key.startsWith(this.prefix))
        .forEach((key) => storage.removeItem(key));
    });
  }

  private fullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private serialize(value: unknown, key: string): string {
    let serialized: string | undefined;
    try {
      serialized = JSON.stringify(value);
    } catch (error) {
      throw new StorageError(`No se pudo serializar el valor de "${key}".`, 'serialize', key, error);
    }
    if (serialized === undefined) {
      // JSON.stringify devuelve undefined para funciones y símbolos.
      throw new StorageError(`El valor de "${key}" no es serializable.`, 'serialize', key);
    }
    return serialized;
  }

  /** Ejecuta una operación sobre localStorage convirtiendo cualquier fallo en StorageError. */
  private run<R>(operation: StorageOperation, key: string | undefined, action: (storage: Storage) => R): R {
    try {
      return action(globalThis.localStorage);
    } catch (error) {
      throw new StorageError(`Falló la operación "${operation}" en localStorage.`, operation, key, error);
    }
  }
}