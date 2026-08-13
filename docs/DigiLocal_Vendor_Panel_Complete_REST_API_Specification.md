# 🌐 DigiLocal Vendor Panel — Complete REST API Specification (v2.0.0)

> **Target Audience:** Frontend Engineering (React / React Native / Vue / HTML5) & Backend Integration Teams  
> **API Version:** 2.0.0 (Complete Vendor Mobile, Firebase Auth & Store Operations Specification)  
> **Base Environment URLs:**
> - **Cloud Base URL:** `https://digi-local-backend.onrender.com/api/vendors`
> - **Local Network Base URL:** `http://172.25.12.195:5001/api/vendors`
> - **Localhost Base URL:** `http://localhost:5001/api/vendors`

---

## 🔑 Overview & OTP System Architecture

The DigiLocal Vendor Panel API provides an enterprise-grade backend infrastructure for hyper-local society vendor onboarding, store management, inventory control, and order fulfillment.

### Key Authentication Features:
1. **Dual OTP Methods**: Native 6-digit numeric OTPs or Firebase Phone Authentication (`firebase_token` / `idToken`).
2. **Pre-check Phone Status**: Instant verification whether a mobile number belongs to an existing vendor account before dispatching OTPs.
3. **Flexible Payload Identifiers**: Accepts `mobile`, `phone`, `phone_number`, or `identifier` in formats `+919876543210` or `9876543210`.
4. **Purpose-Driven Dispatch**: Requires `purpose: "login"` or `purpose: "register"` to enforce proper account state validation.
5. **JWT Bearer Token Security**: Returns standard `accessToken` and `refreshToken` pairs upon login or registration.

---

## 1. Authentication & OTP Endpoints

### 1.1 Check Phone Registration Status
Checks whether a vendor store account exists for a given mobile phone number before initiating login or signup.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/check-phone` (or `/check-mobile`)
- **Full Network URL:** `https://digi-local-backend.onrender.com/api/vendors/check-phone`
- **Headers:** `Content-Type: application/json`

#### 📥 Request Body
```json
{
  "phone": "+919876543210"
}
```
*(Accepts `phone`, `mobile`, `phone_number`, or `identifier`)*

#### ✅ Response — Account Exists (`HTTP 200 OK`)
```json
{
  "exists": true,
  "phone": "+919876543210",
  "message": "Vendor account found"
}
```

#### ✅ Response — No Account (`HTTP 200 OK`)
```json
{
  "exists": false,
  "phone": "+919876543210",
  "message": "No vendor account found with this mobile number"
}
```

---

### 1.2 Send Vendor OTP
Dispatches a 6-digit verification OTP code to a vendor's mobile number or email address.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/send-otp`
- **Full Network URL:** `https://digi-local-backend.onrender.com/api/vendors/send-otp`
- **Headers:** `Content-Type: application/json`

#### 📥 Request Body (Vendor Login)
```json
{
  "mobile": "+919876543210",
  "purpose": "login"
}
```

#### 📥 Request Body (Vendor Registration)
```json
{
  "mobile": "+919876543210",
  "purpose": "register"
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "exists": true,
  "message": "OTP verification request initiated successfully. Please enter the verification code.",
  "target": "+919876543210",
  "provider": "firebase",
  "simulationOtp": "584920"
}
```

#### ❌ Error Responses
- **No Account Found for Login (`HTTP 404 Not Found`):**  
  `{ "exists": false, "error": "No vendor store account found with this mobile number. Please register your account first." }`
- **Account Already Exists for Signup (`HTTP 400 Bad Request`):**  
  `{ "exists": true, "error": "An account with this mobile number already exists. Please log in instead." }`

---

### 1.3 Verify Vendor OTP Code / Firebase Token
Validates either a 6-digit backend OTP code OR a Firebase Phone Authentication `idToken`.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/verify-otp`
- **Full Network URL:** `https://digi-local-backend.onrender.com/api/vendors/verify-otp`
- **Headers:** `Content-Type: application/json`

