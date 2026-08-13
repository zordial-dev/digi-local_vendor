# 📱 DigiLocal Vendor App — Mobile OTP REST API Specification

> **Target Audience:** Vendor Mobile App Frontend Developer (On Local Network / Wi-Fi)  
> **Version:** 2.0.0 (Mobile OTP Only Specification)  
> **Server Base URL (Local Wi-Fi Network):** `http://172.25.12.195:5001/api/vendors`  

---

## 🔑 Key Rules & Specifications

1. **Base Network URL**: `http://172.25.12.195:5001/api/vendors`  
2. **OTP Format**: 6-digit numeric string (e.g. `"584920"`).
3. **Expiration Time (TTL)**: 10 minutes (600,000 milliseconds).
4. **Max Verification Attempts**: 5 attempts per generated OTP code.
5. **Flexible Mobile Payload Keys**: The backend accepts `mobile`, `phone`, `phone_number`, or `identifier` (e.g. `"+919876543210"` or `"9876543210"`).
6. **Simulation Mode**: In testing environments, the API returns `"simulationOtp"` in the JSON response payload for immediate testing without SMS waiting.

---

## 1. Send Mobile OTP

Dispatches a 6-digit OTP code to a vendor's mobile number.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/send-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/send-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "mobile": "+919876543210"
}
```
*(Accepts `mobile`, `phone`, `phone_number`, or `identifier`)*

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "OTP verification request initiated successfully. Please enter the verification code or Firebase token.",
  "target": "+919876543210"
}
```

### ❌ Error Response (`HTTP 400 Bad Request`)
```json
{
  "error": "Email or mobile number is required to send OTP"
}
```

---

## 2. Verify Mobile OTP Code

Validates the 6-digit OTP code sent to the vendor's mobile number.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/verify-otp`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/verify-otp`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```
*(Accepts `phone`, `mobile`, `phone_number`, or `identifier`)*

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "OTP verified successfully. You may now proceed or reset your password."
}
```

### ❌ Error Responses (`HTTP 400 Bad Request`)
- **Invalid OTP Code:** `{ "error": "Invalid OTP" }`
- **Expired OTP Code:** `{ "error": "OTP has expired" }`
- **Max Tries Exceeded:** `{ "error": "Maximum OTP verification attempts exceeded" }`

---

## 3. Request Mobile Password Reset OTP (Forgot Password)

Triggers a password recovery OTP to the vendor's registered mobile number.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/forgot-password`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/forgot-password`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "mobile": "+919876543210"
}
```

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "OTP sent successfully to registered mobile or email address",
  "target": "+919876543210",
  "simulationOtp": "584920"
}
```

---

## 4. Reset Password with Mobile OTP

Sets a new account password using the verified 6-digit Mobile OTP.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/reset-password`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/reset-password`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body
```json
{
  "mobile": "+919876543210",
  "otp": "584920",
  "newPassword": "NewSecurePassword123!"
}
```

### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "Password reset successfully! You can now log in with your new password."
}
```

### ❌ Error Responses (`HTTP 400 Bad Request`)
- **Validation Failure:** `{ "error": "New password must be at least 6 characters long" }`
- **Invalid OTP:** `{ "error": "Invalid OTP" }`

---

## 5. Mobile OTP Direct Login

Logs a vendor into their store account directly using **Mobile Number + 6-Digit OTP**.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/login`
- **Full Network URL:** `http://172.25.12.195:5001/api/vendors/login`
- **Headers:** `Content-Type: application/json`

### 📥 Request Body (Mobile OTP Login)
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```

### 📥 Request Body (Mobile + Password Login)
```json
{
  "mobile": "+919876543210",
  "password": "VendorPassword123!"
}
```

### ✅ Success Response (`HTTP 200 OK`)
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
    "status": "ACTIVE"
  }
}
```

---

## 📱 React Native / Expo Frontend Integration Code (TypeScript)

```typescript
import { sendOtpApi, verifyOtpApi, loginVendorWithOtpApi, forgotPasswordOtpApi, resetPasswordWithOtpApi } from '../services/apiService';

// 1. Send OTP to Mobile Number
export const sendMobileOtp = async (mobileNumber: string) => {
  return await sendOtpApi(mobileNumber);
};

// 2. Verify Mobile OTP Code
export const verifyMobileOtp = async (mobileNumber: string, otpCode: string) => {
  return await verifyOtpApi(mobileNumber, otpCode);
};

// 3. Mobile OTP Login
export const loginWithMobileOtp = async (mobileNumber: string, otpCode: string) => {
  return await loginVendorWithOtpApi(mobileNumber, otpCode);
};

// 4. Reset Password with Mobile OTP
export const resetPasswordWithMobileOtp = async (
  mobileNumber: string,
  otpCode: string,
  newPasswordStr: string
) => {
  return await resetPasswordWithOtpApi(mobileNumber, otpCode, newPasswordStr);
};
```
