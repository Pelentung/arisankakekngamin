
'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MonthlyReport } from '@/components/laporan/monthly-report';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { Loader2 } from 'lucide-react';

export default function LaporanPage() {
  const { auth } = initializeFirebase();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // If not logged in, redirect to login page
        router.push('/');
      } else {
        setUser(currentUser);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth, router]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This is a fallback, useEffect should already have redirected
    return null;
  }

  if (user.isAnonymous) {
    // Guest user view
    return <UserDashboard />;
  }

  // Regular user view (can see reports but also has full sidebar)
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <Header title="Laporan Keuangan" />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
              Laporan & Riwayat Pemenang
            </h1>
            
            <MonthlyReport />
            <WinnerHistory />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