#### 📥 Option A: Verifying 6-Digit Backend OTP
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```

#### 📥 Option B: Verifying Firebase Phone Auth ID Token
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "OTP verified successfully",
  "valid": true,
  "phone_number": "+919876543210"
}
```

#### ❌ Error Response (`HTTP 400 Bad Request`)
```json
{
  "error": "Invalid OTP code. Please check your verification code."
}
```

---

### 1.4 Vendor Login (OTP, Firebase, or Password)
Authenticates a vendor and returns standard JWT Access & Refresh Tokens along with full store profile details.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/login`
- **Full Network URL:** `https://digi-local-backend.onrender.com/api/vendors/login`
- **Headers:** `Content-Type: application/json`

#### 📥 Option A: Mobile OTP Login
```json
{
  "mobile": "+919876543210",
  "otp": "584920"
}
```

#### 📥 Option B: Firebase Token Login
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIs..."
}
```

#### 📥 Option C: Mobile/Email & Password Login
```json
{
  "identifier": "+919876543210",
  "password": "VendorPassword123!"
}
```

#### ✅ Success Response (`HTTP 200 OK`)
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

### 1.5 Vendor Registration
Registers a new vendor store profile associated with a Housing Society.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/register`
- **Full Network URL:** `https://digi-local-backend.onrender.com/api/vendors/register`
- **Headers:** `Content-Type: application/json`

#### 📥 Request Body
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
  "gst_number": "07AAAAA140001Z5",
  "firebase_token": "eyJhbGciOiJSUzI1..."
}
```

#### ✅ Success Response (`HTTP 201 Created`)
```json
{
  "message": "Vendor registration completed successfully!",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "vendor_id": 104,
  "vendor": {
    "vendor_id": 104,
    "store_name": "Fresh Grocery & Vegetables",
    "vendor_name": "Rakesh Patel",
    "email": "rakesh.fresh@gmail.com",
    "phone_number": "+919876543210",
    "society_id": 1,
    "category": "Grocery",
    "address": "Shop #12, Greenwood Residency",
    "status": "ACTIVE"
  }
}
```

---

## 2. Session & Token Management

### 2.1 Refresh JWT Access Token
Generates a new short-lived Access Token using a valid Refresh Token.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/refresh`
- **Headers:** `Content-Type: application/json`

#### 📥 Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "Access token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 2.2 Vendor Logout
Revokes session tokens and logs out the vendor.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/logout`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`

#### 📥 Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "Logout successful, tokens revoked"
}
```

---

## 3. Store Profile & Operating Hours

### 3.1 Get Vendor Store Profile
Retrieves detailed store information, including address, timing, and ratings.

- **HTTP Method:** `GET`
- **Route Endpoint:** `/:vendorId`
- **Headers:** `Authorization: Bearer <accessToken>`

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "vendor_id": 103,
  "store_name": "FreshMart Grocery & Organic",
  "vendor_name": "Rahul Sharma",
  "email": "rahul.sharma@gmail.com",
  "phone_number": "+919876543210",
  "category": "Grocery & Daily Essentials",
  "rating": "4.9",
  "opening_timing": "08:00 AM",
  "closing_timing": "10:00 PM",
  "status": "ACTIVE",
  "society_name": "Omaxe Greenwood Residency"
}
```

---

### 3.2 Update Vendor Store Profile
Updates store operating hours, contact details, or business category.

