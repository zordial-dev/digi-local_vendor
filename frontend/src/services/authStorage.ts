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

export interface SavedCredentials {
  email: string;
  pass: string;
  vendorId?: number;
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
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.setItemAsync === 'function') {
      await SecureStore.setItemAsync(VENDOR_KEY, dataStr);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VENDOR_KEY, dataStr);
    }
  } catch (e) {
    console.error('Failed to save vendor user:', e);
  }
}

export async function getSavedVendorUser(): Promise<any | null> {
  try {
    let dataStr: string | null = null;
    if (Platform.OS !== 'web' && SecureStore && typeof SecureStore.getItemAsync === 'function') {
      dataStr = await SecureStore.getItemAsync(VENDOR_KEY);
    } else if (typeof localStorage !== 'undefined') {
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
      await SecureStore.deleteItemAsync(CRED_KEY);
      await SecureStore.deleteItemAsync(VENDOR_KEY);
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(CRED_KEY);
      localStorage.removeItem(VENDOR_KEY);
    }
  } catch (e) {
    console.error('Failed to clear vendor credentials:', e);
  }
}
