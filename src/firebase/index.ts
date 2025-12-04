import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

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
export { initializeFirebase };
