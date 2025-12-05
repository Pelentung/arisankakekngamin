
'use client';

import { Header } from '@/components/layout/header';
import { MonthlyReport } from '@/components/laporan/monthly-report';
import { Button } from '../ui/button';
import { LogOut, Megaphone, Trophy, ClipboardList } from 'lucide-react';
import { initializeFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { WinnerHistory } from './winner-history';
import { AnnouncementsList } from '../laporan/announcements-list';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { RealTimeClock } from './real-time-clock';
import Image from 'next/image';


export function UserDashboard() {
    const { auth } = initializeFirebase();
    const router = useRouter();

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Selamat Datang di Arisan Keluarga Besar Kami" isMarquee />
            <main className="flex-1 p-4 md:p-6 space-y-6">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="rounded-lg bg-primary/20 text-primary h-12 w-12 overflow-hidden flex-shrink-0">
                           <Image src="https://i.imgur.com/Euyh8nM.png" alt="App Logo" width={48} height={48} className="object-cover w-full h-full"/>
                        </div>
                        <h1 className="font-headline text-2xl font-extrabold tracking-tight sm:text-3xl animate-shimmer bg-[linear-gradient(110deg,hsl(var(--primary)),45%,hsl(var(--accent)),55%,hsl(var(--primary)))] bg-[length:200%_100%] bg-clip-text text-transparent">
                            ARISAN KELUARGA BESAR Alm. KAKEK NGAMIN
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                        <RealTimeClock />
                        <Button variant="outline" onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Keluar
                        </Button>
                    </div>
                 </div>
                 
                 <Card>
                    <CardHeader>
                        <CardTitle className="uppercase text-blue-600">Pengumuman</CardTitle>
                        <CardDescription>Informasi penting dan terkini dari pengurus arisan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AnnouncementsList />
                    </CardContent>
                 </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="uppercase text-blue-600">Rangkuman Laporan Keuangan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MonthlyReport />
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="uppercase text-blue-600">Anggota Yang Sudah Narik</CardTitle>
                        <CardDescription>Daftar anggota yang sudah pernah memenangkan undian di setiap grup.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WinnerHistory />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
