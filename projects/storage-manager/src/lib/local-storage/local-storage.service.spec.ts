import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageService } from './local-storage.service';
import { StorageError } from './models/storage-error';
import { LOCAL_STORAGE_OPTIONS } from './models/storage-options';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('guardar y consultar', () => {
    it('guarda y consulta un string', () => {
      service.set('name', 'Ana');
      expect(service.get<string>('name')).toBe('Ana');
    });

    it('guarda y consulta un número', () => {
      service.set('age', 25);
      expect(service.get<number>('age')).toBe(25);
    });

    it('guarda y consulta un booleano (incluido false)', () => {
      service.set('active', false);
      expect(service.get<boolean>('active')).toBe(false);
    });

    it('guarda y consulta un objeto', () => {
      const user = { id: 1, name: 'Ana', tags: ['a', 'b'] };
      service.set('user', user);
      expect(service.get<typeof user>('user')).toEqual(user);
    });

    it('guarda y consulta un arreglo', () => {
      service.set('list', [1, 2, 3]);
      expect(service.get<number[]>('list')).toEqual([1, 2, 3]);
    });

    it('serializa con JSON.stringify', () => {
      service.set('user', { id: 1 });
      expect(localStorage.getItem('user')).toBe('{"id":1}');
      service.set('text', 'hola');
      expect(localStorage.getItem('text')).toBe('"hola"');
    });

    it('devuelve null para una clave inexistente', () => {
      expect(service.get('missing')).toBeNull();
    });

    it('rechaza null y undefined', () => {
      expect(() => service.set('k', null)).toThrow(StorageError);
      expect(() => service.set('k', undefined)).toThrow(StorageError);
      expect(service.has('k')).toBe(false);
    });
  });

  describe('errores de serialización', () => {
    it('falla con referencias circulares', () => {
      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      expect(() => service.set('c', circular)).toThrowError(
        expect.objectContaining({ name: 'StorageError', operation: 'serialize', key: 'c' }),
      );
    });

    it('falla con valores no serializables (función)', () => {
      expect(() => service.set('f', () => 1)).toThrowError(
        expect.objectContaining({ operation: 'serialize', key: 'f' }),
      );
    });

    it('falla al leer contenido que no es JSON válido', () => {
      localStorage.setItem('bad', '{no-json');
      expect(() => service.get('bad')).toThrowError(
        expect.objectContaining({ operation: 'deserialize', key: 'bad' }),
      );
    });
  });

  describe('update', () => {
    it('actualiza un valor existente', () => {
      service.set('n', 1);
      service.update('n', 2);
      expect(service.get<number>('n')).toBe(2);
    });

    it('falla si la clave no existe', () => {
      expect(() => service.update('missing', 1)).toThrowError(
        expect.objectContaining({ operation: 'update', key: 'missing' }),
      );
    });
  });

  describe('remove y has', () => {
    it('elimina una clave', () => {
      service.set('n', 1);
      service.remove('n');
      expect(service.has('n')).toBe(false);
      expect(service.get('n')).toBeNull();
    });

    it('eliminar una clave inexistente no lanza error', () => {
      expect(() => service.remove('missing')).not.toThrow();
    });

    it('has devuelve true si existe y false si no', () => {
      service.set('n', 0);
      expect(service.has('n')).toBe(true);
      expect(service.has('other')).toBe(false);
    });
  });

  describe('clear', () => {
    it('vacía todo el almacenamiento sin prefijo', () => {
      service.set('a', 1);
      service.set('b', 2);
      service.clear();
      expect(localStorage.length).toBe(0);
    });
  });

  describe('con prefijo', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [{ provide: LOCAL_STORAGE_OPTIONS, useValue: { prefix: 'app_' } }],
      });
      service = TestBed.inject(LocalStorageService);
    });

    it('antepone el prefijo a las claves', () => {
      service.set('a', 1);
      expect(localStorage.getItem('app_a')).toBe('1');
      expect(service.get<number>('a')).toBe(1);
    });

    it('clear elimina solo las claves con prefijo', () => {
      service.set('a', 1);
      localStorage.setItem('other', '"keep"');
      service.clear();
      expect(service.has('a')).toBe(false);
      expect(localStorage.getItem('other')).toBe('"keep"');
    });
  });

  describe('errores de localStorage', () => {
    const quota = () => {
      throw new Error('QuotaExceededError');
    };

    it('set falla si setItem lanza error', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(quota);
      expect(() => service.set('a', 1)).toThrowError(
        expect.objectContaining({ operation: 'set', key: 'a' }),
      );
    });

    it('get falla si getItem lanza error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(quota);
      expect(() => service.get('a')).toThrowError(expect.objectContaining({ operation: 'get' }));
    });

    it('has falla si getItem lanza error', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(quota);
      expect(() => service.has('a')).toThrowError(expect.objectContaining({ operation: 'has' }));
    });

    it('remove falla si removeItem lanza error', () => {
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(quota);
      expect(() => service.remove('a')).toThrowError(expect.objectContaining({ operation: 'remove' }));
    });

    it('clear falla si clear lanza error', () => {
      vi.spyOn(Storage.prototype, 'clear').mockImplementation(quota);
      expect(() => service.clear()).toThrowError(expect.objectContaining({ operation: 'clear' }));
    });

    it('conserva el error original en cause', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(quota);
      try {
        service.set('a', 1);
        expect.unreachable();
      } catch (error) {
        expect((error as StorageError).cause).toBeInstanceOf(Error);
      }
    });

    it('falla si localStorage no está disponible', () => {
      vi.stubGlobal('localStorage', undefined);
      expect(() => service.get('a')).toThrow(StorageError);
    });
  });
});