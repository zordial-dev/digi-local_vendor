import { getApiBaseUrl, safeFetch } from './config';
import { VendorUser } from './types';
import { saveTokens } from '../authStorage';

// ── Vendor Authentication APIs ────────────────────────────────

export async function checkVendorPhoneApi(phone: string): Promise<{ exists: boolean; phone: string; message: string }> {
  const clean = phone.trim();
  const payload = {
    phone: clean,
    mobile: clean,
    phone_number: clean,
    identifier: clean
  };

  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/check-phone`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return {
        exists: data.exists ?? false,
        phone: data.phone || clean,
        message: data.message || (data.exists ? 'Vendor account found' : 'No vendor account found')
      };
    }

    // Try fallback check-mobile route
    const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/check-mobile`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (fallback.res.ok) {
      return {
        exists: fallback.data.exists ?? false,
        phone: fallback.data.phone || clean,
        message: fallback.data.message || (fallback.data.exists ? 'Vendor account found' : 'No vendor account found')
      };
    }
  } catch (err: any) {
    console.warn('⚠️ [CHECK PHONE WARN]: check-phone route unavailable or unreachable, defaulting to exists=true for login:', err.message || err);
  }

  return { exists: true, phone: clean, message: 'Proceeding with OTP verification' };
}

export async function loginVendorApi(emailOrMobile: string, pass: string): Promise<{
  vendor: VendorUser;
  accessToken: string;
  refreshToken?: string;
  token?: string;
  message?: string;
}> {
  try {
    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(emailOrMobile);
    const body = isEmail
      ? { email: emailOrMobile.trim().toLowerCase(), password: pass.trim(), identifier: emailOrMobile.trim().toLowerCase() }
      : {
          mobile: emailOrMobile.trim(),
          phone: emailOrMobile.trim(),
          phone_number: emailOrMobile.trim(),
          identifier: emailOrMobile.trim(),
          password: pass.trim()
        };

    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    const tokenToSave = data.accessToken || data.token;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function registerVendorApi(payload: {
  society_id?: number | null;
  society_name?: string;
  vendor_name: string;
  email: string;
  password: string;
  store_name: string;
  phone_number?: string;
  mobile?: string;
  gst_number?: string;
  category?: string;
  address?: string;
  otp?: string;
}): Promise<{
  vendor: VendorUser;
  vendor_id: number;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  message?: string;
}> {
  try {
    const cleanPhone = payload.phone_number || payload.mobile || '';
    const body = {
      ...payload,
      mobile: cleanPhone,
      phone: cleanPhone,
      phone_number: cleanPhone,
      identifier: cleanPhone
    };

    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/register`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed. Please check input values.');
    }

    const tokenToSave = data.accessToken || data.token;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function loginVendorWithOtpApi(identifierOrFirebaseToken: string, otp?: string): Promise<{
  vendor: VendorUser;
  accessToken: string;
  refreshToken?: string;
  token?: string;
  message?: string;
}> {
  try {
    const isFirebaseToken = !otp && identifierOrFirebaseToken.length > 50;
    const body = isFirebaseToken
      ? { firebase_token: identifierOrFirebaseToken, idToken: identifierOrFirebaseToken }
      : /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(identifierOrFirebaseToken)
      ? { email: identifierOrFirebaseToken.trim().toLowerCase(), identifier: identifierOrFirebaseToken.trim().toLowerCase(), otp: otp?.trim() }
      : {
          mobile: identifierOrFirebaseToken.trim(),
          phone: identifierOrFirebaseToken.trim(),
          phone_number: identifierOrFirebaseToken.trim(),
          identifier: identifierOrFirebaseToken.trim(),
          otp: otp?.trim()
        };

    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(data.error || 'Login with OTP failed. Please check the code.');
    }

    const tokenToSave = data.accessToken || data.token;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken);
    }

    return data;
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function refreshAccessTokenApi(refreshToken: string): Promise<string | null> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (res.ok && (data.accessToken || data.token)) {
      const newToken = data.accessToken || data.token;
      await saveTokens(newToken);
      return newToken;
    }
    return null;
  } catch (err) {
    console.error('Failed to refresh access token:', err);
    return null;
  }
}

export async function logoutVendorApi(refreshToken?: string): Promise<{ message?: string }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    return data;
  } catch (err) {
    console.error('Logout error:', err);
    return { message: 'Logged out locally' };
  }
}

export async function sendOtpApi(
  identifier: string,
  purpose?: 'login' | 'register'
): Promise<{ exists?: boolean; message?: string; target?: string; provider?: string; simulationOtp?: string; otp?: string; code?: string }> {
  const clean = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
  const url = `${getApiBaseUrl()}/vendors/send-otp`;
  const payload = isEmail
    ? { email: clean.toLowerCase(), identifier: clean.toLowerCase(), purpose }
    : {
        mobile: clean,
        phone: clean,
        phone_number: clean,
        identifier: clean,
        email: `${clean}@mobile.digilocal.com`,
        purpose
      };

  console.log('📲 [SEND OTP REQUEST]:', { url, payload });

  try {
    const { res, data } = await safeFetch(url, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    console.log('📡 [SEND OTP RESPONSE STATUS]:', res.status, res.ok ? 'OK' : 'FAILED');
    console.log('📦 [SEND OTP RESPONSE BODY]:', data);

    if (!res.ok) {
      console.error('❌ [SEND OTP FAILED]: Server returned error', { status: res.status, data });
      throw new Error(data.error || data.message || `Failed to send OTP (Status: ${res.status})`);
    }

    console.log('✅ [SEND OTP SUCCESS]:', data);
    return data;
  } catch (err: any) {
    console.error('💥 [SEND OTP EXCEPTION]:', { message: err.message, stack: err.stack, err });
    throw err;
  }
}

export async function verifyOtpApi(
  identifierOrFirebaseToken: string,
  otp?: string
): Promise<boolean> {
  const isFirebaseToken = !otp && identifierOrFirebaseToken.length > 50;
  const payload = isFirebaseToken
    ? { firebase_token: identifierOrFirebaseToken, idToken: identifierOrFirebaseToken }
    : /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(identifierOrFirebaseToken)
    ? { email: identifierOrFirebaseToken.trim().toLowerCase(), identifier: identifierOrFirebaseToken.trim().toLowerCase(), otp: otp?.trim() }
    : {
        mobile: identifierOrFirebaseToken.trim(),
        phone: identifierOrFirebaseToken.trim(),
        phone_number: identifierOrFirebaseToken.trim(),
        identifier: identifierOrFirebaseToken.trim(),
        email: `${identifierOrFirebaseToken.trim()}@mobile.digilocal.com`,
        otp: otp?.trim()
      };

  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/verify-otp`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Invalid or expired OTP code');
  }
  return true;
}

export async function forgotPasswordOtpApi(
  identifier: string
): Promise<{ message?: string; target?: string; simulationOtp?: string }> {
  const clean = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
  const payload = isEmail
    ? { email: clean.toLowerCase(), identifier: clean.toLowerCase() }
    : {
        mobile: clean,
        phone: clean,
        phone_number: clean,
        identifier: clean,
        email: `${clean}@mobile.digilocal.com`
      };

  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/forgot-password`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Forgot password request failed');
  }
  return data;
}

export async function resetPasswordWithOtpApi(
  identifier: string,
  otp: string,
  newPassword: string
): Promise<{ message?: string }> {
  const clean = identifier.trim();
  const cleanOtp = otp.trim();
  const cleanPass = newPassword.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
  const payload = isEmail
    ? {
        email: clean.toLowerCase(),
        identifier: clean.toLowerCase(),
        otp: cleanOtp,
        newPassword: cleanPass,
        new_password: cleanPass
      }
    : {
        mobile: clean,
        phone: clean,
        phone_number: clean,
        identifier: clean,
        email: `${clean}@mobile.digilocal.com`,
        otp: cleanOtp,
        newPassword: cleanPass,
        new_password: cleanPass
      };

  const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/reset-password`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error(data.error || 'Password reset failed');
  }
  return data;
}
