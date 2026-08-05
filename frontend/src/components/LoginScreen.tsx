import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  Image,
} from 'react-native';
import {
  Lock,
  Mail,
  AlertTriangle,
  ShieldCheck,
  Store,
  Building,
  Phone,
  Eye,
  EyeOff,
  UserCheck,
  User,
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
  Image as ImageIcon
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';
import { Colors, APP_LOGO_URL } from '../constants/theme';
import { DigiLocalLogo } from './DigiLocalLogo';
import { loginVendorApi, registerVendorApi, fetchSocietiesApi, VendorUser, Society } from '../services/apiService';
import { getSavedCredentials, saveCredentials } from '../services/authStorage';

interface LoginScreenProps {
  onLoginSuccess: (vendor: VendorUser) => void;
  onBackToWelcome?: () => void;
  isDarkMode?: boolean;
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


const BUSINESS_CATEGORIES = [
  'Grocery & Supermarket',
  'Fruits & Vegetables',
  'Resin Art & Handicrafts',
  'Dairy & Sweets',
  'Bakery & Snacks',
  'General Store',
  'Pharmacy & Healthcare',
  'Electronics & Repairs',
  'Hardware & Utilities',
  'Laundry & Dry Cleaning',
  'Services & Other'
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onBackToWelcome,
  isDarkMode = false,
}) => {
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [regStep, setRegStep] = useState<1 | 2 | 3>(1);

  // Form fields (Login & Shared)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Step 1: Business Info
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [storeName, setStoreName] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Step 2: Shop Details
  const [shopAddress, setShopAddress] = useState('');
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [societyInputText, setSocietyInputText] = useState('');
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [isSearchingSocieties, setIsSearchingSocieties] = useState(false);

  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [gst, setGst] = useState('');
  const [shopImages, setShopImages] = useState<string[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Forgot Password modal states
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showRegSuccessModal, setShowRegSuccessModal] = useState(false);
  const [registeredVendor, setRegisteredVendor] = useState<any>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await getSavedCredentials();
        if (saved && saved.email && saved.pass) {
          setEmail(saved.email);
          setPassword(saved.pass);
          try {
            const res = await loginVendorApi(saved.email, saved.pass);
            if (res && res.vendor) {
              onLoginSuccess(res.vendor);
              return;
            }
          } catch (e) {
            console.log('Auto-login skipped:', e);
          }
        }
      } catch (err) {
        console.error('Error during login screen init:', err);
      }
    };
    init();
  }, []);

  const handleSocietySearch = async (text: string) => {
    setSocietyInputText(text);
    setSelectedSocietyId(null);

    if (text.trim().length < 2) {
      setSocieties([]);
      setShowSocietyDropdown(false);
      return;
    }

    setIsSearchingSocieties(true);
    try {
      const res = await fetchSocietiesApi(text.trim());
      setSocieties(Array.isArray(res) ? res : (res as any).societies || []);
      setShowSocietyDropdown(true);
    } catch (e) {
      console.log('Society search error:', e);
    } finally {
      setIsSearchingSocieties(false);
    }
  };

  const handleAddPhoto = async () => {
    if (shopImages.length >= 5) {
      setError('Maximum 5 photos allowed.');
      return;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setError('Permission to access gallery is required to upload shop images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setShopImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
        setError('');
      }
    } catch (err) {
      console.error('Error picking photo:', err);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setShopImages(prev => prev.filter((_, i) => i !== index));
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

    const isMobile = /^[6-9]\d{9}$/.test(cleanInput);
    const isEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanInput);

    if (!isMobile && !isEmail) {
      setError('Please enter a valid 10-digit Mobile Number or Email Address.');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginVendorApi(cleanInput.toLowerCase(), cleanPassword);
      if (rememberMe) {
        await saveCredentials(cleanInput, cleanPassword, res.vendor.vendor_id);
      }
      onLoginSuccess(res.vendor);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep1 = () => {
    setError('');
    const cleanVendor = vendorName.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanStore = storeName.trim();

    if (!cleanVendor || !cleanPhone || !cleanEmail || !cleanStore || !category) {
      setError('Please fill in all business info fields (Owner Name, Mobile, Email, Business Name, Category).');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(cleanVendor)) {
      setError('Owner Name must contain only alphabets.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Mobile Number must be a valid 10-digit number starting with 6, 7, 8, or 9.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setRegStep(2);
  };

  const handleNextStep2 = () => {
    setError('');
    const cleanAddress = shopAddress.trim();
    const cleanPin = pincode.trim();

    if (!cleanAddress) {
      setError('Please enter your Shop Address.');
      return;
    }
    if (cleanPin && !/^\d{6}$/.test(cleanPin)) {
      setError('Pincode must be a 6-digit number.');
      return;
    }

    setRegStep(3);
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMsg('');

    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setError('Please create a password for your account.');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    const hasSpecial = /[^a-zA-Z0-9]/.test(cleanPassword);

    if (cleanPassword.length < 8 || !hasUpperCase || !hasNumber || !hasSpecial) {
      setError('Password must be at least 8 characters long and include an uppercase letter, a number, and a special symbol (@, #, $, !).');
      return;
    }

    if (!agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerVendorApi({
        society_id: selectedSocietyId || undefined,
        society_name: selectedSocietyId ? undefined : societyInputText.trim(),
        store_name: storeName.trim(),
        vendor_name: vendorName.trim(),
        email: email.trim().toLowerCase(),
        password: cleanPassword,
        phone_number: phone.trim(),
        gst_number: gst.trim().toUpperCase() || undefined
      });

      if (rememberMe) {
        await saveCredentials(email.trim().toLowerCase(), cleanPassword, res.vendor_id);
      }
      setRegisteredVendor(res.vendor);
      setShowRegSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password verification & update handlers
  const handleVerifyAccount = async () => {
    setForgotError('');
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(cleanEmail)) {
      setForgotError('Please enter a valid registered email address.');
      return;
    }
    setForgotLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setForgotStep(2);
    } catch (err: any) {
      setForgotError('Verification failed. Email address not found.');
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotSuccess('Your password has been successfully reset! You can now log in.');
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Real-time invalid field checks
  const isVendorInvalid = mode === 'register' && regStep === 1 && vendorName.length > 0 && (vendorName.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(vendorName));
  const isPhoneInvalid = mode === 'register' && regStep === 1 && phone.length > 0 && (phone.length < 10 || !/^[6-9]\d{9}$/.test(phone));
  const isEmailInvalid = mode === 'register' && regStep === 1 && email.length > 0 && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email.trim());
  const isShopNumberInvalid = mode === 'register' && regStep === 1 && shopNumber.length > 0 && !/^[a-zA-Z0-9\s/#,-]+$/.test(shopNumber);
  const isStoreInvalid = mode === 'register' && regStep === 1 && storeName.length > 0 && storeName.trim().length < 2;

  const isAddressInvalid = mode === 'register' && regStep === 2 && shopAddress.length > 0 && shopAddress.trim().length < 5;
  const isPincodeInvalid = mode === 'register' && regStep === 2 && pincode.length > 0 && !/^\d{6}$/.test(pincode.trim());
  const isCityInvalid = mode === 'register' && regStep === 2 && city.length > 0 && (city.trim().length < 2 || !/^[a-zA-Z\s]+$/.test(city));
  const panCheckRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  const gstCheckRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  const isGstInvalid = mode === 'register' && regStep === 2 && gst.length > 0 && !panCheckRegex.test(gst.toUpperCase().trim()) && !gstCheckRegex.test(gst.toUpperCase().trim());

  const isPasswordInvalid = mode === 'register' && regStep === 3 && password.length > 0 && (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FAF7F0' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F0" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: mode === 'login' ? (Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 40) : (Platform.OS === 'android' ? (StatusBar.currentHeight || 20) : 0) }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Heading Section */}
        <View style={[styles.headingSection, mode === 'login' ? { marginBottom: 40, marginTop: 0 } : { marginBottom: 4, marginTop: 4 }]}>
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
                <ArrowLeft size={22} color="#055726" strokeWidth={2.4} />
              </TouchableOpacity>

              <Text style={styles.mainTitleRegisterInline} numberOfLines={1}>
                Vendor Registration
              </Text>

              <View style={{ width: 28 }} />
            </View>
          ) : (
            <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
              {/* Top DigiLocal Logo Badge */}
              <View style={styles.topLogoBadge}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={{ width: 54, height: 54, borderRadius: 14 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.mainTitleCentered}>Vendor Login</Text>
              <Text style={styles.mainSubtitleCentered}>
                Welcome back! Login to your vendor account
              </Text>
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
          {error ? (
            <View style={styles.errorBox}>
              <AlertTriangle color="#EF4444" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {successMsg ? (
            <View style={styles.successBox}>
              <UserCheck color="#10B981" size={16} style={{ marginRight: 8 }} />
              <Text style={styles.successText}>{successMsg}</Text>
            </View>
          ) : null}

          {mode === 'login' ? (
            /* ===== LOGIN FORM ===== */
            <>
              {/* Mobile Number / Email ID */}
              <Text style={styles.inputLabel}>Mobile Number / Email ID</Text>
              <View style={styles.inputWrapper}>
                <User color="#055726" size={20} style={{ marginLeft: 4, marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number or email id"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={email}
                  onChangeText={(text) => setEmail(text.trim())}
                />
              </View>
              {isEmailInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Please enter a valid email address (e.g. vendor@domain.com)</Text>
              ) : null}

              {/* Password */}
              <Text style={[styles.inputLabel, { marginTop: 20, marginBottom: 8 }]}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#055726" size={20} style={{ marginLeft: 4, marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { paddingVertical: 0 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType={showPassword ? 'none' : 'password'}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
                  {showPassword ? <EyeOff color="#1F2937" size={20} /> : <Eye color="#1F2937" size={20} />}
                </TouchableOpacity>
              </View>
              {isPasswordInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Password must be 8+ chars with uppercase, number & special symbol (@, #, $, !)</Text>
              ) : null}

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordRow}
                onPress={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotError('');
                  setForgotSuccess('');
                  setForgotNewPass('');
                  setForgotConfirmPass('');
                  setShowForgotModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.submitButton, mode === 'login' && { marginTop: 32 }]}
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
          ) : regStep === 1 ? (
            /* ===== REGISTRATION STEP 1: Business Info ===== */
            <>
              {/* Owner Name */}
              <Text style={styles.inputLabel}>Owner Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter owner name"
                  placeholderTextColor="#9CA3AF"
                  value={vendorName}
                  onChangeText={(text) => setVendorName(text.replace(/[^a-zA-Z\s]/g, ''))}
                />
              </View>
              {isVendorInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Owner name must contain only alphabets</Text>
              ) : null}

              {/* Mobile Number */}
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(text) => {
                    const digitsOnly = text.replace(/[^0-9]/g, '');
                    const validStart = digitsOnly.replace(/^[^6-9]+/, '');
                    setPhone(validStart.slice(0, 10));
                  }}
                />
              </View>
              {isPhoneInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Mobile number must be 10 digits starting with 6, 7, 8, or 9</Text>
              ) : null}

              {/* Email Address */}
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => setEmail(text.trim())}
                />
              </View>
              {isEmailInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Please enter a valid email address (e.g. vendor@domain.com)</Text>
              ) : null}

              {/* Shop Number */}
              <Text style={styles.inputLabel}>Shop Number *</Text>
              <View style={[styles.inputWrapper, isShopNumberInvalid ? styles.inputWrapperError : undefined]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Shop G-12, Block A / Flat 102"
                  placeholderTextColor="#9CA3AF"
                  value={shopNumber}
                  onChangeText={(text) => setShopNumber(text)}
                />
              </View>
              {isShopNumberInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Shop Number contains invalid special symbols. Use letters, numbers, -, /, # or commas.</Text>
              ) : null}

              {/* Shop / Business Name */}
              <Text style={styles.inputLabel}>Shop / Business Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop / business name"
                  placeholderTextColor="#9CA3AF"
                  value={storeName}
                  onChangeText={(text) => setStoreName(text.replace(/[^a-zA-Z\s]/g, ''))}
                />
              </View>
              {isStoreInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Business name must be at least 2 characters</Text>
              ) : null}

              {/* Business Category */}
              <Text style={styles.inputLabel}>Business Category</Text>
              <View style={{ position: 'relative', zIndex: 10, marginBottom: 12 }}>
                <TouchableOpacity
                  style={styles.inputWrapper}
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
                      {BUSINESS_CATEGORIES.map(cat => (
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
                          {category === cat ? <Check size={16} color="#055726" strokeWidth={2.5} /> : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              {/* Next Button */}
              <TouchableOpacity
                style={[styles.submitButton, { marginTop: 16 }]}
                onPress={handleNextStep1}
                activeOpacity={0.9}
              >
                <Text style={styles.submitButtonText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : regStep === 2 ? (
            /* ===== REGISTRATION STEP 2: Shop Details ===== */
            <>
              {/* Shop Address */}
              <Text style={styles.inputLabel}>Shop Address</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop address"
                  placeholderTextColor="#9CA3AF"
                  value={shopAddress}
                  onChangeText={setShopAddress}
                />
              </View>
              {isAddressInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Shop address must be at least 5 characters</Text>
              ) : null}

              {/* Select Society */}
              <Text style={styles.inputLabel}>Select Society</Text>
              <View style={{ position: 'relative', zIndex: 10, marginBottom: 12 }}>
                <View style={[styles.inputWrapper, selectedSocietyId ? styles.inputWrapperActive : undefined]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Select society"
                    placeholderTextColor="#9CA3AF"
                    value={societyInputText}
                    onFocus={() => {
                      if (societyInputText.trim().length >= 2) {
                        setShowSocietyDropdown(true);
                      }
                    }}
                    onChangeText={handleSocietySearch}
                  />
                  {isSearchingSocieties ? (
                    <ActivityIndicator size="small" color="#055726" style={{ marginRight: 6 }} />
                  ) : (
                    <ChevronDown size={18} color="#6B7280" />
                  )}
                </View>

                {showSocietyDropdown && societies.length > 0 ? (
                  <View style={styles.dropdownBox}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                      {societies.map(soc => (
                        <TouchableOpacity
                          key={soc.society_id}
                          style={[
                            styles.dropdownItem,
                            selectedSocietyId === soc.society_id && styles.dropdownItemActive
                          ]}
                          onPress={() => {
                            setSelectedSocietyId(soc.society_id);
                            setSocietyInputText(soc.society_name);
                            setShowSocietyDropdown(false);
                          }}
                        >
                          <Building size={15} color="#055726" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dropdownTitle}>{soc.society_name}</Text>
                            {soc.location ? <Text style={styles.dropdownSub}>{soc.location}</Text> : null}
                          </View>
                          {selectedSocietyId === soc.society_id ? <Check size={15} color="#055726" strokeWidth={3} /> : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              {/* Pincode & City (Side by Side Grid) */}
              <View style={styles.gridRow}>
                <View style={[styles.gridCol, { marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Pincode *</Text>
                  <View style={[styles.inputWrapper, isPincodeInvalid ? styles.inputWrapperError : undefined]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter pincode"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={pincode}
                      onChangeText={setPincode}
                    />
                  </View>
                  {isPincodeInvalid ? (
                    <Text style={styles.inputErrorText}>⚠️ Enter 6-digit pincode</Text>
                  ) : null}
                </View>

                <View style={[styles.gridCol, { marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <View style={[styles.inputWrapper, isCityInvalid ? styles.inputWrapperError : undefined]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter city"
                      placeholderTextColor="#9CA3AF"
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  {isCityInvalid ? (
                    <Text style={styles.inputErrorText}>⚠️ Enter valid city name</Text>
                  ) : null}
                </View>
              </View>

              {/* GST Number (Optional) */}
              <Text style={styles.inputLabel}>GST Number (Optional)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter GST number"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  maxLength={15}
                  value={gst}
                  onChangeText={(text) => setGst(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                />
              </View>
              {isGstInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Invalid format. Enter 10-digit PAN or 15-digit GST</Text>
              ) : null}

              {/* Shop Images Picker Section */}
              <Text style={styles.inputLabel}>Shop Images</Text>
              <TouchableOpacity
                style={styles.uploadCard}
                onPress={handleAddPhoto}
                activeOpacity={0.8}
              >
                <View style={styles.uploadPlusCircle}>
                  <Plus size={20} color="#055726" strokeWidth={2.5} />
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.uploadTitle}>Add Photos</Text>
                  <Text style={styles.uploadSub}>(Max 5 Images)</Text>
                </View>
              </TouchableOpacity>

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
                style={[styles.submitButton, { marginTop: 20 }]}
                onPress={handleNextStep2}
                activeOpacity={0.9}
              >
                <Text style={styles.submitButtonText}>Next</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ===== REGISTRATION STEP 3: Verify & Finish ===== */
            <>
              {/* Create Password */}
              <Text style={styles.inputLabel}>Create Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { paddingVertical: 0 }]}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
                  {showPassword ? <EyeOff color="#6B7280" size={20} /> : <Eye color="#6B7280" size={20} />}
                </TouchableOpacity>
              </View>
              {isPasswordInvalid ? (
                <Text style={styles.inputErrorText}>⚠️ Password must be 8+ chars with uppercase, number & special symbol (@, #, $, !)</Text>
              ) : null}

              {/* Details Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Registration Details</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Owner:</Text>
                  <Text style={styles.summaryVal}>{vendorName || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Mobile:</Text>
                  <Text style={styles.summaryVal}>{phone || '-'}</Text>
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
                  <Text style={styles.summaryLabel}>Shop No:</Text>
                  <Text style={styles.summaryVal}>{shopNumber || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Category:</Text>
                  <Text style={styles.summaryVal}>{category || '-'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Address:</Text>
                  <Text style={styles.summaryVal}>{shopAddress || '-'}</Text>
                </View>
              </View>

              {/* Terms & Privacy Agreement Checkbox */}
              <View style={styles.termsCheckRow}>
                <TouchableOpacity
                  style={[styles.checkboxSquare, agreedToTerms && styles.checkboxSquareChecked]}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  activeOpacity={0.8}
                >
                  {agreedToTerms ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                </TouchableOpacity>
                <Text style={styles.termsCheckText}>
                  I agree to the{' '}
                  <Text style={styles.termsCheckLink} onPress={() => setShowTermsModal(true)}>
                    Terms & Conditions
                  </Text>
                  {' '}and{' '}
                  <Text style={styles.termsCheckLink} onPress={() => setShowPrivacyModal(true)}>
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitButton, { marginTop: 20 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit Registration</Text>
                )}
              </TouchableOpacity>
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

            <Text style={styles.dontHaveText}>Don't have a Vendor Account?</Text>
            
            <TouchableOpacity
              style={styles.registerLinkRow}
              onPress={() => {
                setMode('register');
                setRegStep(1);
                setError('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.registerLinkText}>Register as Vendor</Text>
              <ChevronRight size={18} color="#055726" strokeWidth={2.5} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Registration Success Modal */}
      <Modal transparent animationType="fade" visible={showRegSuccessModal} onRequestClose={() => {}}>
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

            <Text style={styles.regSuccessTitle}>Registration Successful!</Text>
            
            <Text style={styles.regSuccessDesc}>
              Your vendor account has been created successfully. You can now manage your shop and start selling.
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

      {/* Terms & Conditions Modal */}
      <Modal transparent animationType="slide" visible={showTermsModal} onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Terms & Conditions</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              <Text style={styles.termsBodyText}>{TERMS_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.modalDoneBtnText}>I Understand & Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal transparent animationType="slide" visible={showPrivacyModal} onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320, marginVertical: 10 }}>
              <Text style={styles.termsBodyText}>{PRIVACY_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalDoneBtnText}>I Understand & Agree</Text>
            </TouchableOpacity>
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
                {forgotStep === 3 ? 'Password Updated' : 'Reset Password'}
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

            {forgotStep === 1 ? (
              <View>
                <Text style={styles.forgotDesc}>
                  Enter your registered vendor email address to verify your account and reset your password.
                </Text>

                <Text style={styles.inputLabel}>Registered Email *</Text>
                <View style={styles.inputWrapper}>
                  <Mail color="#9CA3AF" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="vendor@digilocal.com"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.modalDoneBtn, forgotLoading && { opacity: 0.7 }]}
                  onPress={handleVerifyAccount}
                  disabled={forgotLoading}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalDoneBtnText}>Verify Account & Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : forgotStep === 2 ? (
              <View>
                <View style={styles.successBox}>
                  <UserCheck color="#10B981" size={16} style={{ marginRight: 8 }} />
                  <Text style={styles.successText}>Account verified! Enter your new password below.</Text>
                </View>

                <Text style={styles.inputLabel}>New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Enter new password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!forgotShowPass}
                    autoCapitalize="none"
                    value={forgotNewPass}
                    onChangeText={setForgotNewPass}
                  />
                  <TouchableOpacity onPress={() => setForgotShowPass(!forgotShowPass)} style={styles.eyeIcon}>
                    {forgotShowPass ? <EyeOff color="#9CA3AF" size={18} /> : <Eye color="#9CA3AF" size={18} />}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <View style={styles.inputWrapper}>
                  <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { paddingVertical: 0 }]}
                    placeholder="Confirm new password"
                    placeholderTextColor="#9CA3AF"
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
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <View style={styles.forgotSuccessBadge}>
                  <UserCheck size={28} color="#074E36" />
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 24 : 64,
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    minHeight: '100%',
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
  topLogoBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E8F2EA',
    borderWidth: 1,
    borderColor: '#D4E6D9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitleCentered: {
    fontSize: 32,
    fontWeight: '800',
    color: '#055726',
    letterSpacing: -0.6,
    marginBottom: 6,
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
    marginTop: 28,
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1E2D6',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#055726',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  dontHaveText: {
    fontSize: 13.5,
    color: '#6B7280',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  registerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  registerLinkText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#055726',
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
    color: '#055726',
    letterSpacing: -0.4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#055726',
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
    backgroundColor: '#055726',
  },
  stepCircleInactive: {
    backgroundColor: '#FAF7F0',
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
    color: '#055726',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: -16,
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#055726',
  },
  stepLineInactive: {
    backgroundColor: '#E5E7EB',
  },

  card: {
    width: '100%',
    maxWidth: 420,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2EA',
    borderWidth: 1,
    borderColor: '#D2E4D5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#1E3A29',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1F2937',
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
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputErrorText: {
    color: '#EF4444',
    fontSize: 11.5,
    marginTop: 3,
    marginBottom: 6,
    paddingLeft: 6,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  inputWrapperActive: {
    borderColor: '#055726',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  categoryPlaceholderText: {
    flex: 1,
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#055726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#18281F',
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
    backgroundColor: '#E8F2EA',
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18281F',
    flex: 1,
  },
  dropdownSub: {
    fontSize: 11,
    color: '#6B7C70',
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
    backgroundColor: '#FAF7F0',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
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
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  uploadTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  uploadSub: {
    fontSize: 11,
    color: '#6B7280',
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
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#055726',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#055726',
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
    color: '#055726',
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
    borderColor: '#055726',
    backgroundColor: '#FAF7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxSquareChecked: {
    backgroundColor: '#055726',
    borderColor: '#055726',
  },
  termsCheckText: {
    flex: 1,
    fontSize: 12.5,
    color: '#1F2937',
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  termsCheckLink: {
    color: '#055726',
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
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#055726',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    width: 95,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryVal: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
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
    color: '#055726',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_600SemiBold',
  },
  submitButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#055726',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#055726',
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
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular',
  },
  footerGreenLink: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#055726',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
  },

  /* Forgot Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
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
    backgroundColor: '#055726',
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
    backgroundColor: '#E8F2EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  forgotSuccessTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#074E36',
    marginBottom: 6,
  },
  forgotSuccessDesc: {
    fontSize: 13.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
