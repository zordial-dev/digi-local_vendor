# 🌐 DigiLocal Vendor Web Panel — OTP Authentication REST API Specification

> **Target Audience:** Vendor Web Portal Frontend Engineering Team (React / Next.js / Vue / HTML5)  
> **Version:** 2.0.0 (Complete Vendor Mobile & Email OTP Specification)  
> **Local Network Base URL:** `http://172.25.12.195:5001/api/vendors`  
> **Localhost Base URL:** `http://localhost:5001/api/vendors`  
> **Cloud Base URL:** `https://digi-local-backend.onrender.com/api/vendors`  

---

## 🔑 Overview & OTP System Parity

The Vendor Web Panel OTP authentication engine is **100% feature-identical** to the Resident User OTP system. It supports:
1. **Dual OTP Methods**: Native 6-digit numeric OTPs or Firebase Phone Authentication (`idToken` / `firebase_token`).
2. **Pre-check Phone Registration**: Verify whether a phone number belongs to an existing vendor account before triggering OTPs.
3. **Flexible Payload Keys**: Accepts `mobile`, `phone`, `phone_number`, or `identifier` (e.g. `"+919876543210"` or `"9876543210"`).
4. **Purpose-Driven Dispatch**: Accepts `purpose: "login"` or `purpose: "register"` to validate account existence prior to sending SMS/Email.

---

## 1. Check Phone Registration Status

Checks whether a vendor account exists for a given mobile number before initiating login or signup.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/check-phone` (or `/check-mobile`)
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/check-phone`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "phone": "+919876543210"
}
```
*(Accepts `phone`, `mobile`, `phone_number`, or `identifier`)*

### ✅ Response — Account Exists (`HTTP 200 OK`)
```json
{
  "exists": true,
  "phone": "+919876543210",
  "message": "Vendor account found"
}
```

### ✅ Response — No Account (`HTTP 200 OK`)
```json
{
  "exists": false,
  "phone": "+919876543210",
  "message": "No vendor account found with this mobile number"
}
```

---

## 2. Send Vendor OTP

Dispatches a 6-digit OTP code to a vendor's mobile number or email address.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/send-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/send-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body (For Vendor Login):
```json
{
  "mobile": "+919876543210",
  "purpose": "login"
}
```

### 📥 Request Body (For New Vendor Signup):
```json
{
  "mobile": "+919876543210",
  "purpose": "register"
}
```

### ✅ Success Response (`HTTP 200 OK`):
```json
{
  "exists": true,
  "message": "OTP verification request initiated successfully. Please enter the verification code or Firebase token.",
  "target": "+919876543210",
  "provider": "firebase",
  "simulationOtp": "584920"
}
```
*(Note: `simulationOtp` is returned in non-production testing environments for instant manual verification).*

### ❌ Error Responses:
- **No Account for Login (`HTTP 404 Not Found`):**
  ```json
  {
    "exists": false,
    "error": "No vendor store account found with this mobile number. Please register your account first."
  }
  ```
- **Account Already Exists for Register (`HTTP 400 Bad Request`):**
  ```json
  {
    "exists": true,
    "error": "An account with this mobile number already exists. Please log in instead."
  }
  ```

---

## 3. Verify Vendor OTP Code / Firebase Token

Validates either a 6-digit backend OTP code OR a Firebase Phone Auth `idToken`.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/verify-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/verify-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Option A: Verifying 6-Digit Backend OTP
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```

### 📥 Option B: Verifying Firebase Phone Auth ID Token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### ✅ Success Response (`HTTP 200 OK`):
```json
{
  "message": "OTP verified successfully",
  "valid": true,
  "phone_number": "+919876543210"
}
```

### ❌ Error Response (`HTTP 400 Bad Request`):
```json
{
  "error": "Invalid OTP code. Please check your verification code."
}
```

---

## 4. Vendor Login (OTP or Password)

Authenticates vendor and returns standard JWT Access & Refresh Tokens along with full store profile details.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/login`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/login`
- **Headers:** `Content-Type: application/json`

### 📥 Option A: Login with Mobile OTP
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```

### 📥 Option B: Login with Firebase Token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

### 📥 Option C: Login with Mobile/Email & Password
```json
{
  "identifier": "+919876543210",
  "password": "VendorPassword123!"
}
```

### ✅ Success Response (`HTTP 200 OK`):
```json
{
  "message": "Vendor login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor": {
    "vendor_id": 103,
    "vendor_name": "Rahul Sharma",
    "email": "rahul.sharma@gmail.com",
    "phone_number": "+919876543210",
    "store_name": "FreshMart Grocery & Organic",
    "public_id": "SOC1-V103",
    "status": "ACTIVE",
    "society_id": 1
  }
}
```

---

## 5. Vendor Registration

Creates a new vendor store profile.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/register`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/register`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body:
```json
{
  "store_name": "Fresh Grocery & Vegetables",
  "vendor_name": "Rakesh Patel",
  "email": "rakesh.fresh@gmail.com",
  "phone_number": "+919876543210",
  "password": "SecureVendorPass123!",
  "society_id": 1,
  "category": "Grocery",
  "address": "Shop #12, Greenwood Residency",
  "gst_number": "07AAAAA140001Z5"
}
```

### ✅ Success Response (`HTTP 201 Created`):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor_id": 104,
  "vendor": {
    "vendor_id": 104,
    "store_name": "Fresh Grocery & Vegetables",
    "vendor_name": "Rakesh Patel",
    "status": "ACTIVE"
  }
}
```

---

## 🌐 JavaScript / React Web Panel Integration Example

```javascript
import { checkVendorPhoneApi, sendOtpApi, verifyOtpApi, loginVendorWithOtpApi } from '../services/apiService';

// 1. Check if Phone is Registered
export async function checkVendorMobile(phone) {
  return await checkVendorPhoneApi(phone);
  // { exists: boolean, phone: string, message: string }
}

// 2. Request OTP for Login
export async function requestVendorLoginOtp(phone) {
  return await sendOtpApi(phone, 'login');
}

// 3. Verify OTP & Login Vendor
export async function loginVendorWithOtp(phone, otpCode) {
  const data = await loginVendorWithOtpApi(phone, otpCode);
  // Save JWT Access Token to localStorage / cookies
  localStorage.setItem('vendor_access_token', data.accessToken || data.token);
  localStorage.setItem('vendor_profile', JSON.stringify(data.vendor));
  return data;
}
```
