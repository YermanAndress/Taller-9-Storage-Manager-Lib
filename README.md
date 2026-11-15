# Storage Manager

Librería Angular para administrar información mediante las APIs nativas
**LocalStorage** y **Cache Storage**. El repositorio incluye la librería y una
aplicación Showcase para demostrar su uso.

## Integrantes

- Nicolle Daniela Valverde Gallego
- German Andres Rojas Cardona
- Angela Patricia Aponte Escudero

## Tecnologías

- Angular 22 y TypeScript.
- Bun como gestor de paquetes y ejecutor de comandos.
- Vitest para pruebas unitarias.
- ng-packagr para construir la librería.

## Estructura

```text
projects/storage-manager/   # Librería reutilizable
src/                         # Aplicación Showcase
dist/storage-manager/       # Paquete compilado
```

## Instalación y ejecución

```bash
bun install
bunx ng build storage-manager
bun start
```

Abre [http://localhost:4200](http://localhost:4200) para utilizar el
Showcase. La aplicación demuestra guardar, consultar, actualizar, verificar y
eliminar información de LocalStorage, además de administrar recursos de Cache
Storage.

## Uso de la librería

Los servicios se importan desde la API pública:

```typescript
import { CacheStorageService, LocalStorageService } from 'storage-manager';
```

### LocalStorageService

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService } from 'storage-manager';

@Component({
  selector: 'app-example',
  template: '<p>Ejemplo de almacenamiento</p>',
})
export class ExampleComponent {
  private readonly storage = inject(LocalStorageService);

  saveUser(): void {
    this.storage.set('user', { name: 'Ana', age: 25 });
  }

  readUser(): void {
    const user = this.storage.get<{ name: string; age: number }>('user');
    console.log(user);
  }
}
```

Métodos disponibles:

| Método                  | Descripción                                       |
| ----------------------- | ------------------------------------------------- |
| `set<T>(key, value)`    | Guarda o sobrescribe un valor usando JSON.        |
| `get<T>(key)`           | Consulta un valor y devuelve `null` si no existe. |
| `update<T>(key, value)` | Actualiza una clave existente.                    |
| `has(key)`              | Verifica si una clave existe.                     |
| `remove(key)`           | Elimina una clave.                                |
| `clear()`               | Limpia el almacenamiento.                         |

Los errores se reportan mediante `StorageError`:

```typescript
import { StorageError } from 'storage-manager';

try {
  this.storage.set('data', value);
} catch (error) {
  if (error instanceof StorageError) {
    console.error(error.operation, error.key, error.message);
  }
}
```

El servicio también permite configurar un prefijo para evitar colisiones:

```typescript
import { LOCAL_STORAGE_OPTIONS } from 'storage-manager';

export const appConfig = {
  providers: [
    {
      provide: LOCAL_STORAGE_OPTIONS,
      useValue: { prefix: 'my-app_' },
    },
  ],
};
```

### CacheStorageService

Todas sus operaciones son asíncronas:

```typescript
import { CacheStorageService } from 'storage-manager';

export class ExampleService {
  constructor(private readonly cache: CacheStorageService) {}

  async saveResource(): Promise<void> {
    await this.cache.put(
      'app-cache',
      '/api/config',
      new Response(JSON.stringify({ enabled: true })),
    );
  }

  async readResource(): Promise<string | undefined> {
    const response = await this.cache.match('app-cache', '/api/config');
    return response ? response.text() : undefined;
  }
}
```

Métodos disponibles:

| Método                              | Descripción                        |
| ----------------------------------- | ---------------------------------- |
| `open(cacheName)`                   | Abre o crea una caché.             |
| `put(cacheName, request, response)` | Guarda una respuesta.              |
| `match(cacheName, request)`         | Consulta una respuesta almacenada. |
| `has(cacheName, request)`           | Verifica si existe un recurso.     |
| `delete(cacheName, request)`        | Elimina un recurso.                |
| `deleteCache(cacheName)`            | Elimina una caché completa.        |
| `keys()`                            | Lista las cachés disponibles.      |

## API pública

`projects/storage-manager/src/public-api.ts` expone:

- `LocalStorageService`.
- `CacheStorageService`.
- `StorageError` y `StorageOperation`.
- `StorageOptions` y `LOCAL_STORAGE_OPTIONS`.

Las implementaciones internas y las pruebas no forman parte de la API pública.

## Pruebas y cobertura

Pruebas de la librería:

```bash
bunx ng test storage-manager --no-watch
```

Pruebas del Showcase:

```bash
bunx ng test --no-watch
```

Para generar cobertura:

```bash
bun add --dev @vitest/coverage-v8
bunx ng test storage-manager --no-watch --coverage
```

## Documentación con Compodoc

```bash
bun add --dev @compodoc/compodoc
bunx compodoc -p tsconfig.json -d documentation
bunx compodoc -s -d documentation
```

## Construcción y publicación

Construye la librería con:

```bash
bunx ng build storage-manager
```

El resultado queda en `dist/storage-manager`. Después de revisar y actualizar
la versión de `projects/storage-manager/package.json`, puedes publicar el
paquete:

```bash
cd dist/storage-manager
bun publish
```

Luego puede instalarse en otro proyecto Angular con:

```bash
bun add storage-manager
```

Cache Storage suele requerir HTTPS o un entorno local como `localhost`.

## Licencia

Proyecto académico para la asignatura Arquitectura de Software de la Unidad
Central del Valle del Cauca.
