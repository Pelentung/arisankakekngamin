
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface User extends FirebaseAuthUser {
  isAdmin?: boolean;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Always try to set/update user document on auth state change.
        // This handles new user creation and keeps data fresh.
        // Using { merge: true } is idempotent and safe.
        const isAdminByEmail = firebaseUser.email === 'adminarisan@gmail.com';
        const userProfileData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            isAdmin: isAdminByEmail,
        };

        try {
            // This will create the document if it doesn't exist, 
            // or update it if it does. No need to check for existence first.
            await setDoc(userRef, userProfileData, { merge: true });
        } catch (error) {
            console.error("Error writing user profile:", error);
        }

        const unsubSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({ ...firebaseUser, ...userData });
          } else {
            // Fallback to the data we just tried to write if snapshot is slow
            setUser({ ...firebaseUser, ...userProfileData });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error in user snapshot listener:", error);
            // Fallback to auth user if snapshot fails
            setUser(firebaseUser); 
            setLoading(false);
        });

        return () => unsubSnapshot(); // Return snapshot listener cleanup
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe(); // Return auth state listener cleanup
  }, [auth, db]);

  const value: UserContextType = {
    user,
    loading,
  };

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
