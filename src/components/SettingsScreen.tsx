import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Image,
  TextInput,
  Modal,
  Pressable,
  Linking,
  Platform,
  Switch,
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
  Camera,
  Upload,
  Image as ImageIcon,
  MapPin,
  Sparkles,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  LifeBuoy,
  Smartphone,
  Key,
  ChevronRight,
  User
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageFromDevice, captureImageFromDevice, PickedImageResult } from '../utils/imagePickerHelper';
import { Colors } from '../constants/theme';
import {
  VendorUser,
  VendorSubscription,
  VendorPayment,
  requestSubscriptionRenewalApi,
  updateStoreSettingsApi,
  deleteVendorAccountApi,
  getApiBaseUrl,
  uploadMediaApi,
  updateVendorProfileApi,
  uploadVendorLogoApi
} from '../services/apiService';
import { playAlarmSound } from '../services/notificationService';
import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';
import { StoreDigitalCardModal } from './StoreDigitalCardModal';
import { SupportTicketsModal } from './SupportTicketsModal';

interface SettingsScreenProps {
  vendor: VendorUser;
  subscription: VendorSubscription | null;
  payments: VendorPayment[];
  onLogout: () => void;
  onRefresh: () => Promise<void> | void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onTestAlarm?: () => void;
  onExploreVendors?: () => void;
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
        {open ? <ChevronUp size={16} color="#211A19" /> : <ChevronDown size={16} color="#78716C" />}
      </View>
      {open ? <Text style={faqStyles.answer}>{answer}</Text> : null}
    </TouchableOpacity>
  );
};

const faqStyles = StyleSheet.create({
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD5',
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
    color: '#211A19',
    flex: 1,
    paddingRight: 8,
  },
  answer: {
    fontSize: 12,
    color: '#78716C',
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
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E7DFD5',
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
    color: '#211A19',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7DFD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#78716C',
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    color: '#78716C',
    lineHeight: 22,
    marginBottom: 24,
  },
  doneBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: {
    color: '#FAF8F5',
    fontSize: 14,
    fontWeight: '700',
  },
});

// ── Privacy Policy & Terms Content ───────────────────────────
const PRIVACY_CONTENT = `DigiLocal Vendor Privacy Policy
Effective Date: 10/08/2026 | Last Updated: 18/08/2026
Operating Entity: Zordial Technologies Private Limited
Platform: DigiLocal Technologies (com.digilocal.vendor)

This Privacy Policy explains how Zordial Technologies Private Limited, operating the DigiLocal platform ("DigiLocal", "we", "us" or "our"), collects, uses, stores and protects information when you use the DigiLocal Vendor application (com.digilocal.vendor) and related services.

DigiLocal Vendor is a merchant platform that enables local shops and suppliers operating within or servicing residential societies and gated communities to manage their stores, products, orders, customers and payouts.

1. INFORMATION WE COLLECT
1.1 Vendor Personal Information: Full name, mobile number, email address, account credentials, OTP authentication information, profile information, and account verification records.
1.2 Business Information: Store name, shop address, business category, society name, society ID, store logo, product catalogue, product images, and operating information.
1.3 Government and Tax Information: GSTIN, PAN, and tax compliance information where applicable.
1.4 Banking and Payout Information: Account holder name, bank account number, IFSC code, UPI ID, payout records, and transaction references (used solely for processing T+1 vendor disbursements).

2. CUSTOMER INFORMATION ACCESSIBLE TO VENDORS
When a customer places an order, the vendor receives order fulfilment data (customer name, customer phone, tower/block, flat/unit number, delivery address, ordered items, quantity, order value, and order status).
VENDOR DATA-USE RESTRICTIONS:
Customer data is strictly for order fulfilment. Vendors must NOT copy, permanently store, sell, export, share, or misuse customer phone numbers for personal marketing or unsolicited communications. Misuse leads to immediate account termination and legal action.

3. DEVICE PERMISSIONS
• Notifications: New order alerts, order updates, payment notifications.
• Alarms / Background Alerts: High-priority audio chimes & full-screen alerts for incoming orders.
• Microphone: Voice-based search and speech-to-text processing (not stored permanently).
• Camera & Photos: Uploading store logos, product pictures, and banners.
• Technical: IP address, device ID, app version, FCM push tokens, and network diagnostic logs.

4. HOW WE USE INFORMATION
To authenticate accounts via OTP, manage catalogues, process customer orders, dispatch live alerts, compute commissions, process automated T+1 bank payouts, resolve disputes, prevent fraud, and comply with statutory regulations.

5. THIRD-PARTY PROVIDERS
• Firebase / Google (Phone Auth OTP, FCM push alerts, cloud services)
• SMS Gateways (MSG91 / Firebase)
• Banking & Payment Partners (settlement transfers)
• Cloud Infrastructure (AWS, Google Cloud, Render)

6. DATA SECURITY
We employ AES-256 encryption, access controls, secure HTTPS APIs, and role-based permissions.

7. DATA RETENTION & VENDOR RIGHTS
Data is retained as necessary for orders, payouts, fraud prevention, and statutory tax compliance. Vendors may request account closure or data correction by contacting support.

8. GRIEVANCE & PRIVACY CONTACT
• Email: products@zordial.com
• Helpline: +91 94613 53008
• Operating Entity: Zordial Technologies Private Limited
• Address: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India

9. GOVERNING LAW
This Privacy Policy is governed by the applicable laws of India.`;

