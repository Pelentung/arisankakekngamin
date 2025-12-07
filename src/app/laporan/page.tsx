
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
import { Loader2, Megaphone, ClipboardList, Trophy } from 'lucide-react';
import { AnnouncementsList } from '@/components/laporan/announcements-list';
import { subscribeToData, unsubscribeAll } from '@/app/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserDashboard } from '@/components/dashboard/user-dashboard';

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
    });
    
    // Subscribe to all necessary data for reports
    const unsubAnnouncements = subscribeToData(db, 'announcements', () => {});
    const unsubPayments = subscribeToData(db, 'payments', () => {});
    const unsubExpenses = subscribeToData(db, 'expenses', () => {});
    const unsubGroups = subscribeToData(db, 'groups', () => {});
    const unsubMembers = subscribeToData(db, 'members', () => {});

    return () => {
      authUnsubscribe();
      // Unsubscribe from all data listeners on component unmount
      unsubscribeAll();
    };
  }, [auth, db]);

  useEffect(() => {
    // Redirect logic must be in useEffect to avoid "setstate in render" errors.
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [isLoading, user, router]);
  
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
                
                <div className="grid grid-cols-1 gap-6">
                   <Card className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-start gap-4">
                            <div className="p-2 bg-primary/20 text-primary rounded-lg">
                                <Megaphone className="w-6 h-6"/>
                            </div>
                            <div>
                                <CardTitle className="text-primary animate-blink font-bold">PENGUMUMAN</CardTitle>
                                <CardDescription>Informasi penting dan terkini dari pengurus arisan.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <AnnouncementsList />
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden border-blue-500/50 border-t-4">
                         <CardHeader className="flex flex-row items-start gap-4">
                            <div className="p-2 bg-blue-500/20 text-blue-600 rounded-lg">
                                <ClipboardList className="w-6 h-6"/>
                            </div>
                            <div>
                                <CardTitle>Laporan Bulanan</CardTitle>
                                <CardDescription>Rangkuman laporan keuangan per bulan.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <MonthlyReport />
                        </CardContent>
                    </Card>
                    
                    <Card className="relative overflow-hidden border-green-500/50 border-t-4">
                        <CardHeader className="flex flex-row items-start gap-4">
                             <div className="p-2 bg-green-500/20 text-green-600 rounded-lg">
                                <Trophy className="w-6 h-6"/>
                            </div>
                            <div>
                                <CardTitle>Anggota Yang Sudah Narik</CardTitle>
                                <CardDescription>Daftar anggota yang sudah pernah memenangkan undian di setiap grup.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <WinnerHistory />
                        </CardContent>
                    </Card>
                </div>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      );
  }

  // Guest user view is handled on the main page. A second redirect is here just in case.
  // This redirect will also be safely handled by the useEffect above.
  return null;
}

    