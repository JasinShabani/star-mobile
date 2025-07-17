// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './redux/store';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Keyboard } from 'react-native';
import { Platform } from 'react-native';

import RootNavigator from './navigation/RootNavigator';
import { OneSignal } from 'react-native-onesignal';
import DeviceInfo from 'react-native-device-info';
import api from './api/client';
import { store, persistor } from './redux/store';
import 'react-native-gesture-handler';
// Inner component that needs Redux context
function MainApp({ navigationRef }: { navigationRef: React.MutableRefObject<any> }) {
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const oneSignalInitialized = useRef(false);

  useEffect(() => {
    if (!oneSignalInitialized.current) return;
    if (userId) {
      OneSignal.login(userId);
      console.log('🆔 OneSignal.login →', userId);
    } else {
      OneSignal.logout();
      console.log('🚪 OneSignal.logout()');
    }
  }, [userId]);

  useEffect(() => {
    const sendDeviceInfo = async () => {
      try {
        const deviceType = Platform.OS;
        const deviceModel = DeviceInfo.getBrand() + ' ' + DeviceInfo.getModel();
        await api.post('/user/device', {
          playerId: null,
          deviceType,
          deviceModel,
        });
        console.log('📡 Sent device info to backend', deviceModel);
      } catch (e) {
        console.log('Failed to send device info', e);
      }
    };

    const deviceType = Platform.OS;
    console.log('🆔 deviceType →', deviceType);
    if (Platform.OS === 'android') {
      OneSignal.initialize('63cf4afc-1554-40d5-b5bf-91883997bc79');
    } else {
      OneSignal.initialize('3d4ead16-1b91-4c5f-a510-fd3a747b6c91');
    }
    OneSignal.Notifications.requestPermission(true);
    oneSignalInitialized.current = true;
    console.log('🆔 OneSignal',);
    sendDeviceInfo();
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      const { additionalData } = event.notification;

      if (additionalData?.type === 'like' && additionalData?.postId) {
        navigationRef.current?.navigate('Profile', {
          screen: 'PostDetail',
          params: {
            postId: additionalData.postId,
            user: null, 
          },
        });
      } else if (additionalData?.type === 'follow') {
        setTimeout(() => {
          navigationRef.current?.navigate('Profile', {
            screen: 'UserProfile',
            params: {
              username: additionalData.followerUsername,
              fromModal: true,
            },
          });
        }, 100);
      }
    });
    }, [navigationRef, userId]);

  return (
    <NavigationContainer ref={navigationRef} onStateChange={() => Keyboard.dismiss()}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const navigationRef = useRef<any>(null);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <MainApp navigationRef={navigationRef} />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
