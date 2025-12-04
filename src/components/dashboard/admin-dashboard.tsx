'use client';

import { Header } from '@/components/layout/header';
import { FinancialSummary } from '@/components/dashboard/financial-summary';
import { GroupsList } from '@/components/dashboard/groups-list';
import { WinnerHistory } from '@/components/dashboard/winner-history';
import { RealTimeClock } from '@/components/dashboard/real-time-clock';

export function AdminDashboard() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header title="Menu Utama" />
            <main className="flex-1 p-4 md:p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h1 className="font-headline text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-blue-500 sm:text-3xl">
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
    );
}
