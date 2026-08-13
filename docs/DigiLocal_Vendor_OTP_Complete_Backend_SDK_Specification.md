# 🚀 DigiLocal Vendor OTP & Authentication — Complete Backend & SDK Specification

> **Target Audience:** Vendor Mobile App Frontend Developers (React Native / Expo / Flutter)  
> **Server Base URL (Local Network):** `http://172.25.12.195:5001/api/vendors`  
> **Cloud Base URL:** `https://digi-local-backend.onrender.com/api/vendors`  

---

## 📌 Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │    Vendor Application (React Native / Web)    │
                      └──────────────────────┬────────────────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
             [Firebase Phone Auth]                        [Backend REST API]
                       │                                           │
            1. User enters phone                        1. User enters phone
            2. Firebase sends SMS to SIM                2. App calls POST /send-otp
            3. App gets idToken                         3. App receives 6-digit OTP
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │    DigiLocal Backend Server   │
                             │ (verifyIdToken / verifyOTP)   │
                             └───────────────┬───────────────┘
                                             │
                                             ▼
                             ┌───────────────────────────────┐
                             │   JWT Access & Refresh Tokens │
                             │      + Vendor Store Data      │
                             └───────────────────────────────┘
```

---

## 🛠️ API Reference Endpoints

### 1. Check Phone Number Registration
- **HTTP Method:** `POST`
- **Full URL:** `http://172.25.12.195:5001/api/vendors/check-phone`
- **Headers:** `Content-Type: application/json`

#### Request Body:
```json
{
  "phone": "9571240742"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "exists": true,
  "phone": "9571240742",
  "message": "Account found"
}
```

---

### 2. Request OTP Dispatch
- **HTTP Method:** `POST`
- **Full URL:** `http://172.25.12.195:5001/api/vendors/send-otp`
- **Headers:** `Content-Type: application/json`

#### Request Body:
```json
{
  "phone": "9571240742",
  "purpose": "login"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "exists": true,
  "message": "OTP dispatch initiated successfully. Please enter the 6-digit verification code.",
  "target": "9571240742",
  "provider": "firebase",
  "simulationOtp": "636133",
  "otp": "636133",
  "code": "636133"
}
```

---

### 3. Verify OTP Code (Optional intermediate step)
- **HTTP Method:** `POST`
- **Full URL:** `http://172.25.12.195:5001/api/vendors/verify-otp`
- **Headers:** `Content-Type: application/json`

#### Request Body (Numeric OTP):
```json
{
  "phone": "9571240742",
  "otp": "636133"
}
```

#### Request Body (Firebase ID Token):
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "message": "OTP verified successfully",
  "valid": true,
  "phone_number": "9571240742"
}
```

---

### 4. Vendor Login & JWT Exchange
- **HTTP Method:** `POST`
- **Full URL:** `http://172.25.12.195:5001/api/vendors/login`
- **Headers:** `Content-Type: application/json`

#### Option A: Firebase ID Token Login (Recommended for Production)
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### Option B: 6-Digit OTP Login
```json
{
  "phone": "9571240742",
  "otp": "636133"
}
```

#### Option C: Password Login
```json
{
  "identifier": "raj.kumar@digilocal.com",
  "password": "VendorPassword123!"
}
```

#### Success Response (`HTTP 200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "accessToken": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "eyJhbGciOiJIUzI1Ni...",
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

## 📱 Frontend Integration Snippets

### React Native / Expo (`@react-native-firebase/auth`)

```typescript
import auth from '@react-native-firebase/auth';
import axios from 'axios';

const BACKEND_URL = 'http://172.25.12.195:5001/api/vendors';

// Step 1: Trigger Firebase Real SMS
export async function sendFirebaseSms(mobileNumber: string) {
  const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

  // Check if store account exists
  const { data: checkRes } = await axios.post(`${BACKEND_URL}/check-phone`, { phone: formattedPhone });
  if (!checkRes.exists) {
    throw new Error('No vendor account registered with this phone number.');
  }

  // Firebase Client SDK sends real SMS to device SIM
  const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
  return confirmation;
}

// Step 2: Verify SMS Code & Authenticate with Backend
export async function verifyAndLogin(confirmationResult: any, smsCode: string) {
  // Confirm SMS code with Firebase Client SDK
  const userCredential = await confirmationResult.confirm(smsCode);
  const firebaseToken = await userCredential.user.getIdToken();

  // Exchange Firebase Token for DigiLocal Vendor JWT
  const response = await axios.post(`${BACKEND_URL}/login`, {
    firebase_token: firebaseToken
  });

  return response.data; // { accessToken, refreshToken, vendor }
}
```
