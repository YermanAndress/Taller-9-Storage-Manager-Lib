# Storage Manager

Librería Angular para administrar información mediante LocalStorage y Cache
Storage.

## Instalación

```bash
bun add storage-manager
```

## Importación

```typescript
import {
  CacheStorageService,
  LocalStorageService,
} from 'storage-manager';
```

## LocalStorageService

```typescript
const storage = inject(LocalStorageService);

storage.set('user', { name: 'Ana', age: 25 });
const user = storage.get<{ name: string; age: number }>('user');
storage.update('user', { name: 'Ana', age: 26 });
const exists = storage.has('user');
storage.remove('user');
storage.clear();
```

Los valores se serializan con JSON. Una clave inexistente devuelve `null` y los
errores se reportan mediante `StorageError`.

## CacheStorageService

Las operaciones son asíncronas:

```typescript
const cache = inject(CacheStorageService);

await cache.put(
  'app-cache',
  '/api/config',
  new Response(JSON.stringify({ enabled: true })),
);

const response = await cache.match('app-cache', '/api/config');
```

Métodos disponibles:

- `open(cacheName)`
- `put(cacheName, request, response)`
- `match(cacheName, request)`
- `has(cacheName, request)`
- `delete(cacheName, request)`
- `deleteCache(cacheName)`
- `keys()`

## Construcción

Desde la raíz del proyecto:

```bash
bunx ng build storage-manager
```

El paquete compilado se genera en `dist/storage-manager`.

## Pruebas

```bash
bunx ng test storage-manager --no-watch
```

Para consultar la documentación general del proyecto, revisa el README de la
raíz del repositorio.
