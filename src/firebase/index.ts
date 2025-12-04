import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Note: This is a public configuration.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
  const apps = getApps();
  const firebaseApp: FirebaseApp = apps.length
    ? apps[0]
    : initializeApp(firebaseConfig);
  const auth: Auth = getAuth(firebaseApp);
  const db: Firestore = getFirestore(firebaseApp);

  return { firebaseApp, auth, db };
}

export * from './provider';
export * from './auth/use-user';
export { initializeFirebase };
