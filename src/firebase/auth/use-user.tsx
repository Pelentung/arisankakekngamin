
'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import type { User as FirebaseAuthUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';
import { doc, onSnapshot, setDoc, getDocs, serverTimestamp, collection } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface User extends FirebaseAuthUser {
    isAdmin?: boolean;
}

interface UserContextType {
  user: User | null | undefined;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const db = useFirestore();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
        // Firebase might not be initialized yet
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        
        // Listen for changes to the user's document in Firestore
        const unsubSnapshot = onSnapshot(userRef, 
        async (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                setUser({ ...firebaseUser, ...userData });
            } else {
                // If user doc doesn't exist, create it.
                // The first user to sign up will be made an admin.
                const usersCollectionRef = collection(db, 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);
                const isFirstUser = usersSnapshot.empty;
                
                const newUserProfile = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName || firebaseUser.email,
                    photoURL: firebaseUser.photoURL,
                    isAdmin: isFirstUser, // First user is admin
                    createdAt: serverTimestamp(),
                };
                
                try {
                    await setDoc(userRef, newUserProfile);
                    setUser({ ...firebaseUser, ...newUserProfile });
                } catch (e) {
                     errorEmitter.emit('permission-error', new FirestorePermissionError({
                        path: userRef.path,
                        operation: 'create',
                        requestResourceData: newUserProfile
                    }));
                }
            }
             setLoading(false);
        }, 
        (error) => {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: userRef.path,
                operation: 'get',
            }));
            setUser(firebaseUser); // Set user without custom data if snapshot fails
            setLoading(false);
        });

        return () => unsubSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
