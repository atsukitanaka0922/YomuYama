// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBVueeuQcURYIAjm4uGt2xMZ1peoZQi9M8",
  authDomain: "yomuyama-a293c.firebaseapp.com",
  projectId: "yomuyama-a293c",
  storageBucket: "yomuyama-a293c.firebasestorage.app",
  messagingSenderId: "731054019052",
  appId: "1:731054019052:web:669180b4fef9c766f330c9",
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

export { db, auth, messaging };
