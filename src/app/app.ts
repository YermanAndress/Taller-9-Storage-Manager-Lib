import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CacheStorageService, LocalStorageService } from 'storage-manager';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly cacheStorage = inject(CacheStorageService);
  protected readonly localStorage = inject(LocalStorageService);
  protected readonly cacheName = 'storage-manager-demo';
  protected requestUrl = '/showcase-example.txt';
  protected responseContent = 'Contenido almacenado desde el Showcase.';
  protected searchUrl = '/showcase-example.txt';
  protected readonly result = signal('Aún no se ha ejecutado ninguna operación.');
  protected readonly status = signal('Listo para probar Cache Storage.');
  protected readonly cacheNames = signal<string[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly error = signal('');
  protected localKey = 'user';
  protected localValue = '{"name":"Ana","age":25}';
  protected localReadKey = 'user';
  protected readonly localResult = signal(
    'Aún no se ha ejecutado ninguna operación.',
  );
  protected readonly localStatus = signal('Listo para probar LocalStorage.');
  protected readonly localError = signal('');

  async saveResource(): Promise<void> {
    if (!this.requestUrl.trim() || !this.responseContent.trim()) {
      this.error.set('La URL y el contenido son obligatorios.');
      return;
    }

    await this.execute(async () => {
      await this.cacheStorage.put(
        this.cacheName,
        this.requestUrl.trim(),
        new Response(this.responseContent),
      );
      this.status.set('Recurso guardado correctamente.');
      this.result.set(`Se guardó el recurso: ${this.requestUrl.trim()}`);
      await this.loadCacheNames();
    });
  }

  async readResource(): Promise<void> {
    if (!this.searchUrl.trim()) {
      this.error.set('La URL de consulta es obligatoria.');
      return;
    }

    await this.execute(async () => {
      const response = await this.cacheStorage.match(
        this.cacheName,
        this.searchUrl.trim(),
      );

      if (!response) {
        this.status.set('El recurso no fue encontrado.');
        this.result.set('No existe una respuesta almacenada para esa URL.');
        return;
      }

      this.status.set('Recurso consultado correctamente.');
      this.result.set(await response.text());
    });
  }

  async checkResource(): Promise<void> {
    if (!this.searchUrl.trim()) {
      this.error.set('La URL de consulta es obligatoria.');
      return;
    }

    await this.execute(async () => {
      const exists = await this.cacheStorage.has(
        this.cacheName,
        this.searchUrl.trim(),
      );
      this.status.set(exists ? 'El recurso existe.' : 'El recurso no existe.');
      this.result.set(exists ? 'true' : 'false');
    });
  }

  async removeResource(): Promise<void> {
    if (!this.searchUrl.trim()) {
      this.error.set('La URL de eliminación es obligatoria.');
      return;
    }

    await this.execute(async () => {
      const deleted = await this.cacheStorage.delete(
        this.cacheName,
        this.searchUrl.trim(),
      );
      this.status.set(
        deleted ? 'Recurso eliminado correctamente.' : 'El recurso no existía.',
      );
      this.result.set(deleted ? 'true' : 'false');
    });
  }

  async removeCache(): Promise<void> {
    await this.execute(async () => {
      const deleted = await this.cacheStorage.deleteCache(this.cacheName);
      this.status.set(
        deleted ? 'Caché eliminada correctamente.' : 'La caché no existía.',
      );
      this.result.set(deleted ? 'true' : 'false');
      await this.loadCacheNames();
    });
  }

  async loadCacheNames(): Promise<void> {
    await this.execute(async () => {
      this.cacheNames.set(await this.cacheStorage.keys());
      this.status.set('Cachés actualizadas.');
    });
  }

  saveLocalValue(): void {
    if (!this.localKey.trim() || !this.localValue.trim()) {
      this.localError.set('La clave y el valor son obligatorios.');
      return;
    }

    this.executeLocal(() => {
      this.localStorage.set(
        this.localKey.trim(),
        this.parseLocalValue(this.localValue),
      );
      this.localStatus.set('Valor guardado correctamente.');
      this.localResult.set(`Se guardó la clave: ${this.localKey.trim()}`);
    });
  }

  readLocalValue(): void {
    if (!this.localReadKey.trim()) {
      this.localError.set('La clave de consulta es obligatoria.');
      return;
    }

    this.executeLocal(() => {
      const value = this.localStorage.get<unknown>(this.localReadKey.trim());
      this.localStatus.set(
        value === null ? 'La clave no existe.' : 'Valor consultado correctamente.',
      );
      this.localResult.set(
        value === null ? 'null' : this.formatLocalValue(value),
      );
    });
  }

  updateLocalValue(): void {
    if (!this.localKey.trim() || !this.localValue.trim()) {
      this.localError.set('La clave y el valor son obligatorios.');
      return;
    }

    this.executeLocal(() => {
      this.localStorage.update(
        this.localKey.trim(),
        this.parseLocalValue(this.localValue),
      );
      this.localStatus.set('Valor actualizado correctamente.');
      this.localResult.set(`Se actualizó la clave: ${this.localKey.trim()}`);
    });
  }

  checkLocalValue(): void {
    if (!this.localReadKey.trim()) {
      this.localError.set('La clave de consulta es obligatoria.');
      return;
    }

    this.executeLocal(() => {
      const exists = this.localStorage.has(this.localReadKey.trim());
      this.localStatus.set(exists ? 'La clave existe.' : 'La clave no existe.');
      this.localResult.set(exists ? 'true' : 'false');
    });
  }

  removeLocalValue(): void {
    if (!this.localReadKey.trim()) {
      this.localError.set('La clave de eliminación es obligatoria.');
      return;
    }

    this.executeLocal(() => {
      const existed = this.localStorage.has(this.localReadKey.trim());
      this.localStorage.remove(this.localReadKey.trim());
      this.localStatus.set(
        existed ? 'Clave eliminada correctamente.' : 'La clave no existía.',
      );
      this.localResult.set(existed ? 'true' : 'false');
    });
  }

  clearLocalStorage(): void {
    this.executeLocal(() => {
      this.localStorage.clear();
      this.localStatus.set('LocalStorage limpiado correctamente.');
      this.localResult.set('Todas las claves fueron eliminadas.');
    });
  }

  private async execute(operation: () => Promise<void>): Promise<void> {
    this.isLoading.set(true);
    this.error.set('');

    try {
      await operation();
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Ocurrió un error inesperado.';
      this.error.set(message);
      this.status.set('La operación no pudo completarse.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private executeLocal(operation: () => void): void {
    this.localError.set('');

    try {
      operation();
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : 'Ocurrió un error inesperado.';
      this.localError.set(message);
      this.localStatus.set('La operación no pudo completarse.');
    }
  }

  private parseLocalValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private formatLocalValue(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  }
}
