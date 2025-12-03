import { Header } from '@/components/layout/header';
import { FinancialSummary } from '@/components/dashboard/financial-summary';
import { GroupsList } from '@/components/dashboard/groups-list';
import { PaymentOverview } from '@/components/dashboard/payment-overview';
import { WinnerHistory } from '@/components/dashboard/winner-history';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Menu Utama" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
          Manajemen Keuangan Arisan Keluarga Besar Alm. Kakek Ngamin
        </h1>
        
        <FinancialSummary />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PaymentOverview />
          </div>
          <div className="flex flex-col gap-6">
            <GroupsList />
          </div>
        </div>

        <WinnerHistory />
      </main>
    </div>
  );
}
