# 🔔 DigiLocal Vendor Order Notification & Ringing Alert System — API & Mobile App Developer Documentation

This document outlines how the **Zomato / Swiggy-Style Vendor Order Alert System** works in the DigiLocal backend, and provides step-by-step instructions for the mobile app developer (Flutter / Expo React Native / Bare React Native / Native Android / iOS) to integrate real-time notifications and continuous ringing alerts.

---

## 🌟 Architecture Overview

When a customer places a new order on DigiLocal:
1. The backend saves the order in PostgreSQL/SQLite.
2. The backend fetches the store owner's registered **FCM Push Device Token** (or **Expo Push Token**).
3. The backend dispatches a **High-Priority Push Notification** to the vendor's mobile phone via Firebase Cloud Messaging (FCM) or Expo Push API.
4. If the vendor app is open (Foreground), a real-time **Socket.io event** (`new_order_alert`) is also emitted to room `vendor_<vendor_id>`.
5. On the vendor's phone, a **continuous ringing sound** (`order_alert_chime`) and **full-screen order alert modal** pops up until the vendor accepts or rejects the order.

---

## 📡 Backend API Endpoints

### 1. Register / Update Device Token (FCM or Expo)

Whenever a vendor logs into the app or launches it, the mobile app must fetch their FCM Token or Expo Push Token and send it to the backend.

- **Endpoint**: `POST /api/vendors/fcm-token` or `POST /api/vendorPanel/:vendorId/fcm-token` or `POST /api/vendors/device-token`
- **Authentication**: `Authorization: Bearer <VENDOR_JWT_TOKEN>`

#### Request Body (`application/json`):
```json
{
  "fcm_token": "ExponentPushToken[xxxxxxxxxxxxxx]", // or Firebase FCM token string
  "device_type": "android" // "android" or "ios"
}
```

#### Response (`200 OK`):
```json
{
  "message": "FCM device token registered successfully",
  "vendor_id": 21
}
```

---

### 2. Unregister Device Token on Logout

When the vendor logs out, clear their push token so they stop receiving order alerts on that device.

- **Endpoint**: `DELETE /api/vendors/fcm-token` or `DELETE /api/vendorPanel/:vendorId/fcm-token`
- **Authentication**: `Authorization: Bearer <VENDOR_JWT_TOKEN>`

#### Response (`200 OK`):
```json
{
  "message": "FCM device token cleared successfully"
}
```

---

## 📦 Push Notification Payload Structure

When a new order arrives, the backend sends the following high-priority push payload:

### 1. FCM Notification Payload (Firebase Cloud Messaging)
```json
{
  "notification": {
    "title": "🚨 NEW ORDER RECEIVED #ORD-9842",
    "body": "₹250.00 order received from Rahul Sharma (3 items). Tap to accept now!"
  },
  "data": {
    "event_type": "NEW_ORDER_ALERT",
    "order_id": "ORD-9842",
    "vendor_id": "21",
    "total_amount": "250.00",
    "customer_name": "Rahul Sharma",
    "items_count": "3",
    "sound": "order_alert_chime",
    "channel_id": "order_alerts_channel",
    "sound_loop": "true",
    "alert_duration": "30"
  },
  "android": {
    "priority": "high",
    "ttl": "60000s",
    "notification": {
      "sound": "order_alert_chime",
      "channelId": "order_alerts_channel",
      "priority": "max",
      "visibility": "public",
      "defaultVibrateTimings": true
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "order_alert_chime.caf",
        "badge": 1,
        "contentAvailable": true,
        "category": "NEW_ORDER_ALERT"
      }
    }
  }
}
```

### 2. Expo Push Payload (for Expo React Native Apps)
If the token registered starts with `ExponentPushToken[...]`, the backend sends:
```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "sound": "order_alert_chime",
  "title": "🚨 NEW ORDER RECEIVED #ORD-9842",
  "body": "₹250.00 order received from Rahul Sharma (3 items). Tap to accept now!",
  "data": {
    "event_type": "NEW_ORDER_ALERT",
    "order_id": "ORD-9842",
    "vendor_id": "21",
    "total_amount": "250.00",
    "customer_name": "Rahul Sharma",
    "sound_loop": "true",
    "channel_id": "order_alerts_channel"
  },
  "priority": "high",
  "channelId": "order_alerts_channel",
  "_displayInForeground": true
}
```

---

## ⚡ Socket.io Real-Time Event (App in Foreground)

When the app is open in the foreground, connect to Socket.io to receive instant zero‑latency order popups.

### 1. Connection & Room Subscription
```javascript
import { io } from "socket.io-client";

const socket = io("https://your-backend-domain.com");

socket.on("connect", () => {
  console.log("Connected to DigiLocal Realtime Socket:", socket.id);

  // Join private vendor room
  socket.emit("join_vendor_room", vendorId);
});

// Listen for incoming order alerts
socket.on("new_order_alert", (data) => {
  console.log("🚨 New Order Alert Event Received:", data);
  /*
    data = {
      order_id: "ORD-9842",
      vendor_id: 21,
      total_amount: "250.00",
      customer_name: "Rahul Sharma",
      items_count: 3,
      sound: "order_alert_chime",
      created_at: "2026-08-07T13:30:00.000Z"
    }
  */

  // Trigger continuous audio chime loop & display Full‑Screen Order Acceptance Modal
  triggerRingingAlertModal(data);
});
```

---

## 📲 App Developer Integration Steps

### Step 1: Add Custom Alarm Ringtone Asset

Place custom audio file into app assets:
- **Android**: `android/app/src/main/res/raw/order_alert_chime.mp3`
- **iOS**: Add `order_alert_chime.caf` to Xcode bundle resources.

---

### Step 2: Create High‑Priority Notification Channel (Android)

On Android 8.0+ (API 26+), you **MUST** create a High‑Importance Android Notification Channel before notifications can play custom sound or show heads‑up banners.

#### Flutter Implementation (`flutter_local_notifications`):
```dart
const AndroidNotificationChannel channel = AndroidNotificationChannel(
  'order_alerts_channel', // id (MUST match backend channel_id)
  'Order Alerts', // name
  description: 'High priority notifications for incoming store orders',
  importance: Importance.max,
  playSound: true,
  sound: RawResourceAndroidNotificationSound('order_alert_chime'),
  enableVibration: true,
);

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

await flutterLocalNotificationsPlugin
    .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
    ?.createNotificationChannel(channel);
```

#### React Native Expo Implementation (`expo-notifications`):
```javascript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('order_alerts_channel', {
    name: 'Order Alerts',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'order_alert_chime.mp3', // or custom sound
  });
}
```

---

### Step 3: Implement Continuous Ringing Audio Loop (Zomato Style)

When a notification or Socket event arrives:
1. Play audio loop using audio library (`audioplayers` in Flutter, `expo-av` or `react-native-sound` in React Native).
2. Open full‑screen popup modal showing:
   - Order ID
   - Customer Name
   - Total Amount
   - Accept Order & Decline Order Buttons.
3. Stop audio loop when vendor clicks **Accept** or **Decline**, or after 30 seconds timeout.

---

## 🛠️ Testing Environment Variables (Backend `.env`)

To test Firebase Push Notifications live on backend:
Add service account path or JSON string to backend `.env`:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
# OR
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

*(Note: If no Firebase service account is provided, the backend automatically runs in **Mock Log Mode**, logging all payload details to the console without throwing errors! Expo Push tokens work out‑of‑the‑box without extra keys.)*

---

*This is documentation of notification push and alert to vendor app add it to frontend.*
