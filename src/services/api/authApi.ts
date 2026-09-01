import { getApiBaseUrl, safeFetch } from './config';
import { VendorUser, RegisterVendorPayload } from './types';
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
    console.warn('⚠️ [CHECK PHONE WARN]: check-phone route unavailable or unreachable:', err.message || err);
  }

  return { exists: false, phone: clean, message: 'Check unavailable' };
}

export async function checkVendorEmailApi(email: string): Promise<{ exists: boolean; email: string; message: string }> {
  const clean = email.trim().toLowerCase();
  const payload = {
    email: clean,
    identifier: clean
  };

  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/check-email`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.ok && typeof data.exists === 'boolean') {
      return {
        exists: data.exists,
        email: clean,
        message: data.message || (data.exists ? 'Vendor account found with this email' : 'Email available')
      };
    }
  } catch (err: any) {
    // Graceful fallback if check-email endpoint is unavailable on backend
  }

  return { exists: false, email: clean, message: 'Email check unavailable' };
}

export async function loginVendorApi(emailOrMobile: string, pass: string): Promise<{
  vendor: VendorUser;
  accessToken: string;
  refreshToken?: string;
  token?: string;
  message?: string;
}> {
  try {
    const clean = emailOrMobile.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
    
    // v2.5.0 schema: accepts email, phone, mobile, identifier, and password
    const body: Record<string, any> = {
      email: isEmail ? clean.toLowerCase() : clean,
      phone: clean,
      mobile: clean,
      phone_number: clean,
      identifier: isEmail ? clean.toLowerCase() : clean,
      password: pass.trim()
    };

    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errMsg = (data?.error || data?.message || '').toLowerCase();

      // 🔴 HTTP 403 Forbidden — Blocked Vendor Account Handling (code: VENDOR_BLOCKED)
      if (
        res.status === 403 ||
        data?.code === 'VENDOR_BLOCKED' ||
        data?.is_blocked ||
        errMsg.includes('blocked')
      ) {
        const err: any = new Error(
          data?.error ||
          data?.message ||
          'Your vendor account has been blocked by admin.'
        );
        err.isBlocked = true;
        err.code = 'VENDOR_BLOCKED';
        err.blockReason = data?.block_reason || data?.reason || data?.message;
        throw err;
      }

      // 🟡 HTTP 401 Unauthorized — Incorrect Password
      if (
        res.status === 401 ||
        errMsg.includes('password') ||
        errMsg.includes('credential') ||
        errMsg.includes('incorrect') ||
        errMsg.includes('wrong')
      ) {
        throw new Error(data?.error || 'Incorrect password. Please check your password and try again.');
      }

      // 🔵 HTTP 404 Not Found — Account Not Found
      if (res.status === 404 || errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        // Double check if account actually exists via check-email or check-phone
        try {
          const check = isEmail
            ? await checkVendorEmailApi(clean)
            : await checkVendorPhoneApi(clean);
          if (check.exists) {
            throw new Error('Incorrect password. Please check your password and try again.');
          }
        } catch (_) {}
        throw new Error(data?.error || 'No account found with this credential.');
      }

      // 🟠 HTTP 400 Bad Request — Missing Credentials
      if (res.status === 400) {
        throw new Error(data?.error || 'Identifier and password are required.');
      }
      
      let rawError = data?.error || data?.message || 'Login failed. Please check your credentials.';
      if (isEmail && typeof rawError === 'string') {
        rawError = rawError.replace(/mobile(\s+number)?/gi, 'email address').replace(/phone(\s+number)?/gi, 'email address');
      }
      throw new Error(rawError);
    }

    const tokenToSave = data.accessToken || data.token;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken);
    }

    return {
      ...data,
      accessToken: tokenToSave,
      vendor: data.vendor || {
        vendor_id: data.vendor_id,
        store_name: data.store_name || data.storeName,
        vendor_name: data.vendor_name || data.vendorName,
        email: data.email,
        phone_number: data.phone_number || data.phone,
        status: data.status || 'active',
      }
    };
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function registerVendorApi(payload: RegisterVendorPayload): Promise<{
  vendor: VendorUser;
  vendor_id: number;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  message?: string;
  success?: boolean;
  data?: any;
}> {
  try {
    const cleanPhone = payload.phone_number || payload.mobile || payload.phone || '';
    const cleanVendorName = payload.vendor_name || payload.owner_name || payload.store_name || 'Store Merchant';
    const cleanStoreName = payload.store_name || payload.shop_name || payload.business_name || 'My Store';
    const cleanArea = payload.area || payload.society_name || payload.location_name || '';
    const cleanCity = payload.city || '';
    const cleanState = payload.state || '';
    const cleanPincode = payload.pincode || '';
    const cleanWhatsapp = payload.whatsapp_number || payload.whatsapp || cleanPhone;
    const cleanShopNo = payload.shop_number || payload.shop_no || payload.shopNumber || 'Shop #1';
    const cleanShopImg = payload.shop_image || payload.logo || payload.image_url || '';
    const cleanCategory = payload.category || 'General';
    const cleanGstin = payload.gstin || (payload.gst_number && payload.gst_number.length === 15 ? payload.gst_number : undefined);
    const cleanPan = payload.pan_number || (payload.gst_number && payload.gst_number.length === 10 ? payload.gst_number : undefined) || payload.pan;

    const accNum = (payload.account_number || payload.bank_account_number || '').trim();
    const ifsc = (payload.ifsc_code || payload.ifsc || '').trim();
    const holder = (payload.account_holder_name || payload.holder_name || '').trim() || cleanVendorName;
    const bName = (payload.bank_name || '').trim();
    const accType = payload.account_type || 'CURRENT';

    const fullAddress = payload.address || [cleanArea, cleanCity, cleanState, cleanPincode].filter(Boolean).join(', ');

    const body: Record<string, any> = {
      // Primary API Specification Fields
      vendor_name: cleanVendorName,
      owner_name: cleanVendorName,
      store_name: cleanStoreName,
      shop_name: cleanStoreName,
      business_name: cleanStoreName,
      email: payload.email.trim().toLowerCase(),
      phone_number: cleanPhone,
      phone: cleanPhone,
      mobile: cleanPhone,
      password: payload.password,
      area: cleanArea,
      society_name: cleanArea,
      location_name: cleanArea,
      city: cleanCity,
      state: cleanState,
      pincode: cleanPincode,
      whatsapp_number: cleanWhatsapp,
      whatsapp: cleanWhatsapp,
      shop_number: cleanShopNo,
      shop_no: cleanShopNo,
      shop_image: cleanShopImg,
      logo: cleanShopImg,
      image_url: cleanShopImg,
      category: cleanCategory,
      gstin: cleanGstin,
      pan_number: cleanPan,
      gst_number: payload.gst_number || cleanGstin,
      address: fullAddress,
      location_address: fullAddress,
      // Platform Options
      society_id: payload.society_id || undefined,
      business_type: payload.business_type || 'PRODUCT',
      accepted_payment_methods: payload.accepted_payment_methods || ['UPI', 'COD'],
      otp: payload.otp || undefined,
    };

    // Include optional bank details if provided
    if (accNum) {
      body.account_number = accNum;
      body.bank_account_number = accNum;
      body.bank_account = accNum;
    }
    if (ifsc) {
      body.ifsc_code = ifsc;
      body.ifsc = ifsc;
    }
    if (bName) {
      body.bank_name = bName;
    }
    if (holder) {
      body.account_holder_name = holder;
      body.holder_name = holder;
      body.account_name = holder;
    }
    if (payload.upi_id) {
      body.upi_id = payload.upi_id;
    }
    if (payload.qr_code_url) {
      body.qr_code_url = payload.qr_code_url;
    }
    if (accType) {
      body.account_type = accType;
    }

    let result;
    try {
      result = await safeFetch(`${getApiBaseUrl()}/vendors/register`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Platform-Client': 'vendor_app'
        }
      });
      if (!result.res.ok && result.res.status === 404) {
        throw new Error('Fallback to legacy route');
      }
    } catch (_) {
      result = await safeFetch(`${getApiBaseUrl()}/registerVender`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Platform-Client': 'vendor_app'
        }
      });
    }

    const { res, data } = result;

    if (!res.ok) {
      throw new Error(data?.error || data?.message || 'Registration failed. Please check input values.');
    }

    const tokenToSave = data.accessToken || data.token || data.data?.token || data.data?.accessToken;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken || data.data?.refreshToken);
    }

    const resolvedBusinessType = payload.business_type || (data.vendor?.business_type) || (data.data?.vendor?.business_type) || 'PRODUCT';
    const rawVendor = data.vendor || data.data?.vendor || data.data;
    const vendorObj: VendorUser = {
      ...(typeof rawVendor === 'object' && rawVendor ? rawVendor : {}),
      vendor_id: (rawVendor && rawVendor.vendor_id) || data.vendor_id || data.data?.vendor_id || 0,
      vendor_name: (rawVendor && rawVendor.vendor_name) || cleanVendorName,
      store_name: (rawVendor && rawVendor.store_name) || cleanStoreName,
      email: (rawVendor && rawVendor.email) || payload.email.trim().toLowerCase(),
      phone_number: (rawVendor && rawVendor.phone_number) || cleanPhone,
      status: (rawVendor && rawVendor.status) || 'PENDING',
      category: (rawVendor && rawVendor.category) || cleanCategory,
      business_type: resolvedBusinessType,
      area: (rawVendor && rawVendor.area) || cleanArea,
      city: (rawVendor && rawVendor.city) || cleanCity,
      state: (rawVendor && rawVendor.state) || cleanState,
      pincode: (rawVendor && rawVendor.pincode) || cleanPincode,
      whatsapp_number: (rawVendor && rawVendor.whatsapp_number) || cleanWhatsapp,
      shop_number: (rawVendor && rawVendor.shop_number) || cleanShopNo,
      shop_image: (rawVendor && rawVendor.shop_image) || cleanShopImg,
      gstin: (rawVendor && rawVendor.gstin) || cleanGstin,
      pan_number: (rawVendor && rawVendor.pan_number) || cleanPan,
    };

    return {
      vendor: vendorObj,
      vendor_id: vendorObj.vendor_id || data.vendor_id || data.data?.vendor_id || 0,
      accessToken: tokenToSave,
      refreshToken: data.refreshToken || data.data?.refreshToken,
      token: tokenToSave,
      message: data.message || 'Vendor merchant registration submitted successfully.',
      success: true,
      data: data.data || data
    };
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function loginVendorWithOtpApi(identifier: string, otp?: string): Promise<{
  vendor: VendorUser;
  accessToken: string;
  refreshToken?: string;
  token?: string;
  message?: string;
}> {
  try {
    const clean = identifier.trim();
    const cleanOtp = otp?.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
    const body = isEmail
      ? { email: clean.toLowerCase(), identifier: clean.toLowerCase(), otp: cleanOtp }
      : {
          mobile: clean,
          phone: clean,
          phone_number: clean,
          identifier: clean,
          otp: cleanOtp
        };

    // Try specialized login-with-otp endpoint first
    let resData = await safeFetch(`${getApiBaseUrl()}/vendors/login-with-otp`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!resData.res.ok) {
      // Fallback 1: /vendors/otp-login
      resData = await safeFetch(`${getApiBaseUrl()}/vendors/otp-login`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    if (!resData.res.ok) {
      // Fallback 2: /vendors/login
      resData = await safeFetch(`${getApiBaseUrl()}/vendors/login`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    const { res, data } = resData;

    if (!res.ok) {
      const errMsg = (data?.error || data?.message || '').toLowerCase();
      if (
        res.status === 403 ||
        data?.code === 'VENDOR_BLOCKED' ||
        data?.is_blocked ||
        errMsg.includes('blocked')
      ) {
        const err: any = new Error(
          data?.error ||
          data?.message ||
          'Your vendor account has been blocked by admin. Access denied.'
        );
        err.isBlocked = true;
        err.code = 'VENDOR_BLOCKED';
        err.blockReason = data?.block_reason || data?.reason;
        throw err;
      }

      if (res.status === 404 || errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        throw new Error('No vendor account found with this mobile number. Please register first.');
      }

      throw new Error(data?.error || data?.message || 'Login with OTP failed. Please check the code.');
    }

    const tokenToSave = data.accessToken || data.token;
    if (tokenToSave) {
      await saveTokens(tokenToSave, data.refreshToken);
    }

    return {
      ...data,
      accessToken: tokenToSave,
      vendor: data.vendor || {
        vendor_id: data.vendor_id,
        store_name: data.store_name || data.storeName,
        vendor_name: data.vendor_name || data.vendorName,
        email: data.email,
        phone_number: data.phone_number || data.phone,
        status: data.status || 'active',
      }
    };
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('fetch')) {
      throw new Error(`Server connection failed (${getApiBaseUrl()}). Ensure backend server is active.`);
    }
    throw err;
  }
}

export async function refreshAccessTokenApi(refreshToken: string): Promise<string | null> {
  try {
    let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/refresh-token`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });

    if (!res.ok) {
      const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/refresh`, {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      res = fallback.res;
      data = fallback.data;
    }

    if (res.ok && (data.accessToken || data.token)) {
      const newToken = data.accessToken || data.token;
      await saveTokens(newToken, data.refreshToken || refreshToken);
      return newToken;
    }
    return null;
  } catch (err) {
    console.error('Failed to refresh access token:', err);
    return null;
  }
}

export async function logoutVendorApi(refreshToken?: string): Promise<{ message?: string; success?: boolean }> {
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/logout`, {
      method: 'POST',
      body: JSON.stringify({ refreshToken })
    });
    return data || { success: true, message: 'Logout successful' };
  } catch (err) {
    console.error('Logout error:', err);
    return { success: true, message: 'Logged out locally' };
  }
}

