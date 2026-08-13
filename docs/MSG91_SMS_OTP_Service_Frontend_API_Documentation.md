# MSG91 SMS OTP Service — Frontend API Documentation

Complete REST API specification for integrating **Mobile & Website SMS OTP Authentication** using the MSG91 OTP service.

---

## 🌐 Base URLs

| Environment | Base URL |
|-------------|----------|
| **Local Server** | `http://localhost:5001/api` |
| **Local Network (LAN)** | `http://172.25.12.195:5001/api` |
| **Production Cloud** | `https://digi-local-backend.onrender.com/api` |

---

## 📋 API Endpoints

| Operation | Method | Endpoint | Description |
|-----------|--------|----------|-------------|
| **Send OTP** | `POST` | `/api/otp/send-otp` | Send 6-digit OTP SMS to mobile number |
| **Verify OTP** | `POST` | `/api/otp/verify-otp` | Verify OTP code entered by user |

---

## 1. Send OTP SMS (`POST /api/otp/send-otp`)

Triggers an SMS containing a 6-digit OTP to the specified mobile number via MSG91 service.

- **Method:** `POST`
- **Endpoint:** `/api/otp/send-otp`
- **Content-Type:** `application/json`

### 📥 Expected Input

**Request Body:**
```json
{
  "phone": "9876543210"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ Yes | 10-digit Indian mobile number or prefixed string (`9876543210`, `+919876543210`, or `919876543210`) |

---

### 📤 Expected Output

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "type": "success",
    "message": "OTP sent successfully",
    "mobile": "919876543210"
  }
}
```

#### Error Response (`400 Bad Request` — Invalid/Missing Phone)
```json
{
  "success": false,
  "message": "Invalid phone number format. Provide a valid 10-digit mobile number."
}
```

#### Error Response (`500 Internal Server Error` — Gateway Error)
```json
{
  "success": false,
  "message": "Failed to send OTP via MSG91"
}
```

---

## 2. Verify OTP (`POST /api/otp/verify-otp`)

Verifies the 6-digit OTP code entered by the user against MSG91 verification engine.

- **Method:** `POST`
- **Endpoint:** `/api/otp/verify-otp`
- **Content-Type:** `application/json`

### 📥 Expected Input

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | `string` | ✅ Yes | Mobile number used when requesting the OTP |
| `otp` | `string` | ✅ Yes | 6-digit OTP entered by the user |

---

### 📤 Expected Output

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "type": "success",
    "message": "OTP verified successfully",
    "mobile": "919876543210"
  }
}
```

#### Error Response (`400 Bad Request` — Incorrect or Expired OTP)
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 💻 Frontend Code Example (Fetch API)

```javascript
const BASE_URL = 'http://localhost:5001/api/otp';

// 1. Send OTP
async function handleSendOtp(phoneNumber) {
  const res = await fetch(`${BASE_URL}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneNumber })
  });
  const data = await res.json();
  if (data.success) {
    alert('OTP sent successfully!');
  } else {
    alert('Failed to send OTP: ' + data.message);
  }
}

// 2. Verify OTP
async function handleVerifyOtp(phoneNumber, otpCode) {
  const res = await fetch(`${BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: phoneNumber, otp: otpCode })
  });
  const data = await res.json();
  if (data.success) {
    alert('OTP verified successfully!');
  } else {
    alert('Verification failed: ' + data.message);
  }
}
```
