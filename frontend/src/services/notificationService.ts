import { Platform, Vibration } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { VendorOrder } from './apiService';
import Constants from 'expo-constants';

// Configure notification handling behaviour
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

let alarmSoundObject: Audio.Sound | null = null;

export async function requestAlarmPermissions() {
  if (Platform.OS === 'web') return true;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('order_alarms', {
        name: 'Order Alarm Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: '#EF4444',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: 'default',
        bypassDnd: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for notification permissions!');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPerm = await requestAlarmPermissions();
    if (!hasPerm) return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return tokenData.data;
  } catch (e) {
    console.error('Error fetching Expo Push Token:', e);
    return null;
  }
}

export async function playAlarmSound(
  soundUrl: string = 'https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav',
  volume: number = 1.0
) {
  try {
    await stopAlarmSound();

    if (Platform.OS !== 'web') {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      { shouldPlay: true, isLooping: true, volume }
    );
    alarmSoundObject = sound;
    Vibration.vibrate([1000, 1000, 1000], true);
  } catch (error) {
    console.error('Failed to play alarm sound:', error);
  }
}

export async function stopAlarmSound() {
  try {
    Vibration.cancel();
    if (alarmSoundObject) {
      await alarmSoundObject.stopAsync();
      await alarmSoundObject.unloadAsync();
      alarmSoundObject = null;
    }
  } catch (error) {
    console.error('Error stopping alarm sound:', error);
  }
}

export async function triggerOrderNotification(order: VendorOrder) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🚨 NEW ORDER #${order.order_id}!`,
        body: `Customer: ${order.customer_name} • Total: ₹${order.total_amount}`,
        data: { orderId: order.order_id },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' ? { channelId: 'order_alarms' } : {}),
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