export async function sendOtpApi(
  identifier: string,
  purpose?: 'login' | 'register'
): Promise<{ exists?: boolean; message?: string; target?: string; provider?: string; simulationOtp?: string; otp?: string; code?: string; success?: boolean; data?: any }> {
  const clean = identifier.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
  const payload = isEmail
    ? { phone: clean, mobile: clean, email: clean.toLowerCase(), identifier: clean.toLowerCase(), purpose }
    : {
        phone: clean,
        mobile: clean,
        phone_number: clean,
        identifier: clean,
        email: `${clean}@mobile.digilocal.com`,
        purpose
      };

  // 1. Try v3.6.0 primary endpoint: POST /api/vendors/send-otp
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/send-otp`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok && data) {
      return data;
    }
  } catch (_) {}

  // 2. Fallback: POST /api/otp/send-otp
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/otp/send-otp`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.message || `Failed to send OTP (Status: ${res.status})`);
    }

    return data;
  } catch (err: any) {
    throw err;
  }
}

export async function verifyOtpApi(
  identifier: string,
  otp?: string
): Promise<boolean> {
  const clean = identifier.trim();
  const cleanOtp = otp?.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean);
  const payload = isEmail
    ? { phone: clean, email: clean.toLowerCase(), identifier: clean.toLowerCase(), otp: cleanOtp }
    : {
        phone: clean,
        mobile: clean,
        phone_number: clean,
        identifier: clean,
        email: `${clean}@mobile.digilocal.com`,
        otp: cleanOtp
      };

  // 1. Try v3.6.0 primary endpoint: POST /api/vendors/verify-otp
  try {
    const { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/verify-otp`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.ok && (data.success !== false)) {
      return true;
    }
  } catch (_) {}

  // 2. Fallback: POST /api/otp/verify-otp
  const { res, data } = await safeFetch(`${getApiBaseUrl()}/otp/verify-otp`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (!res.ok || data.success === false) {
    throw new Error(data.error || data.message || 'Invalid or expired OTP code');
  }
  return true;
}

/**
 * ⚡ Step 4: Vendor Approval Status Check API (v3.6.0)
 * Calls GET /api/vendors/status?phone=<PHONE> or GET /api/vendors/status/:vendorId
 */
export async function fetchVendorApprovalStatusApi(
  phoneOrVendorId: string | number
): Promise<{
  status: string;
  vendor_id?: number;
  store_name?: string;
  vendor_name?: string;
  hold_reason?: string;
  hold_email_subject?: string;
  has_resubmitted?: boolean;
  message?: string;
  is_blocked?: boolean;
}> {
  const isId = typeof phoneOrVendorId === 'number' || /^\d{1,6}$/.test(String(phoneOrVendorId));
  const url = isId
    ? `${getApiBaseUrl()}/vendors/status/${phoneOrVendorId}`
    : `${getApiBaseUrl()}/vendors/status?phone=${encodeURIComponent(String(phoneOrVendorId).trim())}`;

  try {
    const { res, data } = await safeFetch(url);
    if (res.ok && data) {
      return data;
    }
  } catch (_) {}

  return { status: 'PENDING', message: 'Status check currently in progress.' };
}

/**
 * ⚡ Step 5: Resubmit On-Hold Vendor Application API (v3.6.0)
 * Calls POST /api/vendors/resubmit with updated shop_image, gstin, address
 */
export async function resubmitVendorApplicationApi(payload: {
  vendor_id: number;
  shop_image?: string;
  gstin?: string;
  pan_number?: string;
  address?: string;
  message?: string;
}): Promise<{ success: boolean; message: string; status: string }> {
  try {
    let { res, data } = await safeFetch(`${getApiBaseUrl()}/vendors/resubmit`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const fallback = await safeFetch(`${getApiBaseUrl()}/vendors/resubmit`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      res = fallback.res;
      data = fallback.data;
    }

    if (res.ok) {
      return {
        success: true,
        message: data.message || 'Application resubmitted successfully for admin re-evaluation.',
        status: data.status || 'PENDING'
      };
    }

    throw new Error(data?.error || data?.message || 'Failed to resubmit application.');
  } catch (err: any) {
    throw err;
  }
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
