# 🔥 Firebase Phone Auth & SMS Configuration Guide for Android

> **Target Application:** DigiLocal Vendor Android App (`com.digilocal.vendor`)  
> **Purpose:** Step-by-step setup to enable real Firebase Phone SMS delivery on Android devices.

---

## 📋 Checklist & Step-by-Step Instructions

---

### 1️⃣ Enable Phone Provider in Firebase Console

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase Project (**DigiLocal**).
3. In the left sidebar, click **Build** ➔ **Authentication**.
4. Select the **Sign-in method** tab.
5. Click **Phone** under *Sign-in providers*.
6. Toggle **Enable** to **ON**.
7. *(Optional for testing)* Under **Phone numbers for testing**, add test numbers (e.g. `+919828365559` with test code `123456`) to test without using SMS quota.
8. Click **Save**.

---

### 2️⃣ Register Android App & Download `google-services.json`

1. Go to **Project Settings** (⚙️ gear icon in top left) ➔ **General** tab.
2. Scroll down to **Your apps** and click **Add App** ➔ select **Android** (🤖).
3. Set **Android package name**: `com.digilocal.vendor`
4. App nickname (optional): `DigiLocal Vendor App`
5. Click **Register App**.
6. Download the **`google-services.json`** file.
7. Move `google-services.json` into your project directory:
   - Location: `frontend/android/app/google-services.json`
   - Location: `frontend/google-services.json`

---

### 3️⃣ Add SHA-1 & SHA-256 Fingerprints *(CRITICAL for SMS Delivery)*

Firebase Phone Auth on Android **requires** SHA-1 & SHA-256 fingerprints to enable Google Play Integrity & automatic SMS verification.

#### How to get SHA-1 from your Mac Terminal:
Run this command inside `frontend/android`:
```bash
cd android && ./gradlew signingReport
```

Look for the output:
```text
Variant: debug
Config: debug
Store: /Users/apple/.android/debug.keystore
Alias: AndroidDebugKey
SHA1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:E6:3A:ED:9A:00:00:00:00
SHA-256: FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C
```

#### Add Fingerprints in Firebase Console:
1. Go to **Project Settings** ➔ **General** ➔ **Your apps** ➔ select your Android app (`com.digilocal.vendor`).
2. Click **Add fingerprint**.
3. Paste your **SHA-1** fingerprint ➔ Click **Save**.
4. Click **Add fingerprint** again ➔ Paste your **SHA-256** fingerprint ➔ Click **Save**.

---

### 4️⃣ Enable Play Integrity API in Google Cloud

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase Project from the top dropdown.
3. In the search bar, type **Play Integrity API** and select it.
4. Click **Enable**.

---

### 5️⃣ Update `app.json` Configuration

In your `frontend/app.json`, ensure `googleServicesFile` is linked:

```json
{
  "expo": {
    "android": {
      "package": "com.digilocal.vendor",
      "googleServicesFile": "./google-services.json"
    }
  }
}
```
