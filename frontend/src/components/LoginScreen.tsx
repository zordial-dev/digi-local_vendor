import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
  Modal
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
  ArrowRight,
  Check,
  Plus,
  UserCircle2,
  X,
  FileText,
  Shield
} from 'lucide-react-native';
import { Colors, APP_LOGO_URL } from '../constants/theme';
import {
  loginVendorApi,
  registerVendorApi,
  fetchSocietiesApi,
  Society,
  VendorUser
} from '../services/apiService';
import { saveCredentials, getSavedCredentials } from '../services/authStorage';

interface LoginScreenProps {
  onLoginSuccess: (vendor: VendorUser) => void;
  isDarkMode?: boolean;
}

const TERMS_TEXT = `DigiLocal Vendor Terms & Conditions

Welcome to the DigiLocal Vendor Platform. By accessing or using our application, you agree to be bound by these Terms and Conditions.

1. Vendor Responsibilities
• You agree to provide accurate store details, phone numbers, and pricing for all listed items.
• You are responsible for accepting or declining orders in a timely manner.
• You must keep item availability (In Stock / Out of Stock) updated.

2. Order Fulfillment & Notifications
• Live order notifications require sound and notification permissions to alert you when a customer places an order.
• Orders accepted by your store must be prepared and delivered as per your society's delivery guidelines.

3. Subscription & Service Fees
• Vendor access is subject to an active DigiLocal platform subscription.
• Annual subscriptions can be renewed directly through the Settings screen.

4. Account Security
• You are responsible for keeping your login password confidential.
• Notify support immediately if you suspect unauthorized access to your account.

5. Termination
• DigiLocal reserves the right to suspend or terminate accounts that violate platform rules or engage in fraudulent activities.`;

