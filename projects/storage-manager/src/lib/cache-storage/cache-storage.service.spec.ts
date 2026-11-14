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

  it('should open an existing cache or create it', async () => {
    await expect(service.open('app-cache')).resolves.toBe(cache);
    expect(cacheStorage.open).toHaveBeenCalledWith('app-cache');
  });

  it('should store a response in a cache', async () => {
    await service.put('app-cache', '/assets/config.json', response);

    expect(cacheStorage.open).toHaveBeenCalledWith('app-cache');
    expect(cache.put).toHaveBeenCalledWith('/assets/config.json', response);
  });

  it('should return a cached response', async () => {
    await expect(service.match('app-cache', '/assets/config.json')).resolves.toBe(response);

    expect(cache.match).toHaveBeenCalledWith('/assets/config.json');
  });

  it('should return undefined for a missing response', async () => {
    vi.mocked(cache.match).mockResolvedValueOnce(undefined);

    await expect(service.match('app-cache', '/missing.json')).resolves.toBeUndefined();
  });

  it('should indicate whether a request exists in the cache', async () => {
    await expect(service.has('app-cache', '/assets/config.json')).resolves.toBe(true);

    vi.mocked(cache.match).mockResolvedValueOnce(undefined);

    await expect(service.has('app-cache', '/missing.json')).resolves.toBe(false);
  });

  it('should delete a request from a cache', async () => {
    await expect(service.delete('app-cache', '/assets/config.json')).resolves.toBe(true);

    expect(cache.delete).toHaveBeenCalledWith('/assets/config.json');
  });

  it('should return false when the request was not deleted', async () => {
    vi.mocked(cache.delete).mockResolvedValueOnce(false);

    await expect(service.delete('app-cache', '/missing.json')).resolves.toBe(false);
  });

  it('should delete an entire cache', async () => {
    await expect(service.deleteCache('app-cache')).resolves.toBe(true);
    expect(cacheStorage.delete).toHaveBeenCalledWith('app-cache');
  });

  it('should return false when the cache does not exist', async () => {
    vi.mocked(cacheStorage.delete).mockResolvedValueOnce(false);

    await expect(service.deleteCache('missing-cache')).resolves.toBe(false);
  });

  it('should list all cache names', async () => {
    await expect(service.keys()).resolves.toEqual(['app-cache']);
    expect(cacheStorage.keys).toHaveBeenCalledOnce();
  });

  it('should reject when the Cache Storage API operation fails', async () => {
    const error = new Error('Unable to open cache');
    vi.mocked(cacheStorage.open).mockRejectedValueOnce(error);

    await expect(service.open('app-cache')).rejects.toThrow(error);
  });

  it('should reject when Cache Storage is unavailable', async () => {
    vi.stubGlobal('caches', undefined);

    expect(() => service.keys()).toThrow('Cache Storage is not available in this environment.');
  });
});
