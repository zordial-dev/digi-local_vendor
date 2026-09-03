import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  Modal,
  Image,
  Alert,
  Linking,
  NativeModules,
  TurboModuleRegistry,
} from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Lock,
  Mail,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Store,
  Building,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  User,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  UserCircle2,
  X,
  FileText,
  Shield,
  KeyRound,
  ChevronDown,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  ShoppingBag,
  Wrench,
  MapPin,
  Search,
  Building2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageFromDevice, captureImageFromDevice } from '../utils/imagePickerHelper';
import Svg, { Path } from 'react-native-svg';
import { Colors, APP_LOGO_URL } from '../constants/theme';
import { loginVendorApi, registerVendorApi, VendorUser, sendOtpApi, verifyOtpApi, loginVendorWithOtpApi, forgotPasswordOtpApi, resetPasswordWithOtpApi, checkVendorPhoneApi, checkVendorEmailApi, fetchLocationSuggestionsApi, fetchSocietiesApi } from '../services/apiService';
import { getSavedCredentials, saveCredentials } from '../services/authStorage';
import { isServiceCategory } from '../utils/translations';

// Clean user-facing error message formatter for production
const formatUserFacingError = (err: any, fallbackMessage: string): string => {
  const message = String(err?.message || err || '');

  if (message.includes('auth/too-many-requests')) {
    return 'Too many OTP requests. Please wait a moment and try again.';
  }
  if (message.includes('auth/invalid-phone-number')) {
    return 'Invalid mobile number. Please check your 10-digit number and try again.';
  }
  if (message.includes('auth/quota-exceeded')) {
    return 'SMS service is temporarily busy. Please try again later or use password login.';
  }
  if (message.includes('auth/invalid-verification-code') || message.includes('invalid-otp')) {
    return 'Invalid verification code. Please check the code and try again.';
  }
  if (message.includes('auth/session-expired') || message.includes('code-expired')) {
    return 'OTP code has expired. Please request a new code.';
  }
  if (message.includes('auth/app-not-authorized') || message.includes('play_integrity') || message.includes('Native module')) {
    return 'OTP service is initializing. Please try again or use password login.';
  }
  if (message.includes('network-request-failed') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  if (message.startsWith('Error:') || message.includes('[auth/') || message.includes('[TypeError')) {
    return fallbackMessage;
  }

  return message || fallbackMessage;
};



export interface CountryCodeItem {
  code: string;
  flag: string;
  name: string;
  dialCode: string;
}

export const POPULAR_COUNTRY_CODES: CountryCodeItem[] = [
  { code: 'IN', flag: '🇮🇳', name: 'India', dialCode: '+91' },
  { code: 'AE', flag: '🇦🇪', name: 'United Arab Emirates', dialCode: '+971' },
  { code: 'US', flag: '🇺🇸', name: 'United States', dialCode: '+1' },
  { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', dialCode: '+44' },
  { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', dialCode: '+966' },
  { code: 'SG', flag: '🇸🇬', name: 'Singapore', dialCode: '+65' },
  { code: 'CA', flag: '🇨🇦', name: 'Canada', dialCode: '+1' },
  { code: 'AU', flag: '🇦🇺', name: 'Australia', dialCode: '+61' },
  { code: 'DE', flag: '🇩🇪', name: 'Germany', dialCode: '+49' },
  { code: 'FR', flag: '🇫🇷', name: 'France', dialCode: '+33' },
  { code: 'NP', flag: '🇳🇵', name: 'Nepal', dialCode: '+977' },
  { code: 'BD', flag: '🇧🇩', name: 'Bangladesh', dialCode: '+880' },
  { code: 'LK', flag: '🇱🇰', name: 'Sri Lanka', dialCode: '+94' },
  { code: 'MY', flag: '🇲🇾', name: 'Malaysia', dialCode: '+60' },
  { code: 'QA', flag: '🇶🇦', name: 'Qatar', dialCode: '+974' },
  { code: 'OM', flag: '🇴🇲', name: 'Oman', dialCode: '+968' },
  { code: 'KW', flag: '🇰🇼', name: 'Kuwait', dialCode: '+965' },
  { code: 'BH', flag: '🇧🇭', name: 'Bahrain', dialCode: '+973' },
  { code: 'ID', flag: '🇮🇩', name: 'Indonesia', dialCode: '+62' },
  { code: 'PH', flag: '🇵🇭', name: 'Philippines', dialCode: '+63' },
  { code: 'ZA', flag: '🇿🇦', name: 'South Africa', dialCode: '+27' },
  { code: 'NZ', flag: '🇳🇿', name: 'New Zealand', dialCode: '+64' },
  { code: 'IE', flag: '🇮🇪', name: 'Ireland', dialCode: '+353' },
  { code: 'IT', flag: '🇮🇹', name: 'Italy', dialCode: '+39' },
  { code: 'ES', flag: '🇪🇸', name: 'Spain', dialCode: '+34' },
];

interface LoginScreenProps {
  onLoginSuccess: (vendor: VendorUser) => void;
  onBackToWelcome?: () => void;
  isDarkMode?: boolean;
  initialBlockedInfo?: { visible: boolean; title: string; message: string; reason?: string } | null;
  onClearBlockedInfo?: () => void;
}

const TERMS_TEXT = `Welcome to Digi Local Vendor Partner Terms & Conditions.

1. Vendor Onboarding & Account Registration
By registering as a vendor partner on Digi Local, you confirm that all store details, owner name, contact number, and location details provided during registration are accurate and legitimate.

2. Product Listings & Fulfillments
Vendors are responsible for maintaining accurate product availability, pricing, and quality standards for all orders placed by society residents.

3. Platform Fees & Subscriptions
Digi Local charges transparent platform subscription or commission fees as per your chosen vendor tier.

4. Account Security
You are responsible for safeguarding your login credentials. Notify support immediately in case of unauthorized account access.`;

const PRIVACY_TEXT = `Digi Local Vendor Partner Privacy Policy.

1. Data Collection
We collect your name, business name, contact number, email address, shop location, and society association for operating the local hyper-local delivery service.

2. Data Usage
Your information is strictly used to connect your store with nearby residential society residents and manage your order notifications.

3. Data Protection
All account credentials are protected using industry-standard encryption protocols. We do not sell or rent vendor personal data to third parties.`;


const PRODUCT_CATEGORIES = [
  'Grocery & Supermarket',
  'Fruits & Vegetables',
  'Dairy & Sweets',
  'Bakery & Snacks',
  'General Store',
  'Pharmacy & Healthcare',
  'Electronics & Repairs',
  'Hardware & Utilities',
  'Resin Art & Handicrafts',
  'Laundry & Dry Cleaning',
  'Other Goods & Products',
];

const SERVICE_CATEGORIES = [
  'Electrician & Repairs',
  'AC & Appliance Service',
  'Plumbing & Sanitary Works',
  'Housekeeping & Deep Cleaning',
  'Tuition & Coaching',
  'Doctor / Clinic & Healthcare',
  'CA, Tax & Accounting',
  'Carpentry & Interior',
  'Beauty, Salon & Spa',
  'Driver & Vehicle Services',
  'Event Services & Catering',
  'Other Home Services',
];

const BUSINESS_CATEGORIES = PRODUCT_CATEGORIES;

const DEFAULT_SOCIETIES_DATA: Array<{ name: string; pincode: string; city: string; state: string; type: 'society' | 'area' }> = [
  { name: 'Mansarovar', pincode: '302020', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Pratap Nagar', pincode: '302033', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Vaishali Nagar', pincode: '302021', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Malviya Nagar', pincode: '302017', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Raja Park', pincode: '302004', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Tonk Road', pincode: '302018', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Jagatpura', pincode: '302017', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'C Scheme', pincode: '302001', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Sodala', pincode: '302006', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Jhotwara', pincode: '302012', city: 'Jaipur', state: 'Rajasthan', type: 'area' },
  { name: 'Ajnara Elements', pincode: '201301', city: 'Noida', state: 'Uttar Pradesh', type: 'society' },
  { name: 'Amrapali Sapphire', pincode: '201301', city: 'Noida', state: 'Uttar Pradesh', type: 'society' },
  { name: 'ATS Hamlet', pincode: '201304', city: 'Noida', state: 'Uttar Pradesh', type: 'society' },
  { name: 'Gaur City', pincode: '201318', city: 'Greater Noida', state: 'Uttar Pradesh', type: 'society' },
  { name: 'Apex Athena', pincode: '201307', city: 'Noida', state: 'Uttar Pradesh', type: 'society' },
];

const FAST_PINCODE_MAP: Record<string, { city: string; state: string }> = {
  '302020': { city: 'Jaipur', state: 'Rajasthan' },
  '302033': { city: 'Jaipur', state: 'Rajasthan' },
  '302021': { city: 'Jaipur', state: 'Rajasthan' },
  '302017': { city: 'Jaipur', state: 'Rajasthan' },
  '302004': { city: 'Jaipur', state: 'Rajasthan' },
  '302018': { city: 'Jaipur', state: 'Rajasthan' },
  '302001': { city: 'Jaipur', state: 'Rajasthan' },
  '302006': { city: 'Jaipur', state: 'Rajasthan' },
  '302012': { city: 'Jaipur', state: 'Rajasthan' },
  '302019': { city: 'Jaipur', state: 'Rajasthan' },
  '302022': { city: 'Jaipur', state: 'Rajasthan' },
  '302015': { city: 'Jaipur', state: 'Rajasthan' },
  '302039': { city: 'Jaipur', state: 'Rajasthan' },
  '302029': { city: 'Jaipur', state: 'Rajasthan' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh' },
  '201304': { city: 'Noida', state: 'Uttar Pradesh' },
  '201307': { city: 'Noida', state: 'Uttar Pradesh' },
  '201309': { city: 'Noida', state: 'Uttar Pradesh' },
  '201318': { city: 'Greater Noida', state: 'Uttar Pradesh' },
  '122001': { city: 'Gurugram', state: 'Haryana' },
  '122002': { city: 'Gurugram', state: 'Haryana' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
};

function getFastLocationFromPincode(pin: string): { city: string; state: string } | null {
  if (FAST_PINCODE_MAP[pin]) return FAST_PINCODE_MAP[pin];
  const prefix = pin.substring(0, 3);
  if (prefix.startsWith('302') || prefix.startsWith('303')) return { city: 'Jaipur', state: 'Rajasthan' };
  if (prefix.startsWith('201')) return { city: 'Noida', state: 'Uttar Pradesh' };
  if (prefix.startsWith('122')) return { city: 'Gurugram', state: 'Haryana' };
  if (prefix.startsWith('110')) return { city: 'New Delhi', state: 'Delhi' };
  if (prefix.startsWith('400')) return { city: 'Mumbai', state: 'Maharashtra' };
  if (prefix.startsWith('560')) return { city: 'Bengaluru', state: 'Karnataka' };
  if (prefix.startsWith('700')) return { city: 'Kolkata', state: 'West Bengal' };
  if (prefix.startsWith('500')) return { city: 'Hyderabad', state: 'Telangana' };
  if (prefix.startsWith('600')) return { city: 'Chennai', state: 'Tamil Nadu' };
  if (prefix.startsWith('380')) return { city: 'Ahmedabad', state: 'Gujarat' };
  return null;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onBackToWelcome,
  isDarkMode = false,
  initialBlockedInfo = null,
  onClearBlockedInfo,
}) => {
  const rawInsets = useSafeAreaInsets();
  const insets = rawInsets || { top: 0, bottom: 0, left: 0, right: 0 };
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Blocked Account Modal State
  const [blockedModalData, setBlockedModalData] = useState<{ visible: boolean; title: string; message: string; reason?: string } | null>(initialBlockedInfo || null);

  useEffect(() => {
    if (initialBlockedInfo?.visible) {
      setBlockedModalData({
        visible: true,
        title: initialBlockedInfo.title || 'Account Blocked by Administrator',
        message: initialBlockedInfo.message || 'Your vendor store account has been blocked by administrator. Access denied.',
        reason: initialBlockedInfo.reason || 'Policy or compliance violation',
      });
    }
  }, [initialBlockedInfo]);

  // Business Classification: Product vs Service
  const [businessType, setBusinessType] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');

  // Form fields (Login & Shared)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Step 1: Business Info (Category & Classification)
  const societiesMemoryRef = React.useRef<Array<{ name: string; pincode: string; city: string; state: string; type?: string }>>(DEFAULT_SOCIETIES_DATA);
  const [areaName, setAreaName] = useState('');
  const [areaSuggestions, setAreaSuggestions] = useState<Array<{ name: string; pincode: string; city: string; state: string }>>([]);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [isFetchingArea, setIsFetchingArea] = useState(false);
  const areaDebounceRef = React.useRef<any>(null);
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Step 2: Shop Details (Owner details, Shop info, GST & Photos)
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCodeItem>(POPULAR_COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [taxIdentifierType, setTaxIdentifierType] = useState<'GSTIN' | 'PAN'>('GSTIN');
  const [gstinNumber, setGstinNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [shopImages, setShopImages] = useState<string[]>([]);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Login with OTP States
  const [loginWithOtp, setLoginWithOtp] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);

  // Set Password Modal States (After OTP Verification)
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [setPasswordNew, setSetPasswordNew] = useState('');
  const [setPasswordConfirm, setSetPasswordConfirm] = useState('');
  const [showSetPass1, setShowSetPass1] = useState(false);
  const [showSetPass2, setShowSetPass2] = useState(false);
  const [setPasswordError, setSetPasswordError] = useState('');
  const [setPasswordLoading, setSetPasswordLoading] = useState(false);
  const [pendingVendorAfterOtp, setPendingVendorAfterOtp] = useState<VendorUser | null>(null);

  // Registration OTP & Step Validation States
  const [showRegOtpModal, setShowRegOtpModal] = useState(false);
  const [regOtp, setRegOtp] = useState('');
  const [regOtpTimer, setRegOtpTimer] = useState(0);
  const [touchedStep1, setTouchedStep1] = useState(false);
  const [touchedStep2, setTouchedStep2] = useState(false);
  const [touchedStep3, setTouchedStep3] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Already Registered Modal States
  const [showAlreadyRegisteredModal, setShowAlreadyRegisteredModal] = useState(false);
  const [alreadyRegisteredType, setAlreadyRegisteredType] = useState<'mobile' | 'email' | 'both'>('mobile');
  const [alreadyRegisteredMsg, setAlreadyRegisteredMsg] = useState('');
  const [alreadyRegisteredValue, setAlreadyRegisteredValue] = useState('');
  const [phoneAlreadyRegisteredError, setPhoneAlreadyRegisteredError] = useState('');
  const checkingPhoneRef = useRef<string>('');
  const [emailAlreadyRegisteredError, setEmailAlreadyRegisteredError] = useState('');
  const checkingEmailRef = useRef<string>('');

  const triggerAlreadyRegisteredModal = (type: 'mobile' | 'email' | 'both', value?: string, customMsg?: string) => {
    setAlreadyRegisteredType(type);
    const val = value || (type === 'mobile' ? phone.trim() : email.trim().toLowerCase());
    setAlreadyRegisteredValue(val);
    if (customMsg) {
      setAlreadyRegisteredMsg(customMsg);
    } else if (type === 'mobile') {
      setAlreadyRegisteredMsg(`The mobile number +91 ${val} is already registered with an existing vendor account. Please use another mobile number or sign in to your account.`);
    } else if (type === 'email') {
      setAlreadyRegisteredMsg(`The email address "${val}" is already registered with an existing vendor account. Please use another email ID or sign in to your account.`);
    } else {
      setAlreadyRegisteredMsg('This mobile number or email ID is already registered with an existing vendor account. Please use another email or mobile number.');
    }
    setShowAlreadyRegisteredModal(true);
  };

  const checkPhoneOnInput = async (inputPhone: string) => {
    const clean = inputPhone.trim();
    if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) {
      checkingPhoneRef.current = clean;
      try {
        const phoneCheck = await checkVendorPhoneApi(clean);
        if (checkingPhoneRef.current === clean && phoneCheck && phoneCheck.exists) {
          setPhoneAlreadyRegisteredError(`Mobile number +91 ${clean} is already registered. Please use another mobile number or log in.`);
        } else if (checkingPhoneRef.current === clean) {
          setPhoneAlreadyRegisteredError('');
        }
      } catch (_) {}
    } else {
      setPhoneAlreadyRegisteredError('');
    }
  };

  const checkEmailOnInput = async (inputEmail: string) => {
    const clean = inputEmail.trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean)) {
      checkingEmailRef.current = clean;
      try {
        const emailCheck = await checkVendorEmailApi(clean);
        if (checkingEmailRef.current === clean && emailCheck && emailCheck.exists) {
          setEmailAlreadyRegisteredError(`Email "${clean}" is already registered. Please use another email ID or sign in.`);
        } else if (checkingEmailRef.current === clean) {
          setEmailAlreadyRegisteredError('');
        }
      } catch (_) {}
    } else {
      setEmailAlreadyRegisteredError('');
    }
  };

  // Not Registered Modal States (for Login flow)
  const [showNotRegisteredModal, setShowNotRegisteredModal] = useState(false);
  const [notRegisteredValue, setNotRegisteredValue] = useState('');

  const triggerNotRegisteredModal = (val: string) => {
    setNotRegisteredValue(val);
    setShowNotRegisteredModal(true);
  };

  // Forgot Password modal states
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [policyTab, setPolicyTab] = useState<'terms' | 'privacy'>('terms');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRegSuccessModal, setShowRegSuccessModal] = useState(false);
  const [registeredVendor, setRegisteredVendor] = useState<any>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotOtpResendTimer, setForgotOtpResendTimer] = useState(0);

  // Login with OTP Modal states
  const [showLoginOtpModal, setShowLoginOtpModal] = useState(false);
  const [loginOtpModalPhone, setLoginOtpModalPhone] = useState('');
  const [loginOtpModalCode, setLoginOtpModalCode] = useState('');
  const [loginOtpModalStep, setLoginOtpModalStep] = useState<1 | 2>(1);
  const [loginOtpModalLoading, setLoginOtpModalLoading] = useState(false);
  const [loginOtpModalError, setLoginOtpModalError] = useState('');
  const [loginOtpModalTimer, setLoginOtpModalTimer] = useState(0);

  // Countdown timer for all OTP resends
  useEffect(() => {
    const timer = setInterval(() => {
      setForgotOtpResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setLoginOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setLoginOtpModalTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setRegOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // Preload societies silently into memory so searching/dropdown opens INSTANTLY with 0ms delay
        fetchSocietiesApi().then(liveList => {
          if (Array.isArray(liveList) && liveList.length > 0) {
            const formatted = liveList.map(s => ({
              name: (s.society_name || '').trim(),
              pincode: (s as any).pincode || (s as any).zip_code || '',
              city: s.location || (s as any).city || '',
              state: (s as any).state || '',
              type: 'society'
            })).filter(item => item.name);

            const combined = [...formatted, ...DEFAULT_SOCIETIES_DATA];
            const uniqueMap = new Map(combined.map(item => [item.name.toLowerCase(), item]));
            societiesMemoryRef.current = Array.from(uniqueMap.values());
          }
        }).catch(() => {});
      } catch (err) {
        console.error('Error during login screen init:', err);
      }
    };
    init();
  }, []);

  const handleAddPhoto = () => {
    if (shopImages.length >= 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    setShowImageSourceModal(true);
  };

  const handleTakePhoto = async () => {
    setShowImageSourceModal(false);
    try {
      const captured = await captureImageFromDevice({
        quality: 0.8,
        allowsEditing: false,
        aspect: [4, 3],
      });
      if (captured && captured.uri) {
        setShopImages(prev => [...prev, captured.base64 ? `data:${captured.mimeType || 'image/jpeg'};base64,${captured.base64}` : captured.uri].slice(0, 5));
        setError('');
      }
    } catch (err: any) {
      console.error('Error capturing photo:', err);
    }
  };

  const handlePickFromGallery = async () => {
    setShowImageSourceModal(false);
    try {
      const picked = await pickImageFromDevice({
        quality: 0.8,
        allowsEditing: false,
        aspect: [4, 3],
      });
      if (picked && picked.uri) {
        setShopImages(prev => [...prev, picked.base64 ? `data:${picked.mimeType || 'image/jpeg'};base64,${picked.base64}` : picked.uri].slice(0, 5));
        setError('');
      }
    } catch (err: any) {
      console.error('Error picking photo:', err);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setShopImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLoginContactChange = (text: string) => {
    const value = text.trim();

    // Check if the user is typing a mobile number (contains only numbers)
    const isNumericOnly = /^\d*$/.test(value);

    if (isNumericOnly) {
      // Rule 1: Mobile Number Validation (Strictly numbers, max 10 digits)
      if (value.length <= 10) {
        setEmail(value);
        setError('');
      }
    } else {
      // Rule 2: Email ID Validation (Allow letters, numbers, @, ., etc.)
      setEmail(value);
      setError('');
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccessMsg('');
    const cleanInput = email.trim();
    const cleanPassword = password.trim();

    if (!cleanInput || !cleanPassword) {
      setError('Please enter both your Mobile / Email ID and password.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanInput);
    const isPhone = /^\d{10}$/.test(cleanInput);

    if (!isEmail && !isPhone) {
      setError('Please enter a valid 10-digit mobile number or a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginVendorApi(cleanInput.toLowerCase(), cleanPassword);
      if (rememberMe) {
        await saveCredentials(cleanInput, cleanPassword, res.vendor.vendor_id);
      }
      const finalVendor: VendorUser = {
        ...res.vendor,
        business_type: res.vendor.business_type || (isServiceCategory(res.vendor.category) ? 'SERVICE' : 'PRODUCT'),
      };
      onLoginSuccess(finalVendor);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      if (err.isBlocked || err.code === 'VENDOR_BLOCKED' || errMsg.includes('blocked')) {
        setBlockedModalData({
          visible: true,
          title: 'Account Blocked by Administrator',
          message: err.message || 'Your vendor store account has been blocked by administrator. Access denied.',
          reason: err.blockReason || 'Policy or compliance violation',
        });
      } else if (errMsg.includes('not found') || errMsg.includes('no account') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('does not exist')) {
        triggerNotRegisteredModal(cleanInput);
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTryAnotherMethod = () => {
    setError('');
    // Prompt for phone number / email freshly in the OTP modal without carrying over previous input
    setLoginOtpModalPhone('');
    setLoginOtpModalCode('');
    setLoginOtpModalError('');
    setLoginOtpModalTimer(0);
    setShowLoginOtpModal(true);
  };

  const panCheckRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const gstCheckRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  const fetchLocationByPincode = async (pin: string) => {
    const cleanPin = pin.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) {
      setPincodeError('');
      return;
    }

    setPincodeError('');

    // 1. Instant match from societiesMemoryRef
    const memoryMatch = societiesMemoryRef.current.find(item => item.pincode === cleanPin);
    if (memoryMatch) {
      if (memoryMatch.city) setCity(memoryMatch.city);
      if (memoryMatch.state) setStateName(memoryMatch.state);
    }

    // 2. Instant match from fast local pincode map
    const fastMatch = getFastLocationFromPincode(cleanPin);
    if (fastMatch) {
      setCity(prev => prev || fastMatch.city);
      setStateName(prev => prev || fastMatch.state);
    }

    // 3. Silent fast network fetch in background (no spinner shown)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (
          Array.isArray(data) &&
          data.length > 0 &&
          data[0].Status === 'Success' &&
          Array.isArray(data[0].PostOffice) &&
          data[0].PostOffice.length > 0
        ) {
          const po = data[0].PostOffice[0];
          const fetchedDistrict = po.District || po.Block || po.Division || '';
          const fetchedState = po.State || '';

          if (fetchedDistrict) setCity(fetchedDistrict);
          if (fetchedState) setStateName(fetchedState);
          setPincodeError('');
        }
      }
    } catch (_) {
      // Keep fast local result silently
    }
  };

  const fetchLocationByAreaName = (text: string) => {
    const cleanText = text.trim().toLowerCase();

    // If text contains a 6-digit pincode, auto-fill by pincode
    const pinMatch = text.trim().match(/\b\d{6}\b/);
    if (pinMatch) {
      const foundPin = pinMatch[0];
      setPincode(foundPin);
      fetchLocationByPincode(foundPin);
    }

    // Instant zero-delay memory filtering (0ms execution, NO loading spinner shown)
    let matches = societiesMemoryRef.current;
    if (cleanText) {
      matches = societiesMemoryRef.current.filter(item =>
        item.name.toLowerCase().includes(cleanText) ||
        item.city.toLowerCase().includes(cleanText) ||
        item.pincode.includes(cleanText)
      );
    }

    setAreaSuggestions(matches.slice(0, 30));
    setShowAreaDropdown(matches.length > 0);

    // Silent background fetch to update memory if user typed >= 2 chars
    if (cleanText.length >= 2) {
      fetchLocationSuggestionsApi(cleanText).then(apiResults => {
        if (Array.isArray(apiResults) && apiResults.length > 0) {
          const apiFormatted = apiResults.map(loc => ({
            name: loc.area,
            pincode: loc.pincode || '',
            city: loc.city || '',
            state: loc.state || '',
            type: 'area'
          })).filter(i => i.name);

          const combined = [...matches, ...apiFormatted];
          const uniqueMap = new Map(combined.map(item => [item.name.toLowerCase(), item]));
          
          societiesMemoryRef.current = Array.from(new Map([...societiesMemoryRef.current, ...combined].map(item => [item.name.toLowerCase(), item])).values());
          setAreaSuggestions(Array.from(uniqueMap.values()).slice(0, 30));
        }
      }).catch(() => {});
    }
  };

  const handleAreaChange = (text: string) => {
    setAreaName(text);
    fetchLocationByAreaName(text);

    // Auto-update pincode, city, state if typed text matches a known location
    const clean = text.trim().toLowerCase();
    if (clean.length >= 2) {
      const match = societiesMemoryRef.current.find(item => item.name.toLowerCase() === clean);
      if (match) {
        if (match.pincode) {
          setPincode(match.pincode);
          fetchLocationByPincode(match.pincode);
        }
        if (match.city) setCity(match.city);
        if (match.state) setStateName(match.state);
      }
    }
  };

  const handleSelectSuggestion = async (item: { name: string; pincode: string; city: string; state: string }) => {
    setAreaName(item.name);

    // Auto-update Pincode, City, and State according to the new location
    if (item.pincode) {
      setPincode(item.pincode);
      fetchLocationByPincode(item.pincode);
    }
    if (item.city) setCity(item.city);
    if (item.state) setStateName(item.state);

    // If pincode, city, or state is missing, auto-fetch details for this location
    if (!item.pincode || !item.city || !item.state) {
      try {
        const results = await fetchLocationSuggestionsApi(item.name);
        if (Array.isArray(results) && results.length > 0) {
          const match = results[0];
          if (match.pincode) {
            setPincode(match.pincode);
            fetchLocationByPincode(match.pincode);
          }
          if (match.city) setCity(match.city);
          if (match.state) setStateName(match.state);
        }
      } catch (_) {}
    }

    setAreaSuggestions([]);
    setShowAreaDropdown(false);
  };

  const handlePincodeChange = (text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(digitsOnly);
    setPincodeError('');
    if (digitsOnly.length === 6) {
      fetchLocationByPincode(digitsOnly);
    }
  };

  const handleNextStep1 = () => {
    setError('');
    setTouchedStep1(true);
    const cleanPin = pincode.trim();
    const cleanCity = city.trim();
    const cleanState = stateName.trim();
    const cleanArea = areaName.trim();

    if (!cleanArea || cleanArea.length < 2) return;
    if (!cleanPin || !/^\d{6}$/.test(cleanPin)) return;
    if (!cleanCity || cleanCity.length < 2 || !/^[a-zA-Z\s]+$/.test(cleanCity)) return;
    if (!cleanState || cleanState.length < 2 || !/^[a-zA-Z\s]+$/.test(cleanState)) return;
    if (!category) return;

    setRegStep(2);
  };

  const handleNextStep2 = async () => {
    setError('');
    setTouchedStep2(true);
    const cleanVendor = vendorName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStore = storeName.trim();
    const cleanShopNumber = shopNumber.trim();
    const cleanGst = gstinNumber.trim().toUpperCase();
    const cleanPan = panNumber.trim().toUpperCase();
    const isIndian = selectedCountryCode.dialCode === '+91';
    const isPhoneValid = isIndian
      ? (/^[6-9]\d{9}$/.test(cleanPhone))
      : (cleanPhone.length >= 7 && cleanPhone.length <= 15 && /^\d{7,15}$/.test(cleanPhone));

    if (!cleanVendor || cleanVendor.length < 2 || !/^[a-zA-Z\s]+$/.test(cleanVendor)) return;
    if (!cleanPhone || !isPhoneValid) return;
    if (!isMobileVerified) return;
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) return;
    if (!cleanStore || cleanStore.length < 2) return;
    if (!cleanShopNumber || cleanShopNumber.length < 1) return;
    if (taxIdentifierType === 'GSTIN') {
      if (!cleanGst || cleanGst.length !== 15 || !gstCheckRegex.test(cleanGst)) return;
    } else {
      if (!cleanPan || cleanPan.length !== 10 || !panCheckRegex.test(cleanPan)) return;
    }
    if (shopImages.length === 0) return;

    if (phoneAlreadyRegisteredError || emailAlreadyRegisteredError) {
      return;
    }

    setLoading(true);
    try {
      // Pre-check phone duplicate
      const phoneCheck = await checkVendorPhoneApi(cleanPhone);
      if (phoneCheck && phoneCheck.exists) {
        setPhoneAlreadyRegisteredError(`Mobile number +91 ${cleanPhone} is already registered. Please use another mobile number or log in.`);
        return;
      } else {
        setPhoneAlreadyRegisteredError('');
      }

      // Pre-check email duplicate
      const emailCheck = await checkVendorEmailApi(cleanEmail);
      if (emailCheck && emailCheck.exists) {
        setEmailAlreadyRegisteredError(`Email "${cleanEmail}" is already registered. Please use another email ID or sign in.`);
        return;
      } else {
        setEmailAlreadyRegisteredError('');
      }

      setRegStep(3);
    } catch (_) {
      setRegStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMsg('');
    setTouchedStep3(true);

    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();
    const hasUpperCase = /[A-Z]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(cleanPassword);

    if (!cleanPassword || cleanPassword.length < 8 || !hasUpperCase || !hasNumber || !hasSpecial) return;
    if (!cleanConfirm || cleanPassword !== cleanConfirm) return;
    if (!agreedToTerms) {
      setError('Please accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (phoneAlreadyRegisteredError || emailAlreadyRegisteredError) {
        setLoading(false);
        setRegStep(2);
        return;
      }

      const cleanArea = areaName.trim();
      const fullAddress = [cleanArea, city.trim(), stateName.trim(), pincode.trim()].filter(Boolean).join(', ');
      const compressedShopImage = (shopImages.length > 0 && shopImages[0]) ? shopImages[0] : '';

      const res = await registerVendorApi({
        vendor_name: vendorName.trim(),
        store_name: storeName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phone.trim(),
        password: cleanPassword,
        area: cleanArea,
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        whatsapp_number: phone.trim(),
        shop_number: shopNumber.trim() || storeName.trim(),
        shop_image: compressedShopImage,
        category: category.trim(),
        gstin: taxIdentifierType === 'GSTIN' && gstinNumber.trim().length === 15 ? gstinNumber.trim().toUpperCase() : "",
        pan_number: taxIdentifierType === 'PAN' && panNumber.trim().length === 10 ? panNumber.trim().toUpperCase() : (taxIdentifierType === 'GSTIN' && gstinNumber.trim().length === 15 ? gstinNumber.trim().substring(2, 12).toUpperCase() : ""),
        gst_number: taxIdentifierType === 'GSTIN' && gstinNumber.trim().length === 15 ? gstinNumber.trim().toUpperCase() : "",
        business_type: businessType,
        address: fullAddress.trim(),
        otp: regOtp || undefined
      });

      if (rememberMe) {
        await saveCredentials(email.trim().toLowerCase(), cleanPassword, res.vendor_id);
      }
      const regVendor: VendorUser = {
        ...res.vendor,
        business_type: businessType,
      };
      setRegisteredVendor(regVendor);
      setShowRegSuccessModal(true);
    } catch (err: any) {
      console.error('❌ [REGISTRATION ERROR]:', err);
      const errMsg = (err.message || '').toLowerCase();
      const isMobileDuplicate =
        errMsg.includes('mobile number already') ||
        errMsg.includes('phone number already') ||
        errMsg.includes('mobile already registered') ||
        errMsg.includes('phone already registered') ||
        errMsg.includes('mobile is already') ||
        errMsg.includes('phone is already');

      const isEmailDuplicate =
        errMsg.includes('email already registered') ||
        errMsg.includes('email address already') ||
        errMsg.includes('email is already');

      if (isMobileDuplicate) {
        triggerAlreadyRegisteredModal('mobile', phone.trim());
      } else if (isEmailDuplicate) {
        triggerAlreadyRegisteredModal('email', email.trim().toLowerCase());
      } else {
        setError(err.message || 'Registration failed. Please check your input details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendLoginOtp = async () => {
    setError('');
    setSuccessMsg('');
    const cleanInput = email.trim();

    if (!cleanInput) {
      setError('Please enter your 10-digit Mobile Number.');
      return;
    }

    const isMobile = /^[6-9]\d{9}$/.test(cleanInput);
    if (!isMobile) {
      setError('Please enter a valid 10-digit Mobile Number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      // 1. Proactively check if vendor mobile is registered
      const phoneCheck = await checkVendorPhoneApi(cleanInput);
      if (phoneCheck && !phoneCheck.exists) {
        setLoading(false);
        triggerNotRegisteredModal(cleanInput);
        return;
      }

      const res = await sendOtpApi(cleanInput, 'login');
      setLoginOtpSent(true);
      setLoginOtpTimer(60);
      setSuccessMsg(`OTP sent to mobile number ${cleanInput}.`);
    } catch (err: any) {
      console.error('❌ [LOGIN OTP FAILED]:', err);
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        triggerNotRegisteredModal(cleanInput);
      } else {
        const userMessage = formatUserFacingError(err, 'Unable to send OTP at this time. Please try again or log in with your password.');
        setError(userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    setError('');
    setSuccessMsg('');
    if (!loginOtp || loginOtp.length < 4) {
      setError('Please enter the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const cleanInput = email.trim();
      await verifyOtpApi(cleanInput, loginOtp);
      const res = await loginVendorWithOtpApi(cleanInput, loginOtp);
      const finalVendor: VendorUser = {
        ...res.vendor,
        business_type: res.vendor.business_type || (isServiceCategory(res.vendor.category) ? 'SERVICE' : 'PRODUCT'),
      };
      onLoginSuccess(finalVendor);
    } catch (err: any) {
      console.error('❌ [VERIFY OTP FAILED]:', err);
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        triggerNotRegisteredModal(email.trim());
      } else {
        const userMessage = formatUserFacingError(err, 'Invalid OTP code. Please check the code and try again.');
        setError(userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRegOtp = async () => {
    if (!agreedToTerms) {
      setTouchedStep3(true);
      setError('Please accept the Terms & Conditions and Privacy Policy to proceed.');
      return;
    }
    if (isMobileVerified) {
      handleRegister();
      return;
    }
    handleSendMobileOtp();
  };

  const handleSendMobileOtp = async () => {
    setError('');
    setSuccessMsg('');
    const cleanPhone = phone.trim();
    if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    try {
      // 1. Pre-check if phone is already registered
      try {
        const phoneCheck = await checkVendorPhoneApi(cleanPhone);
        if (phoneCheck && phoneCheck.exists) {
          setLoading(false);
          triggerAlreadyRegisteredModal('mobile', cleanPhone);
          return;
        }
      } catch (_) {}

      const res = await sendOtpApi(cleanPhone, 'register');
      setRegOtp('');
      setRegOtpTimer(60);
      setShowRegOtpModal(true);
      setSuccessMsg(`OTP sent to mobile number ${cleanPhone}.`);
    } catch (err: any) {
      console.error('❌ [REGISTRATION OTP FAILED]:', err);
      const errMsg = (err.message || '').toLowerCase();
      if (
        errMsg.includes('already exists') ||
        errMsg.includes('already registered') ||
        errMsg.includes('account with this mobile') ||
        errMsg.includes('already in use')
      ) {
        triggerAlreadyRegisteredModal('mobile', cleanPhone);
      } else {
        const userMessage = formatUserFacingError(err, 'Unable to send OTP at this time. Please try again or verify mobile number.');
        setError(userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setError('');
    if (!regOtp || regOtp.length < 4) {
      setError('Please enter the OTP code.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phone.trim();
      await verifyOtpApi(cleanPhone, regOtp);

      setIsMobileVerified(true);
      setShowRegOtpModal(false);

      if (regStep === 3) {
        handleRegister();
      }
    } catch (err: any) {
      console.error('❌ [REGISTRATION VERIFY FAILED]:', err);
      const userMessage = formatUserFacingError(err, 'Invalid OTP code. Please check the code and try again.');
      setError(userMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login with OTP Modal - Step 1: Send OTP (supports Mobile Number & Email ID)
  const handleLoginOtpModalSend = async () => {
    setLoginOtpModalError('');
    const cleanContact = loginOtpModalPhone.trim();
    if (!cleanContact) {
      setLoginOtpModalError('Please enter your registered Mobile Number or Email ID.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanContact);
    const isPhone = /^\d{10}$/.test(cleanContact) || /^[6-9]\d{9}$/.test(cleanContact);

    if (!isEmail && !isPhone) {
      setLoginOtpModalError('Please enter a valid 10-digit mobile number or a valid email address.');
      return;
    }

    setLoginOtpModalLoading(true);
    try {
      // 1. Proactively check if email or phone exists on backend
      const check = isEmail
        ? await checkVendorEmailApi(cleanContact)
        : await checkVendorPhoneApi(cleanContact);

      if (check && !check.exists) {
        setLoginOtpModalLoading(false);
        setShowLoginOtpModal(false);
        triggerNotRegisteredModal(cleanContact);
        return;
      }

      const res = await sendOtpApi(cleanContact, 'login');
      setLoginOtpModalCode('');
      setLoginOtpModalStep(2);
      setLoginOtpModalTimer(60);
      const testOtp = res?.simulationOtp || res?.otp || res?.code || '123456';
      setLoginOtpModalError('');
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        setShowLoginOtpModal(false);
        triggerNotRegisteredModal(cleanContact);
      } else {
        setLoginOtpModalError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setLoginOtpModalLoading(false);
    }
  };

  // Login with OTP Modal - Step 2: Verify & Login
  const handleLoginOtpModalVerify = async () => {
    setLoginOtpModalError('');
    if (!loginOtpModalCode || loginOtpModalCode.length < 4) {
      setLoginOtpModalError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoginOtpModalLoading(true);
    try {
      const cleanContact = loginOtpModalPhone.trim();
      await verifyOtpApi(cleanContact, loginOtpModalCode);
      const res = await loginVendorWithOtpApi(cleanContact, loginOtpModalCode);
      const finalVendor: VendorUser = {
        ...res.vendor,
        business_type: res.vendor.business_type || (isServiceCategory(res.vendor.category) ? 'SERVICE' : 'PRODUCT'),
      };
      // Close OTP Modal (Image 2) and open Set Account Password Modal (Image 1)
      setShowLoginOtpModal(false);
      setPendingVendorAfterOtp(finalVendor);
      setSetPasswordNew('');
      setSetPasswordConfirm('');
      setSetPasswordError('');
      setShowSetPasswordModal(true);
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        setShowLoginOtpModal(false);
        triggerNotRegisteredModal(loginOtpModalPhone.trim());
      } else {
        setLoginOtpModalError(err.message || 'Invalid or expired OTP. Please try again.');
      }
    } finally {
      setLoginOtpModalLoading(false);
    }
  };

  const handleSaveNewPasswordAfterOtp = async () => {
    setSetPasswordError('');
    if (!setPasswordNew || setPasswordNew.length < 6) {
      setSetPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (setPasswordNew !== setPasswordConfirm) {
      setSetPasswordError('Passwords do not match.');
      return;
    }

    setSetPasswordLoading(true);
    try {
      if (pendingVendorAfterOtp) {
        const contact = pendingVendorAfterOtp.phone_number || pendingVendorAfterOtp.email || loginOtpModalPhone;
        try {
          await resetPasswordWithOtpApi(contact, '123456', setPasswordNew);
        } catch (_) {}
      }
      setShowSetPasswordModal(false);
      if (pendingVendorAfterOtp) {
        onLoginSuccess(pendingVendorAfterOtp);
      }
    } catch (err: any) {
      setSetPasswordError(err.message || 'Failed to set password. Proceeding to login.');
      if (pendingVendorAfterOtp) {
        onLoginSuccess(pendingVendorAfterOtp);
      }
    } finally {
      setSetPasswordLoading(false);
    }
  };

  const handleSkipPasswordAfterOtp = () => {
    setShowSetPasswordModal(false);
    if (pendingVendorAfterOtp) {
      onLoginSuccess(pendingVendorAfterOtp);
    }
  };

  // Forgot Password - Step 1: Send OTP to email or mobile
  const handleSendOtp = async () => {
    setForgotError('');
    const cleanContact = forgotEmail.trim();
    if (!cleanContact) {
      setForgotError('Please enter your registered Phone Number or Email ID.');
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanContact);
    const isPhone = /^\d{10}$/.test(cleanContact) || /^[6-9]\d{9}$/.test(cleanContact);

    if (!isEmail && !isPhone) {
      setForgotError('Please enter a valid 10-digit mobile number or email address.');
      return;
    }

    setForgotLoading(true);
    try {
      // 1. Proactively check if email or phone is registered!
      const check = isEmail
        ? await checkVendorEmailApi(cleanContact)
        : await checkVendorPhoneApi(cleanContact);

      if (check && !check.exists) {
        setForgotLoading(false);
        setShowForgotModal(false);
        triggerNotRegisteredModal(cleanContact);
        return;
      }

      const res = await forgotPasswordOtpApi(cleanContact);
      setForgotOtp('');
      setForgotStep(2);
      setForgotOtpResendTimer(30);
      if (res.simulationOtp) {
        setForgotError(`Simulated OTP Code for Testing: ${res.simulationOtp}`);
      }
    } catch (err: any) {
      const errMsg = (err.message || '').toLowerCase();
      if (errMsg.includes('not found') || errMsg.includes('no vendor') || errMsg.includes('not registered') || errMsg.includes('no account') || errMsg.includes('does not exist')) {
        setShowForgotModal(false);
        triggerNotRegisteredModal(cleanContact);
      } else {
        setForgotError(err.message || 'Failed to send OTP. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot Password - Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setForgotError('');
    if (!forgotOtp || forgotOtp.length < 4) {
      setForgotError('Please enter the 6-digit OTP sent to your mobile or email.');
      return;
    }
    setForgotLoading(true);
    try {
      const cleanContact = forgotEmail.trim();
      await verifyOtpApi(cleanContact, forgotOtp);
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || 'Invalid or expired OTP. Please check and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async () => {
    setForgotError('');
    if (!forgotNewPass || !forgotConfirmPass) {
      setForgotError('Please fill in both new password and confirm password fields.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match. Please verify both entries.');
      return;
    }
    const hasUpper = /[A-Z]/.test(forgotNewPass);
    const hasNum = /[0-9]/.test(forgotNewPass);
    const hasSpec = /[^a-zA-Z0-9]/.test(forgotNewPass);
    if (forgotNewPass.length < 8 || !hasUpper || !hasNum || !hasSpec) {
      setForgotError('Password must be at least 8 characters with uppercase, number & special symbol.');
      return;
    }
    setForgotLoading(true);
    try {
      const cleanContact = forgotEmail.trim();
      await resetPasswordWithOtpApi(cleanContact, forgotOtp, forgotNewPass);
      setForgotSuccess('Your password has been successfully reset! You can now log in.');
      setForgotStep(4);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Real-time invalid field checks
  const isPincodeInvalid = mode === 'register' && regStep === 1 && pincode.length > 0 && !/^\d{6}$/.test(pincode.trim());
  const isCityInvalid = mode === 'register' && regStep === 1 && city.length > 0 && (city.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(city));
  const isStateInvalid = mode === 'register' && regStep === 1 && stateName.length > 0 && (stateName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(stateName));

  const isVendorInvalid = mode === 'register' && regStep === 2 && vendorName.length > 0 && (vendorName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(vendorName));
  const isPhoneInvalid = mode === 'register' && regStep === 2 && phone.length > 0 && (phone.length < 10 || !/^[6-9]\d{9}$/.test(phone));
  const isEmailInvalid = mode === 'register' && regStep === 2 && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
  const isStoreInvalid = mode === 'register' && regStep === 2 && storeName.length > 0 && storeName.trim().length < 2;
  const isGstInvalid =
    mode === 'register' &&
    regStep === 2 &&
    (taxIdentifierType === 'GSTIN'
      ? (gstinNumber.length > 0 && (gstinNumber.length !== 15 || !gstCheckRegex.test(gstinNumber.toUpperCase().trim())))
      : (panNumber.length > 0 && (panNumber.length !== 10 || !panCheckRegex.test(panNumber.toUpperCase().trim()))));

  const isPasswordInvalid = mode === 'register' && regStep === 3 && password.length > 0 && (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F6F0' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F6F0" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingTop: mode === 'login'
              ? Math.max(insets.top + 8, Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 24)
              : Math.max(insets.top + 10, Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 8 : 16),
            paddingBottom: isKeyboardVisible ? 320 : Math.max(insets.bottom + 48, 64)
          }
        ]}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' ? false : true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={true}
        bounces={true}
      >
        {/* Heading Section */}
        <View style={[styles.headingSection, mode === 'login' ? { marginBottom: 14, marginTop: 0 } : { marginBottom: 4, marginTop: 4 }]}>
          {mode === 'register' ? (
            <View style={styles.headerRowAligned}>
              <TouchableOpacity
                style={styles.backButtonInline}
                onPress={() => {
                  if (regStep === 3) setRegStep(2);
                  else if (regStep === 2) setRegStep(1);
                  else {
                    setMode('login');
                    setError('');
                  }
                }}
                activeOpacity={0.7}
              >
                <ArrowLeft size={22} color="#541D26" strokeWidth={2.4} />
              </TouchableOpacity>

              <Text style={styles.mainTitleRegisterInline} numberOfLines={1}>
                Vendor Registration
              </Text>

              <View style={{ width: 28 }} />
            </View>
          ) : (
            <View style={{ width: '100%', marginBottom: 0 }}>
              {/* Row 1: Back button on top left */}
              {onBackToWelcome && (
                <TouchableOpacity
                  onPress={onBackToWelcome}
                  style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 16, marginBottom: 8 }}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={24} color="#541D26" strokeWidth={2.5} />
                </TouchableOpacity>
              )}

              {/* Centered logo and titles section below back option */}
              <View style={{ alignItems: 'center', width: '100%' }}>
                {/* Top DigiLocal Logo */}
                <Image
                  source={require('../../assets/images/LOGO.png')}
                  style={{ width: 270, height: 180, marginTop: -55, marginBottom: -35 }}
                  resizeMode="contain"
                />
                
                {/* Vendor Login Text */}
                <Text style={{
                  fontSize: 28,
                  fontWeight: '800',
                  color: '#541D26',
                  textAlign: 'center',
                  fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_800Bold',
                  letterSpacing: -0.5,
                  marginBottom: 12,
                }}>
                  Vendor Login
                </Text>

                {/* Welcome Text */}
                <Text style={{
                  fontSize: 13.5,
                  color: '#78716C',
                  textAlign: 'center',
                  fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
                }}>
                  Welcome back! Login to your vendor account
                </Text>
              </View>
            </View>
          )}

          {/* Stepper Progress Bar for Registration */}
          {mode === 'register' ? (
            <View style={styles.stepperContainer}>
              {/* Step 1 */}
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => { if (regStep > 1) setRegStep(1); }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepCircle, regStep >= 1 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, regStep >= 1 ? styles.stepNumberActive : styles.stepNumberInactive]}>1</Text>
                </View>
                <Text style={[styles.stepLabel, regStep === 1 && styles.stepLabelActive]}>Business Info</Text>
              </TouchableOpacity>

              {/* Line 1-2 */}
              <View style={[styles.stepLine, regStep >= 2 ? styles.stepLineActive : styles.stepLineInactive]} />

              {/* Step 2 */}
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => {
                  if (regStep === 1) handleNextStep1();
                  else if (regStep === 3) setRegStep(2);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepCircle, regStep >= 2 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, regStep >= 2 ? styles.stepNumberActive : styles.stepNumberInactive]}>2</Text>
                </View>
                <Text style={[styles.stepLabel, regStep === 2 && styles.stepLabelActive]}>Shop Details</Text>
              </TouchableOpacity>

              {/* Line 2-3 */}
              <View style={[styles.stepLine, regStep === 3 ? styles.stepLineActive : styles.stepLineInactive]} />

              {/* Step 3 */}
              <TouchableOpacity
                style={styles.stepItem}
                onPress={() => { if (regStep === 2) handleNextStep2(); }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepCircle, regStep === 3 ? styles.stepCircleActive : styles.stepCircleInactive]}>
                  <Text style={[styles.stepNumber, regStep === 3 ? styles.stepNumberActive : styles.stepNumberInactive]}>3</Text>
                </View>
                <Text style={[styles.stepLabel, regStep === 3 && styles.stepLabelActive]}>Verify & Finish</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Main Form Container */}
        <View style={styles.card}>
          {error && mode === 'login' ? (
            <View style={styles.errorBox}>
              <AlertTriangle color="#EF4444" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}



          {mode === 'login' ? (
            /* ===== LOGIN FORM ===== */
            <>
              {/* Email Address or Phone Number */}
              <Text style={styles.inputLabel}>Email Address or Phone Number *</Text>
              <View style={[styles.inputWrapper, (error && !password) ? styles.inputWrapperError : undefined]}>
                {/^\d+$/.test(email.trim()) && email.trim().length > 0 ? (
                  <Phone color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
                ) : email.trim().includes('@') || /[a-zA-Z]/.test(email.trim()) ? (
                  <Mail color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
                ) : (
                  <User color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
                )}
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number or email id"
                  placeholderTextColor="#78716C"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType={/^\d+$/.test(email) ? "number-pad" : "email-address"}
                  editable={!loginOtpSent}
                  value={email}
                  onChangeText={handleLoginContactChange}
                />
              </View>
              {/^\d+$/.test(email) && email.length > 0 && !/^[6-9]/.test(email) ? (
                <Text style={styles.inputErrorText}>Mobile number must start with 6, 7, 8, or 9</Text>
              ) : /^\d+$/.test(email) && email.length > 0 && email.length < 10 ? (
                <Text style={[styles.inputErrorText, { color: '#78716C' }]}>Mobile number ({email.length}/10 digits)</Text>
              ) : (!/^\d+$/.test(email) && email.length > 0 && (!email.includes('@') || !email.includes('.'))) ? (
                <Text style={styles.inputErrorText}>Please enter a valid email address (e.g. vendor@domain.com)</Text>
              ) : null}

              {/* Password */}
              <Text style={[styles.inputLabel, { marginTop: 20, marginBottom: 8 }]}>Password *</Text>
              <View style={[styles.inputWrapper, (error && password.length === 0) ? styles.inputWrapperError : undefined]}>
                <Lock color="#541D26" size={20} style={{ marginLeft: 4, marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { paddingVertical: 0 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#78716C"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={showPassword ? 'none' : 'password'}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
                  {showPassword ? <Eye color="#1F2937" size={20} /> : <EyeOff color="#1F2937" size={20} />}
                </TouchableOpacity>
              </View>
              {isPasswordInvalid ? (
                <Text style={styles.inputErrorText}>Password must be 8+ chars with uppercase, number & special symbol (@, #, $, !)</Text>
              ) : null}

              {/* Try another method (Right Corner with Key icon) */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                  onPress={handleTryAnotherMethod}
                  activeOpacity={0.7}
                >
                  <KeyRound size={16} color="#B45309" />
                  <Text style={{ fontSize: 13, color: '#541D26', fontWeight: '700' }}>
                    Try another method
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.submitButton, { marginTop: 20 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ===== REGISTRATION STEP 1: Business Info ===== */}
              <View style={{ display: regStep === 1 ? 'flex' : 'none', width: '100%' }}>
                {/* 1. Enter Address (Society / Area / Sector) */}
                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Add Your Complete Address (Society / Area / Sector) *</Text>

                <View style={{ position: 'relative', zIndex: 30, marginBottom: 4 }}>
                  <View style={[styles.inputWrapper, (touchedStep1 && (!areaName.trim() || areaName.trim().length < 2)) ? styles.inputWrapperError : undefined]}>
                    <Building2 size={18} color="#541D26" style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.input}
                      placeholder="Search or enter society, area or sector (e.g. Mansarovar)"
                      placeholderTextColor="#78716C"
                      value={areaName}
                      onChangeText={handleAreaChange}
                      onFocus={() => {
                        fetchLocationByAreaName(areaName);
                        setShowAreaDropdown(true);
                      }}
                    />
                    {isFetchingArea ? (
                      <ActivityIndicator size="small" color="#541D26" style={{ marginRight: 6 }} />
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        if (showAreaDropdown) {
                          setShowAreaDropdown(false);
                        } else {
                          fetchLocationByAreaName(areaName);
                          setShowAreaDropdown(true);

                        }
                      }}
                      style={{ padding: 4, marginLeft: 4 }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <ChevronDown
                        size={18}
                        color="#541D26"
                        style={{ transform: [{ rotate: showAreaDropdown ? '180deg' : '0deg' }] }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Area / Society Suggestions Dropdown */}
                  {showAreaDropdown && areaSuggestions.length > 0 ? (
                    <View style={[styles.dropdownBox, { marginTop: 4, maxHeight: 250, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }]}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 250 }}>
                        {areaSuggestions.map((item, idx) => (
                          <TouchableOpacity
                            key={`${item.name}_${item.pincode}_${idx}`}
                            style={[
                              styles.dropdownItem,
                              { borderBottomWidth: idx < areaSuggestions.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }
                            ]}
                            onPress={() => handleSelectSuggestion(item)}
                            activeOpacity={0.8}
                          >
                            <Building2 size={16} color="#541D26" style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.dropdownTitle}>{item.name}</Text>
                              <Text style={styles.dropdownSub}>
                                {[item.city, item.state].filter(Boolean).join(', ')}{item.pincode ? ` • ${item.pincode}` : ''}
                              </Text>
                            </View>
                            <ChevronRight size={14} color="#9CA3AF" />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
                {touchedStep1 && (!areaName.trim() || areaName.trim().length < 2) ? (
                  <Text style={styles.inputErrorText}>Complete Address (Society / Area / Sector) is mandatory * (minimum 2 characters).</Text>
                ) : null}

                {/* Remaining Step 1 fields - Blurred & Disabled until address is entered */}
                <View
                  style={{ opacity: (areaName.trim().length >= 2) ? 1 : 0.45 }}
                  pointerEvents={(areaName.trim().length >= 2) ? 'auto' : 'none'}
                >
                  {/* Pincode & City (Side by Side Grid) */}
                  <View style={[styles.gridRow, { marginTop: 12 }]}>
                    <View style={[styles.gridCol, { marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Pincode *</Text>
                      <View style={[styles.inputWrapper, (touchedStep1 && (!pincode.trim() || !/^\d{6}$/.test(pincode.trim()))) ? styles.inputWrapperError : undefined]}>
                        <TextInput
                          style={styles.input}
                          placeholder="Pincode"
                          placeholderTextColor="#78716C"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={pincode}
                          onChangeText={handlePincodeChange}
                          editable={areaName.trim().length >= 2}
                        />
                      </View>
                      {touchedStep1 && (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) ? (
                        <Text style={styles.inputErrorText}>Pincode is mandatory *.</Text>
                      ) : null}
                    </View>

                    <View style={[styles.gridCol, { marginLeft: 8 }]}>
                      <Text style={styles.inputLabel}>City *</Text>
                      <View style={[styles.inputWrapper, (touchedStep1 && (!city.trim() || city.trim().length < 2)) ? styles.inputWrapperError : undefined]}>
                        <TextInput
                          style={styles.input}
                          placeholder="City"
                          placeholderTextColor="#78716C"
                          value={city}
                          onChangeText={setCity}
                          editable={areaName.trim().length >= 2}
                        />
                      </View>
                      {touchedStep1 && (!city.trim() || city.trim().length < 2) ? (
                        <Text style={styles.inputErrorText}>City is mandatory *.</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* State */}
                  <Text style={[styles.inputLabel, { marginTop: 14 }]}>State *</Text>
                  <View style={[styles.inputWrapper, (touchedStep1 && (!stateName.trim() || stateName.trim().length < 2)) ? styles.inputWrapperError : undefined]}>
                    <TextInput
                      style={styles.input}
                      placeholder="State"
                      placeholderTextColor="#78716C"
                      value={stateName}
                      onChangeText={setStateName}
                      editable={areaName.trim().length >= 2}
                    />
                  </View>
                  {touchedStep1 && (!stateName.trim() || stateName.trim().length < 2) ? (
                    <Text style={styles.inputErrorText}>State is mandatory *.</Text>
                  ) : null}

                  {/* Business Classification */}
                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Business Classification *</Text>
                  <View style={styles.bizClassificationRow}>
                    <TouchableOpacity
                      style={[styles.bizClassCard, businessType === 'PRODUCT' && styles.bizClassCardActive]}
                      onPress={() => {
                        setBusinessType('PRODUCT');
                        setCategory('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.bizClassIconBox, businessType === 'PRODUCT' && styles.bizClassIconBoxActive]}>
                        <ShoppingBag size={18} color={businessType === 'PRODUCT' ? '#FFFFFF' : '#541D26'} />
                      </View>
                      <Text style={[styles.bizClassTitle, businessType === 'PRODUCT' && styles.bizClassTitleActive]}>
                        Product Merchant
                      </Text>
                      <Text style={styles.bizClassSub}>Grocery, Bakery, Dairy, Chemist, Retail Goods</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.bizClassCard, businessType === 'SERVICE' && styles.bizClassCardActive]}
                      onPress={() => {
                        setBusinessType('SERVICE');
                        setCategory('');
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.bizClassIconBox, businessType === 'SERVICE' && styles.bizClassIconBoxActive]}>
                        <Wrench size={18} color={businessType === 'SERVICE' ? '#FFFFFF' : '#541D26'} />
                      </View>
                      <Text style={[styles.bizClassTitle, businessType === 'SERVICE' && styles.bizClassTitleActive]}>
                        Service Provider
                      </Text>
                      <Text style={styles.bizClassSub}>Electrician, AC Repair, Tuition, Clinic, CA</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Business Category */}
                  <Text style={[styles.inputLabel, { marginTop: 16 }]}>Business Category *</Text>
                  <View style={{ position: 'relative', zIndex: 10, marginBottom: 4 }}>
                    <TouchableOpacity
                      style={[styles.inputWrapper, (touchedStep1 && !category) ? styles.inputWrapperError : undefined]}
                      onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      activeOpacity={0.8}
                    >
                      <Text style={category ? styles.categoryText : styles.categoryPlaceholderText}>
                        {category || 'Select category'}
                      </Text>
                      <ChevronDown size={18} color="#6B7280" />
                    </TouchableOpacity>

                    {showCategoryDropdown ? (
                      <View style={styles.dropdownBox}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                          {(businessType === 'SERVICE' ? SERVICE_CATEGORIES : PRODUCT_CATEGORIES).map(cat => (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.dropdownItem,
                                category === cat && styles.dropdownItemActive
                              ]}
                              onPress={() => {
                                setCategory(cat);
                                setShowCategoryDropdown(false);
                              }}
                            >
                              <Text style={styles.dropdownTitle}>{cat}</Text>
                              {category === cat ? <Check size={16} color="#541D26" strokeWidth={2.5} /> : null}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                  {touchedStep1 && !category ? (
                    <Text style={styles.inputErrorText}>Business Category Selection is mandatory *. Please select a category.</Text>
                  ) : null}

                  {/* Next Button */}
                  <TouchableOpacity
                    style={[styles.submitButton, { marginTop: 20 }]}
                    onPress={handleNextStep1}
                    disabled={loading || areaName.trim().length < 2}
                    activeOpacity={0.9}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Next</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* ===== REGISTRATION STEP 2: Shop Details ===== */}
              <View style={{ display: regStep === 2 ? 'flex' : 'none', width: '100%' }}>
                {/* Owner Name */}
                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Owner Name *</Text>
                <View style={[styles.inputWrapper, (touchedStep2 && (!vendorName.trim() || vendorName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(vendorName.trim()))) ? styles.inputWrapperError : isVendorInvalid ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter owner name"
                    placeholderTextColor="#78716C"
                    value={vendorName}
                    onChangeText={(text) => setVendorName(text.replace(/[^a-zA-Z\s]/g, ''))}
                  />
                </View>
                {touchedStep2 && (!vendorName.trim() || vendorName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(vendorName.trim())) ? (
                  <Text style={styles.inputErrorText}>Owner Name is mandatory * (alphabets only, at least 2 characters).</Text>
                ) : isVendorInvalid ? (
                  <Text style={styles.inputErrorText}>Owner name must contain only alphabets</Text>
                ) : null}

                {/* Mobile Number */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <Text style={styles.inputLabel}>Mobile Number *</Text>
                  {isMobileVerified ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
                      <Check size={12} color="#16A34A" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>Verified</Text>
                    </View>
                  ) : (
                    (selectedCountryCode.dialCode === '+91' ? (phone.trim().length === 10 && /^[6-9]\d{9}$/.test(phone.trim())) : (phone.trim().length >= 7 && phone.trim().length <= 15)) ? (
                      <TouchableOpacity onPress={handleSendMobileOtp} disabled={loading} activeOpacity={0.7}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#541D26', textDecorationLine: 'underline' }}>
                          Verify via OTP
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  )}
                </View>
                <View style={[styles.inputWrapper, (isPhoneInvalid || (touchedStep2 && (!phone.trim() || !isMobileVerified))) ? styles.inputWrapperError : undefined]}>
                  <TouchableOpacity
                    style={styles.countryCodeBadge}
                    onPress={() => {
                      setCountrySearchQuery('');
                      setShowCountryPicker(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryCodeText}>{selectedCountryCode.flag} {selectedCountryCode.dialCode}</Text>
                    <ChevronDown size={14} color="#541D26" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                  <View style={styles.countryCodeDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder={selectedCountryCode.dialCode === '+91' ? 'Enter 10-digit mobile number' : 'Enter mobile number'}
                    placeholderTextColor="#78716C"
                    keyboardType="number-pad"
                    maxLength={selectedCountryCode.dialCode === '+91' ? 10 : 15}
                    value={phone}
                    onChangeText={(text) => {
                      const maxLen = selectedCountryCode.dialCode === '+91' ? 10 : 15;
                      const digitsOnly = text.replace(/[^0-9]/g, '').slice(0, maxLen);
                      setPhone(digitsOnly);
                      if (isMobileVerified) setIsMobileVerified(false);
                      if (selectedCountryCode.dialCode === '+91' && digitsOnly.length === 10) {
                        checkPhoneOnInput(digitsOnly);
                      } else {
                        setPhoneAlreadyRegisteredError('');
                      }
                    }}
                    onBlur={() => {
                      if (selectedCountryCode.dialCode === '+91' && phone.length === 10) {
                        checkPhoneOnInput(phone);
                      }
                    }}
                  />
                </View>
                {phoneAlreadyRegisteredError ? (
                  <View style={{ marginTop: 4, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.inputErrorText, { color: '#DC2626', fontWeight: '700', flex: 1 }]}>
                      {phoneAlreadyRegisteredError}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMode('login');
                        setEmail(phone);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Text style={{ color: '#541D26', fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                ) : selectedCountryCode.dialCode === '+91' && phone.length > 0 && !/^[6-9]/.test(phone) ? (
                  <Text style={styles.inputErrorText}>Mobile number must start with 6, 7, 8, or 9.</Text>
                ) : selectedCountryCode.dialCode === '+91' && phone.length > 0 && phone.length < 10 ? (
                  <Text style={styles.inputErrorText}>Mobile number must be 10 digits (currently {phone.length}/10).</Text>
                ) : selectedCountryCode.dialCode !== '+91' && phone.length > 0 && phone.length < 7 ? (
                  <Text style={styles.inputErrorText}>Phone number must be at least 7 digits (currently {phone.length}).</Text>
                ) : touchedStep2 && (!phone.trim() || (selectedCountryCode.dialCode === '+91' ? !/^[6-9]\d{9}$/.test(phone.trim()) : phone.trim().length < 7)) ? (
                  <Text style={styles.inputErrorText}>
                    {selectedCountryCode.dialCode === '+91'
                      ? 'Mobile Number is mandatory * (10-digit number starting with 6, 7, 8, or 9).'
                      : 'Mobile Number is mandatory * (7 to 15 digits).'}
                  </Text>
                ) : touchedStep2 && !isMobileVerified ? (
                  <Text style={styles.inputErrorText}>Mobile OTP Verification is mandatory *. Please tap "Verify via OTP" beside your phone number.</Text>
                ) : null}

                {/* Email Address */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Email Address *</Text>
                <View style={[styles.inputWrapper, emailAlreadyRegisteredError ? styles.inputWrapperError : (touchedStep2 && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim()))) ? styles.inputWrapperError : isEmailInvalid ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email address"
                    placeholderTextColor="#78716C"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={(text) => {
                      const clean = text.trim();
                      setEmail(clean);
                      if (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(clean)) {
                        checkEmailOnInput(clean);
                      } else {
                        setEmailAlreadyRegisteredError('');
                      }
                    }}
                    onBlur={() => {
                      if (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
                        checkEmailOnInput(email.trim());
                      }
                    }}
                  />
                </View>
                {emailAlreadyRegisteredError ? (
                  <View style={{ marginTop: 4, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.inputErrorText, { color: '#DC2626', fontWeight: '700', flex: 1 }]}>
                      {emailAlreadyRegisteredError}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setMode('login');
                        setEmail(email.trim());
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Text style={{ color: '#541D26', fontWeight: '800', fontSize: 12, textDecorationLine: 'underline' }}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                ) : touchedStep2 && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim())) ? (
                  <Text style={styles.inputErrorText}>Email Address is mandatory * (e.g. vendor@domain.com).</Text>
                ) : isEmailInvalid ? (
                  <Text style={styles.inputErrorText}>Please enter a valid email address (e.g. vendor@domain.com)</Text>
                ) : null}

                {/* Shop / Business Name */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Shop / Business Name *</Text>
                <View style={[styles.inputWrapper, (touchedStep2 && (!storeName.trim() || storeName.trim().length < 2)) ? styles.inputWrapperError : isStoreInvalid ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter shop / business name"
                    placeholderTextColor="#78716C"
                    value={storeName}
                    onChangeText={(text) => setStoreName(text.replace(/[^a-zA-Z\s]/g, ''))}
                  />
                </View>
                {touchedStep2 && (!storeName.trim() || storeName.trim().length < 2) ? (
                  <Text style={styles.inputErrorText}>Shop / Business Name is mandatory * (at least 2 characters).</Text>
                ) : isStoreInvalid ? (
                  <Text style={styles.inputErrorText}>Business name must be at least 2 characters</Text>
                ) : null}

                {/* Shop Number */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Shop Number *</Text>
                <View style={[styles.inputWrapper, (touchedStep2 && (!shopNumber.trim() || shopNumber.trim().length < 1)) ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Shop No. 12, Ground Floor"
                    placeholderTextColor="#78716C"
                    value={shopNumber}
                    onChangeText={setShopNumber}
                  />
                </View>
                {touchedStep2 && (!shopNumber.trim() || shopNumber.trim().length < 1) ? (
                  <Text style={styles.inputErrorText}>Shop Number is mandatory * (e.g. Shop 12 or Booth 4).</Text>
                ) : null}

                {/* Tax Identifier Toggle & Input (Image 2 Design) */}
                <View style={{ marginTop: 16 }}>
                  {/* Top Row: Tax Identifier Label + Pill Toggle */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={[styles.inputLabel, { marginTop: 0 }]}>Tax Identifier *</Text>
                    
                    {/* GSTIN / PAN Toggle Pill */}
                    <View style={{
                      flexDirection: 'row',
                      backgroundColor: '#EEE5DA',
                      borderRadius: 20,
                      padding: 3,
                      alignItems: 'center'
                    }}>
                      <TouchableOpacity
                        onPress={() => setTaxIdentifierType('GSTIN')}
                        style={{
                          backgroundColor: taxIdentifierType === 'GSTIN' ? '#541D26' : 'transparent',
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: taxIdentifierType === 'GSTIN' ? '#FAF8F5' : '#78716C',
                          letterSpacing: 0.3
                        }}>
                          GSTIN
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setTaxIdentifierType('PAN')}
                        style={{
                          backgroundColor: taxIdentifierType === 'PAN' ? '#541D26' : 'transparent',
                          borderRadius: 16,
                          paddingHorizontal: 12,
                          paddingVertical: 4,
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '800',
                          color: taxIdentifierType === 'PAN' ? '#FAF8F5' : '#78716C',
                          letterSpacing: 0.3
                        }}>
                          PAN
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Field Label */}
                  <Text style={[styles.inputLabel, { marginTop: 4, fontSize: 13, color: '#44403C' }]}>
                    {taxIdentifierType === 'GSTIN' ? 'GSTIN Number *' : 'PAN Number *'}
                  </Text>

                  {/* Input Wrapper */}
                  <View style={[
                    styles.inputWrapper,
                    (touchedStep2 && (
                      taxIdentifierType === 'GSTIN'
                        ? (!gstinNumber.trim() || gstinNumber.trim().length !== 15 || !gstCheckRegex.test(gstinNumber.toUpperCase().trim()))
                        : (!panNumber.trim() || panNumber.trim().length !== 10 || !panCheckRegex.test(panNumber.toUpperCase().trim()))
                    )) ? styles.inputWrapperError : isGstInvalid ? styles.inputWrapperError : undefined
                  ]}>
                    {taxIdentifierType === 'GSTIN' ? (
                      <TextInput
                        key="input_field_gstin"
                        style={styles.input}
                        placeholder="ENTER 15–DIGIT GSTIN (E.G. 08ABCDE1234F1Z5)"
                        placeholderTextColor="#78716C"
                        autoCapitalize="characters"
                        maxLength={15}
                        value={gstinNumber}
                        onChangeText={(text) => {
                          setGstinNumber(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15));
                        }}
                      />
                    ) : (
                      <TextInput
                        key="input_field_pan"
                        style={styles.input}
                        placeholder="ENTER 10–DIGIT PAN (E.G. ABCDE1234F)"
                        placeholderTextColor="#78716C"
                        autoCapitalize="characters"
                        maxLength={10}
                        value={panNumber}
                        onChangeText={(text) => {
                          setPanNumber(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10));
                        }}
                      />
                    )}
                  </View>

                  {touchedStep2 && (
                    taxIdentifierType === 'GSTIN'
                      ? (!gstinNumber.trim() || gstinNumber.trim().length !== 15 || !gstCheckRegex.test(gstinNumber.toUpperCase().trim()))
                      : (!panNumber.trim() || panNumber.trim().length !== 10 || !panCheckRegex.test(panNumber.toUpperCase().trim()))
                  ) ? (
                    <Text style={styles.inputErrorText}>
                      {taxIdentifierType === 'GSTIN'
                        ? 'GSTIN Number is mandatory * (15-digit valid GSTIN e.g. 08ABCDE1234F1Z5).'
                        : 'PAN Number is mandatory * (10-digit valid PAN e.g. ABCDE1234F).'}
                    </Text>
                  ) : isGstInvalid ? (
                    <Text style={styles.inputErrorText}>
                      {taxIdentifierType === 'GSTIN'
                        ? 'Invalid GSTIN format. Must be 15 alphanumeric characters (e.g. 08ABCDE1234F1Z5)'
                        : 'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F)'}
                    </Text>
                  ) : null}
                </View>

                {/* Shop Images Picker Section */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Shop Images *</Text>
                <TouchableOpacity
                  style={[styles.uploadCard, (touchedStep2 && shopImages.length === 0) ? { borderColor: '#EF4444', backgroundColor: '#FEF2F2' } : undefined]}
                  onPress={handleAddPhoto}
                  activeOpacity={0.8}
                >
                  <View style={styles.uploadPlusCircle}>
                    <Plus size={20} color="#541D26" strokeWidth={2.5} />
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.uploadTitle}>Add Photos</Text>
                    <Text style={styles.uploadSub}>(Max 5 Images)</Text>
                  </View>
                </TouchableOpacity>
                {touchedStep2 && shopImages.length === 0 ? (
                  <Text style={styles.inputErrorText}>Shop Photos are mandatory *. Please upload at least 1 photo of your store.</Text>
                ) : null}

                {/* Preview thumbnails */}
                {shopImages.length > 0 ? (
                  <View style={styles.photosGrid}>
                    {shopImages.map((uri, idx) => (
                      <View key={idx} style={styles.photoThumbWrapper}>
                        <Image source={{ uri }} style={styles.photoThumb} />
                        <TouchableOpacity
                          style={styles.photoRemoveBtn}
                          onPress={() => handleRemovePhoto(idx)}
                        >
                          <X size={12} color="#FFFFFF" strokeWidth={3} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Next Button */}
                <TouchableOpacity
                  style={[styles.submitButton, { marginTop: 20 }, (Boolean(phoneAlreadyRegisteredError) || Boolean(emailAlreadyRegisteredError)) && { opacity: 0.5 }]}
                  onPress={handleNextStep2}
                  disabled={loading || Boolean(phoneAlreadyRegisteredError) || Boolean(emailAlreadyRegisteredError)}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Next</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* ===== REGISTRATION STEP 3: Verify & Finish ===== */}
              <View style={{ display: regStep === 3 ? 'flex' : 'none', width: '100%' }}>
                {/* Create Password */}
                <Text style={styles.inputLabel}>Create Password *</Text>
                <View style={[styles.inputWrapper, (touchedStep3 && (!password.trim() || password.trim().length < 8 || !/[A-Z]/.test(password.trim()) || !/[0-9]/.test(password.trim()) || !/[^a-zA-Z0-9]/.test(password.trim()))) ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Min. 8 chars, 1 uppercase, 1 num, 1 sym"
                    placeholderTextColor="#78716C"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <Eye size={18} color="#6B7280" />
                    ) : (
                      <EyeOff size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {touchedStep3 && (!password.trim() || password.trim().length < 8 || !/[A-Z]/.test(password.trim()) || !/[0-9]/.test(password.trim()) || !/[^a-zA-Z0-9]/.test(password.trim())) ? (
                  <Text style={styles.inputErrorText}>Password must be at least 8 characters, include 1 uppercase, 1 number, and 1 special character.</Text>
                ) : isPasswordInvalid ? (
                  <Text style={styles.inputErrorText}>Password must contain uppercase, number & special character</Text>
                ) : null}

                {/* Confirm Password */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Confirm Password *</Text>
                <View style={[styles.inputWrapper, (touchedStep3 && (!confirmPassword.trim() || confirmPassword.trim() !== password.trim())) ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Re-enter password"
                    placeholderTextColor="#78716C"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showConfirmPassword ? (
                      <Eye size={18} color="#6B7280" />
                    ) : (
                      <EyeOff size={18} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                </View>
                {touchedStep3 && (!confirmPassword.trim() || confirmPassword.trim() !== password.trim()) ? (
                  <Text style={styles.inputErrorText}>Passwords do not match.</Text>
                ) : null}

                {/* Review Registration Details Card */}
                <View style={[styles.summaryCard, { marginTop: 16 }]}>
                  <Text style={styles.summaryTitle}>Review Your Details</Text>

                  {/* Section 1: Business Info */}
                  <View style={{ marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#541D26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      1. Business Info
                    </Text>
                    {/* Area / Locality */}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Area / Sector:</Text>
                      <Text style={styles.summaryVal}>{areaName || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Pincode:</Text>
                      <Text style={styles.summaryVal}>{pincode || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>City:</Text>
                      <Text style={styles.summaryVal}>{city || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>State:</Text>
                      <Text style={styles.summaryVal}>{stateName || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Classification:</Text>
                      <Text style={styles.summaryVal}>
                        {businessType === 'SERVICE' ? 'Service Provider' : 'Product Merchant'}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Category:</Text>
                      <Text style={styles.summaryVal}>{category || '-'}</Text>
                    </View>
                  </View>

                  {/* Section 2: Shop Details */}
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#541D26', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      2. Shop Details
                    </Text>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Owner Name:</Text>
                      <Text style={styles.summaryVal}>{vendorName || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Mobile:</Text>
                      <Text style={styles.summaryVal}>
                        {phone ? `${selectedCountryCode.dialCode} ${phone}` : '-'} {isMobileVerified ? '✓ Verified' : ''}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Email:</Text>
                      <Text style={styles.summaryVal}>{email || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shop Name:</Text>
                      <Text style={styles.summaryVal}>{storeName || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shop Number:</Text>
                      <Text style={styles.summaryVal}>{shopNumber || '-'}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{taxIdentifierType === 'GSTIN' ? 'GSTIN:' : 'PAN:'}</Text>
                      <Text style={styles.summaryVal}>
                        {taxIdentifierType === 'GSTIN' ? (gstinNumber ? gstinNumber.toUpperCase() : '-') : (panNumber ? panNumber.toUpperCase() : '-')}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shop Images:</Text>
                      <Text style={styles.summaryVal}>
                        {shopImages.length > 0 ? `${shopImages.length} photo(s) selected` : '-'}
                      </Text>
                    </View>

                    {shopImages.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginLeft: 110 }}>
                        {shopImages.slice(0, 4).map((uri, idx) => (
                          <Image
                            key={idx}
                            source={{ uri }}
                            style={{ width: 38, height: 38, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' }}
                          />
                        ))}
                        {shopImages.length > 4 ? (
                          <View style={{ width: 38, height: 38, borderRadius: 6, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#4B5563' }}>+{shopImages.length - 4}</Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* ─── Terms & Privacy Agreement Checkbox ─── */}
                <View style={[styles.termsCheckRow, { marginTop: 18, marginBottom: 4 }]}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxSquare,
                      agreedToTerms && styles.checkboxSquareChecked,
                      (touchedStep3 && !agreedToTerms) ? { borderColor: '#EF4444' } : undefined,
                    ]}
                    onPress={() => {
                      if (!agreedToTerms) {
                        setShowPolicyModal(true);
                      } else {
                        setAgreedToTerms(false);
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    {agreedToTerms ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                  </TouchableOpacity>
                  <Text style={styles.termsCheckText}>
                    I have read and agree to the{' '}
                    <Text
                      style={styles.termsCheckLink}
                      onPress={() => setShowPolicyModal(true)}
                    >
                      Terms & Conditions
                    </Text>
                    {' '}and{' '}
                    <Text
                      style={styles.termsCheckLink}
                      onPress={() => setShowPolicyModal(true)}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>

                {touchedStep3 && !agreedToTerms ? (
                  <Text style={styles.inputErrorText}>Please accept the Terms & Conditions and Privacy Policy to proceed.</Text>
                ) : null}
                {touchedStep3 && !isMobileVerified ? (
                  <Text style={styles.inputErrorText}>Mobile OTP Verification is mandatory *. Please go back to Step 1 and verify your mobile number.</Text>
                ) : null}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, { marginTop: 20 }]}
                  onPress={handleTriggerRegOtp}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit for Admin Approval</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Divider & Registration Switch Line (Login Mode) */}
        {mode === 'login' ? (
          <View style={styles.loginFooterContainer}>
            {/* Horizontal Divider with "or" */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.registerPromptRow}
              onPress={() => {
                setMode('register');
                setRegStep(1);
                setPhone('');
                setEmail('');
                setIsMobileVerified(false);
                setError('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.dontHaveText} numberOfLines={1} adjustsFontSizeToFit>
                Don't have a vendor account?{' '}
                <Text style={styles.registerLinkText}>Register as Vendor</Text>
              </Text>
              <ChevronRight size={15} color="#541D26" strokeWidth={2.5} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* ─── Already Registered Alert Modal ─── */}
      <Modal
        transparent
        animationType="fade"
        visible={showAlreadyRegisteredModal}
        onRequestClose={() => setShowAlreadyRegisteredModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', paddingHorizontal: 24 }]}>
          <View style={[styles.modalSheet, { borderRadius: 24, paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center', width: '100%', maxWidth: 400 }]}>
            {/* Warning / Alert Icon Badge */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#FEF2F2',
              borderWidth: 6,
              borderColor: '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <AlertCircle size={32} color="#DC2626" strokeWidth={2.2} />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#1F2937',
              textAlign: 'center',
              marginBottom: 10,
              fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold'
            }}>
              {alreadyRegisteredType === 'mobile'
                ? 'Mobile Number Already Registered'
                : alreadyRegisteredType === 'email'
                  ? 'Email ID Already Registered'
                  : 'Already Registered'}
            </Text>

            {/* Message Body */}
            <Text style={{
              fontSize: 13.5,
              color: '#4B5563',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
              paddingHorizontal: 4,
              fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular'
            }}>
              {alreadyRegisteredMsg || 'This mobile number or email ID is already registered. Please use another email or mobile number.'}
            </Text>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: 10 }}>
              {/* Primary: Use Another */}
              <TouchableOpacity
                style={[styles.modalDoneBtn, { width: '100%', backgroundColor: '#541D26' }]}
                onPress={() => {
                  setShowAlreadyRegisteredModal(false);
                  if (alreadyRegisteredType === 'mobile') {
                    setPhone('');
                    setIsMobileVerified(false);
                  } else if (alreadyRegisteredType === 'email') {
                    setEmail('');
                  } else {
                    setPhone('');
                    setEmail('');
                    setIsMobileVerified(false);
                  }
                  setRegStep(1);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDoneBtnText}>
                  {alreadyRegisteredType === 'mobile'
                    ? 'Use Another Mobile Number'
                    : alreadyRegisteredType === 'email'
                      ? 'Use Another Email ID'
                      : 'Use Another Email / Mobile'}
                </Text>
              </TouchableOpacity>

              {/* Secondary: Switch to Sign In */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  paddingVertical: 13,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: '#541D26',
                  backgroundColor: '#FAF8F5',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  setShowAlreadyRegisteredModal(false);
                  setMode('login');
                  if (alreadyRegisteredType === 'mobile' && alreadyRegisteredValue) {
                    setEmail(alreadyRegisteredValue);
                  } else if (alreadyRegisteredType === 'email' && alreadyRegisteredValue) {
                    setEmail(alreadyRegisteredValue);
                  }
                  setRegStep(1);
                }}
                activeOpacity={0.85}
              >
                <Text style={{
                  color: '#541D26',
                  fontSize: 14,
                  fontWeight: '700',
                  fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold'
                }}>
                  Sign In to Existing Account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Mobile / Email Not Registered Alert Modal ─── */}
      <Modal
        transparent
        animationType="fade"
        visible={showNotRegisteredModal}
        onRequestClose={() => setShowNotRegisteredModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', paddingHorizontal: 24 }]}>
          <View style={[styles.modalSheet, { borderRadius: 24, paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center', width: '100%', maxWidth: 400 }]}>
            {/* User Plus / Info Badge */}
            <View style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: '#F7EEF0',
              borderWidth: 6,
              borderColor: '#FAF8F5',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}>
              <UserPlus size={32} color="#541D26" strokeWidth={2.2} />
            </View>

            {/* Title */}
            <Text style={{
              fontSize: 19,
              fontWeight: '800',
              color: '#211A19',
              textAlign: 'center',
              marginBottom: 10,
              fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold'
            }}>
              {notRegisteredValue.includes('@') ? 'Email ID Not Registered' : 'Mobile Number Not Registered'}
            </Text>

            {/* Description */}
            <Text style={{
              fontSize: 14,
              color: '#4B5563',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
              paddingHorizontal: 4,
              fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular'
            }}>
              {notRegisteredValue.includes('@')
                ? 'This email address is not registered, please register.'
                : 'This phone number is not registered, please register.'}
            </Text>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: 10 }}>
              {/* Primary: Register as Vendor */}
              <TouchableOpacity
                style={[styles.modalDoneBtn, { width: '100%', backgroundColor: '#541D26' }]}
                onPress={() => {
                  setShowNotRegisteredModal(false);
                  setMode('register');
                  setRegStep(1);
                  setPhone('');
                  setEmail('');
                  setIsMobileVerified(false);
                  setError('');
                  setSuccessMsg('');
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDoneBtnText}>
                  Register as Vendor
                </Text>
              </TouchableOpacity>

              {/* Secondary: Try Another */}
              <TouchableOpacity
                style={{
                  width: '100%',
                  paddingVertical: 13,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: '#E7DFD5',
                  backgroundColor: '#FAF8F5',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onPress={() => {
                  setShowNotRegisteredModal(false);
                  setEmail('');
                  setForgotEmail('');
                  setLoginOtpSent(false);
                  setLoginOtp('');
                  setError('');
                }}
                activeOpacity={0.85}
              >
                <Text style={{
                  color: '#211A19',
                  fontSize: 14,
                  fontWeight: '700',
                  fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold'
                }}>
                  {notRegisteredValue.includes('@') ? 'Try Another Email ID' : 'Try another mobile number'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Registration Success Modal */}
      <Modal transparent animationType="fade" visible={showRegSuccessModal} onRequestClose={() => { }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 }]}>
            {/* Confetti & Green Check Badge */}
            <View style={styles.successBadgeOuter}>
              <View style={styles.confettiDot1} />
              <View style={styles.confettiDot2} />
              <View style={styles.confettiDot3} />
              <View style={styles.confettiDot4} />
              <View style={styles.successBadgeCircle}>
                <Check size={36} color="#FFFFFF" strokeWidth={3.5} />
              </View>
            </View>

            <Text style={styles.regSuccessTitle}>Registration Submitted!</Text>

            <Text style={styles.regSuccessDesc}>
              Your new registration has been submitted and is under review. Approval will be processed as soon as possible. We will notify you once it is activated.
            </Text>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { width: '100%', marginTop: 24 }]}
              onPress={() => {
                setShowRegSuccessModal(false);
                if (registeredVendor) {
                  onLoginSuccess(registeredVendor);
                }
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.modalDoneBtnText}>Continue to Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Image Source Selection Modal ─── */}
      <Modal
        visible={showImageSourceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImageSourceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 24 }]}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shop Photo</Text>
              <TouchableOpacity onPress={() => setShowImageSourceModal(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#78716C', marginBottom: 16 }}>
              Choose whether to take a new photo or select from your gallery:
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: '#F7EEF0',
                  borderRadius: 12,
                  gap: 12,
                }}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#541D26" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#541D26' }}>Take Photo with Camera</Text>
                  <Text style={{ fontSize: 11.5, color: '#4B5563' }}>Use device camera to take a photo</Text>
                </View>
                <ChevronRight size={16} color="#541D26" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: '#FAF8F5',
                  borderWidth: 1,
                  borderColor: '#E7DFD5',
                  borderRadius: 12,
                  gap: 12,
                }}
                onPress={handlePickFromGallery}
                activeOpacity={0.8}
              >
                <ImageIcon size={20} color="#211A19" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#211A19' }}>Choose from Gallery / Files</Text>
                  <Text style={{ fontSize: 11.5, color: '#4B5563' }}>Select photo from device library</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Country Code Picker Modal ─── */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%', paddingBottom: 20 }]}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Country Search Bar */}
            <View style={[styles.inputWrapper, { marginHorizontal: 16, marginTop: 10, marginBottom: 8 }]}>
              <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Search country or code (e.g. UAE, +1, UK)"
                placeholderTextColor="#78716C"
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                autoCorrect={false}
              />
            </View>

            {/* Country List */}
            <ScrollView style={{ paddingHorizontal: 16, marginTop: 4 }} keyboardShouldPersistTaps="handled">
              {POPULAR_COUNTRY_CODES.filter(c =>
                c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
                c.dialCode.includes(countrySearchQuery) ||
                c.code.toLowerCase().includes(countrySearchQuery.toLowerCase())
              ).map(item => (
                <TouchableOpacity
                  key={item.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F3F4F6',
                  }}
                  onPress={() => {
                    setSelectedCountryCode(item);
                    setShowCountryPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 22, marginRight: 12 }}>{item.flag}</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: '#1F2937' }}>{item.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#541D26' }}>{item.dialCode}</Text>
                  {selectedCountryCode.code === item.code ? (
                    <Check size={16} color="#541D26" strokeWidth={3} style={{ marginLeft: 8 }} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Unified Terms & Conditions & Privacy Policy Modal (Same Page) ─── */}
      <Modal transparent animationType="slide" visible={showPolicyModal || showTermsModal || showPrivacyModal} onRequestClose={() => {
        setShowPolicyModal(false);
        setShowTermsModal(false);
        setShowPrivacyModal(false);
      }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '90%', paddingBottom: 20 }]}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Privacy Policy</Text>
              <TouchableOpacity onPress={() => {
                setShowPolicyModal(false);
                setShowTermsModal(false);
                setShowPrivacyModal(false);
              }}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420, marginVertical: 10, paddingHorizontal: 2 }} showsVerticalScrollIndicator>
              {/* Section 1: Terms & Conditions */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: '#541D26', marginBottom: 12 }}>
                  <FileText size={18} color="#541D26" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#541D26', fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold' }}>
                    1. Terms & Conditions
                  </Text>
                </View>
                <Text style={styles.termsBodyText}>{TERMS_TEXT}</Text>
              </View>

              {/* Section 2: Privacy Policy (Directly on Same Page) */}
              <View style={{ marginTop: 12, paddingTop: 16, borderTopWidth: 2, borderTopColor: '#E5E7EB', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1.5, borderBottomColor: '#541D26', marginBottom: 12 }}>
                  <Shield size={18} color="#541D26" />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#541D26', fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold' }}>
                    2. Privacy Policy
                  </Text>
                </View>
                <Text style={styles.termsBodyText}>{PRIVACY_TEXT}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { width: '100%', marginTop: 12, backgroundColor: '#541D26' }]}
              onPress={() => {
                setAgreedToTerms(true);
                setShowPolicyModal(false);
                setShowTermsModal(false);
                setShowPrivacyModal(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneBtnText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Registration OTP Modal */}
      <Modal transparent animationType="slide" visible={showRegOtpModal} onRequestClose={() => setShowRegOtpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Mobile / Email</Text>
              <TouchableOpacity onPress={() => setShowRegOtpModal(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.successBox}>
              <Mail color="#16A34A" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.successText}>Registration OTP sent successfully!</Text>
            </View>

            <Text style={styles.forgotDesc}>
              Please enter the 6-digit OTP code sent to your registered email or mobile to verify your identity. (Use Dummy OTP: 123456)
            </Text>

            <Text style={styles.inputLabel}>Enter OTP *</Text>
            <View style={[styles.inputWrapper, { justifyContent: 'center' }]}>
              <TextInput
                style={[styles.input, { letterSpacing: 8, fontSize: 20, textAlign: 'center', fontWeight: '700' }]}
                placeholder="------"
                placeholderTextColor="#78716C"
                keyboardType="number-pad"
                maxLength={6}
                value={regOtp}
                onChangeText={setRegOtp}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { marginTop: 20 }]}
              onPress={handleVerifyAndRegister}
            >
              <Text style={styles.modalDoneBtnText}>Verify & Complete Registration</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              {regOtpTimer > 0 ? (
                <Text style={{ color: '#6B7280', fontSize: 13 }}>Resend in {regOtpTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleTriggerRegOtp}>
                  <Text style={{ color: '#541D26', fontSize: 13, fontWeight: '700' }}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Set Account Password Modal (Image 1) ─── */}
      <Modal
        transparent
        animationType="fade"
        visible={showSetPasswordModal}
        onRequestClose={handleSkipPasswordAfterOtp}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { padding: 24, borderRadius: 24, maxWidth: 400, width: '92%', alignItems: 'center' }]}>
            {/* Header Circle Icon */}
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#F5EBE6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <KeyRound size={32} color="#541D26" />
            </View>

            {/* Title & Subtitle */}
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 }}>
              Set Account Password?
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18, marginBottom: 20, paddingHorizontal: 4 }}>
              You logged in successfully via OTP. Would you like to set a password now so you can login faster next time?
            </Text>

            {setPasswordError ? (
              <View style={[styles.errorBox, { width: '100%', marginBottom: 12 }]}>
                <AlertTriangle color="#EF4444" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{setPasswordError}</Text>
              </View>
            ) : null}

            {/* New Password Field */}
            <View style={{ width: '100%', marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>New Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: '#F5EBE6', borderColor: '#EADCD5' }]}>
                <Lock color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password (min 6 chars)"
                  placeholderTextColor="#78716C"
                  secureTextEntry={!showSetPass1}
                  value={setPasswordNew}
                  onChangeText={setSetPasswordNew}
                />
                <TouchableOpacity onPress={() => setShowSetPass1(!showSetPass1)} style={{ padding: 4 }}>
                  {showSetPass1 ? <Eye color="#6B7280" size={18} /> : <EyeOff color="#6B7280" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View style={{ width: '100%', marginBottom: 24 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#1F2937', marginBottom: 6 }}>Confirm Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: '#F5EBE6', borderColor: '#EADCD5' }]}>
                <Lock color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#78716C"
                  secureTextEntry={!showSetPass2}
                  value={setPasswordConfirm}
                  onChangeText={setSetPasswordConfirm}
                />
                <TouchableOpacity onPress={() => setShowSetPass2(!showSetPass2)} style={{ padding: 4 }}>
                  {showSetPass2 ? <Eye color="#6B7280" size={18} /> : <EyeOff color="#6B7280" size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons (Skip for Now vs Save Password ->) */}
            <View style={{ flexDirection: 'row', width: '100%', gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={handleSkipPasswordAfterOtp}
                disabled={setPasswordLoading}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#374151' }}>Skip for Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1.2,
                  paddingVertical: 14,
                  borderRadius: 14,
                  backgroundColor: '#541D26',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
                onPress={handleSaveNewPasswordAfterOtp}
                disabled={setPasswordLoading}
                activeOpacity={0.9}
              >
                {setPasswordLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Save Password</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal transparent animationType="slide" visible={showForgotModal} onRequestClose={() => setShowForgotModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {forgotStep === 4 ? 'Password Updated' : 'Reset Password'}
              </Text>
              <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            {forgotError ? (
              <View style={styles.errorBox}>
                <AlertTriangle color="#EF4444" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{forgotError}</Text>
              </View>
            ) : null}

            {/* Step 1: Enter Mobile / Email & Send OTP */}
            {forgotStep === 1 ? (
              <View>
                <Text style={styles.forgotDesc}>
                  Enter your registered mobile number or email ID. We'll send a secure OTP code to verify your identity and reset your password.
                </Text>

                <Text style={styles.inputLabel}>Email Address or Phone Number *</Text>
                <View style={[styles.inputWrapper, (forgotError && !forgotEmail) ? styles.inputWrapperError : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile number or email id"
                    placeholderTextColor="#78716C"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType={/^\d+$/.test(forgotEmail) ? 'number-pad' : 'email-address'}
                    value={forgotEmail}
                    onChangeText={(text) => {
                      const val = text.trim();
                      if (/^\d*$/.test(val)) {
                        if (val.length <= 10) {
                          setForgotEmail(val);
                          setForgotError('');
                        }
                      } else {
                        setForgotEmail(val);
                        setForgotError('');
                      }
                    }}
                  />
                </View>
                {/^\d+$/.test(forgotEmail) && forgotEmail.length > 0 && !/^[6-9]/.test(forgotEmail) ? (
                  <Text style={styles.inputErrorText}>Mobile number must start with 6, 7, 8, or 9.</Text>
                ) : /^\d+$/.test(forgotEmail) && forgotEmail.length > 0 && forgotEmail.length < 10 ? (
                  <Text style={[styles.inputErrorText, { color: '#78716C' }]}>
                    Mobile number ({forgotEmail.length}/10 digits)
                  </Text>
                ) : (!/^\d+$/.test(forgotEmail) && forgotEmail.length > 0 && (!forgotEmail.includes('@') || !forgotEmail.includes('.'))) ? (
                  <Text style={styles.inputErrorText}>Please enter a valid email address (e.g. vendor@domain.com)</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.modalDoneBtn, forgotLoading && { opacity: 0.7 }]}
                  onPress={handleSendOtp}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalDoneBtnText}>Send Reset OTP</Text>
                  )}
                </TouchableOpacity>
              </View>

            ) : forgotStep === 2 ? (
              /* Step 2: Enter OTP */
              <View>
                <View style={styles.successBox}>
                  {forgotEmail.includes('@') ? (
                    <Mail color="#16A34A" size={16} style={{ marginRight: 8 }} />
                  ) : (
                    <Phone color="#16A34A" size={16} style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.successText}>
                    OTP sent to {forgotEmail.includes('@') ? forgotEmail : `+91 ${forgotEmail}`}
                  </Text>
                </View>

                <Text style={styles.forgotDesc}>
                  Enter the 6-digit OTP code sent to your {forgotEmail.includes('@') ? 'email address' : 'mobile number'} to verify your identity.
                </Text>

                <Text style={styles.inputLabel}>Enter OTP *</Text>
                <View style={[styles.inputWrapper, { justifyContent: 'center' }]}>
                  <TextInput
                    style={[styles.input, { letterSpacing: 8, fontSize: 20, textAlign: 'center', fontWeight: '700' }]}
                    placeholder="------"
                    placeholderTextColor="#78716C"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={forgotOtp}
                    onChangeText={setForgotOtp}
                  />
                </View>

                {/* Resend Link / Timer */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 14 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setForgotStep(1);
                      setForgotOtp('');
                      setForgotError('');
                    }}
                  >
                    <Text style={{ color: '#541D26', fontSize: 13, fontWeight: '600' }}>← Change Email/Mobile</Text>
                  </TouchableOpacity>

                  {forgotOtpResendTimer > 0 ? (
                    <Text style={{ color: '#6B7280', fontSize: 13 }}>Resend in {forgotOtpResendTimer}s</Text>
                  ) : (
                    <TouchableOpacity onPress={handleSendOtp}>
                      <Text style={{ color: '#541D26', fontSize: 13, fontWeight: '700' }}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, forgotLoading && { opacity: 0.7 }]}
                  onPress={handleVerifyOtp}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalDoneBtnText}>Verify OTP</Text>
                  )}
                </TouchableOpacity>
              </View>

            ) : forgotStep === 3 ? (
              /* Step 3: New Password */
              <View>
                <View style={styles.successBox}>
                  <UserCheck color="#16A34A" size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.successText}>OTP verified! Enter your new password below.</Text>
                </View>

                <Text style={styles.inputLabel}>New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Enter new password"
                    placeholderTextColor="#78716C"
                    secureTextEntry={!forgotShowPass}
                    autoCapitalize="none"
                    value={forgotNewPass}
                    onChangeText={setForgotNewPass}
                  />
                  <TouchableOpacity onPress={() => setForgotShowPass(!forgotShowPass)} style={styles.eyeIcon}>
                    {forgotShowPass ? <Eye color="#9CA3AF" size={18} /> : <EyeOff color="#9CA3AF" size={18} />}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Confirm new password"
                    placeholderTextColor="#78716C"
                    secureTextEntry={!forgotShowPass}
                    autoCapitalize="none"
                    value={forgotConfirmPass}
                    onChangeText={setForgotConfirmPass}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, forgotLoading && { opacity: 0.7 }]}
                  onPress={handleResetPasswordSubmit}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalDoneBtnText}>Update & Reset Password</Text>
                  )}
                </TouchableOpacity>
              </View>

            ) : (
              /* Step 4: Success */
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={styles.forgotSuccessBadge}>
                  <UserCheck size={28} color="#541D26" />
                </View>
                <Text style={styles.forgotSuccessTitle}>Password Updated!</Text>
                <Text style={styles.forgotSuccessDesc}>{forgotSuccess}</Text>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, { width: '100%', marginTop: 20 }]}
                  onPress={() => {
                    setEmail(forgotEmail);
                    setPassword(forgotNewPass);
                    setShowForgotModal(false);
                  }}
                >
                  <Text style={styles.modalDoneBtnText}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Login with OTP Modal ─── */}
      <Modal transparent animationType="slide" visible={showLoginOtpModal} onRequestClose={() => setShowLoginOtpModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 28 }]}>
            <View style={styles.modalHandleBar} />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 4 }}>
              <TouchableOpacity onPress={() => setShowLoginOtpModal(false)} style={styles.modalCloseBtn}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            {loginOtpModalError ? (
              <View style={[styles.errorBox, { marginBottom: 14 }]}>
                <AlertTriangle color="#EF4444" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{loginOtpModalError}</Text>
              </View>
            ) : null}

            {/* Email Address or Phone Number Header */}
            <Text style={styles.inputLabel}>Email Address or Phone Number *</Text>
            <View style={[styles.inputWrapper, { marginBottom: 14 }]}>
              {/^\d+$/.test(loginOtpModalPhone.trim()) && loginOtpModalPhone.trim().length > 0 ? (
                <Phone color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
              ) : loginOtpModalPhone.trim().includes('@') || /[a-zA-Z]/.test(loginOtpModalPhone.trim()) ? (
                <Mail color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
              ) : (
                <User color="#541D26" size={18} style={{ marginLeft: 4, marginRight: 8 }} />
              )}
              <TextInput
                style={styles.input}
                placeholder="Enter mobile number or email id"
                placeholderTextColor="#78716C"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={/^\d+$/.test(loginOtpModalPhone) ? 'number-pad' : 'email-address'}
                value={loginOtpModalPhone}
                onChangeText={(text) => {
                  setLoginOtpModalPhone(text);
                  setLoginOtpModalError('');
                }}
              />
            </View>

            {/* 6-Digit Verification Code Label + Use Password Instead link */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
              <Text style={[styles.inputLabel, { marginBottom: 0, paddingLeft: 0, fontSize: 13, fontWeight: '700' }]}>
                6–Digit Verification Code *
              </Text>
              <TouchableOpacity onPress={() => setShowLoginOtpModal(false)} activeOpacity={0.7}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#541D26', textDecorationLine: 'underline' }}>
                  Use Password Instead
                </Text>
              </TouchableOpacity>
            </View>

            {/* 6 OTP Boxes */}
            <View style={{ position: 'relative', marginVertical: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const digit = loginOtpModalCode[index] || '';
                  return (
                    <View
                      key={index}
                      style={{
                        width: 44,
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: digit ? '#541D26' : '#E5E7EB',
                        backgroundColor: digit ? '#FFF7F8' : '#FAF9F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 20, fontWeight: '700', color: '#541D26' }}>{digit}</Text>
                    </View>
                  );
                })}
              </View>

              <TextInput
                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }}
                keyboardType="number-pad"
                maxLength={6}
                value={loginOtpModalCode}
                onChangeText={(val) => setLoginOtpModalCode(val.replace(/[^0-9]/g, ''))}
              />
            </View>

            {/* Resend Link / Timer */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, marginBottom: 8 }}>
              {loginOtpModalTimer > 0 ? (
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#78716C' }}>Resend in {loginOtpModalTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={handleLoginOtpModalSend}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#541D26' }}>Resend OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Button: VERIFY OTP & LOG IN -> */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { marginTop: 12, backgroundColor: '#541D26', borderRadius: 28, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
                loginOtpModalLoading && { opacity: 0.7 }
              ]}
              onPress={handleLoginOtpModalVerify}
              disabled={loginOtpModalLoading}
              activeOpacity={0.9}
            >
              {loginOtpModalLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                    VERIFY OTP & LOG IN
                  </Text>
                  <ArrowRight size={18} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ─── Blocked Account Alert Modal ─── */}
      <Modal
        transparent
        animationType="fade"
        visible={Boolean(blockedModalData?.visible)}
        onRequestClose={() => {
          setBlockedModalData(null);
          if (onClearBlockedInfo) onClearBlockedInfo();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 22 }]}>
            {/* Red Shield Alert Badge */}
            <View style={styles.blockedBadgeCircle}>
              <AlertTriangle size={34} color="#DC2626" strokeWidth={2.5} />
            </View>

            <Text style={styles.blockedTitle}>
              {blockedModalData?.title || 'Account Blocked by Admin'}
            </Text>

            <Text style={styles.blockedDesc}>
              {blockedModalData?.message || 'Your vendor merchant account has been suspended or blocked by the platform administrator.'}
            </Text>

            {blockedModalData?.reason ? (
              <View style={styles.blockedReasonCard}>
                <Text style={styles.blockedReasonHeading}>Reason for Block:</Text>
                <Text style={styles.blockedReasonText}>{blockedModalData.reason}</Text>
              </View>
            ) : null}

            {/* Support Help Card */}
            <View style={styles.blockedSupportCard}>
              <Text style={styles.blockedSupportTitle}>Need assistance? Contact Support</Text>
              
              <TouchableOpacity
                style={styles.blockedSupportRow}
                onPress={() => Linking.openURL('mailto:products@zordial.com')}
                activeOpacity={0.7}
              >
                <Mail size={15} color="#541D26" style={{ marginRight: 8 }} />
                <Text style={styles.blockedSupportLink}>products@zordial.com</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.blockedSupportRow}
                onPress={() => Linking.openURL('tel:+919461353008')}
                activeOpacity={0.7}
              >
                <Phone size={15} color="#541D26" style={{ marginRight: 8 }} />
                <Text style={styles.blockedSupportLink}>+91 94613 53008</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalDoneBtn, { width: '100%', marginTop: 20, backgroundColor: '#DC2626' }]}
              onPress={() => {
                setBlockedModalData(null);
                if (onClearBlockedInfo) onClearBlockedInfo();
              }}
              activeOpacity={0.9}
            >
              <Text style={styles.modalDoneBtnText}>Dismiss & Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#F8F6F0',
    flexGrow: 1,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 16,
    marginBottom: 24,
  },
  headingSection: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  mainTitleCentered: {
    fontSize: 32,
    fontWeight: '800',
    color: '#541D26',
    letterSpacing: -0.6,
    marginBottom: 25,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  mainSubtitleCentered: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  loginFooterContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7DFD5',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#541D26',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  registerPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dontHaveText: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  registerLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#541D26',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  headerRowAligned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
  },
  backButtonInline: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  mainTitleRegisterInline: {
    flex: 1,
    fontSize: 23,
    fontWeight: '800',
    color: '#541D26',
    letterSpacing: -0.4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#541D26',
    letterSpacing: -0.6,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 0,
    paddingLeft: 2,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },

  /* Stepper Bar Styles */
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#541D26',
  },
  stepCircleInactive: {
    backgroundColor: '#F8F6F0',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepNumberInactive: {
    color: '#6B7280',
  },
  stepLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  stepLabelActive: {
    fontWeight: '700',
    color: '#541D26',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -16,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#541D26',
  },
  stepLineInactive: {
    backgroundColor: '#E7DFD5',
  },

  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#16A34A',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#211A19',
    marginBottom: 8,
    marginTop: 0,
    alignSelf: 'flex-start',
    paddingLeft: 4,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  inputWrapperError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  inputErrorText: {
    color: '#DC2626',
    fontSize: 11.5,
    marginTop: 3,
    marginBottom: 6,
    paddingLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  inputWrapperActive: {
    borderColor: '#541D26',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#541D26',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  countryCodeDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E7DFD5',
    marginRight: 10,
    marginLeft: 2,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#211A19',
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    color: '#211A19',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  categoryPlaceholderText: {
    flex: 1,
    fontSize: 14,
    color: '#78716C',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownItemActive: {
    backgroundColor: '#F7EEF0',
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#211A19',
    flex: 1,
  },
  dropdownSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCol: {
    flex: 1,
  },

  /* Shop Images Upload Card */
  uploadCard: {
    width: '100%',
    height: 84,
    borderRadius: 16,
    backgroundColor: '#F8F6F0',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  uploadPlusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211A19',
  },
  uploadSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  photoThumbWrapper: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Summary Card for Step 3 */
  successBadgeOuter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  successBadgeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confettiDot1: {
    position: 'absolute',
    top: 4,
    left: 12,
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#D97706',
    transform: [{ rotate: '45deg' }],
  },
  confettiDot2: {
    position: 'absolute',
    top: 10,
    right: 14,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#15803D',
  },
  confettiDot3: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#9CA3AF',
  },
  confettiDot4: {
    position: 'absolute',
    bottom: 12,
    right: 18,
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: '#D97706',
    transform: [{ rotate: '25deg' }],
  },
  regSuccessTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#541D26',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  regSuccessDesc: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  termsCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#541D26',
    backgroundColor: '#F8F6F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSquareChecked: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  termsCheckText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  termsCheckLink: {
    color: '#541D26',
    fontWeight: '700',
    textDecorationLine: 'underline',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  termsBodyText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#541D26',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    width: 110,
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  summaryVal: {
    flex: 1,
    fontSize: 13,
    color: '#211A19',
    fontWeight: '600',
  },

  eyeIcon: {
    padding: 6,
  },
  forgotPasswordRow: {
    alignSelf: 'flex-end',
    marginTop: 14,
    marginBottom: 0,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#541D26',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginTop: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
    paddingBottom: 24,
  },
  footerGrayText: {
    fontSize: 13.5,
    color: '#78716C',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  footerGreenLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#541D26',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },

  /* Forgot Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 13, 18, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 12,
    maxHeight: '80%',
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E7DFD5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  /* Society Selection Card Design */
  societyCardContainer: {
    width: '100%',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  societyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  societyHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  societyHeaderTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#211A19',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  requiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  requiredBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  unlistedButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  unlistedButtonText: {
    fontSize: 13,
    color: '#211A19',
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },

  /* Modal Header */
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#101828',
  },
  forgotDesc: {
    fontSize: 13.5,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalDoneBtn: {
    height: 48,
    backgroundColor: '#541D26',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  forgotSuccessBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F7EEF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  forgotSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#541D26',
    marginBottom: 6,
  },
  forgotSuccessDesc: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bizClassificationRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  bizClassCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    alignItems: 'center',
  },
  bizClassCardActive: {
    backgroundColor: '#F7EEF0',
    borderColor: '#541D26',
  },
  bizClassIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  bizClassIconBoxActive: {
    backgroundColor: '#541D26',
  },
  bizClassTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#211A19',
    textAlign: 'center',
    marginBottom: 2,
  },
  bizClassTitleActive: {
    color: '#541D26',
  },
  bizClassSub: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 13,
  },
  blockedBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  blockedDesc: {
    fontSize: 13.5,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  blockedReasonCard: {
    width: '100%',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  blockedReasonHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9F1239',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  blockedReasonText: {
    fontSize: 12.5,
    color: '#881337',
    fontWeight: '500',
  },
  blockedSupportCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
  },
  blockedSupportTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  blockedSupportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  blockedSupportLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#541D26',
    textDecorationLine: 'underline',
  },
  modalCloseBtn: {
    padding: 4,
  },
});
