import AsyncStorage from '@react-native-async-storage/async-storage';
import { VendorDashboardData, Society } from './api/types';

// In-Memory L1 Cache for 0ms synchronous retrieval
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const CACHE_PREFIX = '@digilocal_cache:';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24; // 24 Hours default TTL

export const CACHE_KEYS = {
  DASHBOARD: (vendorId: number) => `dashboard_v${vendorId}`,
  ITEMS: (vendorId: number) => `items_v${vendorId}`,
  ORDERS: (vendorId: number) => `orders_v${vendorId}`,
  SOCIETIES: 'societies_list',
  PAYMENTS: (vendorId: number) => `payments_v${vendorId}`,
};

/**
 * Set an item in memory (L1) and AsyncStorage (L2)
 */
export async function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
  const record = {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  };

  // 1. L1 Memory Cache (instant)
  memoryCache.set(key, record);

  // 2. L2 Persistent Storage
  try {
    const fullKey = CACHE_PREFIX + key;
    await AsyncStorage.setItem(fullKey, JSON.stringify(record));
  } catch (err) {
    console.warn('[Cache] Failed to persist cache to AsyncStorage:', err);
  }
}

/**
 * Get an item from memory (L1) or AsyncStorage (L2)
 */
export async function getCache<T>(key: string, maxAgeMs?: number): Promise<T | null> {
  const now = Date.now();

  // 1. Check L1 Memory Cache
  if (memoryCache.has(key)) {
    const memRecord = memoryCache.get(key)!;
    const maxAge = maxAgeMs !== undefined ? maxAgeMs : memRecord.ttl;
    if (now - memRecord.timestamp < maxAge) {
      return memRecord.data as T;
    }
  }

  // 2. Check L2 Persistent Storage
  try {
    const fullKey = CACHE_PREFIX + key;
    const jsonStr = await AsyncStorage.getItem(fullKey);
    if (!jsonStr) return null;

    const record = JSON.parse(jsonStr);
    const maxAge = maxAgeMs !== undefined ? maxAgeMs : (record.ttl || DEFAULT_TTL_MS);

    if (now - record.timestamp < maxAge) {
      // Re-populate L1 cache for subsequent fast reads
      memoryCache.set(key, record);
      return record.data as T;
    } else {
      // Stale cache expired
      AsyncStorage.removeItem(fullKey).catch(() => {});
    }
  } catch (err) {
    console.warn('[Cache] Failed to read cache from AsyncStorage:', err);
  }

  return null;
}

/**
 * Synchronous L1 memory read (0ms response)
 */
export function getMemoryCache<T>(key: string): T | null {
  if (memoryCache.has(key)) {
    const memRecord = memoryCache.get(key)!;
    if (Date.now() - memRecord.timestamp < memRecord.ttl) {
      return memRecord.data as T;
    }
  }
  return null;
}

/**
 * Remove specific cache key from L1 & L2
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  } catch (err) {
    console.warn('[Cache] Failed to invalidate cache key:', key, err);
  }
}

/**
 * Clear all DigiLocal cache keys
 */
export async function clearAllAppCache(): Promise<void> {
  memoryCache.clear();
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (err) {
    console.warn('[Cache] Failed to clear all cache:', err);
  }
}

// ── Specific Helper Functions ──────────────────────────────────

export async function getCachedDashboard(vendorId: number): Promise<VendorDashboardData | null> {
  return await getCache<VendorDashboardData>(CACHE_KEYS.DASHBOARD(vendorId));
}

export async function setCachedDashboard(vendorId: number, data: VendorDashboardData): Promise<void> {
  await setCache(CACHE_KEYS.DASHBOARD(vendorId), data, 1000 * 60 * 60 * 48); // 48h TTL
}

export async function getCachedSocieties(): Promise<Society[] | null> {
  return await getCache<Society[]>(CACHE_KEYS.SOCIETIES, 1000 * 60 * 60 * 72); // 72h TTL
}

export async function setCachedSocieties(societies: Society[]): Promise<void> {
  if (Array.isArray(societies) && societies.length > 0) {
    await setCache(CACHE_KEYS.SOCIETIES, societies, 1000 * 60 * 60 * 72);
  }
}
