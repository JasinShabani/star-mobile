declare module 'react-native-onesignal' {
  // Notification payload
  export interface Notification {
    title?: string;
    body?: string;
    additionalData?: Record<string, any>;
  }

  // Foreground notification handler event
  export interface ForegroundEvent {
    getNotification(): Notification;
    complete(notification?: Notification | null): void;
  }

  // Click event payload
  export interface ClickEvent {
    notification: Notification;
  }

  // Device state returned by getDeviceState()
  export interface DeviceState {
    userId: string | null;
    pushToken: string | null;
    externalUserId: string | null;
    emailUserId: string | null;
    areNotificationsEnabled: boolean;
  }

  // Main OneSignal API
  interface OneSignalStatic {
    initialize(appId: string): void;
    setNotificationWillShowInForegroundHandler(handler: (event: ForegroundEvent) => void): void;
    setNotificationOpenedHandler(handler: (event: ClickEvent) => void): void;

    // External User ID API
    login(externalId: string): void;
    logout(): void;
    setExternalUserId?(id: string): void; // legacy
    removeExternalUserId?(): void; // legacy

    // Device state API
    getDeviceState?(): Promise<DeviceState>;

    // Subscription observer
    addSubscriptionObserver(callback: (state: DeviceState) => void): void;

    // Legacy User alias API
    User: {
      addAlias(key: string, value: string): void;
      removeAliases(): void;
      getOnesignalId(): Promise<string | null>;
      getExternalId(): Promise<string | null>;
      getTags(): Promise<Record<string, string>>;
    };

    // Notifications module
    Notifications: {
      requestPermission(prompt?: boolean): void;
      addEventListener(eventName: 'click', handler: (event: ClickEvent) => void): void;
      removeEventListener(eventName: 'click', handler: (event: ClickEvent) => void): void;
    };
  }

  const OneSignal: OneSignalStatic;
  export = OneSignal;
}
