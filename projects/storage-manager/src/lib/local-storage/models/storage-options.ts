import { InjectionToken } from '@angular/core';

/**
 * Opciones de configuración del servicio de LocalStorage.
 */
export interface StorageOptions {
  /**
   * Prefijo que se antepone a todas las claves guardadas.
   * Evita colisiones con otras aplicaciones del mismo origen y permite
   * que `clear()` borre solo las claves propias.
   * @default ''
   */
  prefix?: string;
}

/**
 * Token de inyección para configurar `LocalStorageService`.
 *
 * @example
 * providers: [{ provide: LOCAL_STORAGE_OPTIONS, useValue: { prefix: 'app_' } }]
 */
export const LOCAL_STORAGE_OPTIONS = new InjectionToken<StorageOptions>('LOCAL_STORAGE_OPTIONS');