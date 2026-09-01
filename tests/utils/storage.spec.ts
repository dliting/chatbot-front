/**
 * Tests for storage adapter abstraction
 * Covers: LocalStorageAdapter, loadVersioned, saveVersioned, schema versioning
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  LocalStorageAdapter,
  loadVersioned,
  saveVersioned,
  TOPICS_SCHEMA_VERSION,
  type StorageAdapter,
  type VersionedData,
} from '@/utils/storage'

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter

  beforeEach(() => {
    adapter = new LocalStorageAdapter()
    localStorage.clear()
  })

  it('should return null for missing key', () => {
    expect(adapter.get('nonexistent')).toBeNull()
  })

  it('should set and get a value', () => {
    adapter.set('test', { foo: 'bar' })
    expect(adapter.get('test')).toEqual({ foo: 'bar' })
  })

  it('should remove a key', () => {
    adapter.set('test', 'value')
    adapter.remove('test')
    expect(adapter.get('test')).toBeNull()
  })

  it('should clear all keys', () => {
    adapter.set('a', 1)
    adapter.set('b', 2)
    adapter.clear()
    expect(adapter.get('a')).toBeNull()
    expect(adapter.get('b')).toBeNull()
  })

  it('should handle JSON parse errors gracefully', () => {
    localStorage.setItem('bad', '{invalid json}')
    expect(adapter.get('bad')).toBeNull()
  })

  it('should handle set errors gracefully (quota exceeded)', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    // Should not throw
    adapter.set('test', 'value')
    spy.mockRestore()
  })
})

describe('Versioned storage', () => {
  let adapter: StorageAdapter

  beforeEach(() => {
    adapter = new LocalStorageAdapter()
    localStorage.clear()
  })

  it('should save and load versioned data', () => {
    const data = [{ id: 1, name: 'test' }]
    saveVersioned(adapter, 'key', data, 1)

    const result = loadVersioned(adapter, 'key', {
      1: (d) => d as typeof data,
    })
    expect(result).toEqual(data)
  })

  it('should return null for missing key', () => {
    const result = loadVersioned(adapter, 'missing', {
      1: (d) => d,
    })
    expect(result).toBeNull()
  })

  it('should migrate legacy unversioned data (version 0)', () => {
    // Simulate legacy data stored without version field
    adapter.set('key', [{ id: 1 }])

    const result = loadVersioned(adapter, 'key', {
      0: (d) => {
        if (Array.isArray(d)) return d as Array<{ id: number }>
        return []
      },
    })
    expect(result).toEqual([{ id: 1 }])
  })

  it('should return null when no migration exists for version', () => {
    saveVersioned(adapter, 'key', 'data', 99)

    const result = loadVersioned(adapter, 'key', {
      1: (d) => d,
    })
    expect(result).toBeNull()
  })

  it('should return null when migration returns null for corrupt data', () => {
    saveVersioned(adapter, 'key', 'not-an-array', 1)

    const result = loadVersioned<{ id: number }[]>(adapter, 'key', {
      1: (d) => Array.isArray(d) ? d as { id: number }[] : null,
    })
    expect(result).toBeNull()
  })
})

describe('TOPICS_SCHEMA_VERSION', () => {
  it('should be 1', () => {
    expect(TOPICS_SCHEMA_VERSION).toBe(1)
  })
})
