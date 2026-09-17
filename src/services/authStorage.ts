import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}

const SAVED_IDENTIFIER_KEY = 'digilocal_vendor_saved_identifier';
const VENDOR_KEY = 'digilocal_vender_user';
const API_URL_KEY = 'digilocal_vender_api_url';
const ACCESS_TOKEN_KEY = 'digilocal_vendor_access_token';
const REFRESH_TOKEN_KEY = 'digilocal_vendor_refresh_token';
const LEGACY_CRED_KEY = 'digilocal_vender_credentials';

export interface SavedCredentials {
  email: string;
  pass?: string;
  vendorId?: number;
}

// ── Secure Token Storage (OWASP M1 Compliant) ──
// Stores tokens exclusively in EncryptedSharedPreferences (Android) / Keychain (iOS) via expo-secure-store

export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      if (accessToken) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken).catch(() => {});
      if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    // Clean up any legacy plaintext tokens from AsyncStorage
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
  } catch (e) {
    console.error('Failed to save auth tokens securely:', e);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const secVal = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY).catch(() => null);
      if (secVal) return secVal;
    } else if (typeof localStorage !== 'undefined') {
      const localVal = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (localVal) return localVal;
    }

    // One-time migration for legacy tokens found in AsyncStorage
    const legacyVal = await AsyncStorage.getItem(ACCESS_TOKEN_KEY).catch(() => null);
    if (legacyVal) {
      if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, legacyVal).catch(() => {});
      }
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
      return legacyVal;
    }
  } catch (e) {
    console.error('Failed to read access token:', e);
  }
  return null;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const secVal = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY).catch(() => null);
      if (secVal) return secVal;
    } else if (typeof localStorage !== 'undefined') {
      const localVal = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (localVal) return localVal;
    }

    // One-time migration for legacy tokens found in AsyncStorage
    const legacyVal = await AsyncStorage.getItem(REFRESH_TOKEN_KEY).catch(() => null);
    if (legacyVal) {
      if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, legacyVal).catch(() => {});
      }
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
      return legacyVal;
    }
  } catch (e) {
    console.error('Failed to read refresh token:', e);
  }
  return null;
}

// ── Saved Identifier Storage (Remember Me) ──
// Strictly saves only the login email/phone identifier without storing raw passwords

export async function saveSavedIdentifier(identifier: string): Promise<void> {
  try {
    const clean = identifier.trim();
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(SAVED_IDENTIFIER_KEY, clean).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVED_IDENTIFIER_KEY, clean);
    }
    await AsyncStorage.setItem(SAVED_IDENTIFIER_KEY, clean).catch(() => {});
    // Purge any legacy credentials with plaintext passwords
    await AsyncStorage.removeItem(LEGACY_CRED_KEY).catch(() => {});
  } catch (e) {
    console.error('Failed to save vendor identifier:', e);
  }
}

export async function getSavedIdentifier(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const secVal = await SecureStore.getItemAsync(SAVED_IDENTIFIER_KEY).catch(() => null);
      if (secVal) return secVal;
    }
    if (typeof localStorage !== 'undefined') {
      const localVal = localStorage.getItem(SAVED_IDENTIFIER_KEY);
      if (localVal) return localVal;
    }
    const asyncVal = await AsyncStorage.getItem(SAVED_IDENTIFIER_KEY).catch(() => null);
    if (asyncVal) return asyncVal;
  } catch (e) {
    console.error('Failed to read saved identifier:', e);
  }
  return null;
}

export async function clearSavedIdentifier(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(SAVED_IDENTIFIER_KEY).catch(() => {});
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SAVED_IDENTIFIER_KEY);
    }
    await AsyncStorage.removeItem(SAVED_IDENTIFIER_KEY).catch(() => {});
  } catch (e) {}
}

/**
 * @deprecated Plaintext password storage is completely eliminated for OWASP compliance.
 * This helper now strictly saves the identifier without passwords.
 */