const TERMS_CONTENT = `DigiLocal Vendor Terms & Conditions
Effective Date: 10/08/2026 | Last Updated: 18/08/2026
Operating Entity: Zordial Technologies Private Limited
Brand: DigiLocal Technologies (com.digilocal.vendor)

These Terms & Conditions ("Terms") govern your registration and use of the DigiLocal Vendor application and related services.
By registering as a vendor or using DigiLocal Vendor, you agree to these Terms.

1. VENDOR ELIGIBILITY
To register, you must be legally authorized to operate your business, authorized to sell within/service the registered society, provide accurate registration info, and comply with all applicable laws and society/RWA rules.

2. VENDOR ACCOUNT & SECURITY
You are responsible for keeping OTPs and login credentials confidential, preventing unauthorized access, and maintaining updated business profiles.

3. BUSINESS & STATUTORY INFORMATION
Vendors must provide accurate details (Store name, Shop address, GSTIN, PAN, Bank/IFSC info). False or fraudulent documentation leads to immediate account suspension or termination.

4. PRODUCT CATALOGUE & PRICING
Listings must clearly state product names, descriptions, selling prices, MRP, quantity, pack size, availability, and precise units of measurement (e.g. 1 kg, 500 g, 1 litre, 500 ml, 1 packet, 1 piece, 1 box).

5. PRODUCT QUALITY & PROHIBITED GOODS
Vendors must supply genuine, safe, non-expired products. Prohibited items: counterfeit items, adulterated food, illegal goods, narcotics, unauthorized medicines, or hazardous materials.

6. STOCK & INVENTORY
Vendors must promptly toggle products "In Stock" or "Out of Stock". Repeated acceptance of orders for unavailable products may result in account review or suspension.

7. ORDER PROCESSING & CANCELLATIONS
Orders progress through PENDING ➔ ACCEPTED ➔ PREPARING ➔ OUT FOR DELIVERY ➔ DELIVERED / COMPLETED. Vendors must respond to order alerts promptly. Repeated unwarranted cancellations lead to penalties or account suspension.

8. DELIVERY & SOCIETY RULES
Vendors and delivery personnel must strictly follow society/RWA gate-entry rules, visitor logs, delivery timings, parking regulations, and resident safety standards.

9. CUSTOMER INFORMATION CONFIDENTIALITY
Customer details are strictly confidential for order fulfillment only. Vendors must NOT use customer numbers for independent marketing, unsolicited messages, or unrelated commercial purposes.

10. PAYMENTS & T+1 PAYOUTS
Eligible completed orders are settled on a T+1 schedule (targeted for processing on the next applicable business day, subject to banking holidays). Payouts may be adjusted for platform fees, commissions, taxes, and dispute refunds.

11. REFUNDS & DISPUTES
Customer complaints regarding missing, damaged, expired, or defective products will be investigated. Where attributable to the vendor, refunds or deductions will apply.

12. INTELLECTUAL PROPERTY & INDEMNITY
DigiLocal branding and software are owned by Zordial Technologies Private Limited. Vendors indemnify DigiLocal against losses arising from unlawful products, data misuse, or rule violations.

13. TERMINATION & SUSPENSION
DigiLocal reserves the right to suspend or terminate accounts for fraud, customer data misuse, expired goods, or serious society violations.

14. GRIEVANCE & SUPPORT CONTACT
• Email: products@zordial.com
• Helpline: +91 94613 53008
• Operating Entity: Zordial Technologies Private Limited
• Address: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India

15. GOVERNING LAW & JURISDICTION
Governed by the laws of India. Disputes are subject to the exclusive jurisdiction of the courts of Jaipur, Rajasthan.`;

const ABOUT_CONTENT = `About DigiLocal
Powering Local Businesses Inside Communities

DigiLocal is a hyperlocal digital commerce platform built to connect local vendors with residents of residential societies and gated communities.
We believe that the neighbourhood shops people already trust should have access to simple, modern digital tools without having to build their own technology.
With DigiLocal Vendor, local merchants can manage their business digitally—from products and inventory to customer orders, deliveries and payouts.

CORE PLATFORM CAPABILITIES
• Create and manage digital store
• Add products and manage pricing
• Define product quantities and units (kg, litre, packet, piece, box)
• Update stock availability in real time
• Receive instant customer orders with prompt audio alerts
• Manage order status (Preparing, Out for Delivery, Delivered)
• Track sales and earnings with live analytics
• Receive automated T+1 payouts directly into bank accounts
• Serve customers within participating communities efficiently

BUILT FOR LOCAL COMMERCE
DigiLocal is designed specifically for the unique needs of residential societies, gated communities and local neighbourhood commerce. Instead of relying only on traditional offline ordering, vendors can use DigiLocal to create a convenient digital connection with residents while continuing to operate their local businesses.

OUR VISION
To make local commerce faster, simpler and more connected. We want residents to discover and order everyday essentials from trusted nearby businesses while giving local vendors the technology they need to grow digitally.

OUR COMMITMENT
• Local First: Supporting neighbourhood businesses & community commerce.
• Simple Technology: Easy-to-use digital tools for vendors.
• Reliable Service: Rapid response to orders & smooth fulfillment.
• Transparency: Clear breakdown of orders, commissions & payouts.
• Community Focus: Built for vendors, residents & housing societies.

OPERATING DETAILS
Zordial Technologies Private Limited
Brand: DigiLocal Technologies
Support: products@zordial.com
Helpline: +91 94613 53008
Address: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India

DigiLocal — Your Society. Your Vendor. Your Doorstep.`;

