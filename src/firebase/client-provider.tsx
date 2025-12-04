'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from '.';
import { FirebaseProvider, FirebaseContextType } from './provider';

// Create a context for the Firebase services
const FirebaseClientContext = createContext<FirebaseContextType | null>(null);

// Custom hook to use the Firebase services
export const useFirebase = () => {
  const context = useContext(FirebaseClientContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

// Provider component
export const FirebaseClientProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [firebaseContext, setFirebaseContext] =
    useState<FirebaseContextType | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client
    const context = initializeFirebase();
    setFirebaseContext(context);
  }, []);

  if (!firebaseContext) {
    // You can return a loader here if you want
    return <div className="flex items-center justify-center min-h-screen">Loading Firebase...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseContext.firebaseApp}
      auth={firebaseContext.auth}
      db={firebaseContext.db}
    >
      {children}
    </FirebaseProvider>
  );
};
