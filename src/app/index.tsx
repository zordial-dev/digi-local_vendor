import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  Menu,
  X,
  CreditCard,
  Settings,
  ChevronRight,
  Store,
  ClipboardList,
  Plus,
  Bell,
  Camera,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  PhoneCall,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Send,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageFromDevice, captureImageFromDevice, PickedImageResult } from '../utils/imagePickerHelper';
import { Colors, BrandTheme, DigiLocalColors, APP_LOGO_URL } from '../constants/theme';
import {
  VendorUser,
  VendorItem,
  VendorOrder,
  VendorSubscription,
  VendorPayment,
  fetchVendorDashboardApi,
  fetchVendorStatusApi,
  updateOrderStatusApi,
  updateVendorPushTokenApi,
  deleteVendorPushTokenApi,
  setApiBaseUrl,
  placeOrderApi,
  connectSocket,
  disconnectSocket,
  getCachedDashboard,
  uploadMediaApi,
  updateVendorProfileApi,
  uploadVendorLogoApi,
  VendorStatusResponse,
  clearAllAppCache,
  logoutVendorApi,
  resubmitVendorApplicationApi,
} from '../services/apiService';
import {
  clearSavedCredentials,
  saveVendorUser,
  getSavedVendorUser,
  getSavedApiBaseUrlStorage,
  hasSeenApprovedAlert,
  markApprovedAlertSeen,
} from '../services/authStorage';
import {
  playAlarmSound,
  stopAlarmSound,
  triggerOrderNotification,
  registerForPushNotificationsAsync,
  setupOrderAlertChannel,
  setupNotificationListeners
} from '../services/notificationService';

// Screens & Overlays
import { TabBarBackground } from '../components/TabBarBackground';
import { SplashScreenComponent } from '../components/SplashScreen';
import { WelcomeLandingScreen } from '../components/WelcomeLandingScreen';
import { LoginScreen } from '../components/LoginScreen';
import { OrdersScreenComponent } from '../components/OrdersScreen';
import { MenuScreenComponent } from '../components/MenuScreen';
import { SettingsScreenComponent } from '../components/SettingsScreen';
import { PayoutsScreenComponent } from '../components/PayoutsScreen';
import { AlarmOverlay } from '../components/AlarmOverlay';
import { StoreDigitalCardModal } from '../components/StoreDigitalCardModal';
import { ResubmitModal } from '../components/ResubmitModal';
import { CustomAlertModal, CustomAlertState, AlertType } from '../components/CustomAlertModal';
import { ToastContainer } from '../components/ToastNotification';
import { isServiceCategory } from '../utils/translations';