// ── Password Modal ────────────────────────────────────────────
const PasswordModal: React.FC<{ visible: boolean; onClose: () => void; onSave: (cur: string, nw: string) => void }> = ({
  visible, onClose, onSave,
}) => {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = () => {
    if (!current || !newPw || !confirm) { setErr('All fields are required.'); return; }
    if (current.trim() === newPw.trim()) { setErr('New password should be different from previous password.'); return; }
    if (newPw.trim() !== confirm.trim()) { setErr('New passwords do not match.'); return; }
    if (newPw.trim().length < 6) { setErr('New password must be at least 6 characters.'); return; }
    setErr('');
    onSave(current.trim(), newPw.trim());
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
            { label: 'Confirm New Password', val: confirm, set: setConfirm, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
          ].map(({ label, val, set, show, toggle }) => (
            <View key={label} style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>{label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E7DFD5', borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: '#FAF8F5' }}>
                <Lock size={16} color="#78716C" style={{ marginRight: 10 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, color: '#211A19', height: '100%' }}
                  secureTextEntry={!show}
                  value={val}
                  onChangeText={set}
                  placeholder="••••••••"
                  placeholderTextColor="#78716C"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={toggle} style={{ padding: 4 }} activeOpacity={0.7}>
                  {show ? <Eye size={18} color="#541D26" /> : <EyeOff size={18} color="#78716C" />}
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <TouchableOpacity style={docStyles.doneBtn} onPress={handleSave} activeOpacity={0.9}>
            <Text style={docStyles.doneBtnText}>Update Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 8 }} onPress={onClose}>
            <Text style={{ color: '#78716C', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ── Account & Security Modal ─────────────────────────────────
const AccountSecurityModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  vendor: VendorUser;
  onChangePassword: () => void;
  showAlert: (title: string, msg: string, type?: AlertType) => void;
}> = ({ visible, onClose, vendor, onChangePassword, showAlert }) => {
  const [sessionSuccess, setSessionSuccess] = useState(false);

  const handleLogoutOtherDevices = () => {
    setSessionSuccess(true);
    setTimeout(() => {
      setSessionSuccess(false);
      showAlert('Security Action Completed', 'Active sessions on other devices have been invalidated.', 'success');
    }, 600);
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={docStyles.overlay}>
        <View style={[docStyles.sheet, { maxHeight: '85%' }]}>
          <View style={docStyles.handleBar} />
          <View style={docStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#541D26" />
              <Text style={docStyles.title}>Account & Security</Text>
            </View>
            <TouchableOpacity style={docStyles.closeBtn} onPress={onClose}>
              <Text style={docStyles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Account Status Card */}
            <View style={{
              backgroundColor: '#F7EEF0',
              borderWidth: 1,
              borderColor: '#E7DFD5',
              borderRadius: 14,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#FAF8F5',
                borderWidth: 1,
                borderColor: '#E7DFD5',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <ShieldCheck size={22} color="#541D26" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#541D26' }}>Account Security: Protected</Text>
                <Text style={{ fontSize: 11, color: '#78716C', marginTop: 2 }}>
                  Your merchant store login credentials and session tokens are encrypted and secure.
                </Text>
              </View>
            </View>

            {/* Login Credentials Section */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              REGISTERED LOGIN CREDENTIALS
            </Text>

            <View style={{
              backgroundColor: '#FAF8F5',
              borderWidth: 1.5,
              borderColor: '#E7DFD5',
              borderRadius: 14,
              padding: 14,
              gap: 12,
              marginBottom: 16
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Smartphone size={16} color="#541D26" />
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#78716C', textTransform: 'uppercase' }}>Mobile Number</Text>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>{vendor.phone_number || 'Not Registered'}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#F7EEF0', borderWidth: 1, borderColor: '#E7DFD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#541D26' }}>VERIFIED</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E7DFD5' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color="#541D26" />
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#78716C', textTransform: 'uppercase' }}>Email Address</Text>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>{vendor.email || 'Not Registered'}</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: '#F7EEF0', borderWidth: 1, borderColor: '#E7DFD5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#541D26' }}>VERIFIED</Text>
                </View>
              </View>

              <View style={{ height: 1, backgroundColor: '#E7DFD5' }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <User size={16} color="#541D26" />
                  <View>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#78716C', textTransform: 'uppercase' }}>Store Representative</Text>
                    <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>{vendor.vendor_name || 'Store Owner'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Security Actions */}
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              SECURITY ACTIONS & CONTROLS
            </Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#541D26',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                onPress={() => {
                  onClose();
                  onChangePassword();
                }}
                activeOpacity={0.88}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Lock size={17} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Change Account Password</Text>
                </View>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FAF8F5',
                  borderWidth: 1.5,
                  borderColor: '#E7DFD5',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
                onPress={handleLogoutOtherDevices}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Key size={17} color="#541D26" />
                  <Text style={{ color: '#211A19', fontWeight: '700', fontSize: 13 }}>Invalidate Other Active Sessions</Text>
                </View>
                {sessionSuccess ? <ActivityIndicator color="#541D26" size="small" /> : <ChevronRight size={16} color="#78716C" />}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Help & Support Modal ──────────────────────────────────────
const HelpModal: React.FC<{ visible: boolean; onClose: () => void; onOpenTickets?: () => void }> = ({ visible, onClose, onOpenTickets }) => (
  <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
    <View style={docStyles.overlay}>
      <View style={[docStyles.sheet, { maxHeight: '94%' }]}>
        <View style={docStyles.handleBar} />
        <View style={docStyles.header}>
          <Text style={docStyles.title}>Help & Support</Text>
          <TouchableOpacity style={docStyles.closeBtn} onPress={onClose}><Text style={docStyles.closeBtnText}>✕</Text></TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Welcome Banner */}
          <View style={{ backgroundColor: '#F7EEF0', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#EEE5DA' }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#541D26', marginBottom: 4 }}>
              We're Here to Help
            </Text>
            <Text style={{ fontSize: 12.5, color: '#211A19', opacity: 0.85, lineHeight: 18 }}>
              Welcome to DigiLocal Vendor. If you need assistance with your account, orders, payments, products, or any other feature, our support team is here to help.
            </Text>
          </View>

          {/* Common Help Topics Header */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#541D26', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>
            Common Help Topics
          </Text>

          <FAQItem
            question="1. Account & Login"
            answer="• Trouble logging in or receiving an OTP&#10;• Updating your mobile number or email address&#10;• Account verification & store activation issues&#10;• Password or account-security concerns"
          />
          <FAQItem
            question="2. Store & Profile"
            answer="• Updating store information & description&#10;• Changing store category or society details&#10;• Uploading or changing your store logo&#10;• Updating business or GST information"
          />
          <FAQItem
            question="3. Products & Catalogue"
            answer="• Adding or editing products&#10;• Updating prices and stock status&#10;• Setting product units (kg, litre, packet, piece, etc.)&#10;• Uploading product images&#10;• Marking products as Out of Stock"
          />
          <FAQItem
            question="4. Orders"
            answer="• New order notifications & live audio alarms&#10;• Accepting or rejecting orders promptly&#10;• Updating order status (Preparing, Out for Delivery, Delivered)&#10;• Society entry & delivery-related issues&#10;• Cancelled or disputed orders"
          />
          <FAQItem
            question="5. Payments & Payouts"
            answer="• Checking live earnings & dashboard stats&#10;• Viewing payout history & transaction logs&#10;• Bank-account & IFSC verification&#10;• T+1 settlement queries & timeline&#10;• Commission or platform-fee queries"
          />
          <FAQItem
            question="6. Customer Issues"
            answer="If a customer reports a missing, incorrect, damaged, expired or defective product, please contact DigiLocal Support promptly and cooperate with the resolution process."
          />

          {/* Contact Support Section */}
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#541D26', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 10 }}>
            Contact DigiLocal Support
          </Text>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E7DFD5' }}
            onPress={() => Linking.openURL('mailto:products@zordial.com')}
            activeOpacity={0.85}
          >
            <Mail size={20} color="#541D26" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>Email Support</Text>
              <Text style={{ fontSize: 12, color: '#78716C', marginTop: 1 }}>products@zordial.com</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E7DFD5' }}
            onPress={() => Linking.openURL('tel:+919461353008')}
            activeOpacity={0.85}
          >
            <Phone size={20} color="#541D26" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>Helpline & Phone</Text>
              <Text style={{ fontSize: 12, color: '#78716C', marginTop: 1 }}>+91 94613 53008</Text>
            </View>
          </TouchableOpacity>

          {/* Raise a Ticket Option */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#E7DFD5' }}
            onPress={() => {
              onClose();
              if (onOpenTickets) onOpenTickets();
            }}
            activeOpacity={0.85}
          >
            <LifeBuoy size={20} color="#541D26" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#211A19' }}>Raise a Ticket</Text>
              <Text style={{ fontSize: 12, color: '#78716C', marginTop: 1 }}>Log complaints, billing queries & payout disputes</Text>
            </View>
            <ChevronDown size={16} color="#78716C" style={{ transform: [{ rotate: '-90deg' }] }} />
          </TouchableOpacity>

          {/* Operating Entity & Address Info */}
          <View style={{ backgroundColor: '#FAF8F5', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E7DFD5', marginBottom: 14 }}>
            <Text style={{ fontSize: 11.5, fontWeight: '800', color: '#541D26', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Operating Entity Details
            </Text>
            <Text style={{ fontSize: 12.5, color: '#211A19', fontWeight: '700' }}>
              Zordial Technologies Private Limited
            </Text>
            <Text style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>
              Platform: DigiLocal Technologies
            </Text>
            <Text style={{ fontSize: 12, color: '#78716C', marginTop: 2 }}>
              Address: Near Tonk Road, Pratap Nagar, Jaipur, Rajasthan, India
            </Text>
          </View>

          {/* When Contacting Support Guidelines */}
          <View style={{ backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#EEE5DA', marginBottom: 14 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#541D26', marginBottom: 6, letterSpacing: 0.2 }}>
              When Contacting Support
            </Text>
            <Text style={{ fontSize: 12.5, color: '#211A19', fontWeight: '600', lineHeight: 18 }}>
              Please provide the following whenever applicable:
            </Text>
            <Text style={{ fontSize: 12, color: '#78716C', marginTop: 6, lineHeight: 20 }}>
              • <Text style={{ color: '#211A19', fontWeight: '700' }}>Vendor / store name</Text>{'\n'}
              • <Text style={{ color: '#211A19', fontWeight: '700' }}>Registered mobile number</Text>{'\n'}
              • <Text style={{ color: '#211A19', fontWeight: '700' }}>Order ID & Society name</Text>{'\n'}
              • <Text style={{ color: '#211A19', fontWeight: '700' }}>Description of the issue</Text>{'\n'}
              • <Text style={{ color: '#211A19', fontWeight: '700' }}>Relevant screenshots or photographs</Text>
            </Text>
            <Text style={{ fontSize: 11.5, color: '#A88B58', fontStyle: 'italic', marginTop: 8, fontWeight: '600' }}>
              This helps us resolve your issue faster.
            </Text>
          </View>

          {/* Important Security Notice */}
          <View style={{ backgroundColor: '#F7EEF0', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#D6B7A5', marginBottom: 20 }}>
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#541D26', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Security Advisory
            </Text>
            <Text style={{ fontSize: 12, color: '#211A19', lineHeight: 18 }}>
              DigiLocal Support will never ask you to share your OTP, password, UPI PIN, ATM PIN or other confidential credentials. For security reasons, do not share sensitive information with anyone.
            </Text>
          </View>
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
    borderColor: '#E7DFD5',
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
    borderBottomColor: '#FAF8F5',
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#211A19',
    letterSpacing: 0.5,
  },
});

// ── Main SettingsScreen Component ────────────────────────────
export const SettingsScreenComponent: React.FC<SettingsScreenProps> = React.memo(({
  vendor,
  subscription,
  payments,
  onLogout,
  onRefresh,
  isDarkMode = false,
  onToggleDarkMode,
  onTestAlarm,
  onExploreVendors,
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
  const [showTickets, setShowTickets] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountSecurityModal, setShowAccountSecurityModal] = useState(false);
  const [showLogoPickerModal, setShowLogoPickerModal] = useState(false);

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


  const [businessType, setBusinessType] = useState<'PRODUCT' | 'SERVICE'>(vendor.business_type || 'PRODUCT');
  const [professionCategory, setProfessionCategory] = useState(vendor.profession_category || '');
  const [experienceYears, setExperienceYears] = useState(vendor.experience_years ? String(vendor.experience_years) : '');
  const [qualifications, setQualifications] = useState(vendor.qualifications || '');
  const [aboutBio, setAboutBio] = useState(vendor.about || vendor.description || '');
  const [startingPrice, setStartingPrice] = useState(vendor.starting_price ? String(vendor.starting_price) : '');
  const [workingDays, setWorkingDays] = useState(vendor.working_days || 'Mon – Sat');
  const [whatsappNumber, setWhatsappNumber] = useState(vendor.whatsapp_number || vendor.phone_number || '');

  const [gstPercent, setGstPercent] = useState(vendor.gst_percentage ? String(vendor.gst_percentage) : '');
  const [serviceChargePercent, setServiceChargePercent] = useState(vendor.service_charge_percentage ? String(vendor.service_charge_percentage) : '');
  const [deliveryCharge, setDeliveryCharge] = useState(vendor.delivery_charge ? String(vendor.delivery_charge) : '');
  const [minOrderVal, setMinOrderVal] = useState(vendor.min_order_value ? String(vendor.min_order_value) : '');
  const [maxQtyLimit, setMaxQtyLimit] = useState(vendor.max_quantity_limit ? String(vendor.max_quantity_limit) : '');
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
        business_type: businessType,
        profession_category: professionCategory.trim(),
        experience_years: experienceYears ? parseInt(experienceYears, 10) || 0 : undefined,
        qualifications: qualifications.trim(),
        about: aboutBio.trim(),
        starting_price: startingPrice ? parseFloat(startingPrice) || 0 : undefined,
        working_days: workingDays.trim(),
        whatsapp_number: whatsappNumber.trim(),
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
      showAlert('Settings Updated', 'Business configurations saved successfully!', 'success');
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
      `Are you sure you want to permanently delete your store "${vendor.store_name || 'Vendor Store'}" and all product data? This action is permanent and cannot be undone.`,
      'error',
      async () => {
        try {
          await deleteVendorAccountApi(vendor.vendor_id);
          showAlert(
            'Account Deleted',
            'Your vendor store account and all associated data have been permanently deleted.',
            'success',
            onLogout
          );
        } catch (err: any) {
          showAlert('Deletion Failed', err.message || 'Failed to delete vendor store account. Please try again or contact support.', 'error');
        }
      },
      undefined,
      'YES, DELETE',
      'NO, CANCEL',
      true
    );
  };

  const processAndUploadLogo = async (picked: PickedImageResult) => {
    if (!picked.uri) return;
    try {
      showAlert('Uploading Logo', 'Uploading and saving your store logo...', 'info');
      const fileName = picked.fileName || `store_logo_${Date.now()}.jpg`;
      const mimeType = picked.mimeType || 'image/jpeg';

      const uploadResult = await uploadVendorLogoApi(
        vendor.vendor_id,
        picked.base64 ? `data:${mimeType};base64,${picked.base64}` : picked.uri,
        fileName,
        mimeType
      );

      if (uploadResult.logo_url) {
        await onRefresh();
        showAlert('Logo Updated', 'Your custom store logo has been updated successfully!', 'success');
      }
    } catch (err: any) {
      showAlert('Upload Failed', err.message || 'Failed to upload store logo', 'error');
    }
  };

  const handlePickFromCamera = async () => {
    setShowLogoPickerModal(false);
    try {
      const captured = await captureImageFromDevice({
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (captured && captured.uri) {
        await processAndUploadLogo(captured);
      }
    } catch (err: any) {
      showAlert('Camera Error', err.message || 'Failed to capture photo', 'error');
    }
  };

  const handlePickFromGallery = async () => {
    setShowLogoPickerModal(false);
    try {
      const picked = await pickImageFromDevice({
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (picked && picked.uri) {
        await processAndUploadLogo(picked);
      }
    } catch (err: any) {
      showAlert('Gallery Error', err.message || 'Failed to pick image', 'error');
    }
  };

  const handleUploadStoreLogo = () => {
    setShowLogoPickerModal(true);
  };

  const shopUrl = `${getApiBaseUrl().replace('/api', '')}/shop/${vendor.vendor_id}`;

  // Support & Legal 2x2 grid items
  const supportCards = [
    { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs & Contact', onPress: () => setShowHelp(true), color: '#541D26' },
    { icon: Info, label: 'About Us', sub: 'Our story & mission', onPress: () => setShowAbout(true), color: '#C8A878' },
    { icon: Shield, label: 'Privacy Policy', sub: 'Data safety', onPress: () => setShowPrivacy(true), color: '#16A34A' },
    { icon: FileText, label: 'Terms & Conditions', sub: 'Store & platform rules', onPress: () => setShowTerms(true), color: '#C8A878' },
  ];

  const [refreshing, setRefreshing] = useState(false);
  const handlePullRefresh = async () => {
    setRefreshing(true);
    try {
      if (onRefresh) await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#F8F6F0' }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handlePullRefresh}
          colors={['#541D26']}
          tintColor="#541D26"
        />
      }
    >

      {/* Store Header Card */}
      <View style={styles.card}>
        <View style={styles.storeHeader}>
          {(() => {
            const storeLogoUri = (
              vendor.logo_url && vendor.logo_url !== vendor.shop_image && vendor.logo_url !== vendor.image_url ? vendor.logo_url :
              vendor.logo && vendor.logo !== vendor.shop_image && vendor.logo !== vendor.image_url ? vendor.logo :
              vendor.store_logo && vendor.store_logo !== vendor.shop_image && vendor.store_logo !== vendor.image_url ? vendor.store_logo :
              ''
            );
            return (
              <>
                <TouchableOpacity
                  style={styles.avatarBox}
                  onPress={handleUploadStoreLogo}
                  activeOpacity={0.85}
                >
                  {storeLogoUri ? (
                    <Image
                      source={{ uri: storeLogoUri }}
                      style={{ width: 56, height: 56, borderRadius: 16 }}
                    />
                  ) : (
                    <Store color="#ffffff" size={28} />
                  )}
                  <View style={styles.qrBadge}>
                    <Camera size={10} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeTitle}>{vendor.store_name}</Text>
                  <Text style={styles.vendorName}>Owner: {vendor.vendor_name}</Text>
                  <TouchableOpacity onPress={handleUploadStoreLogo} style={{ marginTop: 3 }}>
                    <Text style={{ fontSize: 11.5, color: '#541D26', fontWeight: '700' }}>
                      {storeLogoUri ? 'Change Store Logo' : '+ Add Store Logo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </View>

        {/* Digital Card Button */}
        <TouchableOpacity style={styles.digitalCardBtn} onPress={() => setShowQR(true)} activeOpacity={0.85}>
          <QrCode size={16} color="#541D26" style={{ marginRight: 10 }} />
          <Text style={styles.digitalCardBtnText}>View Digital Store Card & QR</Text>
          <ExternalLink size={14} color="#541D26" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>

      {/* Subscription Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Calendar size={17} color="#211A19" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Subscription & Plan</Text>
        </View>

        <View style={styles.subDetailsRow}>
          <View style={styles.subCol}>
            <Text style={styles.subLabel}>Status</Text>
            <Text style={[styles.subValue, { color: isExpired ? '#EF4444' : '#211A19' }]}>
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
          <Building size={17} color="#211A19" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Business Profile Details</Text>
        </View>

        {[
          { 
            icon: Building, 
            text: (() => {
              const locName = vendor.society_name || vendor.area || vendor.location || 'DigiLocal Area';
              return `Location: ${locName}`;
            })()
          },
          { icon: Store, text: `Shop Number: ${vendor.shop_number || (vendor as any).shop_no || 'N/A'}` },
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
          <Sliders size={17} color="#211A19" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Business Profile & Rules</Text>
        </View>

        {/* Business Type Selector (Product vs Service) */}
        <Text style={[styles.sectionHeading, { marginTop: 2, marginBottom: 6 }]}>1. Business Category Model</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, marginBottom: 12, width: '100%' }}>
          <TouchableOpacity
            style={[
              styles.bizTypeBtn,
              businessType === 'PRODUCT' && styles.bizTypeBtnActive,
            ]}
            onPress={() => setBusinessType('PRODUCT')}
            activeOpacity={0.8}
          >
            <Store size={15} color={businessType === 'PRODUCT' ? '#FFFFFF' : '#541D26'} />
            <Text style={[styles.bizTypeBtnText, businessType === 'PRODUCT' && styles.bizTypeBtnTextActive]} numberOfLines={1}>
              Product Merchant
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.bizTypeBtn,
              businessType === 'SERVICE' && styles.bizTypeBtnActive,
            ]}
            onPress={() => setBusinessType('SERVICE')}
            activeOpacity={0.8}
          >
            <Sparkles size={15} color={businessType === 'SERVICE' ? '#FFFFFF' : '#541D26'} />
            <Text style={[styles.bizTypeBtnText, businessType === 'SERVICE' && styles.bizTypeBtnTextActive]} numberOfLines={1}>
              Service Provider
            </Text>
          </TouchableOpacity>
        </View>

        {businessType === 'SERVICE' ? (
          <>
            <Text style={styles.sectionHeading}>2. Professional Credentials & Bio</Text>
            <Text style={styles.configLabel}>Profession / Specialization *</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19' }]}
              value={professionCategory}
              onChangeText={setProfessionCategory}
              placeholder="e.g. Physiotherapist, Electrician, Tuition Teacher, CA"
              placeholderTextColor="#78716C"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>Experience (Years)</Text>
                <TextInput
                  style={[styles.configInput, { color: '#211A19' }]}
                  value={experienceYears}
                  onChangeText={setExperienceYears}
                  keyboardType="numeric"
                  placeholder="e.g. 8"
                  placeholderTextColor="#78716C"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>Starting Fee (₹)</Text>
                <TextInput
                  style={[styles.configInput, { color: '#211A19' }]}
                  value={startingPrice}
                  onChangeText={setStartingPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 399"
                  placeholderTextColor="#78716C"
                />
              </View>
            </View>

            <Text style={styles.configLabel}>Qualifications & Certifications</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19' }]}
              value={qualifications}
              onChangeText={setQualifications}
              placeholder="e.g. MBBS, MD, Certified Yoga Coach, B.Tech"
              placeholderTextColor="#78716C"
            />

            <Text style={styles.configLabel}>Professional Bio / About Services</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19', height: 75, textAlignVertical: 'top' }]}
              value={aboutBio}
              onChangeText={setAboutBio}
              multiline
              numberOfLines={3}
              placeholder="Describe your expertise, experience, and service guarantees..."
              placeholderTextColor="#78716C"
            />

            <Text style={styles.configLabel}>Working Days</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19' }]}
              value={workingDays}
              onChangeText={setWorkingDays}
              placeholder="e.g. Mon – Sat (Sundays on appointment)"
              placeholderTextColor="#78716C"
            />

            <Text style={styles.configLabel}>WhatsApp Business Number</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19' }]}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit WhatsApp number"
              placeholderTextColor="#78716C"
            />
          </>
        ) : null}

        <Text style={styles.sectionHeading}>
          {businessType === 'SERVICE' ? '3. Contact & Statutory' : '2. Store Profile & Branding'}
        </Text>
        {businessType === 'PRODUCT' ? (
          <>
            <Text style={styles.configLabel}>Store / Business Description</Text>
            <TextInput
              style={[styles.configInput, { color: '#211A19', height: 75, textAlignVertical: 'top' }]}
              value={aboutBio}
              onChangeText={setAboutBio}
              multiline
              numberOfLines={3}
              placeholder="Describe your store, products, specialties, and quality guarantees..."
              placeholderTextColor="#78716C"
            />
          </>
        ) : null}
        <Text style={styles.configLabel}>Primary Contact Phone Number</Text>
        <TextInput
          style={[styles.configInput, { color: '#211A19' }]}
          value={phone}
          onChangeText={(t) => {
            const digitsOnly = t.replace(/[^0-9]/g, '');
            const validStart = digitsOnly.replace(/^[^6-9]+/, '');
            setPhone(validStart.slice(0, 10));
          }}
          keyboardType="number-pad"
          maxLength={10}
          placeholder="e.g. 9876543210" placeholderTextColor="#78716C"
        />
        <Text style={styles.configLabel}>PAN Number</Text>
        <TextInput
          style={[styles.configInput, { color: '#211A19' }]}
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
          placeholder="e.g. ABCDE1234F" placeholderTextColor="#78716C"
        />

        <Text style={styles.configLabel}>GSTIN Number (Optional)</Text>
        <TextInput
          style={[styles.configInput, { color: "#211A19", marginTop: 4 }]}
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
          placeholder="e.g. 22AAAAA0000A1Z5" placeholderTextColor="#78716C"
        />

        <Text style={styles.sectionHeading}>
          {businessType === 'SERVICE' ? '4. Operating Hours' : '3. Operating Timings'}
        </Text>
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
              <Clock size={15} color="#211A19" style={{ marginRight: 8 }} />
              <Text style={styles.dropdownTriggerText}>{openTime || '08:00 AM'}</Text>
              <ChevronDown size={14} color="#211A19" />
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
              <Clock size={15} color="#211A19" style={{ marginRight: 8 }} />
              <Text style={styles.dropdownTriggerText}>{closeTime || '10:00 PM'}</Text>
              <ChevronDown size={14} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {businessType === 'PRODUCT' ? (
          <>
            <Text style={styles.sectionHeading}>4. Taxes & Charges</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>GST Tax (%)</Text>
                <TextInput style={[styles.configInput, { color: '#211A19' }]} value={gstPercent} onChangeText={setGstPercent} keyboardType="numeric" placeholder="5.0" placeholderTextColor="#78716C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>Service Charge (%)</Text>
                <TextInput style={[styles.configInput, { color: '#211A19' }]} value={serviceChargePercent} onChangeText={setServiceChargePercent} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#78716C" />
              </View>
            </View>
            <Text style={styles.configLabel}>Delivery / Packaging Charge (₹)</Text>
            <TextInput style={[styles.configInput, { color: '#211A19' }]} value={deliveryCharge} onChangeText={setDeliveryCharge} keyboardType="numeric" placeholder="0" placeholderTextColor="#78716C" />

            <Text style={styles.sectionHeading}>5. Order Restrictions & Limits</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>Min Order Value (₹)</Text>
                <TextInput style={[styles.configInput, { color: '#211A19' }]} value={minOrderVal} onChangeText={setMinOrderVal} keyboardType="numeric" placeholder="0" placeholderTextColor="#78716C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configLabel}>Max Item Qty Limit</Text>
                <TextInput style={[styles.configInput, { color: '#211A19' }]} value={maxQtyLimit} onChangeText={setMaxQtyLimit} keyboardType="numeric" placeholder="10" placeholderTextColor="#78716C" />
              </View>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.saveConfigsBtn}
          onPress={handleSaveStoreConfigs}
          disabled={savingSettings}
          activeOpacity={0.9}
        >
          {savingSettings ? <ActivityIndicator color="#ffffff" /> : (
            <>
              <Check size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveConfigsBtnText}>
                {businessType === 'SERVICE' ? 'SAVE SERVICE PROFILE' : 'SAVE STORE CONFIGURATION'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sound & Notification Alert */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <BellRing size={17} color="#211A19" style={{ marginRight: 8 }} />
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
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => setShowAccountSecurityModal(true)} 
          activeOpacity={0.7}
        >
          <ShieldCheck size={17} color="#211A19" style={{ marginRight: 8 }} />
          <Text style={styles.cardTitle}>Account & Security</Text>
          <ChevronRight size={16} color="#78716C" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        {/* Row 1: Account Security Overview */}
        <TouchableOpacity 
          style={styles.settingsRowItem} 
          onPress={() => setShowAccountSecurityModal(true)} 
          activeOpacity={0.85}
        >
          <ShieldCheck size={16} color="#541D26" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Account & Security Overview</Text>
            <Text style={styles.settingsRowSub}>View registered login credentials, 2FA & active sessions</Text>
          </View>
          <ChevronDown size={15} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
        </TouchableOpacity>

        {/* Row 2: Password & Security */}
        <TouchableOpacity 
          style={[styles.settingsRowItem, { borderTopWidth: 1, borderTopColor: '#E7DFD5' }]} 
          onPress={() => setShowPassword(true)} 
          activeOpacity={0.85}
        >
          <Lock size={16} color="#541D26" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Password & Security</Text>
            <Text style={styles.settingsRowSub}>Change your account login password</Text>
          </View>
          <ChevronDown size={15} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
        </TouchableOpacity>
      </View>

      {/* Support & Legal — 2x2 Grid */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <HelpCircle size={17} color="#211A19" style={{ marginRight: 8 }} />
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
      <StoreDigitalCardModal
        visible={showQR}
        vendor={vendor}
        onClose={() => setShowQR(false)}
        onExploreVendors={onExploreVendors}
      />
      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} onOpenTickets={() => setShowTickets(true)} />
      <SupportTicketsModal visible={showTickets} onClose={() => setShowTickets(false)} vendor={vendor} />
      <DocumentModal visible={showAbout} title="About DigiLocal" content={ABOUT_CONTENT} onClose={() => setShowAbout(false)} />
      <DocumentModal visible={showPrivacy} title="Privacy Policy" content={PRIVACY_CONTENT} onClose={() => setShowPrivacy(false)} />
      <DocumentModal visible={showTerms} title="Terms & Conditions" content={TERMS_CONTENT} onClose={() => setShowTerms(false)} />
      <AccountSecurityModal
        visible={showAccountSecurityModal}
        onClose={() => setShowAccountSecurityModal(false)}
        vendor={vendor}
        onChangePassword={() => setShowPassword(true)}
        showAlert={showAlert}
      />
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

      {/* Logo Picker Source Selection Modal */}
      <Modal
        visible={showLogoPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoPickerModal(false)}
      >
        <Pressable
          style={styles.logoModalBackdrop}
          onPress={() => setShowLogoPickerModal(false)}
        >
          <View style={styles.logoModalCard}>
            <Text style={styles.logoModalTitle}>Select Store Logo</Text>
            <Text style={styles.logoModalSubtitle}>Choose how you want to add or update your shop logo</Text>

            <TouchableOpacity
              style={styles.logoModalOptionBtn}
              onPress={handlePickFromCamera}
              activeOpacity={0.8}
            >
              <Camera size={20} color="#541D26" style={{ marginRight: 12 }} />
              <Text style={styles.logoModalOptionText}>Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoModalOptionBtn}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
            >
              <ImageIcon size={20} color="#541D26" style={{ marginRight: 12 }} />
              <Text style={styles.logoModalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoModalCancelBtn}
              onPress={() => setShowLogoPickerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.logoModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60, gap: 14 },
  logoModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  logoModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#211A19',
    marginBottom: 4,
    textAlign: 'center',
  },
  logoModalSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginBottom: 18,
    textAlign: 'center',
  },
  logoModalOptionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    marginBottom: 10,
  },
  logoModalOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#211A19',
  },
  logoModalCancelBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  logoModalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    padding: 18,
    shadowColor: '#211A19',
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
    backgroundColor: '#541D26',
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
    backgroundColor: '#C8A878',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storeTitle: { fontSize: 17, fontWeight: '800', color: '#211A19' },
  vendorName: { fontSize: 12, color: '#78716C', marginTop: 2 },
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
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
  },
  digitalCardBtnText: { fontSize: 13.5, fontWeight: '700', color: '#211A19' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#211A19' },
  subDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  subCol: { flex: 1 },
  subLabel: { fontSize: 10, fontWeight: '700', color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.5 },
  subValue: { fontSize: 18, fontWeight: '900', color: '#211A19', marginTop: 2 },
  expiryText: { fontSize: 12, color: '#78716C', marginBottom: 12 },
  renewBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  renewBtnText: { color: '#FAF8F5', fontSize: 13, fontWeight: '700' },
  infoLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7 },
  infoLineText: { fontSize: 13, fontWeight: '500', color: '#211A19' },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
    marginTop: 14,
    marginBottom: 5,
    marginLeft: 2,
  },
  configLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 6,
    marginBottom: 4,
    marginLeft: 2,
  },
  configInput: {
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    fontSize: 13,
    backgroundColor: '#FAF8F5',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 11,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FAF8F5',
  },
  dropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    color: '#211A19',
    fontWeight: '600',
  },
  saveConfigsBtn: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  saveConfigsBtnText: { color: '#FAF8F5', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  testBtn: {
    flexDirection: 'row',
    height: 44,
    borderRadius: 12,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testBtnText: { color: '#FAF8F5', fontSize: 13, fontWeight: '700' },
  settingsRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  settingsRowLabel: { fontSize: 13, fontWeight: '700', color: '#211A19' },
  settingsRowSub: { fontSize: 11, color: '#78716C', marginTop: 2 },
  // Support 2x2 grid
  supportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  supportGridItem: {
    width: '47%',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  supportIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportGridLabel: { fontSize: 12, fontWeight: '700', color: '#211A19' },
  supportGridSub: { fontSize: 10.5, color: '#78716C', marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { color: '#DC2626', fontSize: 14, fontWeight: '800' },
  deleteAccountBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: { fontSize: 13, color: '#78716C', fontWeight: '600' },
  versionFooter: { alignItems: 'center', paddingVertical: 10, paddingBottom: 0 },
  versionText: { fontSize: 13, fontWeight: '700', color: '#211A19' },
  versionSub: { fontSize: 11, color: '#78716C', marginTop: 3 },
  bizTypeBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    backgroundColor: '#FAF8F5',
  },
  bizTypeBtnActive: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  bizTypeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#541D26',
    textAlign: 'center',
  },
  bizTypeBtnTextActive: {
    color: '#FAF8F5',
  },
});
