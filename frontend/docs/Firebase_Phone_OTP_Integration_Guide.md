# 📱 DigiLocal Vendor Mobile App — Firebase Phone OTP Integration Guide

> **Target Audience:** Vendor Mobile App Frontend Developers (React Native / Expo / Flutter)  
> **Backend Server Base URL:** `http://172.25.12.195:5001/api/vendors`  

---

## 🚀 How Firebase Phone Auth Works (Same as User App)

```
[Vendor Mobile App] ──(1) Firebase SDK triggers SMS ────> Google Firebase ──> [Vendor Phone SMS]
[Vendor Mobile App] <──(2) Vendor enters 6-digit SMS code ──────────────────── [Vendor Phone SMS]
[Vendor Mobile App] ──(3) Firebase verifies code & returns idToken ──────────> Google Firebase
[Vendor Mobile App] ──(4) POST /api/vendors/login { firebase_token: idToken }> [DigiLocal Backend]
[DigiLocal Backend] ──(5) Verifies token & returns JWT Access & Refresh Tokens> [Vendor Mobile App]
```

---

## 💻 Complete React Native / Expo Frontend Code

```typescript
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const BACKEND_URL = 'http://172.25.12.195:5001/api/vendors';

let confirmationResult: any = null;

// 1. STEP 1: Check Phone & Trigger Firebase SMS to Mobile Number
export async function sendOtpToVendorMobile(mobileNumber: string) {
  // Always format with +91 country code
  const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

  // Pre-check phone registration on DigiLocal backend
  const { data: checkRes } = await axios.post(`${BACKEND_URL}/check-phone`, { phone: formattedPhone });
  if (!checkRes.exists) {
    throw new Error('No vendor store account found with this mobile number. Please register first.');
  }

  // Notify backend (optional logging)
  await axios.post(`${BACKEND_URL}/send-otp`, { mobile: formattedPhone, purpose: 'login' });

  // 💥 Trigger Firebase Client SDK SMS to SIM Card (Same as User App!)
  confirmationResult = await auth().signInWithPhoneNumber(formattedPhone);

  return { success: true, message: `SMS OTP sent to ${formattedPhone}` };
}

// 2. STEP 2: Confirm 6-Digit SMS Code & Login to DigiLocal Backend
export async function verifySmsAndLoginVendor(smsCode: string) {
  if (!confirmationResult) {
    throw new Error('Please request OTP first.');
  }

  // Confirm 6-digit SMS code with Firebase
  const userCredential = await confirmationResult.confirm(smsCode);

  // Extract Firebase ID Token
  const idToken = await userCredential.user.getIdToken();

  // Exchange Firebase Token for DigiLocal JWT Tokens & Store Profile
  const { data } = await axios.post(`${BACKEND_URL}/login`, {
    firebase_token: idToken
  });

  return data; // { accessToken, refreshToken, vendor }
}
```

---

## 🌐 DigiLocal Backend Endpoints Reference

| Endpoint | Method | Body Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/vendors/check-phone` | `POST` | `{ "phone": "+919571240742" }` | Pre-checks if vendor account exists |
| `/api/vendors/send-otp` | `POST` | `{ "mobile": "+919571240742", "purpose": "login" }` | Logs request on backend |
| `/api/vendors/verify-otp` | `POST` | `{ "firebase_token": "idToken" }` | Verifies Firebase ID Token |
| `/api/vendors/login` | `POST` | `{ "firebase_token": "idToken" }` | Authenticates vendor & returns JWT |
