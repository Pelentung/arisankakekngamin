'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase/provider';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDocs, collection, query, limit } from 'firebase/firestore';

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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubSnapshot = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({ ...firebaseUser, ...userData });
            setLoading(false);
          } else {
            // New user, check if they are the first user
            const usersQuery = query(collection(db, 'users'), limit(1));
            const existingUsers = await getDocs(usersQuery);
            const isFirstUser = existingUsers.empty;

            const newUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isAdmin: isFirstUser, // First user is admin
            };
            try {
              await setDoc(userRef, newUserProfile);
              setUser({ ...firebaseUser, ...newUserProfile });
            } catch (error) {
              console.error("Error creating user profile:", error);
              setUser(firebaseUser); // Fallback to auth user
            }
            setLoading(false);
          }
        }, (error) => {
            console.error("Error in user snapshot listener:", error);
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
