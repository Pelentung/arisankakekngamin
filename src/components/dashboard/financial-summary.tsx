
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


  const { totalBalance } = useMemo(() => {
      // Calculate total income from ALL paid contributions across ALL payments
      const totalIncome = payments.reduce((sum, payment) => {
          const paidContributionsTotal = Object.values(payment.contributions)
              .filter(c => c && c.paid)
              .reduce((contributionSum, c) => contributionSum + c.amount, 0);
          return sum + paidContributionsTotal;
      }, 0);

      // Calculate total expenses from ALL categories
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

      const balance = totalIncome - totalExpenses;

      return { totalBalance: balance };
    }, [payments, expenses]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:border-primary/50 transition-colors lg:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Saldo Kas Gabungan
          </CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-headline">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(totalBalance)}
          </div>
          <p className="text-xs text-muted-foreground">Akumulasi saldo kas dari seluruh pemasukan dan pengeluaran</p>
        </CardContent>
      </Card>
    </div>
  );
}
