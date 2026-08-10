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
} from 'lucide-react-native';
import { Colors, BrandTheme, APP_LOGO_URL } from '../constants/theme';
import {
  VendorUser,
  VendorItem,
  VendorOrder,
  VendorSubscription,
  VendorPayment,
  fetchVendorDashboardApi,
  updateOrderStatusApi,
  updateVendorPushTokenApi,
  deleteVendorPushTokenApi,
  setApiBaseUrl,
  placeOrderApi,
  connectSocket,
  disconnectSocket
} from '../services/apiService';
import {
  clearSavedCredentials,
  saveVendorUser,
  getSavedVendorUser,
  getSavedApiBaseUrlStorage
} from '../services/authStorage';
import {
  playAlarmSound,
  stopAlarmSound,
  triggerOrderNotification,
  registerForPushNotificationsAsync
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
import { CustomAlertModal, CustomAlertState, AlertType } from '../components/CustomAlertModal';

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
  const [showDrawer, setShowDrawer] = useState(false);
  const drawerAnim = useRef(new Animated.Value(300)).current;

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
    Animated.timing(drawerAnim, {
      toValue: 300,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setShowDrawer(false);
      if (cb) cb();
    });
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

  const theme = Colors.light;

  // Load Vendor Dashboard Data
  const loadDashboardData = async (vendorId: number) => {
    try {
      const data = await fetchVendorDashboardApi(vendorId);
      if (data.vendor) {
        setCurrentUser(prev => {
          if (
            prev &&
            prev.vendor_id === data.vendor.vendor_id &&
            prev.store_name === data.vendor.store_name &&
            prev.status === data.vendor.status &&
            prev.phone_number === data.vendor.phone_number &&
            prev.gst_number === data.vendor.gst_number &&
            prev.opening_time === data.vendor.opening_time &&
            prev.closing_time === data.vendor.closing_time &&
            prev.society_name === data.vendor.society_name &&
            prev.email === data.vendor.email
          ) {
            return prev;
          }
          saveVendorUser(data.vendor);
          return data.vendor;
        });
      }

      const newItems = data.items || [];
      setItems(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newItems)) {
          return prev;
        }
        return newItems;
      });

      const newSub = data.subscription || null;
      setSubscription(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newSub)) {
          return prev;
        }
        return newSub;
      });

      const newPayments = data.payments || [];
      setPayments(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newPayments)) {
          return prev;
        }
        return newPayments;
      });

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

      setOrders(prev => {
        if (JSON.stringify(prev) === JSON.stringify(newOrders)) {
          return prev;
        }
        return newOrders;
      });
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Auto-restore saved API URL & Vendor user session
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedUrl = await getSavedApiBaseUrlStorage();
        if (savedUrl) {
          console.log(`[App] Restored custom API URL: ${savedUrl}`);
          setApiBaseUrl(savedUrl);
        }
        const savedVendor = await getSavedVendorUser();
        if (savedVendor && typeof savedVendor === 'object') {
          const vendorData: VendorUser = savedVendor.vendor || savedVendor;
          if (vendorData && vendorData.vendor_id && vendorData.store_name) {
            console.log(`[App] Restored vendor session: ${vendorData.store_name}`);
            setCurrentUser(vendorData);
          }
        }
      } catch (e) {
        console.error('[App] Failed restoring session:', e);
      }
    }
    restoreSession();
  }, []);

  // Auto-polling & Push Token Registration
  useEffect(() => {
    if (!currentUser) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log(`[App] Registered Expo Push Token: ${token}`);
        updateVendorPushTokenApi(currentUser.vendor_id, token);
      }
    }).catch(err => {
      console.log('[App] Push token registration skipped:', err);
    });

    loadDashboardData(currentUser.vendor_id);
    const interval = setInterval(() => {
      loadDashboardData(currentUser.vendor_id);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Socket.io Connection & Room Subscription
  useEffect(() => {
    if (!currentUser) {
      disconnectSocket();
      return;
    }

    console.log(`[App] Initializing Socket.io for vendor ${currentUser.vendor_id}`);
    connectSocket(currentUser.vendor_id, async (newOrder: VendorOrder) => {
      console.log('🚨 [App] New order received via Socket.io:', newOrder);
      // Trigger the modal, notifications and continuous alarm loop
      setActiveAlarmOrder(newOrder);
      await triggerOrderNotification(newOrder);
      await playAlarmSound();
    });

    return () => {
      disconnectSocket();
    };
  }, [currentUser]);

  const handleLoginSuccess = (vendor: VendorUser) => {
    setCurrentUser(vendor);
    saveVendorUser(vendor);
    isFirstLoadRef.current = true;
    loadDashboardData(vendor.vendor_id);
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log(`[App] Push Token registered on login: ${token}`);
        updateVendorPushTokenApi(vendor.vendor_id, token);
      }
    }).catch(err => {
      console.log('[App] Push token registration skipped:', err);
    });
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        await deleteVendorPushTokenApi(currentUser.vendor_id);
      } catch (err) {
        console.error('[App] Failed to delete push token on logout:', err);
      }
    }
    await clearSavedCredentials();
    await stopAlarmSound();
    setActiveAlarmOrder(null);
    setShowLogin(false);
    setCurrentUser(null);
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
    if (!showLogin) {
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
      />
    );
  }

  const storeNameDisplay = (currentUser?.store_name || 'VENDOR').toUpperCase();
  const storeAvatarInitial = storeNameDisplay.charAt(0);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDEDE4" />

      {/* Light Admin Header Bar matching Screenshot */}
      <View style={styles.adminHeader}>
        <Image
          source={{ uri: APP_LOGO_URL }}
          style={styles.headerLogo}
        />
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>DIGILOCAL VENDOR TERMINAL</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{storeNameDisplay}</Text>
        </View>
        <TouchableOpacity
          style={styles.hamburgerBtn}
          onPress={openDrawer}
          activeOpacity={0.8}
        >
          <Menu size={20} color="#18281F" />
        </TouchableOpacity>
      </View>

      {/* Active Screen */}
      <View style={styles.screenContainer}>
        <View style={{ flex: 1, display: currentTab === 'menu' ? 'flex' : 'none' }}>
          <MenuScreenComponent
            vendorId={currentUser.vendor_id}
            items={items}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
            openAddProductTrigger={openAddProductTrigger}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'orders' ? 'flex' : 'none' }}>
          <OrdersScreenComponent
            vendorId={currentUser.vendor_id}
            orders={orders}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'payouts' ? 'flex' : 'none' }}>
          <PayoutsScreenComponent
            payments={payments}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
          />
        </View>

        <View style={{ flex: 1, display: currentTab === 'settings' ? 'flex' : 'none' }}>
          <SettingsScreenComponent
            vendor={currentUser}
            subscription={subscription}
            payments={payments}
            onLogout={handleLogout}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
            onToggleDarkMode={() => { }}
            onTestAlarm={handleTriggerTestAlarm}
          />
        </View>
      </View>

      {/* Sleek Bottom Tab Bar */}
      <View style={[styles.bottomTabBarContainer, { height: 68 + (insets.bottom > 0 ? insets.bottom : 8), paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
        <TabBarBackground
          width={Dimensions.get('window').width}
          height={68 + (insets.bottom > 0 ? insets.bottom : 8)}
        />
        {/* Tab 1: Menu */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('menu')}
          activeOpacity={0.7}
        >
          <Menu size={22} color={currentTab === 'menu' ? '#18281F' : '#6B7C70'} />
          <Text style={[styles.bottomTabText, currentTab === 'menu' && styles.bottomTabTextActive]}>
            Menu
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Orders */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('orders')}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
            <ClipboardList size={22} color={currentTab === 'orders' ? '#18281F' : '#6B7C70'} />
            {orders.length > 0 ? (
              <View style={styles.badgeCount}>
                <Text style={styles.badgeText}>{orders.length}</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.bottomTabText, currentTab === 'orders' && styles.bottomTabTextActive]}>
            Orders
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Prominent Add Product Button in Centre */}
        <View style={styles.centerAddBtnWrapper}>
          <TouchableOpacity
            style={styles.centerAddBtn}
            onPress={() => {
              setCurrentTab('menu');
              setOpenAddProductTrigger(prev => prev + 1);
            }}
            activeOpacity={0.85}
          >
            <Plus size={28} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.centerAddBtnText}>Add Item</Text>
        </View>

        {/* Tab 4: Payouts */}
        <TouchableOpacity
          style={styles.bottomTabItem}
          onPress={() => setCurrentTab('payouts')}
          activeOpacity={0.7}
        >
          <CreditCard size={22} color={currentTab === 'payouts' ? '#18281F' : '#6B7C70'} />
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
          <Settings size={22} color={currentTab === 'settings' ? '#18281F' : '#6B7C70'} />
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
              onPress={() => closeDrawer(handleLogout)}
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
        />
      )}

      {/* Custom Alert */}
      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EDEDE4', // Warm Off-White
  },
  adminHeader: {
    backgroundColor: '#EDEDE4',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E4DCC9', // Sand Border
    paddingHorizontal: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerLogo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    position: 'absolute',
    left: 1,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6B7C70', // Muted Sage Text
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 1,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 13,
    color: '#18281F', // Dark Forest Green
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  hamburgerBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4DCC9', // Sand Border
    backgroundColor: '#FAF8F3', // Light cream background
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
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
    color: '#6B7C70',
    marginTop: 4,
  },
  bottomTabTextActive: {
    color: '#18281F', // Dark Forest Green
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
    backgroundColor: '#C4A066', // Warm Tan Gold
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C4A066',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 4,
    borderColor: '#F7F4EE',
    marginTop: -32,
  },
  centerAddBtnText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#6B7C70',
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
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,22,16,0.6)',
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
    elevation: 14,
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
