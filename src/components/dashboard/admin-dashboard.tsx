
'use client';

import { Header } from '@/components/layout/header';
import { FinancialSummary } from '@/components/dashboard/financial-summary';
import { GroupsList } from '@/components/dashboard/groups-list';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { RealTimeClock } from '@/components/dashboard/real-time-clock';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';

export function AdminDashboard() {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col min-h-screen">
                    <Header title="Menu Utama" />
                    <main className="flex-1 p-4 md:p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h1 className="font-headline text-3xl font-extrabold tracking-tight sm:text-4xl animate-shimmer bg-[linear-gradient(110deg,hsl(var(--primary)),45%,hsl(var(--accent)),55%,hsl(var(--primary)))] bg-[length:200%_100%] bg-clip-text text-transparent">
                                ARISAN KELUARGA BESAR Alm. KAKEK NGAMIN
                            </h1>
                            <RealTimeClock />
                        </div>
                        
                        <FinancialSummary />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-3">
                                <GroupsList />
                            </div>
                        </div>

                        <WinnerHistory />
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

    