- **HTTP Method:** `PUT`
- **Route Endpoint:** `/:vendorId`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`

#### 📥 Request Body
```json
{
  "store_name": "FreshMart Supermarket",
  "opening_timing": "07:30 AM",
  "closing_timing": "10:30 PM",
  "delivery_charge": 0.00
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "Vendor profile updated successfully",
  "vendor": {
    "vendor_id": 103,
    "store_name": "FreshMart Supermarket",
    "opening_timing": "07:30 AM",
    "closing_timing": "10:30 PM"
  }
}
```

---

## 4. Product Catalog & Inventory Management

### 4.1 Get Vendor Products
Lists all product items published by a specific vendor.

- **HTTP Method:** `GET`
- **Route Endpoint:** `/:vendorId/products`

#### ✅ Success Response (`HTTP 200 OK`)
```json
[
  {
    "item_id": "P-101",
    "item_name": "Fresh A2 Organic Milk (1L)",
    "price": 75.00,
    "category": "Dairy",
    "in_stock": true,
    "image_url": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"
  }
]
```

---

### 4.2 Add Product to Catalog
Adds a new item to the vendor store inventory.

- **HTTP Method:** `POST`
- **Route Endpoint:** `/:vendorId/products`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`

#### 📥 Request Body
```json
{
  "item_name": "Organic Brown Bread 400g",
  "price": 55.00,
  "category": "Bakery",
  "in_stock": true,
  "image_url": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400"
}
```

#### ✅ Success Response (`HTTP 201 Created`)
```json
{
  "message": "Product added successfully",
  "item_id": "P-108",
  "product": {
    "item_id": "P-108",
    "item_name": "Organic Brown Bread 400g",
    "price": 55.00,
    "in_stock": true
  }
}
```

---

## 5. Customer Order Management

### 5.1 Get Received Orders
Lists orders placed by residents of the society.

- **HTTP Method:** `GET`
- **Route Endpoint:** `/:vendorId/orders`
- **Headers:** `Authorization: Bearer <accessToken>`

#### ✅ Success Response (`HTTP 200 OK`)
```json
[
  {
    "order_id": "ORD-98421",
    "customer_name": "Aarushi",
    "customer_phone": "+919784319840",
    "delivery_address": "Tower A-402, Greenwood Residency",
    "total_amount": 340.00,
    "status": "ACCEPTED",
    "items": [
      { "item_name": "Organic Milk 1L", "quantity": 2, "unit_price": 75.00 }
    ],
    "created_at": "2026-08-10T15:30:00Z"
  }
]
```

---

### 5.2 Update Order Status
Updates order lifecycle (`ACCEPTED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).

- **HTTP Method:** `PATCH`
- **Route Endpoint:** `/:vendorId/orders/:orderId/status`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <accessToken>`

#### 📥 Request Body
```json
{
  "status": "OUT_FOR_DELIVERY"
}
```

#### ✅ Success Response (`HTTP 200 OK`)
```json
{
  "message": "Order status updated to OUT_FOR_DELIVERY",
  "order_id": "ORD-98421",
  "status": "OUT_FOR_DELIVERY"
}
```

---

## 💻 JavaScript / React Integration Example

```javascript
import axios from 'axios';

const VENDOR_API_BASE = 'https://digi-local-backend.onrender.com/api/vendors';

// 1. Check Mobile Registration Status
export async function checkVendorMobile(phone) {
  const { data } = await axios.post(`${VENDOR_API_BASE}/check-phone`, { phone });
  return data; // { exists: boolean, phone: string, message: string }
}

// 2. Login Vendor with Firebase Token
export async function loginVendorWithFirebase(firebaseToken, phone) {
  const { data } = await axios.post(`${VENDOR_API_BASE}/login`, {
    mobile: phone,
    firebase_token: firebaseToken
  });

  // Save JWT Tokens to localStorage
  localStorage.setItem('vendor_access_token', data.accessToken);
  localStorage.setItem('vendor_refresh_token', data.refreshToken);
  localStorage.setItem('vendor_profile', JSON.stringify(data.vendor));

  return data;
}

// 3. Update Order Status
export async function updateOrderStatus(vendorId, orderId, status) {
  const token = localStorage.getItem('vendor_access_token');
  const { data } = await axios.patch(
    `${VENDOR_API_BASE}/${vendorId}/orders/${orderId}/status`,
    { status },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return data;
}
```
