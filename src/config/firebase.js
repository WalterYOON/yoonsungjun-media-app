// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, 
  writeBatch, query, where, getDocs, orderBy, limit
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export { app, auth, db, appId };
export { 
  collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, 
  writeBatch, query, where, getDocs, orderBy, limit,
  signInWithCustomToken, signInAnonymously, onAuthStateChanged
};
