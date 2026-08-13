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
 * Configure high-priority Android Order Alert Channel
 * - Wakes up lockscreen (PUBLIC visibility)
 * - Bypasses Do Not Disturb (bypassDnd)
 * - Plays custom chime & vibrate loop
 */
export async function setupOrderAlertChannel(): Promise<boolean> {
  if (Platform.OS === 'web') return true;

  try {
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

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted!');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error setting up notification channel:', error);
    return false;
  }
}

export async function requestAlarmPermissions(): Promise<boolean> {
  return setupOrderAlertChannel();
}

// ── PILLAR 2: Continuous Background Audio Ringtone & Vibration Loop ──

let alarmSoundObject: Audio.Sound | null = null;

/**
 * Play continuous ringing chime & vibration until stopped by vendor
 */
export async function startContinuousOrderRingtone(
  soundSource: any = require('../../assets/order_alert_chime.wav'),
  volume: number = 1.0
) {
  try {
    await stopContinuousOrderRingtone();

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    }

    const { sound } = await Audio.Sound.createAsync(
      typeof soundSource === 'string' ? { uri: soundSource } : soundSource,
      { shouldPlay: true, isLooping: true, volume }
    );
    alarmSoundObject = sound;
    Vibration.vibrate([1000, 1000, 1000], true);
  } catch (error) {
    console.error('Failed to start continuous order ringtone:', error);
  }
}

export async function stopContinuousOrderRingtone() {
  try {
    Vibration.cancel();
    if (alarmSoundObject) {
      await alarmSoundObject.stopAsync();
      await alarmSoundObject.unloadAsync();
      alarmSoundObject = null;
    }
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
    await setupOrderAlertChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 NEW ORDER #${order.order_id}!`,
        body: `Customer: ${order.customer_name || 'Resident'} • Total: ₹${order.total_amount}`,
        data: { orderId: order.order_id, order },
        sound: 'order_alert_chime.wav',
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
  onOrderTapped: (orderId: number | string) => void
) {
  // Listener when notification arrives in foreground or background
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    startContinuousOrderRingtone();
  });

  // Listener when notification banner is tapped
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    startContinuousOrderRingtone();
    const data = response.notification.request.content.data;
    const rawId = data?.orderId ?? data?.order_id;
    if (typeof rawId === 'string' || typeof rawId === 'number') {
      onOrderTapped(rawId);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
