import { Header } from '@/components/layout/header';
import { MonthlyReport } from '@/components/laporan/monthly-report';

export default function LaporanPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Laporan Keuangan" />
      <main className="flex-1 p-4 md:p-6 space-y-6">
        <h1 className="font-headline text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl">
          Laporan Bulanan Arisan
        </h1>
        
        <MonthlyReport />
      </main>
    </div>
  );
}
