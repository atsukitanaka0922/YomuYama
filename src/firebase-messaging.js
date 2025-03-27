// src/firebase-messaging.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db, auth } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

// 通知許可を要求
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('通知許可の取得に失敗しました:', error);
    return false;
  }
};

// FCMトークンを取得
export const getFCMToken = async () => {
  try {
    const messaging = getMessaging();
    
    // 公開鍵は Firebase Console から取得します
    // vapidKey は実際のキーに置き換えてください
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY',
    });
    
    if (token) {
      // トークンをユーザーのアカウントに保存
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          fcmToken: token,
          notificationsEnabled: true,
        });
      }
      
      return token;
    } else {
      console.warn('トークンを取得できませんでした。通知が機能しない可能性があります。');
      return null;
    }
  } catch (error) {
    console.error('FCMトークンの取得に失敗しました:', error);
    return null;
  }
};

// フォアグラウンドでのメッセージ受信
export const setupMessageHandler = () => {
  try {
    const messaging = getMessaging();
    
    onMessage(messaging, (payload) => {
      console.log('メッセージを受信しました:', payload);
      
      // フォアグラウンドでのカスタム通知
      const notificationTitle = payload.notification.title;
      const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo192.png',
        data: payload.data,
      };
      
      if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      }
    });
  } catch (error) {
    console.error('メッセージハンドラの設定に失敗しました:', error);
  }
};