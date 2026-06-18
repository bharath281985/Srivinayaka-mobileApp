import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from './api';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

let notificationHandlerConfigured = false;

async function getNotificationsModule() {
  if (isExpoGo) {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

export async function registerForPushNotificationsAsync() {
  const Notifications = await getNotificationsModule();

  if (!Notifications) {
    console.log('Skipping push notifications in Expo Go. Use the APK or a development build for remote notifications.');
    return null;
  }

  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Project ID from app.json
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.log('Project ID not found in app.json. Push notifications might not work in dynamic environments.');
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    
    console.log('[DEBUG] Expo Push Token:', token);

    // Save token to backend if user is logged in
    try {
      await api.post('/api/users/push-token', {
        token,
        deviceType: Platform.OS
      });
      console.log('Push token successfully registered with backend.');
    } catch (e) {
      console.log('Failed to save push token to backend:', e.message);
    }

  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