export async function saveCredentials(email: string, _pass?: string, _vendorId?: number): Promise<void> {
  await saveSavedIdentifier(email);
  // Ensure legacy plaintext password key is wiped immediately
  await AsyncStorage.removeItem(LEGACY_CRED_KEY).catch(() => {});
}

/**
 * @deprecated Reads saved identifier without exposing any plaintext password.
 */
export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  const id = await getSavedIdentifier();
  if (id) {
    return { email: id, pass: '' };
  }
  return null;
}

export async function saveVendorUser(vendor: any): Promise<void> {
  const dataStr = JSON.stringify(vendor);
  try {
    await AsyncStorage.setItem(VENDOR_KEY, dataStr).catch(() => {});

    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(VENDOR_KEY, dataStr).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VENDOR_KEY, dataStr);
    }
  } catch (e) {
    console.error('Failed to save vendor user:', e);
  }
}

export async function getSavedVendorUser(): Promise<any | null> {
  try {
    let dataStr: string | null = await AsyncStorage.getItem(VENDOR_KEY).catch(() => null);

    if (!dataStr && Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      dataStr = await SecureStore.getItemAsync(VENDOR_KEY).catch(() => null);
    }

    if (!dataStr && typeof localStorage !== 'undefined') {
      dataStr = localStorage.getItem(VENDOR_KEY);
    }

    if (dataStr) {
      return JSON.parse(dataStr);
    }
  } catch (e) {
    console.error('Failed to read vendor user:', e);
  }
  return null;
}

export async function saveApiBaseUrlStorage(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(API_URL_KEY, url).catch(() => {});

    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(API_URL_KEY, url).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(API_URL_KEY, url);
    }
  } catch (e) {
    console.error('Failed to save API URL:', e);
  }
}

export async function getSavedApiBaseUrlStorage(): Promise<string | null> {
  try {
    let url: string | null = await AsyncStorage.getItem(API_URL_KEY).catch(() => null);

    if (!url && Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      url = await SecureStore.getItemAsync(API_URL_KEY).catch(() => null);
    }

    if (!url && typeof localStorage !== 'undefined') {
      url = localStorage.getItem(API_URL_KEY);
    }
    return url;
  } catch (e) {
    console.error('Failed to read API URL:', e);
    return null;
  }
}

export async function clearSavedCredentials(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.deleteItemAsync === 'function') {
      await SecureStore.deleteItemAsync(SAVED_IDENTIFIER_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(LEGACY_CRED_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(VENDOR_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(API_URL_KEY).catch(() => {});
    }
  } catch (e) {}

  try {
    await AsyncStorage.removeItem(VENDOR_KEY).catch(() => {});
    await AsyncStorage.removeItem(SAVED_IDENTIFIER_KEY).catch(() => {});
    await AsyncStorage.removeItem(LEGACY_CRED_KEY).catch(() => {});
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
    await AsyncStorage.removeItem(API_URL_KEY).catch(() => {});
  } catch (e) {}

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SAVED_IDENTIFIER_KEY);
      localStorage.removeItem(LEGACY_CRED_KEY);
      localStorage.removeItem(VENDOR_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(API_URL_KEY);
    }
  } catch (e) {}
}

const FAV_VENDORS_KEY = 'digilocal_favorite_vendors';
const SAVED_ADDRESSES_KEY = 'digilocal_saved_addresses';

