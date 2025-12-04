
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { unsubscribeAll } from '@/app/data';

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
    
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      let userDocSnapshotUnsubscribe: () => void = () => {};

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        userDocSnapshotUnsubscribe = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser({ ...firebaseUser, ...docSnap.data() });
          } else {
            const isAdminByEmail = firebaseUser.email === 'adminarisan@gmail.com';
            const userProfileData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                isAdmin: isAdminByEmail,
            };
            setDoc(userRef, userProfileData, { merge: true }).catch(error => {
                console.error("Error creating user document:", error);
            });
            setUser({ ...firebaseUser, ...userProfileData });
          }
          setLoading(false);
        }, (error) => {
            console.error("Error in user snapshot listener:", error);
            setUser(firebaseUser); // Fallback to auth user data
            setLoading(false);
        });

      } else {
        // User is signed out.
        unsubscribeAll(); // Unsubscribe from all data listeners.
        setUser(null);
        setLoading(false);
      }
      
      // Cleanup the user document listener when auth state changes or component unmounts.
      return () => {
        userDocSnapshotUnsubscribe();
      };
    });

    // Cleanup the main auth state listener on component unmount.
    return () => unsubscribeAuth();
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