const PRIVACY_TEXT = `DigiLocal Privacy Policy

DigiLocal is committed to protecting your privacy and business data.

1. Information We Collect
We collect store details, owner name, email address, phone number, GSTIN, and residential society name during registration.

2. How Information is Used
Your information is used strictly to:
• Display your store and menu to society residents.
• Send order notifications and platform alerts.
• Manage your vendor subscription and payments.

3. Data Security
All passwords and sensitive tokens are encrypted. We do not sell, rent, or share vendor personal data with third-party advertisers.

4. Your Rights
You can update your store profile details or request account deletion at any time via the app Settings screen.`;

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  isDarkMode = false,
}) => {
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration specific fields
  const [storeName, setStoreName] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [phone, setPhone] = useState('');
  const [gst, setGst] = useState('');
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [societyInputText, setSocietyInputText] = useState('');
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false);
  const [societies, setSocieties] = useState<Society[]>([]);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals for Terms and Privacy
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Load saved credentials & societies
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const socs = await fetchSocietiesApi();
        setSocieties(socs);
        if (socs.length > 0) {
          setSelectedSocietyId(socs[0].society_id);
          setSocietyInputText(socs[0].society_name);
        }

        const saved = await getSavedCredentials();
        if (saved && saved.email && saved.pass) {
          setEmail(saved.email);
          setPassword(saved.pass);
          // Try silent auto-login
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
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleLogin = async () => {
    setError('');
    setSuccessMsg('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginVendorApi(cleanEmail, cleanPassword);
      if (rememberMe) {
        await saveCredentials(cleanEmail, cleanPassword, res.vendor.vendor_id);
      }
      onLoginSuccess(res.vendor);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMsg('');

    const cleanSocietyText = societyInputText.trim();
    if (!selectedSocietyId && !cleanSocietyText) {
      setError('Please search or type your residential society name.');
      return;
    }
    if (!storeName.trim() || !vendorName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields (Store Name, Vendor Name, Email, Password).');
      return;
    }

    setLoading(true);
    try {
      const res = await registerVendorApi({
        society_id: selectedSocietyId || undefined,
        society_name: selectedSocietyId ? undefined : cleanSocietyText,
        store_name: storeName.trim(),
        vendor_name: vendorName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        phone_number: phone.trim(),
        gst_number: gst.trim()
      });

      setSuccessMsg('Registration successful! You can now log in.');
      if (rememberMe) {
        await saveCredentials(email.trim().toLowerCase(), password.trim(), res.vendor_id);
      }
      onLoginSuccess(res.vendor);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8F5EE' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8F5EE" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: APP_LOGO_URL }}
              style={{ width: 56, height: 56, borderRadius: 16 }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>
            {mode === 'login'
              ? 'Sign in to manage your store & orders'
              : 'Register your store on DigiLocal'}
          </Text>
        </View>

        {/* Refined Toggle: Sign In / Register */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, mode === 'login' && styles.toggleTabActive]}
            onPress={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
            activeOpacity={0.9}
          >
            <UserCircle2 size={14} color={mode === 'login' ? '#FFFFFF' : '#6B7C70'} style={{ marginRight: 4 }} />
            <Text
              style={[styles.toggleTabText, mode === 'login' && styles.toggleTabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Already Have a Store
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleTab, mode === 'register' && styles.toggleTabActive]}
            onPress={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
            activeOpacity={0.9}
          >
            <Store size={14} color={mode === 'register' ? '#FFFFFF' : '#6B7C70'} style={{ marginRight: 4 }} />
            <Text
              style={[styles.toggleTabText, mode === 'register' && styles.toggleTabTextActive]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Create My Store
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
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

          {mode === 'register' ? (
            <>
              {/* Searchable & Custom Society Selector */}
              <Text style={styles.inputLabel}>Residential Society / Neighborhood *</Text>
              <View style={{ position: 'relative', zIndex: 10, marginBottom: 8 }}>
                <View style={[styles.inputWrapper, selectedSocietyId ? styles.inputWrapperActive : undefined]}>
                  <Building color={selectedSocietyId ? '#18281F' : '#6B7C70'} size={18} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Type or select society (e.g. Greenwood Residency)"
                    placeholderTextColor="#9CA3AF"
                    value={societyInputText}
                    onFocus={() => setShowSocietyDropdown(true)}
                    onChangeText={(text) => {
                      setSocietyInputText(text);
                      const exact = societies.find(s => s.society_name.toLowerCase() === text.trim().toLowerCase());
                      if (exact) {
                        setSelectedSocietyId(exact.society_id);
                      } else {
                        setSelectedSocietyId(null);
                      }
                      setShowSocietyDropdown(true);
                    }}
                  />
                  {selectedSocietyId ? (
                    <View style={styles.checkBadge}>
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>

                {showSocietyDropdown ? (
                  <View style={styles.dropdownBox}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                      {societies
                        .filter(soc =>
                          soc.society_name.toLowerCase().includes(societyInputText.toLowerCase().trim()) ||
                          (soc.location && soc.location.toLowerCase().includes(societyInputText.toLowerCase().trim()))
                        )
                        .map(soc => (
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
                            <Building size={15} color="#1B2A4A" style={{ marginRight: 10 }} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.dropdownTitle}>{soc.society_name}</Text>
                              <Text style={styles.dropdownSub}>{soc.location}</Text>
                            </View>
                            {selectedSocietyId === soc.society_id ? <Check size={15} color="#1B2A4A" strokeWidth={3} /> : null}
                          </TouchableOpacity>
                        ))
                      }
                      {societyInputText.trim() !== '' && !societies.some(s => s.society_name.toLowerCase() === societyInputText.trim().toLowerCase()) ? (
                        <TouchableOpacity
                          style={[styles.dropdownItem, { borderTopWidth: 1, borderTopColor: '#F0EDE7' }]}
                          onPress={() => {
                            setSelectedSocietyId(null);
                            setShowSocietyDropdown(false);
                          }}
                        >
                          <Plus size={15} color="#10B981" style={{ marginRight: 10 }} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.dropdownTitle, { color: '#10B981' }]}>
                              Add "{societyInputText.trim()}" as new society
                            </Text>
                            <Text style={styles.dropdownSub}>Tap to register this society name</Text>
                          </View>
                        </TouchableOpacity>
                      ) : null}
                    </ScrollView>
                  </View>
                ) : null}
              </View>

              {/* Store Name */}
              <Text style={styles.inputLabel}>Store / Business Name *</Text>
              <View style={styles.inputWrapper}>
                <Store color="#9CA3AF" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Fresh Daily Groceries"
                  placeholderTextColor="#9CA3AF"
                  value={storeName}
                  onChangeText={setStoreName}
                />
              </View>

              {/* Vendor Owner Name */}
              <Text style={styles.inputLabel}>Vendor Owner Name *</Text>
              <View style={styles.inputWrapper}>
                <UserCheck color="#9CA3AF" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rajesh Sharma"
                  placeholderTextColor="#9CA3AF"
                  value={vendorName}
                  onChangeText={setVendorName}
                />
              </View>

              {/* Phone */}
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Phone color="#9CA3AF" size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="+91 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </>
          ) : null}

          {/* Email Address */}
          <Text style={styles.inputLabel}>Email Address *</Text>
          <View style={styles.inputWrapper}>
            <Mail color="#9CA3AF" size={18} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="vendor@digilocal.com"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <Text style={styles.inputLabel}>Password *</Text>
          <View style={styles.inputWrapper}>
            <Lock color="#9CA3AF" size={18} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingVertical: 0 }]}
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={showPassword ? 'none' : 'password'}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
              {showPassword ? <EyeOff color="#9CA3AF" size={18} /> : <Eye color="#9CA3AF" size={18} />}
            </TouchableOpacity>
          </View>

          {/* Remember Me Checkbox with crisp check tick icon */}
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe ? <Check size={14} color="#ffffff" strokeWidth={3} /> : null}
            </View>
            <Text style={styles.rememberText}>Remember me on this device</Text>
          </TouchableOpacity>

          {/* Terms & Conditions Agreement Line with Clickable Blue Words */}
          <View style={styles.termsRow}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowTermsModal(true)}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={styles.termsLink}
                onPress={() => setShowPrivacyModal(true)}
              >
                Privacy Policy
              </Text>.
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={mode === 'login' ? handleLogin : handleRegister}
            disabled={loading}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>
                  {mode === 'login' ? 'Access Vendor Panel' : 'Submit Store Registration'}
                </Text>
                <ArrowRight color="#ffffff" size={18} style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <ShieldCheck size={13} color="#9CA3AF" style={{ marginRight: 5 }} />
            <Text style={styles.footerText}>
              Connected to DigiLocal Secure Platform
            </Text>
          </View>
          <Text style={styles.versionText}>DigiLocal v1.0.0</Text>
        </View>

      </ScrollView>

      {/* Terms & Conditions Modal */}
      <Modal transparent animationType="slide" visible={showTermsModal} onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandleBar} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileText size={18} color="#1B2A4A" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Terms & Conditions</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTermsModal(false)}>
                <X size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.modalBodyText}>{TERMS_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.modalDoneBtnText}>I Agree & Understand</Text>
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
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={18} color="#1B2A4A" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Privacy Policy</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowPrivacyModal(false)}>
                <X size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              <Text style={styles.modalBodyText}>{PRIVACY_TEXT}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalDoneBtnText}>I Agree & Understand</Text>
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 20 : 60,
    paddingBottom: 60,
    alignItems: 'center',
    backgroundColor: '#F8F5EE',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4DCC9',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#18281F',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7C70',
    marginTop: 6,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#EFE8D8',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTabActive: {
    backgroundColor: '#18281F',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7C70',
  },
  toggleTabTextActive: {
    color: '#F8F5EE',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4DCC9',
    padding: 24,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
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
    borderRadius: 10,
    marginBottom: 16,
  },
  successText: {
    color: '#1E3A29',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18281F',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 7,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    backgroundColor: '#FAF8F3',
    marginBottom: 2,
  },
  inputWrapperActive: {
    borderColor: '#18281F',
    backgroundColor: '#E8F2EA',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#18281F',
    height: '100%',
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
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
  },
  dropdownSub: {
    fontSize: 11,
    color: '#6B7C70',
    marginTop: 1,
  },
  eyeIcon: {
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E4DCC9',
    backgroundColor: '#FAF8F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: '#18281F',
    borderColor: '#18281F',
  },
  rememberText: {
    fontSize: 13,
    color: '#18281F',
    fontWeight: '600',
  },
  // Terms & Conditions Line
  termsRow: {
    marginBottom: 20,
    paddingLeft: 2,
  },
  termsText: {
    fontSize: 12,
    color: '#6B7C70',
    lineHeight: 18,
  },
  termsLink: {
    color: '#C4A066',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  submitButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonText: {
    color: '#F8F5EE',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7C70',
    fontWeight: '500',
  },
  versionText: {
    fontSize: 12,
    color: '#18281F',
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  modalHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4DCC9',
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
    fontSize: 16,
    fontWeight: '800',
    color: '#18281F',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFE8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBodyText: {
    fontSize: 13,
    color: '#18281F',
    lineHeight: 22,
  },
  modalDoneBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  modalDoneBtnText: {
    color: '#F8F5EE',
    fontSize: 14,
    fontWeight: '700',
  },
});
