// Firebase config and initialization for Undergraduation Admin Dashboard
// REPLACE the config placeholders below with your Firebase project credentials
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAoFPJio3TItyeNigjmgtYXT38tcnIQOPQ",
  authDomain: "undergraduation-project-5ac5d.firebaseapp.com",
  projectId: "undergraduation-project-5ac5d",
  storageBucket: "undergraduation-project-5ac5d.appspot.com",
  messagingSenderId: "533956456289",
  appId: "1:533956456289:web:48addef3f5223fa058df20",
  measurementId: "G-2ZGLR63NN6"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// NOTE: Analytics is not enabled here, since this is a Next.js (SSR) app. Use only on client if needed.