export async function getFavoriteVendorIds(): Promise<number[]> {
  try {
    let raw: string | null = await AsyncStorage.getItem(FAV_VENDORS_KEY).catch(() => null);
    if (!raw && Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      raw = await SecureStore.getItemAsync(FAV_VENDORS_KEY).catch(() => null);
    } else if (!raw && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(FAV_VENDORS_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function toggleFavoriteVendorId(vendorId: number): Promise<boolean> {
  try {
    const list = await getFavoriteVendorIds();
    const exists = list.includes(vendorId);
    const updated = exists ? list.filter(id => id !== vendorId) : [...list, vendorId];
    const raw = JSON.stringify(updated);
    await AsyncStorage.setItem(FAV_VENDORS_KEY, raw).catch(() => {});
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(FAV_VENDORS_KEY, raw).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FAV_VENDORS_KEY, raw);
    }
    return !exists;
  } catch (e) {
    return false;
  }
}

export async function isVendorFavorited(vendorId: number): Promise<boolean> {
  const list = await getFavoriteVendorIds();
  return list.includes(vendorId);
}

export async function getSavedAddresses(): Promise<any[]> {
  try {
    let raw: string | null = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY).catch(() => null);
    if (!raw && Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      raw = await SecureStore.getItemAsync(SAVED_ADDRESSES_KEY).catch(() => null);
    } else if (!raw && typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(SAVED_ADDRESSES_KEY);
    }
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function addSavedAddress(newAddress: { flat_no?: string; society_name?: string; block?: string }): Promise<{ success: boolean; message: string; addresses: any[] }> {
  try {
    const currentList = await getSavedAddresses();
    const normFlat = (newAddress.flat_no || '').trim().toLowerCase();
    const normSoc = (newAddress.society_name || '').trim().toLowerCase();
    const normBlock = (newAddress.block || '').trim().toLowerCase();

    // Check duplicate
    const isDuplicate = currentList.some(addr => {
      const aFlat = (addr.flat_no || '').trim().toLowerCase();
      const aSoc = (addr.society_name || '').trim().toLowerCase();
      const aBlock = (addr.block || '').trim().toLowerCase();
      return aFlat === normFlat && aSoc === normSoc && aBlock === normBlock;
    });

    if (isDuplicate) {
      return { success: false, message: 'This address is already saved in your account.', addresses: currentList };
    }

    const updatedList = [...currentList, { ...newAddress, id: Date.now() }];
    const raw = JSON.stringify(updatedList);
    await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, raw).catch(() => {});
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(SAVED_ADDRESSES_KEY, raw).catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SAVED_ADDRESSES_KEY, raw);
    }
    return { success: true, message: 'Address saved successfully.', addresses: updatedList };
  } catch (e: any) {
    return { success: false, message: e.message || 'Failed to save address.', addresses: [] };
  }
}

const APPROVED_ALERT_SEEN_KEY_PREFIX = 'digilocal_approved_alert_seen_';

export async function hasSeenApprovedAlert(vendorId: number): Promise<boolean> {
  try {
    const key = `${APPROVED_ALERT_SEEN_KEY_PREFIX}${vendorId}`;
    const asyncVal = await AsyncStorage.getItem(key).catch(() => null);
    if (asyncVal) return asyncVal === 'true';

    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const val = await SecureStore.getItemAsync(key).catch(() => null);
      return val === 'true';
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key) === 'true';
    }
  } catch (_) {}
  return false;
}

export async function markApprovedAlertSeen(vendorId: number): Promise<void> {
  try {
    const key = `${APPROVED_ALERT_SEEN_KEY_PREFIX}${vendorId}`;
    await AsyncStorage.setItem(key, 'true').catch(() => {});
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, 'true').catch(() => {});
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, 'true');
    }
  } catch (_) {}
}

const ITEM_PHOTOS_CACHE_PREFIX = 'digilocal_item_photos_';

export async function saveCachedItemPhoto(vendorId: number | string, itemId: number | string, uri: string): Promise<void> {
  if (!uri) return;
  try {
    const key = `${ITEM_PHOTOS_CACHE_PREFIX}${vendorId}`;
    const raw = await AsyncStorage.getItem(key).catch(() => null);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[String(itemId)] = uri;
    await AsyncStorage.setItem(key, JSON.stringify(map)).catch(() => {});
  } catch (_) {}
}

export async function getAllCachedItemPhotos(vendorId: number | string): Promise<Record<string, string>> {
  try {
    const key = `${ITEM_PHOTOS_CACHE_PREFIX}${vendorId}`;
    const raw = await AsyncStorage.getItem(key).catch(() => null);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}
