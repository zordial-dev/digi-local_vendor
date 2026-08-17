import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { VendorOrder } from './apiService';
import Constants from 'expo-constants';

// ── PILLAR 1: High-Priority Notification Handler & Android Channel ──

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
} catch (_) {}

/**
 * Register Action Category for System Notifications
 */
export async function setupNotificationCategories() {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setNotificationCategoryAsync('NEW_ORDER_ACTIONS', [
      {
        identifier: 'ACCEPT',
        buttonTitle: 'Accept',
        options: { opensAppToForeground: true }
      },
      {
        identifier: 'REJECT',
        buttonTitle: 'Reject',
        options: { isDestructive: true, opensAppToForeground: true }
      },
      {
        identifier: 'MUTE',
        buttonTitle: 'Mute',
        options: { opensAppToForeground: true }
      }
    ]);
  } catch (error) {
    console.error('Error setting up notification categories:', error);
  }
}

/**
 * Configure high-priority Android Order Alert Channel
 * - Wakes up lockscreen (PUBLIC visibility)
 * - Bypasses Do Not Disturb (bypassDnd)
 * - Plays custom chime & vibrate loop
 */
export async function setupOrderAlertChannel(requestPermission: boolean = true): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
    // Register action categories on launch/setup
    await setupNotificationCategories();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('order_alerts_channel', {
        name: 'New Order Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#055726',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'order_alert_chime.wav',
        bypassDnd: true,
        showBadge: true,
        enableVibrate: true,
        enableLights: true,
      });
    }

    let existingStatus = 'undetermined';
    try {
      const perm = await Notifications.getPermissionsAsync();
      existingStatus = perm?.status || 'undetermined';
    } catch (_) {}

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted' && requestPermission) {
      try {
        const perm = await Notifications.requestPermissionsAsync();
        finalStatus = perm?.status || 'undetermined';
      } catch (_) {}
    }

    return finalStatus === 'granted';
  } catch (error) {
    return false;
  }
}

export async function requestAlarmPermissions(): Promise<boolean> {
  return setupOrderAlertChannel(true);
}

// ── PILLAR 2: Continuous Background Audio Ringtone & Vibration Loop ──

const activeSoundObjects = new Set<Audio.Sound>();
let isRingtonePlaying = false;
let isStartingRingtone = false;

async function stopAllActiveSounds() {
  if (Platform.OS !== 'web') {
    try {
      Vibration.cancel();
    } catch (_) {}
  }

  const soundsToStop = Array.from(activeSoundObjects);
  activeSoundObjects.clear();

  for (const s of soundsToStop) {
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch (_) {}
  }
}

/**
 * Play continuous ringing chime & vibration until stopped by vendor
 */
export async function startContinuousOrderRingtone(
  soundSource: any = require('../../assets/order_alert_chime.wav'),
  volume: number = 1.0
) {
  isRingtonePlaying = true;
  if (isStartingRingtone) return;
  isStartingRingtone = true;

  try {
    await stopAllActiveSounds();

    if (!isRingtonePlaying) {
      isStartingRingtone = false;
      return;
    }

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      }).catch(() => {});
    }

    const { sound } = await Audio.Sound.createAsync(
      typeof soundSource === 'string' ? { uri: soundSource } : soundSource,
      { shouldPlay: true, isLooping: true, volume }
    );

    if (!isRingtonePlaying) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (_) {}
      isStartingRingtone = false;
      return;
    }

    activeSoundObjects.add(sound);
    if (Platform.OS !== 'web') {
      Vibration.vibrate([1000, 1000, 1000], true);
    }
  } catch (error) {
    console.error('Failed to start continuous order ringtone:', error);
  } finally {
    isStartingRingtone = false;
  }
}

export async function stopContinuousOrderRingtone() {
  isRingtonePlaying = false;
  isStartingRingtone = false;
  try {
    await stopAllActiveSounds();
  } catch (error) {
    console.error('Error stopping order ringtone:', error);
  }
}

// Aliases for backward compatibility
export const playAlarmSound = startContinuousOrderRingtone;
export const stopAlarmSound = stopContinuousOrderRingtone;

// ── PILLAR 3: Push Token Registration for Remote Backend FCM Triggers ──

const HARDCODED_EAS_PROJECT_ID = 'afdb0388-9c9f-4dc1-b3ca-d03a22d3bf9b';

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  // In Expo Go (SDK 53+), remote push notifications were removed by Expo and require a development build.
  // We check if running in Expo Go to gracefully skip remote token registration and rely on Socket.io + local alerts.
  const isExpoGo =
    Constants.appOwnership === 'expo' ||
    (Constants as any).executionEnvironment === 'storeClient';

  if (isExpoGo) {
    await setupOrderAlertChannel(false);
    return null;
  }

  try {
    const hasPerm = await setupOrderAlertChannel();
    if (!hasPerm) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.easConfig?.projectId ||
      HARDCODED_EAS_PROJECT_ID;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e: any) {
    console.warn('Expo Push Token registration note:', e.message || e);
    return null;
  }
}

// ── PILLAR 4: Local Notification Trigger & Tap Event Listeners ──

export async function triggerOrderNotification(order: VendorOrder) {
  try {
    await setupOrderAlertChannel(false);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 NEW ORDER #${order.order_id}!`,
        body: `Customer: ${order.customer_name || 'Resident'} • Total: ₹${order.total_amount}`,
        data: { orderId: order.order_id, order },
        sound: 'order_alert_chime.wav',
        categoryIdentifier: 'NEW_ORDER_ACTIONS',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: 'order_alerts_channel' } : {}),
      } as any,
      trigger: null,
    });
  } catch (error) {
    console.error('Error scheduling local order notification:', error);
  }
}

export async function dismissOrderNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
}

/**
 * Setup notification tap listener to handle off-screen / background order opens
 */
export function setupNotificationListeners(
  onOrderTapped: (orderId: number | string) => void,
  onAcceptOrder?: (orderId: number | string, vendorId?: number | string) => void,
  onRejectOrder?: (orderId: number | string, vendorId?: number | string) => void,
  onMuteOrder?: () => void
) {
  // Listener when notification arrives in foreground or background
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    startContinuousOrderRingtone();
  });

  // Listener when notification banner or action button is tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as any;
    const rawId = data?.orderId ?? data?.order_id ?? data?.order?.order_id;
    const vendorId = data?.vendorId ?? data?.vendor_id ?? data?.order?.vendor_id;

    // Dismiss the notification from status bar tray
    Notifications.dismissNotificationAsync(response.notification.request.identifier).catch(() => {});

    if (actionId === 'ACCEPT') {
      stopContinuousOrderRingtone();
      if (rawId && onAcceptOrder) {
        onAcceptOrder(rawId, vendorId);
      }
    } else if (actionId === 'REJECT') {
      stopContinuousOrderRingtone();
      if (rawId && onRejectOrder) {
        onRejectOrder(rawId, vendorId);
      }
    } else if (actionId === 'MUTE') {
      stopContinuousOrderRingtone();
      if (onMuteOrder) {
        onMuteOrder();
      }
    } else {
      // Default notification click (banner tap)
      startContinuousOrderRingtone();
      if (typeof rawId === 'string' || typeof rawId === 'number') {
        onOrderTapped(rawId);
      }
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
