import { CacheStorageService } from './cache-storage.service';

describe('CacheStorageService', () => {
  let service: CacheStorageService;
  let cache: Cache;
  let cacheStorage: CacheStorage;
  let response: Response;

  beforeEach(() => {
    response = new Response('cached content', {
      headers: { 'Content-Type': 'text/plain' },
    });

    cache = {
      add: vi.fn(),
      addAll: vi.fn(),
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(response),
      matchAll: vi.fn(),
      put: vi.fn().mockResolvedValue(undefined),
    } as unknown as Cache;

    cacheStorage = {
      delete: vi.fn().mockResolvedValue(true),
      has: vi.fn(),
      keys: vi.fn().mockResolvedValue(['app-cache']),
      match: vi.fn(),
      open: vi.fn().mockResolvedValue(cache),
    } as unknown as CacheStorage;

    vi.stubGlobal('caches', cacheStorage);
    service = new CacheStorageService();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('debería abrir una caché existente o crearla', async () => {
    await expect(service.open('app-cache')).resolves.toBe(cache);
    expect(cacheStorage.open).toHaveBeenCalledWith('app-cache');
  });

  it('debería almacenar una respuesta en una caché', async () => {
    await service.put('app-cache', '/assets/config.json', response);

    expect(cacheStorage.open).toHaveBeenCalledWith('app-cache');
    expect(cache.put).toHaveBeenCalledWith('/assets/config.json', response);
  });

  it('debería devolver una respuesta almacenada', async () => {
    await expect(service.match('app-cache', '/assets/config.json')).resolves.toBe(response);

    expect(cache.match).toHaveBeenCalledWith('/assets/config.json');
  });

  it('debería devolver undefined cuando la respuesta no existe', async () => {
    vi.mocked(cache.match).mockResolvedValueOnce(undefined);

    await expect(service.match('app-cache', '/missing.json')).resolves.toBeUndefined();
  });

  it('debería indicar si una solicitud existe en la caché', async () => {
    await expect(service.has('app-cache', '/assets/config.json')).resolves.toBe(true);

    vi.mocked(cache.match).mockResolvedValueOnce(undefined);

    await expect(service.has('app-cache', '/missing.json')).resolves.toBe(false);
  });

  it('debería eliminar una solicitud de una caché', async () => {
    await expect(service.delete('app-cache', '/assets/config.json')).resolves.toBe(true);

    expect(cache.delete).toHaveBeenCalledWith('/assets/config.json');
  });

  it('debería devolver false cuando la solicitud no fue eliminada', async () => {
    vi.mocked(cache.delete).mockResolvedValueOnce(false);

    await expect(service.delete('app-cache', '/missing.json')).resolves.toBe(false);
  });

  it('debería eliminar una caché completa', async () => {
    await expect(service.deleteCache('app-cache')).resolves.toBe(true);
    expect(cacheStorage.delete).toHaveBeenCalledWith('app-cache');
  });

  it('debería devolver false cuando la caché no existe', async () => {
    vi.mocked(cacheStorage.delete).mockResolvedValueOnce(false);

    await expect(service.deleteCache('missing-cache')).resolves.toBe(false);
  });

  it('debería listar los nombres de todas las cachés', async () => {
    await expect(service.keys()).resolves.toEqual(['app-cache']);
    expect(cacheStorage.keys).toHaveBeenCalledOnce();
  });

  it('debería rechazar cuando falla una operación de Cache Storage', async () => {
    const error = new Error('Unable to open cache');
    vi.mocked(cacheStorage.open).mockRejectedValueOnce(error);

    await expect(service.open('app-cache')).rejects.toThrow(error);
  });

  it('debería rechazar cuando Cache Storage no está disponible', async () => {
    vi.stubGlobal('caches', undefined);

    expect(() => service.keys()).toThrow('Cache Storage is not available in this environment.');
  });
});
