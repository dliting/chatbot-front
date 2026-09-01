/**
 * Storage composable — thin wrapper providing topic-specific load/save
 * using the StorageAdapter abstraction.
 */
import type { Topic } from '@/types'
import type { StorageAdapter } from '@/utils/storage'
import {
  LocalStorageAdapter,
  loadVersioned,
  saveVersioned,
  TOPICS_SCHEMA_VERSION,
} from '@/utils/storage'
import { TOPIC_DEFAULTS } from '@/constants'

/** Default adapter instance (lazy singleton) */
let defaultAdapter: LocalStorageAdapter | null = null
function getDefaultAdapter(): LocalStorageAdapter {
  if (!defaultAdapter) defaultAdapter = new LocalStorageAdapter()
  return defaultAdapter
}

/**
 * Load topics from storage using adapter.
 * Handles both legacy (unversioned) and versioned formats.
 */
export function loadTopicsFromStorage(adapter?: StorageAdapter): Topic[] {
  const storage = adapter ?? getDefaultAdapter()
  const migrations: Record<number, (data: unknown) => Topic[]> = {
    // Version 0: legacy unversioned data (raw Topic[] array)
    0: (data) => {
      if (Array.isArray(data)) return data as Topic[]
      return []
    },
    // Version 1+: data is a Topic[] array
    1: (data) => {
      if (Array.isArray(data)) return data as Topic[]
      return []
    },
  }
  return loadVersioned<Topic[]>(storage, TOPIC_DEFAULTS.STORAGE_KEY, migrations) ?? []
}

/**
 * Save topics to storage using adapter with schema versioning.
 */
export function saveTopicsToStorage(topics: Topic[], adapter?: StorageAdapter): void {
  const storage = adapter ?? getDefaultAdapter()
  saveVersioned(storage, TOPIC_DEFAULTS.STORAGE_KEY, topics, TOPICS_SCHEMA_VERSION)
}

/**
 * Clear topics from storage using adapter.
 */
export function clearTopicsFromStorage(adapter?: StorageAdapter): void {
  const storage = adapter ?? getDefaultAdapter()
  storage.remove(TOPIC_DEFAULTS.STORAGE_KEY)
}
