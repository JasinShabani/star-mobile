// src/App.tsx
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Keyboard } from 'react-native';

import RootNavigator from './navigation/RootNavigator';
import { OneSignal } from 'react-native-onesignal';
import { store, persistor } from './redux/store';
import 'react-native-gesture-handler';


export default function App() {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    OneSignal.initialize('3d4ead16-1b91-4c5f-a510-fd3a747b6c91');
    OneSignal.Notifications.requestPermission(true);
    // Handle notification opened (when user taps notification)
    OneSignal.Notifications.addEventListener('click', (event: any) => {
      const { additionalData } = event.notification;

      if (additionalData?.type === 'like' && additionalData?.postId) {
        navigationRef.current?.navigate('Profile', {
          screen: 'PostDetail',
          params: {
            postId: additionalData.postId,
            user: null, // PostDetail will use post.user data instead
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
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef} onStateChange={() => Keyboard.dismiss()}>
              <RootNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}
