import { NativeModules, Platform } from 'react-native';
import { checkVendorPhoneApi, sendOtpApi, loginVendorWithOtpApi } from './api/authApi';

let confirmationResult: any = null;

/**
 * Safely retrieve Native Firebase Auth SDK instance
 */
const getFirebaseAuthInstance = () => {
  if (Platform.OS === 'web') return null;

  try {
    // ⚠️ IMPORTANT: Uncomment the line below when you are ready to build the APK!
    // We comment it out temporarily because Expo Go automatically tries to load it and crashes.
    const authModule = require('@react-native-firebase/auth'); 
    
    const authFn = typeof authModule === 'function' ? authModule : ((authModule as any)?.default || authModule);
    if (typeof authFn === 'function') {
      return authFn();
    }
  } catch (err: any) {
    console.warn('⚠️ [NATIVE FIREBASE LOAD FAILED]:', err?.message || err);
  }
  return null;
};

/**
 * 1. STEP 1: Trigger Firebase Client SDK Phone SMS to Mobile Number
 */
export async function sendOtpToVendorMobile(mobileNumber: string, isLogin: boolean = true) {
  const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber.trim()}`;

  console.log('🔥 [FIREBASE PHONE AUTH INITIATED]:', { raw: mobileNumber, formatted: formattedPhone, isLogin });

  // Pre-check phone registration on DigiLocal backend if logging in
  if (isLogin) {
    console.log('🔍 [CHECKING PHONE REGISTRATION ON BACKEND]:', formattedPhone);
    const checkRes = await checkVendorPhoneApi(formattedPhone);
    console.log('📊 [PHONE CHECK RESULT]:', checkRes);

    if (!checkRes.exists) {
      console.warn('⚠️ [PHONE UNREGISTERED]: No account found for login');
      throw new Error('No vendor store account found with this mobile number. Please register your account first.');
    }
  }

  // Notify backend API of OTP request attempt
  try {
    await sendOtpApi(formattedPhone, isLogin ? 'login' : 'register');
  } catch (backendErr) {
    console.warn('Backend send-otp notification warning:', backendErr);
  }

  // Safely retrieve Native Firebase Auth instance
  const authInstance = getFirebaseAuthInstance();
  if (!authInstance || typeof authInstance.signInWithPhoneNumber !== 'function') {
    console.log('⚠️ [EXPO GO DETECTED]: Bypassing Firebase Native SMS');
    confirmationResult = { isExpoMock: true, mobile: formattedPhone };
    alert('EXPO TEST MODE: Firebase Native SDK is unavailable in Expo Go. Please use the test number 9999999999 and OTP 123456 to test the flow.');
    return { success: true, message: 'Mock OTP sent (Expo Go)' };
  }

  // 💥 Trigger Firebase Client SDK SMS to SIM Card
  console.log('🔥 [FIREBASE SDK]: Triggering signInWithPhoneNumber for', formattedPhone);
  confirmationResult = await authInstance.signInWithPhoneNumber(formattedPhone);
  console.log('🔥 [FIREBASE SDK SUCCESS]: SMS dispatched to SIM card, confirmationResult created');

  return {
    success: true,
    message: `SMS OTP code dispatched to ${formattedPhone} via Firebase`
  };
}

/**
 * 2. STEP 2: Confirm 6-Digit Firebase SMS Code & Authenticate with DigiLocal Backend
 */
export async function verifySmsAndLoginVendor(mobileNumber: string, smsCode: string) {
  if (!confirmationResult) {
    throw new Error('Please request Firebase OTP first.');
  }

  console.log('🔥 [VERIFYING FIREBASE SMS CODE]:', smsCode);

  if (confirmationResult.isExpoMock) {
    console.log('🔥 [EXPO MOCK VERIFY]: Sending local OTP to backend for verification');
    // Call the auth API with the raw phone and OTP (bypassing Firebase Token exchange)
    const backendData = await loginVendorWithOtpApi(confirmationResult.mobile, smsCode);
    console.log('✅ [DIGILOCAL BACKEND LOGIN SUCCESS]:', backendData);
    return backendData;
  }

  // 1. Confirm 6-digit SMS code with Firebase Client SDK
  const userCredential = await confirmationResult.confirm(smsCode.trim());
  console.log('🔥 [FIREBASE SMS VERIFIED SUCCESS]: User credential obtained');

  // 2. Extract Firebase ID Token
  const idToken = await userCredential.user.getIdToken();
  console.log('🔥 [FIREBASE ID TOKEN GENERATED]: Exchanging token with DigiLocal backend...');

  // 3. Exchange Firebase Token for DigiLocal JWT Tokens & Store Profile
  const backendData = await loginVendorWithOtpApi(idToken);
  console.log('✅ [DIGILOCAL BACKEND LOGIN SUCCESS]:', backendData);

  return backendData;
}
