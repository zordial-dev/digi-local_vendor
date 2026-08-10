# 📱 DigiLocal Vendor App — OTP REST API Complete Specification (v2.0.0)

> **Target Audience:** Vendor Mobile App Frontend Developers (React Native / Expo / Flutter)  
> **Server Base URL (Local Wi-Fi Network):** `http://172.25.12.195:5001/api/vendors`  
> **Localhost Base URL:** `http://localhost:5001/api/vendors`  
> **Cloud Base URL:** `https://digi-local-backend.onrender.com/api/vendors`  

---

## 🔑 OTP System Architecture & Rules

The Vendor OTP engine matches the **Resident User OTP system** 1:1. It supports:
1. **Firebase Phone Authentication**: Client Mobile SDK triggers SMS via Google Firebase and sends `firebase_token` to the backend.
2. **Backend 6-Digit OTP**: Direct 6-digit numeric OTP generation & verification for testing and fallback SMS.
3. **Flexible Mobile Keys**: Accepts `mobile`, `phone`, `phone_number`, or `identifier` in the request body.
4. **Pre-Check Registration**: Allows checking if a phone number is registered before triggering SMS.

---

## 1. Pre-Check Vendor Mobile Registration

- **HTTP Method:** `POST`
- **Route Endpoint:** `/check-phone` (or `/check-mobile`)
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/check-phone`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "phone": "+919571240742"
}
```
*(Accepts `phone`, `mobile`, `phone_number`, or `identifier`)*

### ✅ Response — Account Found (`HTTP 200 OK`)
```json
{
  "exists": true,
  "phone": "+919571240742",
  "message": "Account found"
}
```

### ✅ Response — No Account (`HTTP 200 OK`)
```json
{
  "exists": false,
  "phone": "+919571240742",
  "message": "No vendor account found with this mobile number"
}
```

---

## 2. Dispatch Mobile OTP

- **HTTP Method:** `POST`
- **Route Endpoint:** `/send-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/send-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body (Login):
```json
{
  "mobile": "+919571240742",
  "purpose": "login"
}
```

### 📥 Request Body (Signup/Registration):
```json
{
  "mobile": "+919571240742",
  "purpose": "register"
}
```

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "exists": true,
  "message": "OTP dispatch initiated via Firebase Phone Authentication. Please complete SMS verification on client and submit firebase_token.",
  "target": "+919571240742",
  "provider": "firebase",
  "simulationOtp": "764481",
  "otp": "764481",
  "code": "764481"
}
```

### ❌ Error Response — Unregistered for Login (`HTTP 404 Not Found`)
```json
{
  "exists": false,
  "error": "No vendor store account found with this mobile number. Please register your account first."
}
```

---

## 3. Verify OTP Code or Firebase Token

- **HTTP Method:** `POST`
- **Route Endpoint:** `/verify-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/verify-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Option A: Verifying 6-Digit Backend OTP Code
```json
{
  "mobile": "+919571240742",
  "otp": "764481"
}
```

### 📥 Option B: Verifying Firebase Phone Auth Token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "OTP verified successfully",
  "valid": true,
  "phone_number": "+919571240742"
}
```

### ❌ Error Response (`HTTP 400 Bad Request`)
```json
{
  "error": "Invalid OTP code. Please double check your verification code."
}
```

---

## 4. Vendor Login (Mobile OTP or Firebase Token)

- **HTTP Method:** `POST`
- **Route Endpoint:** `/login`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/login`
- **Headers:** `Content-Type: application/json`

### 📥 Option A: Login with 6-Digit Mobile OTP
```json
{
  "mobile": "+919571240742",
  "otp": "764481"
}
```

### 📥 Option B: Login with Firebase Token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor": {
    "vendor_id": 103,
    "store_name": "Raj Super Mart",
    "vendor_name": "Raj Kumar",
    "email": "raj.kumar@digilocal.com",
    "phone_number": "9571240742",
    "society_id": 1,
    "status": "ACTIVE"
  }
}
```

---

## 📱 React Native / Expo Mobile App Implementation Example

```typescript
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const BASE_URL = 'http://172.25.12.195:5001/api/vendors';

// 1. Pre-Check Phone Registration
export const checkVendorMobile = async (mobileNumber: string) => {
  const response = await axios.post(`${BASE_URL}/check-phone`, { phone: mobileNumber });
  return response.data; // { exists: boolean, phone: string, message: string }
};

// 2. Request Mobile OTP (Send OTP)
export const sendVendorOtp = async (mobileNumber: string, isLogin: boolean = true) => {
  const response = await axios.post(`${BASE_URL}/send-otp`, {
    mobile: mobileNumber,
    purpose: isLogin ? 'login' : 'register'
  });
  return response.data;
};

// 3. Login using Firebase Phone Auth SDK
export const loginWithFirebasePhoneAuth = async (phoneNumber: string, smsCode: string) => {
  // Trigger Firebase SMS via SDK
  const confirmation = await auth().signInWithPhoneNumber(phoneNumber);

  // Confirm 6-digit SMS code
  const userCredential = await confirmation.confirm(smsCode);
  const idToken = await userCredential.user.getIdToken();

  // Exchange with Backend for DigiLocal JWT Tokens & Profile
  const response = await axios.post(`${BASE_URL}/login`, {
    firebase_token: idToken
  });

  return response.data; // { accessToken, refreshToken, vendor }
};

// 4. Login using 6-Digit Backend OTP
export const loginWithNumericOtp = async (mobileNumber: string, otpCode: string) => {
  const response = await axios.post(`${BASE_URL}/login`, {
    mobile: mobileNumber,
    otp: otpCode
  });
  return response.data;
};
```
