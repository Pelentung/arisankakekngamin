
'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { useFirestore, initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { MonthlyReport } from '@/components/laporan/monthly-report';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { UserDashboard } from '@/components/dashboard/user-dashboard';
import { Loader2 } from 'lucide-react';
import { AnnouncementsList } from '@/components/laporan/announcements-list';
import { subscribeToData, unsubscribeAll } from '@/app/data';


export default function LaporanPage() {
  const { auth } = initializeFirebase();
  const db = useFirestore();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!db) return;

    const authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
       if (!currentUser) {
         router.push('/');
       }
    });
    
    // Subscribe to all necessary data for reports
    const unsubAnnouncements = subscribeToData(db, 'announcements', () => {});
    const unsubPayments = subscribeToData(db, 'payments', () => {});
    const unsubExpenses = subscribeToData(db, 'expenses', () => {});
    const unsubGroups = subscribeToData(db, 'groups', () => {});
    const unsubMembers = subscribeToData(db, 'members', () => {});
    const unsubSettings = subscribeToData(db, 'contributionSettings', () => {});


    return () => {
      authUnsubscribe();
      // Unsubscribe from all data listeners on component unmount
      unsubscribeAll();
    };
  }, [auth, router, db]);
  
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

  // Regular user (admin) view
  if (!user.isAnonymous) {
      return (
        <SidebarProvider>
          <Sidebar>
            <SidebarNav />
          </Sidebar>
          <SidebarInset>
            <div className="flex flex-col min-h-screen">
              <Header title="Laporan & Pengumuman" />
              <main className="flex-1 p-4 md:p-6 space-y-6">
                <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
                  Laporan, Riwayat & Pengumuman
                </h1>
                <AnnouncementsList />
                <MonthlyReport />
                <WinnerHistory />
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      );
  }

  // Guest user view
  return <UserDashboard />;
}
