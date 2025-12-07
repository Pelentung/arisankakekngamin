
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Member, DetailedPayment, Expense } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownCircle, ArrowUpCircle, Banknote, HeartHandshake } from 'lucide-react';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { useFirestore } from '@/firebase';
import { Badge } from '../ui/badge';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const generateMonthOptions = () => {
    const options = [];
    let currentDate = new Date();
    for (let i = 0; i < 12; i++) {
        const monthValue = `${getYear(currentDate)}-${getMonth(currentDate)}`;
        const monthLabel = format(currentDate, 'MMMM yyyy', { locale: id });
        options.push({ value: monthValue, label: monthLabel });
        currentDate = subMonths(currentDate, 1);
    }
    return options;
};

export function MonthlyReport() {
    const db = useFirestore();
    const [allPayments, setAllPayments] = useState<DetailedPayment[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const monthOptions = useMemo(() => generateMonthOptions(), []);
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        const unsubPayments = subscribeToData(db, 'payments', data => setAllPayments(data as DetailedPayment[]));
        const unsubGroups = subscribeToData(db, 'groups', data => setAllGroups(data as Group[]));
        const unsubExpenses = subscribeToData(db, 'expenses', data => setAllExpenses(data as Expense[]));

        Promise.all([
            new Promise(resolve => { const unsub = subscribeToData(db, 'payments', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'groups', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'expenses', () => { resolve(true); unsub(); }); }),
        ]).finally(() => setIsLoading(false));

        return () => {
            unsubPayments();
            unsubGroups();
            unsubExpenses();
        };
    }, [db]);


    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const paymentsForMonth = allPayments.filter(p => {
            const paymentDueDate = new Date(p.dueDate);
            return getYear(paymentDueDate) === year && getMonth(paymentDueDate) === month;
        });

        const expensesForMonth = allExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return getYear(expenseDate) === year && getMonth(expenseDate) === month;
        });

        // Calculate cashIn by summing up individual paid contributions
        const cashIn = paymentsForMonth.reduce((sum, payment) => {
            const paidContributionsTotal = Object.values(payment.contributions)
                .filter(c => c.paid)
                .reduce((contributionSum, c) => contributionSum + c.amount, 0);
            return sum + paidContributionsTotal;
        }, 0);

        const cashOut = expensesForMonth.reduce((sum, e) => sum + e.amount, 0);

        const endingBalance = cashIn - cashOut;

        const sickFundCollected = paymentsForMonth.reduce((sum, p) => sum + (p.contributions.sick?.paid ? p.contributions.sick.amount : 0), 0);
        const bereavementFundCollected = paymentsForMonth.reduce((sum, p) => sum + (p.contributions.bereavement?.paid ? p.contributions.bereavement.amount : 0), 0);

        const sickFundSpent = expensesForMonth.filter(e => e.category === 'Sakit').reduce((sum, e) => sum + e.amount, 0);
        const bereavementFundSpent = expensesForMonth.filter(e => e.category === 'Kemalangan').reduce((sum, e) => sum + e.amount, 0);


        return { cashIn, cashOut, endingBalance, sickFundCollected, bereavementFundCollected, sickFundSpent, bereavementFundSpent };
    }, [selectedMonth, allPayments, allExpenses]);


    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="uppercase text-blue-600">Rangkuman Laporan Keuangan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Memuat data laporan...</p>
                </CardContent>
            </Card>
        )
    }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div>
                <CardTitle className="uppercase text-blue-600">Rangkuman Laporan Keuangan</CardTitle>
                <CardDescription>Pilih bulan dan tahun untuk melihat riwayat laporan keuangan.</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <SelectValue placeholder="Pilih Bulan & Tahun" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kas Masuk</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashIn)}</div>
                        <p className="text-xs text-muted-foreground">Total pemasukan bulan ini</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Kas Keluar</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashOut)}</div>
                        <p className="text-xs text-muted-foreground">Total pengeluaran bulan ini</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Bulan Ini</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.endingBalance)}</div>
                        <p className="text-xs text-muted-foreground">Selisih kas masuk dan keluar</p>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>

       <div className="grid gap-4 sm:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Dana Sosial Sakit</CardTitle>
                        <HeartHandshake className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>Rincian dana sosial untuk anggota yang sakit bulan ini.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center"><span>Terkumpul</span> <span className="font-medium">{formatCurrency(reportData.sickFundCollected)}</span></div>
                    <div className="flex justify-between items-center text-red-500"><span>Dikeluarkan</span> <span className="font-medium">{formatCurrency(reportData.sickFundSpent)}</span></div>
                    <div className="flex justify-between items-center font-bold pt-2 border-t"><span>Saldo Akhir</span> <span>{formatCurrency(reportData.sickFundCollected - reportData.sickFundSpent)}</span></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle>Dana Sosial Kemalangan</CardTitle>
                        <HeartHandshake className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardDescription>Rincian dana sosial untuk anggota yang mengalami kemalangan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex justify-between items-center"><span>Terkumpul</span> <span className="font-medium">{formatCurrency(reportData.bereavementFundCollected)}</span></div>
                    <div className="flex justify-between items-center text-red-500"><span>Dikeluarkan</span> <span className="font-medium">{formatCurrency(reportData.bereavementFundSpent)}</span></div>
                    <div className="flex justify-between items-center font-bold pt-2 border-t"><span>Saldo Akhir</span> <span>{formatCurrency(reportData.bereavementFundCollected - reportData.bereavementFundSpent)}</span></div>
                </CardContent>
            </Card>
       </div>

    </div>
  );
}

    