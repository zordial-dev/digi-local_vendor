import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  TextInput,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { CustomTimePicker } from './CustomTimePicker';
import {
  Store,
  Building,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  CreditCard,
  QrCode,
  BellRing,
  LogOut,
  Sliders,
  HelpCircle,
  Info,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  Lock,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Check,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../constants/theme';
import {
  VendorUser,
  VendorSubscription,
  VendorPayment,
  requestSubscriptionRenewalApi,
  updateStoreSettingsApi,
  getApiBaseUrl,
} from '../services/apiService';
import { playAlarmSound } from '../services/notificationService';
import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';
import { StoreDigitalCardModal } from './StoreDigitalCardModal';

interface SettingsScreenProps {
  vendor: VendorUser;
  subscription: VendorSubscription | null;
  payments: VendorPayment[];
  onLogout: () => void;
  onRefresh: () => Promise<void> | void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onTestAlarm?: () => void;
}

// ── FAQ Accordion Item ────────────────────────────────────────
const FAQItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity
      style={faqStyles.item}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.85}
    >
      <View style={faqStyles.itemHeader}>
        <Text style={faqStyles.question}>{question}</Text>
        {open ? <ChevronUp size={16} color="#18281F" /> : <ChevronDown size={16} color="#6B7C70" />}
      </View>
      {open ? <Text style={faqStyles.answer}>{answer}</Text> : null}
    </TouchableOpacity>
  );
};

const faqStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#E4DCC9',
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18281F',
    flex: 1,
    paddingRight: 8,
  },
  answer: {
    fontSize: 12,
    color: '#6B7C70',
    lineHeight: 18,
    marginTop: 8,
  },
});

