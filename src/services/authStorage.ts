import { Platform } from 'react-native';

let SecureStore: any = null;
try {
  SecureStore = require('expo-secure-store');
} catch (e) {
  SecureStore = null;
}

const CRED_KEY = 'digilocal_vender_credentials';
const VENDOR_KEY = 'digilocal_vender_user';
const API_URL_KEY = 'digilocal_vender_api_url';
const ACCESS_TOKEN_KEY = 'digilocal_vendor_access_token';
const REFRESH_TOKEN_KEY = 'digilocal_vendor_refresh_token';

export interface SavedCredentials {
  email: string;
  pass: string;
  vendorId?: number;
}

// Token Storage
export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      if (accessToken) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } else if (typeof localStorage !== 'undefined') {
      if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch (e) {
    console.error('Failed to save auth tokens:', e);
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to read access token:', e);
  }
  return null;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to read refresh token:', e);
  }
  return null;
}

export async function saveCredentials(email: string, pass: string, vendorId?: number): Promise<void> {
  const dataStr = JSON.stringify({ email, pass, vendorId });
  try {
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(CRED_KEY, dataStr);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CRED_KEY, dataStr);
    }
  } catch (e) {
    console.error('Failed to save vendor credentials:', e);
  }
}

export async function getSavedCredentials(): Promise<SavedCredentials | null> {
  try {
    let dataStr: string | null = null;
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      dataStr = await SecureStore.getItemAsync(CRED_KEY);
    } else if (typeof localStorage !== 'undefined') {
      dataStr = localStorage.getItem(CRED_KEY);
    }

    if (dataStr) {
      return JSON.parse(dataStr);
    }
  } catch (e) {
    console.error('Failed to read vendor credentials:', e);
  }
  return null;
}

export async function saveVendorUser(vendor: any): Promise<void> {
  const dataStr = JSON.stringify(vendor);
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(VENDOR_KEY, dataStr);
  } catch (_) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(VENDOR_KEY, dataStr);
      }
    } catch (e) {
      console.error('Failed to save vendor user:', e);
    }
  }
}

export async function getSavedVendorUser(): Promise<any | null> {
  try {
    let dataStr: string | null = null;
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      dataStr = await AsyncStorage.getItem(VENDOR_KEY);
    } catch (_) {}

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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(API_URL_KEY, url);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(API_URL_KEY, url);
    }
  } catch (e) {
    console.error('Failed to save API URL:', e);
  }
}

export async function getSavedApiBaseUrlStorage(): Promise<string | null> {
  try {
    let url: string | null = null;
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      url = await SecureStore.getItemAsync(API_URL_KEY);
    } else if (typeof localStorage !== 'undefined') {
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
      await SecureStore.deleteItemAsync(CRED_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(VENDOR_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY).catch(() => {});
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY).catch(() => {});
    }
  } catch (e) {}

  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    if (AsyncStorage) {
      await AsyncStorage.removeItem(VENDOR_KEY).catch(() => {});
      await AsyncStorage.removeItem(CRED_KEY).catch(() => {});
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY).catch(() => {});
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
    }
  } catch (e) {}

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CRED_KEY);
      localStorage.removeItem(VENDOR_KEY);
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch (e) {}
}

const FAV_VENDORS_KEY = 'digilocal_favorite_vendors';
const SAVED_ADDRESSES_KEY = 'digilocal_saved_addresses';

export async function getFavoriteVendorIds(): Promise<number[]> {
  try {
    let raw: string | null = null;
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      raw = await SecureStore.getItemAsync(FAV_VENDORS_KEY);
    } else if (typeof localStorage !== 'undefined') {
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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(FAV_VENDORS_KEY, raw);
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
    let raw: string | null = null;
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      raw = await SecureStore.getItemAsync(SAVED_ADDRESSES_KEY);
    } else if (typeof localStorage !== 'undefined') {
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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(SAVED_ADDRESSES_KEY, raw);
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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      const val = await SecureStore.getItemAsync(key);
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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(key, 'true');
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, 'true');
    }
  } catch (_) {}
}
