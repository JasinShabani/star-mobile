declare module 'react-native-onesignal' {
  interface Notification {
    title?: string;
    body?: string;
    additionalData?: Record<string, any>;
  }
  interface ForegroundEvent {
    getNotification(): Notification;
    complete(notification?: Notification | null): void;
  }
  interface ClickEvent {
    notification: Notification;
  }
  export const OneSignal: {
    initialize(appId: string): void;
    setNotificationWillShowInForegroundHandler(handler: (event: ForegroundEvent) => void): void;
    setNotificationOpenedHandler(handler: (event: any) => void): void;
    setExternalUserId(id: string): void;
    removeExternalUserId(): void;
    Notifications: {
      requestPermission(prompt?: boolean): void;
      addEventListener(eventName: 'click', handler: (event: ClickEvent) => void): void;
    };
  };
  export default OneSignal;
}