export default function App() {
  const rawInsets = useSafeAreaInsets();
  const insets = rawInsets || { top: 0, bottom: 0, left: 0, right: 0 };
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [currentUser, setCurrentUser] = useState<VendorUser | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'payouts' | 'settings'>('menu');
  const [openAddProductTrigger, setOpenAddProductTrigger] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [showLogoPickerModal, setShowLogoPickerModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerAnim = useRef(new Animated.Value(300)).current;

  // Vendor Approval Lifecycle State ('pending' | 'accepted' | 'rejected' | 'hold')
  const [vendorApprovalStatus, setVendorApprovalStatus] = useState<'pending' | 'accepted' | 'rejected' | 'hold'>('pending');
  const [vendorRejectionReason, setVendorRejectionReason] = useState<string>('');
  const [vendorMessage, setVendorMessage] = useState<string>('');
  const [showResubmitModal, setShowResubmitModal] = useState<boolean>(false);

  // Initial Splash Screen Display Timer
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setIsSplashVisible(false);
    }, 800);
    return () => clearTimeout(splashTimer);
  }, []);

  // Drawer animation helpers
  const openDrawer = () => {
    setShowDrawer(true);
    Animated.spring(drawerAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = (cb?: () => void) => {
    setShowDrawer(false);
    Animated.timing(drawerAnim, {
      toValue: 300,
      duration: 180,
      useNativeDriver: true,
    }).start();
    if (cb) {
      setTimeout(cb, 50);
    }
  };

  // Custom Alert Popup State
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  // Dashboard Data State
  const [items, setItems] = useState<VendorItem[]>([]);
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [subscription, setSubscription] = useState<VendorSubscription | null>(null);
  const [payments, setPayments] = useState<VendorPayment[]>([]);

  // Alarm & Order alert state
  const [activeAlarmOrder, setActiveAlarmOrder] = useState<VendorOrder | null>(null);
  const knownOrderIdsRef = useRef<Set<string | number>>(new Set());
  const isFirstLoadRef = useRef(true);

  // Blocked account alert modal state
  const [blockedAccountInfo, setBlockedAccountInfo] = useState<{
    visible: boolean;
    title: string;
    message: string;
    reason?: string;
    rejectionReason?: string;
    hasResubmitted?: boolean;
    allowResubmit?: boolean;
  } | null>(null);

  const currentUserRef = useRef<VendorUser | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser?.status) {
      const s = String(currentUser.status).toLowerCase();
      if (s === 'rejected') setVendorApprovalStatus('rejected');
      else if (s === 'active' || s === 'accepted') setVendorApprovalStatus('accepted');
      else if (s === 'hold') setVendorApprovalStatus('hold');
      else setVendorApprovalStatus('pending');
    }
  }, [currentUser]);

  // Initialize High-Priority Order Alerts & Lockscreen Notification Channel
  useEffect(() => {
    // Configure channel but do NOT request permissions before login
    setupOrderAlertChannel(false);

    const cleanupListeners = setupNotificationListeners(
      (orderId) => {
        setCurrentTab('orders');
      },
      async (orderId, vId) => {
        setActiveAlarmOrder(null);
        const vendor_id = vId || currentUserRef.current?.vendor_id;
        if (!vendor_id) return;
        try {
          await updateOrderStatusApi(Number(vendor_id), orderId, 'ACCEPTED');
          await loadDashboardData(Number(vendor_id));
          showAlert('Order Accepted', `Order #${orderId} accepted successfully!`, 'success');
        } catch (e: any) {
          showAlert('Accept Failed', e.message || 'Failed to accept order', 'error');
        }
      },
      async (orderId, vId) => {
        setActiveAlarmOrder(null);
        const vendor_id = vId || currentUserRef.current?.vendor_id;
        if (!vendor_id) return;
        try {
          await updateOrderStatusApi(Number(vendor_id), orderId, 'CANCELLED');
          await loadDashboardData(Number(vendor_id));
          showAlert('Order Rejected', `Order #${orderId} has been rejected.`, 'warning');
        } catch (e: any) {
          showAlert('Reject Failed', e.message || 'Failed to reject order', 'error');
        }
      },
      () => {
        handleMuteAlarm();
      }
    );

    return () => {
      cleanupListeners();
    };
  }, []);

  const theme = Colors.light;

  const isFetchingDashboardRef = useRef(false);

  // Load Vendor Dashboard Data with SWR (Cache Hydration + Live Server Query)
  const loadDashboardData = async (vendorId: number, forceRefresh: boolean = false) => {
    if (!vendorId) return;
    if (isFetchingDashboardRef.current) return;
    isFetchingDashboardRef.current = true;
    try {
      // 1. Instant Cache Hydration: immediately populate state so products and orders appear with 0ms delay!
      const cached = await getCachedDashboard(vendorId);
      if (cached) {
        if (Array.isArray(cached.items) && cached.items.length > 0) {
          setItems(prev => (prev.length === 0 ? (cached.items || []) : prev));
        }
        if (Array.isArray(cached.orders) && cached.orders.length > 0) {
          setOrders(prev => (prev.length === 0 ? (cached.orders || []) : prev));
        }
        if (cached.subscription) {
          setSubscription(prev => (prev === null ? (cached.subscription || null) : prev));
        }
        if (Array.isArray(cached.payments) && cached.payments.length > 0) {
          setPayments(prev => (prev.length === 0 ? (cached.payments || []) : prev));
        }
      }

      // 2. ALWAYS fetch fresh live updates directly from the backend server
      const data = await fetchVendorDashboardApi(vendorId, forceRefresh);

      if (data.vendor) {
        const liveStatus = String(data.vendor.status || '').toLowerCase();
        const reasonText = data.vendor.hold_reason || data.vendor.rejection_reason || data.vendor.reason || '';
        if (reasonText) {
          setVendorRejectionReason(reasonText);
        }
        if (liveStatus === 'active' || liveStatus === 'accepted') {
          setVendorApprovalStatus('accepted');
        } else if (liveStatus === 'rejected') {
          setVendorApprovalStatus('rejected');
        } else if (liveStatus === 'hold') {
          setVendorApprovalStatus('hold');
        }
        saveVendorUser(data.vendor);
        setCurrentUser(prev => {
          if (!prev) return data.vendor;
          if (
            prev.vendor_id === data.vendor.vendor_id &&
            prev.store_name === data.vendor.store_name &&
            prev.status === data.vendor.status &&
            prev.logo_url === data.vendor.logo_url &&
            prev.image_url === data.vendor.image_url
          ) {
            return prev;
          }
          return data.vendor;
        });
      }

      if (Array.isArray(data.items)) {
        setItems(data.items);
      }

      if (data.subscription !== undefined) {
        setSubscription(data.subscription);
      }

      if (Array.isArray(data.payments)) {
        setPayments(data.payments);
      }

      const newOrders = data.orders || [];

      if (!isFirstLoadRef.current) {
        const newlyPlaced = newOrders.find(
          o => (o.status === 'PLACED' || o.status === 'PENDING') && !knownOrderIdsRef.current.has(o.order_id)
        );

        if (newlyPlaced) {
          setActiveAlarmOrder(newlyPlaced);
          await triggerOrderNotification(newlyPlaced);
          await playAlarmSound();
        }
      } else {
        isFirstLoadRef.current = false;
      }

      const idsSet = new Set<string | number>();
      newOrders.forEach(o => idsSet.add(o.order_id));
      knownOrderIdsRef.current = idsSet;

      // Always commit fresh orders from server
      setOrders(newOrders);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    } finally {
      isFetchingDashboardRef.current = false;
    }
  };

  // Auto-restore saved API URL & Vendor user session
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUrl = await getSavedApiBaseUrlStorage();
        if (savedUrl) {
          setApiBaseUrl(savedUrl);
        }
        const savedVendor = await getSavedVendorUser();
        if (savedVendor && typeof savedVendor === 'object') {
          const vendorData: VendorUser = savedVendor.vendor || savedVendor;
          if (vendorData && vendorData.vendor_id && vendorData.store_name) {
            // 🛡️ Single Status Guard on App Startup (Called ONLY ONCE)
            const statusRes = await fetchVendorStatusApi(vendorData.vendor_id);
            if (
              statusRes &&
              (statusRes.is_blocked ||
                statusRes.status === 'blocked' ||
                statusRes.action === 'logout' ||
                statusRes.code === 'VENDOR_BLOCKED')
            ) {
              console.warn('⚠️ Vendor account is blocked on app launch. Purging session storage and logging out...');
              await clearSavedCredentials();
              await clearAllAppCache();
              setCurrentUser(null);
              setShowLogin(true);
              setBlockedAccountInfo({
                visible: true,
                title: 'Account Blocked by Admin',
                message:
                  statusRes.message ||
                  statusRes.error ||
                  'Your vendor store account has been blocked by administrator. Access denied.',
                reason: statusRes.block_reason || 'Policy or compliance violation',
              });
              return;
            }

            if (statusRes) {
              if (statusRes.is_rejected || statusRes.status === 'rejected') {
                setVendorApprovalStatus('rejected');
                setVendorRejectionReason(statusRes.rejection_reason || '');
              } else if (statusRes.is_accepted || statusRes.is_active || statusRes.status === 'accepted' || statusRes.status === 'active') {
                setVendorApprovalStatus('accepted');
              } else if (statusRes.is_on_hold || statusRes.status === 'hold') {
                setVendorApprovalStatus('hold');
                setVendorRejectionReason(statusRes.rejection_reason || '');
              } else {
                setVendorApprovalStatus('pending');
              }
              if (statusRes.message) setVendorMessage(statusRes.message);
            }

            setCurrentUser(vendorData);

            // Instant 0ms Cache Hydration
            const cached = await getCachedDashboard(vendorData.vendor_id);
            if (cached) {
              if (Array.isArray(cached.items) && cached.items.length > 0) setItems(cached.items);
              if (Array.isArray(cached.orders) && cached.orders.length > 0) setOrders(cached.orders);
              if (cached.subscription) setSubscription(cached.subscription);
              if (Array.isArray(cached.payments) && cached.payments.length > 0) setPayments(cached.payments);
            }
          }
        }
      } catch (e) {
        console.error('[App] Failed restoring session:', e);
      }
    }
    restoreSession();
  }, []);

  const currentVendorId = currentUser?.vendor_id;

  // Auto-polling & Push Token Registration (Only for active/accepted vendors)
  useEffect(() => {
    if (!currentVendorId || vendorApprovalStatus !== 'accepted') return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        updateVendorPushTokenApi(currentVendorId, token);
      }
    }).catch((_err) => {});

    loadDashboardData(currentVendorId, false);
    const interval = setInterval(() => {
      loadDashboardData(currentVendorId, false);
    }, 20000);

    return () => clearInterval(interval);
  }, [currentVendorId, vendorApprovalStatus]);

  // Socket.io Connection & Room Subscription (Only for active/accepted vendors)
  useEffect(() => {
    if (!currentVendorId || vendorApprovalStatus !== 'accepted') {
      disconnectSocket();
      return;
    }

    connectSocket(currentVendorId, async (newOrder: VendorOrder) => {
      // Trigger the modal, notifications and continuous alarm loop
      setActiveAlarmOrder(newOrder);
      await triggerOrderNotification(newOrder);
      await playAlarmSound();
    });

    return () => {
      disconnectSocket();
    };
  }, [currentVendorId, vendorApprovalStatus]);

  const handleLoginSuccess = async (vendor: VendorUser) => {
    // 🛡️ Single Status Guard on Login Entry (Called ONLY ONCE)
    const statusRes = await fetchVendorStatusApi(vendor.vendor_id);
    if (
      statusRes &&
      (statusRes.is_blocked ||
        statusRes.status === 'blocked' ||
        statusRes.action === 'logout' ||
        statusRes.code === 'VENDOR_BLOCKED')
    ) {
      console.warn('⚠️ Vendor account is blocked. Purging session storage and denying login...');
      await clearSavedCredentials();
      await clearAllAppCache();
      setCurrentUser(null);
      setShowLogin(true);
      setBlockedAccountInfo({
        visible: true,
        title: 'Account Blocked by Admin',
        message:
          statusRes.message ||
          statusRes.error ||
          'Your vendor store account has been blocked by administrator. Access denied.',
        reason: statusRes.block_reason || 'Policy or compliance violation',
      });
      return;
    }

    if (statusRes) {
      const reasonText = statusRes.rejection_reason || statusRes.hold_reason || statusRes.reason || '';
      if (reasonText) {
        setVendorRejectionReason(reasonText);
      }

      if (statusRes.is_rejected || statusRes.status === 'rejected') {
        setVendorApprovalStatus('rejected');
      } else if (statusRes.is_accepted || statusRes.is_active || statusRes.status === 'accepted' || statusRes.status === 'active') {
        setVendorApprovalStatus('accepted');
      } else if (statusRes.is_on_hold || statusRes.status === 'hold') {
        setVendorApprovalStatus('hold');
      } else {
        setVendorApprovalStatus('pending');
      }
      if (statusRes.message) setVendorMessage(statusRes.message);
    }

    setCurrentUser(vendor);
    saveVendorUser(vendor);
    isFirstLoadRef.current = true;

    // Instant cache check on login
    const cached = await getCachedDashboard(vendor.vendor_id);
    if (cached) {
      if (Array.isArray(cached.items) && cached.items.length > 0) setItems(cached.items);
      if (Array.isArray(cached.orders) && cached.orders.length > 0) setOrders(cached.orders);
      if (cached.subscription) setSubscription(cached.subscription);
      if (Array.isArray(cached.payments) && cached.payments.length > 0) setPayments(cached.payments);
    }

    loadDashboardData(vendor.vendor_id);

    // Request notification permissions explicitly after login
    setupOrderAlertChannel(true).then(() => {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          updateVendorPushTokenApi(vendor.vendor_id, token);
        }
      }).catch((_err) => {});
    }).catch((_err) => {});
  };

  const handleLogout = async () => {
    const prevUser = currentUser;
    setShowDrawer(false);
    disconnectSocket();
    await stopAlarmSound();
    setActiveAlarmOrder(null);
    setCurrentUser(null);
    setShowLogin(true);
    setVendorApprovalStatus('pending');
    setItems([]);
    setOrders([]);
    setSubscription(null);
    setPayments([]);

    // Clear saved credentials and cache synchronously
    await clearSavedCredentials().catch(() => {});
    await clearAllAppCache().catch(() => {});

    // Notify backend server asynchronously without blocking UI
    if (prevUser?.vendor_id) {
      Promise.allSettled([
        logoutVendorApi(prevUser.vendor_id),
        deleteVendorPushTokenApi(prevUser.vendor_id),
      ]).catch(() => {});
    }
  };

  const handleAcceptAlarmOrder = async (orderId: string | number) => {
    if (!currentUser) return;
    await stopAlarmSound();
    setActiveAlarmOrder(null);
    try {
      await updateOrderStatusApi(currentUser.vendor_id, orderId, 'ACCEPTED');
      await loadDashboardData(currentUser.vendor_id);
      showAlert('Order Accepted', `Order #${orderId} accepted successfully!`, 'success');
    } catch (e: any) {
      showAlert('Accept Failed', e.message || 'Failed to accept order', 'error');
    }
  };

  const handleRejectAlarmOrder = async (orderId: string | number) => {
    if (!currentUser) return;
    await stopAlarmSound();
    setActiveAlarmOrder(null);
    try {
      await updateOrderStatusApi(currentUser.vendor_id, orderId, 'CANCELLED');
      await loadDashboardData(currentUser.vendor_id);
      showAlert('Order Rejected', `Order #${orderId} has been rejected.`, 'warning');
    } catch (e: any) {
      showAlert('Reject Failed', e.message || 'Failed to reject order', 'error');
    }
  };

  const handleMuteAlarm = async () => {
    await stopAlarmSound();
  };

  const handleTriggerTestAlarm = async () => {
    const demoOrder: VendorOrder = {
      order_id: 9999,
      vendor_id: currentUser?.vendor_id || 1,
      customer_id: 1,
      customer_name: 'Rahul Sharma (Demo Customer)',
      phone_number: '+91 9876543210',
      address: 'Flat 402, Block B, ' + (currentUser?.society_name || 'Greenwood Residency'),
      order_timestamp: new Date().toISOString(),
      status: 'PENDING',
      total_amount: '349.00',
      items: [
        {
          order_id: 9999,
          item_id: 1,
          quantity: 2,
          unit_price: '68.00',
          item_total: '136.00',
          item_name: 'Farm Fresh Organic Milk (1L)',
          unit: '1 Litre'
        },
        {
          order_id: 9999,
          item_id: 2,
          quantity: 1,
          unit_price: '213.00',
          item_total: '213.00',
          item_name: 'Belgian Chocolate Truffle Cake',
          unit: '500g'
        }
      ]
    };

    setActiveAlarmOrder(demoOrder);
    await triggerOrderNotification(demoOrder);
    await playAlarmSound();
  };

  // Render Splash Screen
  if (isSplashVisible) {
    return <SplashScreenComponent />;
  }

  // Not logged in
  if (!currentUser) {
    if (!showLogin && !blockedAccountInfo) {
      return (
        <WelcomeLandingScreen
          onGetStarted={() => setShowLogin(true)}
          onLogin={() => setShowLogin(true)}
        />
      );
    }

    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        onBackToWelcome={() => setShowLogin(false)}
        isDarkMode={false}
        initialBlockedInfo={blockedAccountInfo}
        onClearBlockedInfo={() => setBlockedAccountInfo(null)}
      />
    );
  }

  // ── Render Dedicated Red Rejection Screen if merchant is REJECTED ──
  if (vendorApprovalStatus === 'rejected') {
    return (
      <View style={[styles.safeArea, { paddingTop: insets.top, backgroundColor: DigiLocalColors.canvasBase }]}>
        <StatusBar barStyle="dark-content" backgroundColor={DigiLocalColors.canvasBase} />
        
        {/* Top Header */}
        <View style={[styles.adminHeader, { backgroundColor: DigiLocalColors.surfaceCard, borderBottomColor: DigiLocalColors.border }]}>
          <Text style={[styles.headerTitle, { color: DigiLocalColors.primary, fontWeight: '800' }]}>Merchant Portal</Text>
          <TouchableOpacity
            style={[styles.hamburgerBtn, { backgroundColor: DigiLocalColors.primaryLight }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LogOut size={16} color={DigiLocalColors.primary} />
          </TouchableOpacity>
        </View>

        {/* Rejection Content Card */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: DigiLocalColors.dangerBg,
            borderWidth: 8,
            borderColor: '#FEE2E2',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}>
            <AlertOctagon size={40} color={DigiLocalColors.danger} />
          </View>

          <Text style={{
            fontSize: 22,
            fontWeight: '800',
            color: DigiLocalColors.primary,
            textAlign: 'center',
            marginBottom: 12,
            fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold'
          }}>
            Application Rejected
          </Text>

          <Text style={{
            fontSize: 14.5,
            color: DigiLocalColors.textMuted,
            textAlign: 'center',
            lineHeight: 22,
            marginBottom: 20,
            paddingHorizontal: 8,
            fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular'
          }}>
            Merchant application was rejected by admin. Please contact support.
          </Text>

          {vendorRejectionReason ? (
            <View style={{
              backgroundColor: DigiLocalColors.surfaceCard,
              borderRadius: 14,
              padding: 16,
              width: '100%',
              borderWidth: 1,
              borderColor: DigiLocalColors.border,
              marginBottom: 24,
              shadowColor: DigiLocalColors.textDark,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
              elevation: 1
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: DigiLocalColors.danger, marginBottom: 4 }}>
                Reason from Admin:
              </Text>
              <Text style={{ fontSize: 13, color: DigiLocalColors.textDark, lineHeight: 18 }}>
                {vendorRejectionReason}
              </Text>
            </View>
          ) : null}

          {/* Primary CTA: Resubmit Application */}
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: DigiLocalColors.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              flexDirection: 'row',
              gap: 8,
              shadowColor: DigiLocalColors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3
            }}
            onPress={() => setShowResubmitModal(true)}
            activeOpacity={0.85}
          >
            <Send size={17} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Resubmit Application</Text>
          </TouchableOpacity>

          {/* Secondary Action: Contact Support */}
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: DigiLocalColors.surfaceCard,
              borderRadius: 14,
              paddingVertical: 13,
              borderWidth: 1.5,
              borderColor: DigiLocalColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              flexDirection: 'row',
              gap: 8
            }}
            onPress={() => {
              showAlert('Contact DigiLocal Support', 'Please email us at support@digilocal.in or call our helpline 1800-123-4567 for assistance with your merchant application.', 'info');
            }}
            activeOpacity={0.85}
          >
            <PhoneCall size={17} color={DigiLocalColors.primary} />
            <Text style={{ color: DigiLocalColors.textDark, fontSize: 14, fontWeight: '700' }}>Contact Support</Text>
          </TouchableOpacity>

          {/* Tertiary Action: Check Status Again */}
          <TouchableOpacity
            style={{
              width: '100%',
              backgroundColor: DigiLocalColors.surfaceIvory,
              borderRadius: 14,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: DigiLocalColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
              flexDirection: 'row',
              gap: 8
            }}
            onPress={() => loadDashboardData(currentUser.vendor_id, true)}
            activeOpacity={0.85}
          >
            <RefreshCw size={15} color={DigiLocalColors.textMuted} />
            <Text style={{ color: DigiLocalColors.textMuted, fontSize: 13.5, fontWeight: '700' }}>Check Status Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ paddingVertical: 10 }}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={{ color: DigiLocalColors.textMuted, fontSize: 13.5, fontWeight: '600' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const processAndUploadLogo = async (picked: PickedImageResult) => {
    if (!currentUser || !picked.uri) return;
    try {
      showAlert('Uploading Logo', 'Uploading and saving your custom store logo...', 'info');
      const fileName = picked.fileName || `store_logo_${Date.now()}.jpg`;
      const mimeType = picked.mimeType || 'image/jpeg';

      const uploadResult = await uploadVendorLogoApi(
        currentUser.vendor_id,
        picked.base64 ? `data:${mimeType};base64,${picked.base64}` : picked.uri,
        fileName,
        mimeType
      );

      const logoUrl = uploadResult.logo_url;
      if (logoUrl) {
        const updatedUser = { ...currentUser, logo_url: logoUrl, logo: logoUrl };
        setCurrentUser(updatedUser);
        await saveVendorUser(updatedUser);
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
      showAlert('Camera Error', err.message || 'Failed to take photo', 'error');
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

  const storeNameDisplay = (currentUser?.store_name || 'VENDOR').toUpperCase();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={BrandTheme.warmOffWhite} />

      {/* Custom Vendor Store Header Bar */}
      <View style={styles.adminHeader}>
        {/* Vendor Custom Logo / Add Logo Button */}
        <TouchableOpacity
          style={styles.vendorLogoBtn}
          onPress={handleUploadStoreLogo}
          activeOpacity={0.8}
        >
          {currentUser?.logo_url || currentUser?.image_url ? (
            <Image
              source={{ uri: currentUser.logo_url || currentUser.image_url }}
              style={styles.vendorLogoImg}
            />
          ) : (
            <View style={styles.vendorLogoPlaceholder}>
              <Store size={18} color={BrandTheme.forestGreen} />
              <View style={styles.cameraIconBadge}>
                <Camera size={9} color="#FFFFFF" />
              </View>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentUser?.store_name || 'MY STORE'}
          </Text>
          {currentUser?.society_name ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              📍 {currentUser.society_name}
            </Text>
          ) : null}
        </View>

        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={openDrawer}
            activeOpacity={0.8}
          >
            <Menu size={18} color={BrandTheme.darkForestGreen} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Pending / Hold Verification Status Banner with Admin Reason ─── */}
      {vendorApprovalStatus === 'pending' || vendorApprovalStatus === 'hold' ? (
        <View style={{
          backgroundColor: vendorApprovalStatus === 'hold' ? '#FEF2F2' : '#FFFBEB',
          borderBottomWidth: 1.5,
          borderBottomColor: vendorApprovalStatus === 'hold' ? '#FECDD3' : '#FDE68A',
          paddingVertical: 14,
          paddingHorizontal: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: vendorApprovalStatus === 'hold' ? '#FEE2E2' : '#FEF3C7',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                {vendorApprovalStatus === 'hold' ? (
                  <AlertTriangle size={16} color="#DC2626" strokeWidth={2.5} />
                ) : (
                  <Clock size={16} color="#D97706" strokeWidth={2.5} />
                )}
              </View>
              <Text style={{
                fontSize: 15,
                fontWeight: '800',
                color: vendorApprovalStatus === 'hold' ? '#991B1B' : '#92400E',
                letterSpacing: 0.2,
                fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold'
              }}>
                {vendorApprovalStatus === 'hold' ? 'Request Placed on Hold' : 'Submitted for Admin Approval'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => loadDashboardData(currentUser.vendor_id, true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: vendorApprovalStatus === 'hold' ? '#FEE2E2' : '#FEF3C7',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 0.5,
                  borderColor: vendorApprovalStatus === 'hold' ? '#FECACA' : '#FDE68A'
                }}
                activeOpacity={0.7}
              >
                <RefreshCw size={12} color={vendorApprovalStatus === 'hold' ? "#DC2626" : "#D97706"} />
                <Text style={{ fontSize: 11.5, fontWeight: '700', color: vendorApprovalStatus === 'hold' ? "#DC2626" : "#D97706" }}>
                  Refresh Status
                </Text>
              </TouchableOpacity>

              {vendorApprovalStatus === 'hold' && (
                <TouchableOpacity
                  onPress={() => setShowResubmitModal(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#541D26',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    marginLeft: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Send size={12} color="#FFFFFF" />
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Resubmit</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={{
            fontSize: 12.5,
            color: vendorApprovalStatus === 'hold' ? '#7F1D1D' : '#78350F',
            lineHeight: 18,
            marginTop: 2,
            fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_400Regular'
          }}>
            {vendorMessage || (vendorApprovalStatus === 'hold'
              ? 'Your vendor request is on hold. Please review the admin reason below and resubmit your details.'
              : 'Your merchant application has been submitted and is currently awaiting verification by admin.')}
          </Text>

          {/* ── Admin Hold / Feedback Reason Field Box ── */}
          {(vendorRejectionReason || currentUser?.hold_reason || currentUser?.rejection_reason || currentUser?.reason) ? (
            <View style={{
              marginTop: 10,
              backgroundColor: '#FFFFFF',
              padding: 12,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: vendorApprovalStatus === 'hold' ? '#FECDD3' : '#FDE68A',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AlertCircle size={14} color={vendorApprovalStatus === 'hold' ? '#991B1B' : '#92400E'} />
                <Text style={{
                  fontSize: 11.5,
                  fontWeight: '800',
                  color: vendorApprovalStatus === 'hold' ? '#991B1B' : '#92400E',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  {vendorApprovalStatus === 'hold' ? 'Admin Hold Reason:' : 'Admin Feedback / Note:'}
                </Text>
              </View>
              <Text style={{
                fontSize: 13,
                fontWeight: '600',
                color: '#211A19',
                lineHeight: 19
              }}>
                {vendorRejectionReason || currentUser?.hold_reason || currentUser?.rejection_reason || currentUser?.reason}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Active Screen */}
      <View style={styles.screenContainer}>
        <View style={{ flex: 1, display: currentTab === 'menu' ? 'flex' : 'none' }}>
          <MenuScreenComponent
            vendorId={currentUser.vendor_id}
            items={items}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id, true)}
            isDarkMode={false}
            openAddProductTrigger={openAddProductTrigger}
            businessType={currentUser.business_type === 'SERVICE' || isServiceCategory(currentUser.category, currentUser.business_type) ? 'SERVICE' : 'PRODUCT'}
            isPendingApproval={vendorApprovalStatus === 'pending'}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'orders' ? 'flex' : 'none' }}>
          <OrdersScreenComponent
            vendorId={currentUser.vendor_id}
            orders={orders}
            storeItems={items}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id, true)}
            isDarkMode={false}
            businessType={currentUser.business_type === 'SERVICE' || isServiceCategory(currentUser.category, currentUser.business_type) ? 'SERVICE' : 'PRODUCT'}
            isPendingApproval={vendorApprovalStatus === 'pending'}
            onNavigateToMenu={() => setCurrentTab('menu')}
            onNavigateToSettings={() => setCurrentTab('settings')}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'payouts' ? 'flex' : 'none' }}>
          <PayoutsScreenComponent
            payments={payments}
            orders={orders}
            vendor={currentUser}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id, true)}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'settings' ? 'flex' : 'none' }}>
          <SettingsScreenComponent
            vendor={currentUser}
            subscription={subscription}
            payments={payments}
            onLogout={handleLogout}
            onRefresh={() => loadDashboardData(currentUser.vendor_id, true)}
            isDarkMode={false}
            onToggleDarkMode={() => { }}
            onTestAlarm={handleTriggerTestAlarm}
            onExploreVendors={() => setCurrentTab('menu')}
          />
        </View>
      </View>

      {/* Sleek Bottom Tab Bar */}
      <View style={[styles.bottomTabBarContainer, { height: 68 + (insets.bottom > 0 ? insets.bottom : 8), paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <TabBarBackground
          width={Dimensions.get('window').width}
          height={68 + (insets.bottom > 0 ? insets.bottom : 8)}
        />
        {/* Tab 1: Menu / Services */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('menu')}
          activeOpacity={0.7}
        >
          <Menu size={22} color={currentTab === 'menu' ? '#541D26' : '#78716C'} />
          <Text style={[styles.bottomTabText, currentTab === 'menu' && styles.bottomTabTextActive]}>
            {(currentUser?.business_type === 'SERVICE' || isServiceCategory(currentUser?.category, currentUser?.business_type)) ? 'Services' : 'Menu'}
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Orders / Enquiries */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('orders')}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
            <ClipboardList size={22} color={currentTab === 'orders' ? '#541D26' : '#78716C'} />
            {orders.length > 0 ? (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{orders.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.bottomTabText, currentTab === 'orders' && styles.bottomTabTextActive]}>
            {(currentUser?.business_type === 'SERVICE' || isServiceCategory(currentUser?.category, currentUser?.business_type)) ? 'Enquiries' : 'Orders'}
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Prominent Add Product / Service Button in Centre */}
        <View style={styles.centerAddBtnWrapper}>
          <TouchableOpacity
            style={styles.centerAddBtn}
            onPress={() => {
              setCurrentTab('menu');
              setOpenAddProductTrigger(prev => prev + 1);
            }}
            activeOpacity={0.85}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
          </TouchableOpacity>
          <Text style={styles.centerAddBtnText}>
            {(currentUser?.business_type === 'SERVICE' || isServiceCategory(currentUser?.category, currentUser?.business_type)) ? 'Add Service' : 'Add Item'}
          </Text>
        </View>

        {/* Tab 4: Payouts */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('payouts')}
          activeOpacity={0.7}
        >
          <CreditCard size={22} color={currentTab === 'payouts' ? '#541D26' : '#78716C'} />
          <Text style={[styles.bottomTabText, currentTab === 'payouts' && styles.bottomTabTextActive]}>
            Payouts
          </Text>
        </TouchableOpacity>

        {/* Tab 5: Settings */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('settings')}
          activeOpacity={0.7}
        >
          <Settings size={22} color={currentTab === 'settings' ? '#541D26' : '#78716C'} />
          <Text style={[styles.bottomTabText, currentTab === 'settings' && styles.bottomTabTextActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Hamburger Drawer ─── */}
      <Modal
        visible={showDrawer}
        transparent
        animationType="none"
        onRequestClose={() => closeDrawer()}
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop tap to close */}
          <Pressable style={styles.drawerBackdrop} onPress={() => closeDrawer()} />

          {/* Drawer Panel */}
          <Animated.View style={[styles.drawerPanel, { transform: [{ translateX: drawerAnim }] }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.drawerStoreName} numberOfLines={1}>{storeNameDisplay}</Text>
                <Text style={styles.drawerSubtitle}>Vendor Portal</Text>
              </View>
              <TouchableOpacity onPress={() => closeDrawer()} activeOpacity={0.7} style={styles.drawerCloseBtn}>
                <X size={18} color={BrandTheme.warmTanGold} />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            {/* Settings */}
            <TouchableOpacity
              style={styles.drawerItem}
              activeOpacity={0.8}
              onPress={() => closeDrawer(() => setCurrentTab('settings'))}
            >
              <View style={styles.drawerItemIcon}>
                <Settings size={17} color={BrandTheme.warmTanGold} />
              </View>
              <Text style={styles.drawerItemText}>Settings</Text>
              <ChevronRight size={16} color={BrandTheme.mutedSageText} />
            </TouchableOpacity>

            <View style={[styles.drawerDivider, { marginTop: 8 }]} />

            {/* Logout */}
            <TouchableOpacity
              style={[styles.drawerItem, { marginTop: 4 }]}
              activeOpacity={0.8}
              onPress={() => {
                setShowDrawer(false);
                handleLogout();
              }}
            >
              <View style={[styles.drawerItemIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <LogOut size={17} color="#EF4444" />
              </View>
              <Text style={styles.drawerLogoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />
            <Text style={styles.drawerFooter}>DigiLocal Vendor Terminal</Text>
          </Animated.View>
        </View>
      </Modal>

      {/* Alarm Overlay */}
      {activeAlarmOrder && (
        <AlarmOverlay
          order={activeAlarmOrder}
          onAccept={handleAcceptAlarmOrder}
          onReject={handleRejectAlarmOrder}
          onMute={handleMuteAlarm}
          isDarkMode={false}
        />
      )}

      {/* Store Digital Card Modal */}
      {currentUser && (
        <StoreDigitalCardModal
          visible={showDigitalCard}
          vendor={currentUser}
          onClose={() => setShowDigitalCard(false)}
          onExploreVendors={() => setCurrentTab('menu')}
        />
      )}

      <ResubmitModal
        visible={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        vendor={currentUser}
        showAlert={showAlert}
        onSuccess={() => {
          setVendorApprovalStatus('pending');
          if (currentUser) loadDashboardData(currentUser.vendor_id, true);
        }}
      />

      {/* Custom Alert */}
      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
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
              <Camera size={20} color={BrandTheme.forestGreen} style={{ marginRight: 12 }} />
              <Text style={styles.logoModalOptionText}>Take Photo with Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoModalOptionBtn}
              onPress={handlePickFromGallery}
              activeOpacity={0.8}
            >
              <ImageIcon size={20} color={BrandTheme.forestGreen} style={{ marginRight: 12 }} />
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



      {/* Viewport-Level Floating Toast Notifications */}
      <ToastContainer bottomOffset={78 + (insets.bottom > 0 ? insets.bottom : 8)} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BrandTheme.warmOffWhite, // Warm Off-White App Background (#F8F6F0)
  },
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
  adminHeader: {
    backgroundColor: BrandTheme.warmOffWhite,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
    paddingHorizontal: 16,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorLogoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BrandTheme.forestGreen,
  },
  vendorLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEE5DA',
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: BrandTheme.forestGreen,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    color: BrandTheme.darkForestGreen,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    fontWeight: '600',
    marginTop: 1,
    textAlign: 'center',
  },
  headerRightContainer: {
    width: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder, // Sand border
    backgroundColor: BrandTheme.warmOffWhite, // Warm Off-White background
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandTheme.emeraldGreen, // Emerald green dot
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder, // Sand border
    backgroundColor: BrandTheme.warmOffWhite, // Warm Off-White background
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTabBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    position: 'relative',
  },
  bottomTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 6,
  },
  bottomTabText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: '#541D26',
    fontWeight: '800',
  },
  centerAddBtnWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    marginBottom: 4,
  },
  centerAddBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#541D26', // Deep Maroon / Wine
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#FAF8F5', // Surface Ivory border
    marginTop: -32,
  },
  centerAddBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#541D26',
    marginTop: 4,
    textAlign: 'center',
  },
  badgeCount: {
    position: 'absolute',
    right: -10,
    top: -6,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandTheme.obsidianDarkGreen,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: BrandTheme.warmOffWhite,
  },
  // ── Drawer ──
  drawerOverlay: {
    flex: 1,
    position: 'relative',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,22,16,0.6)',
    zIndex: 1,
  },
  drawerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 272,
    backgroundColor: BrandTheme.darkForestGreen,
    paddingTop: 52,
    paddingBottom: 36,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 20,
    zIndex: 100,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BrandTheme.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  drawerStoreName: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.creamCanvas,
    letterSpacing: 0.4,
  },
  drawerSubtitle: {
    fontSize: 11,
    color: BrandTheme.warmTanGold,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: BrandTheme.forestGreen,
    marginVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    gap: 12,
  },
  drawerItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(196,160,102,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.creamCanvas,
  },
  drawerLogoutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  drawerFooter: {
    fontSize: 10,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginTop: 20,
  },
});
