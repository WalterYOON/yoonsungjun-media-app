// Firebase Imports
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc,
  writeBatch, query, where, getDocs, orderBy, limit
} from 'firebase/firestore';
import {
  getAuth, signInWithCustomToken, signInAnonymously, signInWithEmailAndPassword, signOut,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged,
  browserSessionPersistence, setPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// 브라우저 탭/창을 닫으면 자동 로그아웃 (공용 PC 보안)
setPersistence(auth, browserSessionPersistence).catch(console.error);
const db = getFirestore(app);
const appId = import.meta.env.VITE_APP_ID ?? 'fairplay-vmedia-app';

export { app, auth, db, appId };
export {
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc,
  writeBatch, query, where, getDocs, orderBy, limit,
  signInWithCustomToken, signInAnonymously, signInWithEmailAndPassword, signOut,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged
};
