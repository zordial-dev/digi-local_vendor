import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  LogOut,
  RefreshCw
} from 'lucide-react-native';
import { Colors, APP_LOGO_URL } from '../constants/theme';
import {
  VendorUser,
  VendorItem,
  VendorOrder,
  VendorSubscription,
  VendorPayment,
  fetchVendorDashboardApi,
  updateOrderStatusApi,
  updateVendorPushTokenApi,
  setApiBaseUrl,
  placeOrderApi
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
import { LoginScreen } from '../components/LoginScreen';
import { OrdersScreenComponent } from '../components/OrdersScreen';
import { MenuScreenComponent } from '../components/MenuScreen';
import { SettingsScreenComponent } from '../components/SettingsScreen';
import { AlarmOverlay } from '../components/AlarmOverlay';
import { StoreDigitalCardModal } from '../components/StoreDigitalCardModal';
import { CustomAlertModal, CustomAlertState, AlertType } from '../components/CustomAlertModal';

export default function App() {
  const insets = useSafeAreaInsets();
  const [currentUser, setCurrentUser] = useState<VendorUser | null>(null);
  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'settings'>('menu');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDigitalCard, setShowDigitalCard] = useState(false);

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
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  const theme = Colors.light;

  // Load Vendor Dashboard Data
  const loadDashboardData = async (vendorId: number) => {
    try {
      const data = await fetchVendorDashboardApi(vendorId);
      setItems(data.items || []);
      setSubscription(data.subscription || null);
      setPayments(data.payments || []);

      const newOrders = data.orders || [];

      // Detect newly placed orders for alarm trigger
      if (!isFirstLoadRef.current) {
        const newlyPlaced = newOrders.find(
          o => o.status === 'PLACED' && !knownOrderIdsRef.current.has(o.order_id)
        );

        if (newlyPlaced) {
          setActiveAlarmOrder(newlyPlaced);
          await triggerOrderNotification(newlyPlaced);
          await playAlarmSound();
        }
      } else {
        isFirstLoadRef.current = false;
      }

      // Update known order IDs set
      const idsSet = new Set<number>();
      newOrders.forEach(o => idsSet.add(o.order_id));
      knownOrderIdsRef.current = idsSet;

      setOrders(newOrders);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
    }
  };

  // Auto-restore saved API URL & vendor login session on App launch
  useEffect(() => {
    async function restoreSession() {
      const savedUrl = await getSavedApiBaseUrlStorage();
      if (savedUrl) {
        console.log(`[App] Restored custom API URL: ${savedUrl}`);
        setApiBaseUrl(savedUrl);
      }
      const savedVendor = await getSavedVendorUser();
      if (savedVendor) {
        console.log(`[App] Auto-logging into saved vendor account: ${savedVendor.store_name} (${savedVendor.email})`);
        setCurrentUser(savedVendor);
      }
    }
    restoreSession();
  }, []);

  // Auto-polling & Push Token Registration for Background Notifications
  useEffect(() => {
    if (!currentUser) return;

    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log(`[App] Registered Expo Push Token: ${token}`);
        updateVendorPushTokenApi(currentUser.vendor_id, token);
      }
    });

    loadDashboardData(currentUser.vendor_id);
    const interval = setInterval(() => {
      loadDashboardData(currentUser.vendor_id);
    }, 3000);

    return () => clearInterval(interval);
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
    });
  };

  const handleLogout = async () => {
    await clearSavedCredentials();
    await stopAlarmSound();
    setActiveAlarmOrder(null);
    setCurrentUser(null);
  };

  const handleAcceptAlarmOrder = async (orderId: number) => {
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
      status: 'PLACED',
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

  // If not logged in, render DigiCafe-styled Login / Registration screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        isDarkMode={false}
      />
    );
  }

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1428" />

      {/* Dark Admin Header Bar */}
      <View style={styles.adminHeader}>
        {/* Avatar - tapping opens Digital Card */}
        <TouchableOpacity
          style={styles.headerAvatar}
          onPress={() => setShowDigitalCard(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.headerAvatarText}>
            {currentUser.store_name.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>DIGILOCAL VENDOR TERMINAL</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentUser.store_name.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerLogoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.headerLogoutText}>LOG OUT</Text>
          <LogOut size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Top Tab Bar matching DigiLocal App */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[
            styles.topTabItem,
            currentTab === 'menu' && styles.topTabItemActive
          ]}
          onPress={() => setCurrentTab('menu')}
          activeOpacity={0.7}
        >
          <Text style={[styles.topTabText, currentTab === 'menu' && styles.topTabTextActive]}>
            MANAGE MENU
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topTabItem,
            currentTab === 'orders' && styles.topTabItemActive
          ]}
          onPress={() => setCurrentTab('orders')}
          activeOpacity={0.7}
        >
          <Text style={[styles.topTabText, currentTab === 'orders' && styles.topTabTextActive]}>
            ORDERS ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topTabItem,
            currentTab === 'settings' && styles.topTabItemActive
          ]}
          onPress={() => setCurrentTab('settings')}
          activeOpacity={0.7}
        >
          <Text style={[styles.topTabText, currentTab === 'settings' && styles.topTabTextActive]}>
            SETTINGS
          </Text>
        </TouchableOpacity>
      </View>

      {/* Active App Screen Container */}
      <View style={[styles.screenContainer, { paddingBottom: insets.bottom }]}>
        {currentTab === 'menu' && (
          <MenuScreenComponent
            vendorId={currentUser.vendor_id}
            items={items}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
          />
        )}

        {currentTab === 'orders' && (
          <OrdersScreenComponent
            vendorId={currentUser.vendor_id}
            orders={orders}
            isLoading={loading}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreenComponent
            vendor={currentUser}
            subscription={subscription}
            payments={payments}
            onLogout={handleLogout}
            onRefresh={() => loadDashboardData(currentUser.vendor_id)}
            isDarkMode={false}
            onToggleDarkMode={() => {}}
            onTestAlarm={handleTriggerTestAlarm}
          />
        )}
      </View>

      {/* Alarm Warning Overlay (Full Screen Modal) */}
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

      {/* Custom Internal App Popup Alert Modal */}
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
    backgroundColor: '#18281F',
  },
  adminHeader: {
    backgroundColor: '#18281F',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#C4A066',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18281F',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 9,
    color: '#C4A066',
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 13,
    color: '#F8F5EE',
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C4A066',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  headerLogoutText: {
    color: '#F8F5EE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4DCC9',
    elevation: 2,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  topTabItem: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  topTabItemActive: {
    borderBottomColor: '#C4A066',
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7C70',
    letterSpacing: 0.5,
  },
  topTabTextActive: {
    color: '#C4A066',
    fontWeight: '800',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8F5EE',
  },
});