// ── Document Modal ────────────────────────────────────────────
const DocumentModal: React.FC<{
  visible: boolean;
  title: string;
  content: string;
  onClose: () => void;
}> = ({ visible, title, content, onClose }) => (
  <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
    <View style={docStyles.overlay}>
      <View style={docStyles.sheet}>
        <View style={docStyles.handleBar} />
        <View style={docStyles.header}>
          <Text style={docStyles.title}>{title}</Text>
          <TouchableOpacity style={docStyles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={docStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={docStyles.body}>{content}</Text>
        </ScrollView>
        <TouchableOpacity style={docStyles.doneBtn} onPress={onClose} activeOpacity={0.9}>
          <Text style={docStyles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const docStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#F7F4EE',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4DCC9',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18281F',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4DCC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6B7C70',
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    color: '#6B7C70',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#34533C',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#F7F4EE',
    fontSize: 14,
    fontWeight: '700',
  },
});

// ── Privacy Policy & Terms Content ───────────────────────────
const PRIVACY_CONTENT = `DigiLocal Privacy Policy — Effective: July 2026

1. INFORMATION WE COLLECT
We collect information you provide during vendor registration, including name, store name, email, phone number, GST number, and society name. We also collect order data, menu items, and subscription details to operate the platform.

2. HOW WE USE YOUR DATA
Your data is used solely to provide and improve the DigiLocal Vendor Platform. We use it to:
• Process orders and send real-time notifications.
• Manage subscription plans and renewals.
• Display your storefront to residents of your registered society.

3. DATA SHARING
We do not sell your personal data to third parties. Data is shared only with essential service providers (e.g., push notification services) needed to operate the platform.

4. DATA SECURITY
All data is stored securely in encrypted databases. API communication uses HTTPS. Push tokens and credentials are stored in device-encrypted secure storage.

5. YOUR RIGHTS
You may request deletion of your vendor account and all associated data at any time by using the "Delete Account" option in Settings.

6. CONTACT
For any privacy-related queries, email us at: privacy@digilocal.in`;

const TERMS_CONTENT = `DigiLocal Terms & Conditions — Effective: July 2026

1. PLATFORM USE
DigiLocal Vendor App is exclusively for registered vendors within society communities. By registering, you agree to provide accurate information about your store and products.

2. ORDER MANAGEMENT
As a vendor, you are responsible for:
• Accepting or declining orders within a reasonable time.
• Ensuring item availability and accurate pricing.
• Maintaining up-to-date menu items and operating hours.

3. SUBSCRIPTION & BILLING
• Annual subscription fee: ₹2,999/year.
• Subscriptions must be renewed before the expiry date to maintain platform access.
• Renewal requests submitted through the app are processed by DigiLocal Admin within 24-48 hours.

4. PROHIBITED CONDUCT
Vendors may not:
• List illegal or regulated items.
• Provide false contact or pricing information.
• Misuse customer data shared during ordering.

5. TERMINATION
DigiLocal reserves the right to suspend or terminate vendor accounts that violate these terms.

6. CONTACT
For disputes or queries, email: support@digilocal.in`;

const ABOUT_CONTENT = `About DigiLocal — Empowering Local Commerce

🌟 OUR MISSION
DigiLocal connects local vendors with residents of residential societies, creating a seamless, sustainable, and instant local commerce ecosystem.

🏪 WHAT WE DO
We provide vendors with a powerful digital storefront, order management, and real-time notification system — right on their phone.

🛡️ OUR VALUES
• Sustainable: Supporting local businesses and reducing logistics emissions.
• Instant: Real-time orders with loud alert notifications.
• Powerful: Complete vendor management from catalog to revenue tracking.

👨‍💼 FOR VENDORS
Register once, manage your menu, receive live order alarms, track subscription, and share your digital store QR with society residents.

📬 CONTACT US
Email: hello@digilocal.in
Phone: +91 98765 43210
Website: www.digilocal.in

DigiLocal v1.0.0 — Made with ❤️ in India`;

// ── Password Modal ────────────────────────────────────────────
const PasswordModal: React.FC<{ visible: boolean; onClose: () => void; onSave: (cur: string, nw: string) => void }> = ({
  visible, onClose, onSave,
}) => {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = () => {
    if (!current || !newPw || !confirm) { setErr('All fields are required.'); return; }
    if (newPw !== confirm) { setErr('New passwords do not match.'); return; }
    if (newPw.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    setErr('');
    onSave(current, newPw);
    setCurrent(''); setNewPw(''); setConfirm('');
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={docStyles.overlay}>
        <View style={docStyles.sheet}>
          <View style={docStyles.handleBar} />
          <View style={docStyles.header}>
            <Text style={docStyles.title}>Password & Security</Text>
            <TouchableOpacity style={docStyles.closeBtn} onPress={onClose}><Text style={docStyles.closeBtnText}>✕</Text></TouchableOpacity>
          </View>
          {err ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <AlertTriangle size={14} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600', flex: 1 }}>{err}</Text>
            </View>
          ) : null}
          {[
            { label: 'Current Password', val: current, set: setCurrent, show: showCur, toggle: () => setShowCur(s => !s) },
            { label: 'New Password', val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(s => !s) },
            { label: 'Confirm New Password', val: confirm, set: setConfirm, show: showNew, toggle: () => setShowNew(s => !s) },
          ].map(({ label, val, set, show, toggle }) => (
            <View key={label} style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>{label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#F9FAFB' }}>
                <Lock size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: '#18281F', height: '100%' }}
                  secureTextEntry={!show}
                  value={val}
                  onChangeText={set}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity style={docStyles.doneBtn} onPress={handleSave} activeOpacity={0.9}>
            <Text style={docStyles.doneBtnText}>Update Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 }} onPress={onClose}>
            <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Help & Support Modal ──────────────────────────────────────
const HelpModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
    <View style={docStyles.overlay}>
      <View style={[docStyles.sheet, { maxHeight: '92%' }]}>
        <View style={docStyles.handleBar} />
        <View style={docStyles.header}>
          <Text style={docStyles.title}>Help & Support</Text>
          <TouchableOpacity style={docStyles.closeBtn} onPress={onClose}><Text style={docStyles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
            Frequently Asked Questions
          </Text>
          <FAQItem question="How do I receive live order alarms?" answer="When a resident places an order, the app automatically plays a loud alarm sound and shows a full-screen alert. Go to Settings → Sound & Notification Alert to test your alarm. Make sure your phone volume is on and DigiLocal has notification permissions." />
          <FAQItem question="How is total revenue calculated?" answer="Your total revenue is the sum of all completed order amounts. It is automatically updated in your dashboard as orders change status to COMPLETED." />
          <FAQItem question="How do I update my store timings?" answer="Go to Settings → Store Rules & Website Configurations → Operating Timings. Enter your opening and closing time (e.g. 08:00 AM and 10:00 PM) and tap SAVE STORE CONFIGURATION." />
          <FAQItem question="Why are my items showing as unavailable?" answer="Items can be toggled In Stock / Out of Stock from the Manage Menu tab. Tap the toggle next to any item to change its availability for residents." />
          <FAQItem question="How do I renew my subscription?" answer="Go to Settings → Subscription & Plan and tap Request Plan Renewal. Our team will process your renewal request within 24 hours." />
          <FAQItem question="What is the Digital Store QR Card?" answer="Your unique QR code links to your store's public ordering page. Share it with society residents so they can scan and place orders directly — no app download needed!" />

          <Text style={{ fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 20, marginBottom: 10 }}>
            Contact Support
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3FA', borderRadius: 12, padding: 14, marginBottom: 10 }}
            onPress={() => Linking.openURL('mailto:support@digilocal.in')}
            activeOpacity={0.85}
          >
            <Mail size={18} color="#18281F" style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#18281F' }}>Email Support</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>support@digilocal.in</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F3FA', borderRadius: 12, padding: 14, marginBottom: 24 }}
            onPress={() => Linking.openURL('tel:+919876543210')}
            activeOpacity={0.85}
          >
            <Phone size={18} color="#18281F" style={{ marginRight: 12 }} />
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#18281F' }}>Call Support</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>+91 98765 43210</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={docStyles.doneBtn} onPress={onClose} activeOpacity={0.9}>
          <Text style={docStyles.doneBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Helper to parse time string (e.g., "08:30 AM") to Date
const parseTimeString = (timeStr: string): Date => {
  const date = new Date();
  try {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      date.setHours(hours, minutes, 0, 0);
    }
  } catch (e) {
    console.error(e);
  }
  return date;
};

// Helper to format Date to "hh:mm AM/PM"
const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  const hoursStr = hours < 10 ? '0' + hours : hours;
  return `${hoursStr}:${minutesStr} ${ampm}`;
};

const pickerModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxHeight: 450,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#FAF8F3',
    backgroundColor: '#FAF8F3',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18281F',
    letterSpacing: 0.5,
  },
});

