
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { subscribeToData } from '@/app/data';
import type { DetailedPayment, Expense } from '@/app/data';
import { useFirestore } from '@/firebase';

export function FinancialSummary() {
  const db = useFirestore();
  const [payments, setPayments] = useState<DetailedPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!db) return;
    const unsubPayments = subscribeToData(db, 'payments', (data) => setPayments(data as DetailedPayment[]));
    const unsubExpenses = subscribeToData(db, 'expenses', (data) => setExpenses(data as Expense[]));

    return () => {
        unsubPayments();
        unsubExpenses();
    };
  }, [db]);


  const { remainingCash } =
    useMemo(() => {
      const totalIncome = payments
        .filter((p) => p.status === 'Paid')
        .reduce((sum, p) => sum + p.totalAmount, 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      const remainingCash = totalIncome - totalExpenses;

      return { remainingCash };
    }, [payments, expenses]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:border-primary/50 transition-colors lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Saldo Kas Saat Ini
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
    </div>
  );
}
