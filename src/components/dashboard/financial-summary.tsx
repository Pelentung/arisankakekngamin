'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet, PiggyBank, CircleAlert } from 'lucide-react';
import { arisanData } from '@/app/data';
import { useMemo } from 'react';

export function FinancialSummary() {
  const { remainingCash, currentPayout, outstandingPaymentsCount } =
    useMemo(() => {
      // Calculate total income from all paid contributions across all groups
      const totalIncome = arisanData.payments
        .filter((p) => p.status === 'Paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Calculate total expenses
      const totalExpenses = arisanData.expenses.reduce((sum, e) => sum + e.amount, 0);

      const remainingCash = totalIncome - totalExpenses;
      
      const mainGroup = arisanData.groups.find(g => g.id === 'g1');
      const currentPayout = mainGroup ? mainGroup.contributionAmount * mainGroup.memberIds.length : 0;
      
      const outstandingPaymentsCount = arisanData.payments.filter(
        (p) => p.groupId === 'g1' && (p.status === 'Unpaid' || p.status === 'Late')
      ).length;

      return { remainingCash, currentPayout, outstandingPaymentsCount };
    }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Sisa Kas
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(remainingCash)}
          </div>
          <p className="text-xs text-muted-foreground">Saldo kas sampai dengan saat ini</p>
        </CardContent>
      </Card>
      <Card className="hover:border-primary/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Jumlah Pencairan Saat Ini</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(currentPayout)}
          </div>
          <p className="text-xs text-muted-foreground">Untuk grup "Arisan Uang Kaget Rp. 20.000"</p>
        </CardContent>
      </Card>
      <Card className="hover:border-destructive/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pembayaran Tertunggak</CardTitle>
          <CircleAlert className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline">{outstandingPaymentsCount} Anggota</div>
          <p className="text-xs text-muted-foreground">Di grup utama</p>
        </CardContent>
      </Card>
    </div>
  );
}