// ── Main SettingsScreen Component ────────────────────────────
export const SettingsScreenComponent: React.FC<SettingsScreenProps> = ({
  vendor,
  subscription,
  payments,
  onLogout,
  onRefresh,
  isDarkMode = false,
  onToggleDarkMode,
  onTestAlarm,
}) => {
  const theme = isDarkMode ? Colors.dark : Colors.light;

  const [renewing, setRenewing] = useState(false);

  // Custom Alert Popup State
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false, title: '', message: '', type: 'info'
  });

  // Modals
  const [showQR, setShowQR] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string, showCancel?: boolean) => {
    setAlertState({ visible: true, title, message, type, onConfirm, onCancel, confirmText, cancelText, showCancel });
  };

  // Store Config States
  const [phone, setPhone] = useState(vendor.phone_number || '');

  // Extract initial PAN and GST from vendor.gst_number
  const initialGstRaw = (vendor.gst_number || '').trim().toUpperCase();
  const initialPan = initialGstRaw.length === 10 ? initialGstRaw : (initialGstRaw.length === 15 ? initialGstRaw.substring(2, 12) : '');
  const initialGst = initialGstRaw.length === 15 ? initialGstRaw : '';

  const [panNum, setPanNum] = useState(initialPan);
  const [gstNum, setGstNum] = useState(initialGst);
  const [openTime, setOpenTime] = useState((vendor as any).opening_timing || vendor.opening_time || '08:00 AM');
  const [closeTime, setCloseTime] = useState((vendor as any).closing_timing || vendor.closing_time || '10:00 PM');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'open' | 'close' | null>(null);


  const [gstPercent, setGstPercent] = useState('5');
  const [serviceChargePercent, setServiceChargePercent] = useState('0');
  const [deliveryCharge, setDeliveryCharge] = useState('20');
  const [minOrderVal, setMinOrderVal] = useState('0');
  const [maxQtyLimit, setMaxQtyLimit] = useState('10');
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveStoreConfigs = async () => {
    if (openTime.trim() === closeTime.trim()) {
      showAlert('Invalid Timings', 'Opening time and closing time cannot be the same.', 'warning');
      return;
    }

    const cleanPhone = phone.trim();
    const cleanPan = panNum.trim().toUpperCase();
    const cleanGst = gstNum.trim().toUpperCase();

    if (cleanPhone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(cleanPhone)) {
        showAlert('Invalid Phone', 'Phone number must be a valid 10-digit number starting with 6, 7, 8, or 9.', 'warning');
        return;
      }
    }

    if (cleanPan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(cleanPan)) {
        showAlert('Invalid PAN', 'Please enter a valid 10-character PAN No. (e.g. ABCDE1234F).', 'warning');
        return;
      }
    }

    if (cleanGst) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(cleanGst)) {
        showAlert('Invalid GSTIN', 'Please enter a valid 15-character GST No. (e.g. 22AAAAA0000A1Z5).', 'warning');
        return;
      }
      if (cleanPan && cleanGst.substring(2, 12) !== cleanPan) {
        showAlert('PAN/GST Mismatch', 'The PAN number must match characters 3 to 12 of your GSTIN.', 'warning');
        return;
      }
    }

    const submittedGstNumber = cleanGst || cleanPan;

    setSavingSettings(true);
    try {
      await updateStoreSettingsApi(vendor.vendor_id, {
        store_name: vendor.store_name,
        phone_number: cleanPhone,
        gst_number: submittedGstNumber,
        opening_timing: openTime.trim(),
        closing_timing: closeTime.trim(),
        gst_percentage: parseFloat(gstPercent) || 0,
        service_charge_percentage: parseFloat(serviceChargePercent) || 0,
        delivery_charge: parseFloat(deliveryCharge) || 0,
        min_order_value: parseFloat(minOrderVal) || 0,
        max_quantity_limit: parseInt(maxQtyLimit) || 10,
      });
      showAlert('Settings Updated', 'Store configurations saved successfully!', 'success');
      await onRefresh();
    } catch (err: any) {
      showAlert('Update Failed', err.message || 'Failed to save store settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Subscription
  let daysRemaining = 0;
  let isExpired = true;
  if (subscription && subscription.end_date) {
    const end = new Date(subscription.end_date).getTime();
    const diff = end - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    isExpired = daysRemaining === 0 || subscription.status === 'EXPIRED';
  }

  const handleRequestRenewal = async () => {
    setRenewing(true);
    try {
      await requestSubscriptionRenewalApi(vendor.vendor_id);
      showAlert('Renewal Submitted', 'Subscription renewal request submitted to DigiLocal Admin!', 'success');
      await onRefresh();
    } catch (err: any) {
      showAlert('Request Failed', err.message || 'Failed to submit renewal request.', 'error');
    } finally {
      setRenewing(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to permanently delete your vendor account and all store data? This action cannot be undone.',
      'error',
      () => {
        showAlert('Deletion Requested', 'Your account deletion request has been submitted to DigiLocal Admin. You will be logged out now.', 'warning', onLogout);
      },
      undefined,
      'YES, DELETE',
      'NO, CANCEL',
      true
    );
  };

  const shopUrl = `${getApiBaseUrl().replace('/api', '')}/shop/${vendor.vendor_id}`;

  // Support & Legal 2x2 grid items
  const supportCards = [
    { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs & Contact', onPress: () => setShowHelp(true), color: '#34533C' },
    { icon: Info, label: 'About Us', sub: 'Our story & mission', onPress: () => setShowAbout(true), color: '#C4A066' },
    { icon: Shield, label: 'Privacy Policy', sub: 'Data safety', onPress: () => setShowPrivacy(true), color: '#059669' },
    { icon: FileText, label: 'Terms & Conditions', sub: 'Store & platform rules', onPress: () => setShowTerms(true), color: '#E6C35C' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#EDEDE4' }]} contentContainerStyle={styles.content}>

      {/* Store Header Card */}
      <View style={styles.card}>
        <View style={styles.storeHeader}>
          <TouchableOpacity
            style={styles.avatarBox}
            onPress={() => setShowQR(true)}
            activeOpacity={0.85}
          >
            <Store color="#ffffff" size={28} />
            <View style={styles.qrBadge}>
              <QrCode size={10} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.storeTitle}>{vendor.store_name}</Text>
            <Text style={styles.vendorName}>Owner: {vendor.vendor_name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: (vendor.status === 'APPROVED' || vendor.status === 'ACTIVE') ? 'rgba(24, 40, 31, 0.1)' : 'rgba(245, 158, 11, 0.1)' }]}>
                <Text style={{ color: (vendor.status === 'APPROVED' || vendor.status === 'ACTIVE') ? '#18281F' : '#D97706', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>
                  ACCOUNT {vendor.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Digital Card Button */}
        <TouchableOpacity style={styles.digitalCardBtn} onPress={() => setShowQR(true)} activeOpacity={0.88}>
          <QrCode size={15} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.digitalCardBtnText}>View Digital Store Card & QR</Text>
          <ExternalLink size={13} color="#18281F" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Subscription Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Calendar size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Subscription & Plan</Text>
        </View>

        <View style={styles.subDetailsRow}>
          <View style={styles.subCol}>
            <Text style={styles.subLabel}>Status</Text>
            <Text style={[styles.subValue, { color: isExpired ? '#EF4444' : '#18281F' }]}>
              {subscription?.status || (isExpired ? 'EXPIRED' : 'ACTIVE')}
            </Text>
          </View>
          <View style={styles.subCol}>
            <Text style={styles.subLabel}>Days Remaining</Text>
            <Text style={styles.subValue}>{daysRemaining} Days</Text>
          </View>
        </View>

        {subscription?.end_date ? (
          <Text style={styles.expiryText}>
            Expires on: {new Date(subscription.end_date).toLocaleDateString()}
          </Text>
        ) : null}

        <TouchableOpacity
          style={styles.renewBtn}
          onPress={handleRequestRenewal}
          disabled={renewing}
          activeOpacity={0.9}
        >
          {renewing ? <ActivityIndicator color="#ffffff" /> : (
            <>
              <CreditCard size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.renewBtnText}>Request Plan Renewal (₹2,999/yr)</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Business Profile Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Building size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Business Profile Details</Text>
        </View>

        {[
          { icon: Building, text: `Society: ${vendor.society_name || 'DigiLocal Society'}` },
          { icon: Phone, text: `Contact: ${vendor.phone_number || 'N/A'}` },
          { icon: Mail, text: `Email: ${vendor.email}` },
          { icon: ShieldCheck, text: `GST: ${vendor.gst_number || 'N/A'}` },
        ].map(({ icon: Icon, text }) => (
          <View key={text} style={styles.infoLine}>
            <Icon size={14} color="#9CA3AF" style={{ marginRight: 10 }} />
            <Text style={styles.infoLineText}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Store Rules & Website Configurations */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Sliders size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Store Rules & Configurations</Text>
        </View>

        <Text style={styles.sectionHeading}>1. Store Profile & Branding</Text>
        <Text style={styles.configLabel}>WhatsApp / Phone Number</Text>
        <TextInput
          style={[styles.configInput, { color: '#18281F' }]}
          value={phone}
          onChangeText={(t) => {
            const digitsOnly = t.replace(/[^0-9]/g, '');
            const validStart = digitsOnly.replace(/^[^6-9]+/, '');
            setPhone(validStart.slice(0, 10));
          }}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="e.g. 9876543210" placeholderTextColor="#9CA3AF"
        />
        <Text style={styles.configLabel}>PAN Number</Text>
        <TextInput
          style={[styles.configInput, { color: '#' }]}
          value={panNum}
          onChangeText={(t) => {
            const cleaned = t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
            let formatted = '';
            for (let i = 0; i < cleaned.length; i++) {
              const char = cleaned[i];
              if (i < 5) {
                if (/[A-Z]/.test(char)) formatted += char;
              } else if (i < 9) {
                if (/[0-9]/.test(char)) formatted += char;
              } else {
                if (/[A-Z]/.test(char)) formatted += char;
              }
            }
            setPanNum(formatted);
          }}
          autoCapitalize="characters"
          maxLength={10}
          placeholder="e.g. ABCDE1234F" placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.configLabel}>GSTIN Number (Optional)</Text>
        <TextInput
          style={[styles.configInput, { color: "#18281F", marginTop: 4 }]}
          value={gstNum}
          onChangeText={(t) => {
            const cleaned = t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
            setGstNum(cleaned);
            if (cleaned.length >= 12) {
              setPanNum(cleaned.substring(2, 12));
            }
          }}
          autoCapitalize="characters"
          maxLength={15}
          placeholder="e.g. 22AAAAA0000A1Z5" placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.sectionHeading}>2. Operating Timings</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>Opening Time</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setTimePickerTarget('open');
                setShowTimePicker(true);
              }}
              activeOpacity={0.8}
            >
              <Clock size={15} color="#18281F" style={{ marginRight: 8 }} />
              <Text style={styles.dropdownTriggerText}>{openTime || '08:00 AM'}</Text>
              <ChevronDown size={14} color="#04130aff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>Closing Time</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => {
                setTimePickerTarget('close');
                setShowTimePicker(true);
              }}
              activeOpacity={0.8}
            >
              <Clock size={15} color="#18281F" style={{ marginRight: 8 }} />
              <Text style={styles.dropdownTriggerText}>{closeTime || '10:00 PM'}</Text>
              <ChevronDown size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionHeading}>3. Taxes & Charges</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>GST Tax (%)</Text>
            <TextInput style={[styles.configInput, { color: '#18281F' }]} value={gstPercent} onChangeText={setGstPercent} keyboardType="numeric" placeholder="5.0" placeholderTextColor="#9CA3AF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>Service Charge (%)</Text>
            <TextInput style={[styles.configInput, { color: '#18281F' }]} value={serviceChargePercent} onChangeText={setServiceChargePercent} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#9CA3AF" />
          </View>
        </View>
        <Text style={styles.configLabel}>Delivery / Packaging Charge (₹)</Text>
        <TextInput style={[styles.configInput, { color: '#18281F' }]} value={deliveryCharge} onChangeText={setDeliveryCharge} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" />

        <Text style={styles.sectionHeading}>4. Order Restrictions & Limits</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>Min Order Value (₹)</Text>
            <TextInput style={[styles.configInput, { color: '#18281F' }]} value={minOrderVal} onChangeText={setMinOrderVal} keyboardType="numeric" placeholder="0" placeholderTextColor="#9CA3AF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.configLabel}>Max Item Qty Limit</Text>
            <TextInput style={[styles.configInput, { color: '#18281F' }]} value={maxQtyLimit} onChangeText={setMaxQtyLimit} keyboardType="numeric" placeholder="10" placeholderTextColor="#9CA3AF" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveConfigsBtn}
          onPress={handleSaveStoreConfigs}
          disabled={savingSettings}
          activeOpacity={0.9}
        >
          {savingSettings ? <ActivityIndicator color="#ffffff" /> : (
            <>
              <Check size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveConfigsBtnText}>SAVE STORE CONFIGURATION</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sound & Notification Alert */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <BellRing size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Sound & Notification Alert</Text>
        </View>
        <TouchableOpacity
          style={styles.testBtn}
          onPress={() => { if (onTestAlarm) { onTestAlarm(); } else { playAlarmSound(); } }}
          activeOpacity={0.9}
        >
          <BellRing size={15} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.testBtnText}>Test Order Alarm Sound</Text>
        </TouchableOpacity>
      </View>

      {/* Account & Security */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Account & Security</Text>
        </View>
        <TouchableOpacity style={styles.settingsRowItem} onPress={() => setShowPassword(true)} activeOpacity={0.85}>
          <Lock size={16} color="#18281F" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Password & Security</Text>
            <Text style={styles.settingsRowSub}>Change your account password</Text>
          </View>
          <ChevronDown size={15} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Support & Legal — 2x2 Grid */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <HelpCircle size={17} color="#18281F" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Support & Legal</Text>
        </View>
        <View style={styles.supportGrid}>
          {supportCards.map(({ icon: Icon, label, sub, onPress, color }) => (
            <TouchableOpacity key={label} style={styles.supportGridItem} onPress={onPress} activeOpacity={0.85}>
              <View style={[styles.supportIconBox, { backgroundColor: `${color}15` }]}>
                <Icon size={20} color={color} />
              </View>
              <Text style={styles.supportGridLabel}>{label}</Text>
              <Text style={styles.supportGridSub}>{sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Log Out Button */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => showAlert(
          'Log Out',
          'Are you sure you want to log out of your vendor account?',
          'warning',
          onLogout,
          undefined,
          'YES, LOG OUT',
          'CANCEL',
          true
        )}
        activeOpacity={0.9}
      >
        <LogOut size={17} color="#EF4444" style={{ marginRight: 10 }} />
        <Text style={styles.logoutBtnText}>Log Out Vendor Account</Text>
      </TouchableOpacity>

      {/* Delete Account */}
      <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
        <Trash2 size={14} color="#9CA3AF" style={{ marginRight: 6 }} />
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Version Footer */}
      <View style={styles.versionFooter}>
        <Text style={styles.versionText}>DigiLocal Vendor v1.0.0</Text>
        <Text style={styles.versionSub}>© 2026 DigiLocal. All rights reserved.</Text>
      </View>

      {/* ── Modals ── */}
      <StoreDigitalCardModal visible={showQR} vendor={vendor} onClose={() => setShowQR(false)} />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
      <DocumentModal visible={showAbout} title="About DigiLocal" content={ABOUT_CONTENT} onClose={() => setShowAbout(false)} />
      <DocumentModal visible={showPrivacy} title="Privacy Policy" content={PRIVACY_CONTENT} onClose={() => setShowPrivacy(false)} />
      <DocumentModal visible={showTerms} title="Terms & Conditions" content={TERMS_CONTENT} onClose={() => setShowTerms(false)} />
      <PasswordModal visible={showPassword} onClose={() => setShowPassword(false)} onSave={(cur, nw) => {
        showAlert('Password Updated', 'Your password has been changed successfully. Please log in again.', 'success');
      }} />

      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />

      <CustomTimePicker
        visible={showTimePicker}
        initialTime={timePickerTarget === 'open' ? openTime : closeTime}
        onClose={() => {
          setShowTimePicker(false);
          setTimePickerTarget(null);
        }}
        onSave={(time) => {
          if (timePickerTarget === 'open') {
            if (time.trim() === closeTime.trim()) {
              showAlert('Invalid Timings', 'Opening time and closing time cannot be the same.', 'warning');
              return;
            }
            setOpenTime(time);
          } else {
            if (time.trim() === openTime.trim()) {
              showAlert('Invalid Timings', 'Opening time and closing time cannot be the same.', 'warning');
              return;
            }
            setCloseTime(time);
          }
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4DCC9',
    padding: 18,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  storeHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    position: 'relative',
  },
  qrBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C4A066',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storeTitle: { fontSize: 17, fontWeight: '800', color: '#18281F' },
  vendorName: { fontSize: 12, color: '#6B7C70', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  digitalCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE8D8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  digitalCardBtnText: { fontSize: 13, fontWeight: '700', color: '#18281F' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#18281F' },
  subDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  subCol: { flex: 1 },
  subLabel: { fontSize: 10, fontWeight: '700', color: '#6B7C70', textTransform: 'uppercase', letterSpacing: 0.5 },
  subValue: { fontSize: 18, fontWeight: '900', color: '#18281F', marginTop: 2 },
  expiryText: { fontSize: 12, color: '#6B7C70', marginBottom: 12 },
  renewBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  renewBtnText: { color: '#F8F5EE', fontSize: 13, fontWeight: '700' },
  infoLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  infoLineText: { fontSize: 13, fontWeight: '500', color: '#18281F' },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7C70',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginTop: 14,
    marginBottom: 5,
    marginLeft: 2,
  },
  configLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7C70',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 2,
  },
  configInput: {
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    fontSize: 13,
    backgroundColor: '#FAF8F3',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FAF8F3',
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  saveConfigsBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#C4A066',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  saveConfigsBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  testBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBtnText: { color: '#F8F5EE', fontSize: 13, fontWeight: '700' },
  settingsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  settingsRowLabel: { fontSize: 13, fontWeight: '700', color: '#18281F' },
  settingsRowSub: { fontSize: 11, color: '#6B7C70', marginTop: 2 },
  // Support 2x2 grid
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  supportGridItem: {
    width: '47%',
    backgroundColor: '#FAF8F3',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  supportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportGridLabel: { fontSize: 12, fontWeight: '700', color: '#18281F' },
  supportGridSub: { fontSize: 10.5, color: '#6B7C70', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#B91C1C', fontSize: 14, fontWeight: '800' },
  deleteAccountBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: { fontSize: 13, color: '#6B7C70', fontWeight: '600' },
  versionFooter: { alignItems: 'center', paddingVertical: 10, paddingBottom: 0 },
  versionText: { fontSize: 13, fontWeight: '700', color: '#18281F' },
  versionSub: { fontSize: 11, color: '#6B7C70', marginTop: 3 },
});
