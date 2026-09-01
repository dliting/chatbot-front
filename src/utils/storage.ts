/**
 * Storage adapter abstraction for state persistence.
 * Provides a generic interface that decouples storage operations from localStorage,
 * enabling alternative backends (sessionStorage, IndexedDB, custom) and schema versioning.
 */

/** Generic storage adapter interface */
export interface StorageAdapter {
  get<T>(key: string): T | null
  set(key: string, value: unknown): void
  remove(key: string): void
  clear(): void
}

/** Schema-versioned wrapper around stored data */
export interface VersionedData<T> {
  version: number
  data: T
}

/** Current schema version for topics storage */
export const TOPICS_SCHEMA_VERSION = 1

/**
 * localStorage adapter — the default implementation.
 * Gracefully handles environments where localStorage is unavailable.
 */
export class LocalStorageAdapter implements StorageAdapter {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  set(key: string, value: unknown): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage disabled or quota exceeded — silently fail
    }
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(key)
    } catch {
      // Silently fail
    }
  }

  clear(): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.clear()
    } catch {
      // Silently fail
    }
  }
}

/**
 * Read versioned data from storage, applying migrations if needed.
 * Returns null if key is missing or data is corrupt.
 */
export function loadVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  migrations: Record<number, (data: unknown) => T>
): T | null {
  const raw = adapter.get<VersionedData<unknown> | unknown>(key)
  if (!raw) return null

  // Unversioned legacy data (no `version` field) → treat as version 0
  const versioned = raw as VersionedData<unknown>
  if (typeof versioned.version !== 'number') {
    // Legacy data without version field — try migration from version 0
    const migrate = migrations[0]
    return migrate ? migrate(raw) : null
  }

  const migrate = migrations[versioned.version]
  return migrate ? migrate(versioned.data) : null
}

/**
 * Write versioned data to storage with the current schema version.
 */
export function saveVersioned<T>(
  adapter: StorageAdapter,
  key: string,
  data: T,
  version: number
): void {
  adapter.set(key, { version, data } satisfies VersionedData<T>)
}
