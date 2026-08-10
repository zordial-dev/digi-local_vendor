# 🔑 DigiLocal Vendor App — OTP Authentication & Password Reset API Documentation

This document provides complete documentation for integrating **OTP Send, Verification, Forgot Password, and Password Reset** endpoints for the **Vendor Store Mobile App** (`/api/vendors`).

---

## 📡 Base URL
`http://<your-backend-domain>:5000/api/vendors`

---

## 📲 1. Send Vendor OTP (`POST /api/vendors/send-otp`)
Generates and sends an OTP code to a vendor's mobile number or email address for registration or verification.

- **Endpoint**: `/api/vendors/send-otp`
- **Method**: `POST`
- **Auth Required**: No
- **Headers**: `Content-Type: application/json`

### Request Body (`application/json`):
```json
{
  "phone": "9828365559" // or "email": "vendor@store.com"
}
```

### Response (`200 OK`):
```json
{
  "message": "OTP verification request initiated successfully. Please enter the verification code or Firebase token.",
  "target": "9828365559"
}
```

### Error Response (`400 Bad Request`):
```json
{
  "error": "Email or mobile number is required to send OTP"
}
```

---

## 🔍 2. Verify Vendor OTP (`POST /api/vendors/verify-otp`)
Verifies the OTP code entered by the vendor.

- **Endpoint**: `/api/vendors/verify-otp`
- **Method**: `POST`
- **Auth Required**: No
- **Headers**: `Content-Type: application/json`

### Request Body (`application/json`):
```json
{
  "email": "vendor@store.com", // or phone number string e.g. "9828365559"
  "otp": "123456"
}
```

### Response (`200 OK`):
```json
{
  "message": "OTP verified successfully. You may now reset your password."
}
```

### Error Response (`400 Bad Request`):
```json
{
  "error": "Invalid or expired OTP code"
}
```

---

## 🔒 3. Forgot Password OTP (`POST /api/vendors/forgot-password`)
Triggers an OTP verification code to the vendor's registered email address for password recovery.

- **Endpoint**: `/api/vendors/forgot-password`
- **Method**: `POST`
- **Auth Required**: No
- **Headers**: `Content-Type: application/json`

### Request Body (`application/json`):
```json
{
  "email": "vendor@store.com"
}
```

### Response (`200 OK`):
```json
{
  "message": "OTP sent successfully to registered email address"
}
```

---

## 🔑 4. Reset Password using OTP (`POST /api/vendors/reset-password`)
Resets the vendor account password after OTP verification.

- **Endpoint**: `/api/vendors/reset-password`
- **Method**: `POST`
- **Auth Required**: No
- **Headers**: `Content-Type: application/json`

### Request Body (`application/json`):
```json
{
  "email": "vendor@store.com",
  "otp": "123456",
  "newPassword": "NewStrongPassword123!"
}
```

### Response (`200 OK`):
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

### Error Response (`400 Bad Request`):
```json
{
  "error": "Invalid or expired OTP code"
}
```

---

## 🧪 Testing with cURL Examples

### 1. Send OTP:
```bash
curl -X POST http://localhost:5000/api/vendors/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9828365559"}'
```

### 2. Verify OTP:
```bash
curl -X POST http://localhost:5000/api/vendors/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "vendor@store.com", "otp": "123456"}'
```

### 3. Forgot Password:
```bash
curl -X POST http://localhost:5000/api/vendors/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "vendor@store.com"}'
```

### 4. Reset Password:
```bash
curl -X POST http://localhost:5000/api/vendors/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "vendor@store.com", "otp": "123456", "newPassword": "NewPassword123!"}'
```

---
