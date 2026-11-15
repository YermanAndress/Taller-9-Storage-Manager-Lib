import { Injectable } from '@angular/core';

/**
 * Proporciona una interfaz tipada para la API Cache Storage del navegador.
 *
 * Cada operación recibe explícitamente el nombre de la caché para permitir
 * trabajar con varias cachés sin administrar el objeto CacheStorage nativo.
 */
@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  /**
   * Abre una caché existente o la crea cuando no existe.
   */
  open(cacheName: string): Promise<Cache> {
    return this.getCacheStorage().open(cacheName);
  }

  /**
   * Almacena una respuesta en una caché usando la solicitud indicada como clave.
   */
  async put(cacheName: string, request: RequestInfo, response: Response): Promise<void> {
    const cache = await this.open(cacheName);
    await cache.put(request, response);
  }

  /**
   * Devuelve la respuesta almacenada o undefined cuando no existe.
   */
  async match(cacheName: string, request: RequestInfo): Promise<Response | undefined> {
    const cache = await this.open(cacheName);
    return cache.match(request);
  }

  /**
   * Indica si existe una respuesta almacenada para la solicitud.
   */
  async has(cacheName: string, request: RequestInfo): Promise<boolean> {
    return (await this.match(cacheName, request)) !== undefined;
  }

  /**
   * Elimina una solicitud de una caché.
   */
  async delete(cacheName: string, request: RequestInfo): Promise<boolean> {
    const cache = await this.open(cacheName);
    return cache.delete(request);
  }

  /**
   * Elimina una caché completa e indica si existía.
   */
  deleteCache(cacheName: string): Promise<boolean> {
    return this.getCacheStorage().delete(cacheName);
  }

  /**
   * Devuelve los nombres de todas las cachés del origen actual.
   */
  keys(): Promise<string[]> {
    return this.getCacheStorage().keys();
  }

  private getCacheStorage(): CacheStorage {
    const cacheStorage = globalThis.caches;

    if (!cacheStorage) {
      throw new Error('Cache Storage is not available in this environment.');
    }

    return cacheStorage;
  }
}
