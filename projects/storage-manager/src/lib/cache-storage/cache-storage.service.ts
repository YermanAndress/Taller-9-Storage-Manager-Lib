import { Injectable } from '@angular/core';

/**
 * Provides a typed interface for the browser Cache Storage API.
 *
 * Every operation receives the cache name explicitly so consumers can work
 * with more than one cache without managing the native CacheStorage object.
 */
@Injectable({ providedIn: 'root' })
export class CacheStorageService {
  /**
   * Opens an existing cache or creates it when it does not exist.
   */
  open(cacheName: string): Promise<Cache> {
    return this.getCacheStorage().open(cacheName);
  }

  /**
   * Stores a response in a cache under the given request key.
   */
  async put(cacheName: string, request: RequestInfo, response: Response): Promise<void> {
    const cache = await this.open(cacheName);
    await cache.put(request, response);
  }

  /**
   * Returns the cached response for a request, or undefined when it is absent.
   */
  async match(cacheName: string, request: RequestInfo): Promise<Response | undefined> {
    const cache = await this.open(cacheName);
    return cache.match(request);
  }

  /**
   * Indicates whether a request has a matching cached response.
   */
  async has(cacheName: string, request: RequestInfo): Promise<boolean> {
    return (await this.match(cacheName, request)) !== undefined;
  }

  /**
   * Deletes a request from a cache.
   */
  async delete(cacheName: string, request: RequestInfo): Promise<boolean> {
    const cache = await this.open(cacheName);
    return cache.delete(request);
  }

  /**
   * Deletes an entire cache and returns whether it existed.
   */
  deleteCache(cacheName: string): Promise<boolean> {
    return this.getCacheStorage().delete(cacheName);
  }

  /**
   * Returns the names of all caches available to the current origin.
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
