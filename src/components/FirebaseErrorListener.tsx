
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This is a client-side only component that handles Firebase permission errors.
// It's designed to run in development and will be tree-shaken from production builds.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(
        '[@firebase/permission-error-listener]:\n',
        'Caught a Firestore permission error. This will now be thrown as an uncaught exception to surface it in the Next.js dev overlay. This is for development purposes only.',
        error.toString()
      );
      
      // We throw the error in a timeout to break out of the current React render cycle.
      // This allows the Next.js development overlay to catch it and display it.
      setTimeout(() => {
        throw error;
      }, 0);
      
      toast({
        variant: 'destructive',
        title: 'Firestore Permission Error',
        description:
          'Check the browser console and Next.js overlay for more details.',
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null; // This component does not render anything.
}
