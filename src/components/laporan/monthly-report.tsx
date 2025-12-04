
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import type { Group, Member, DetailedPayment, Expense, ContributionSettings } from '@/app/data';
import { subscribeToData } from '@/app/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownCircle, ArrowUpCircle, Banknote, HeartHandshake, UserCheck } from 'lucide-react';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
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
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allGroups, setAllGroups] = useState<Group[]>([]);
    const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
    const [contributionSettings, setContributionSettings] = useState<ContributionSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const monthOptions = useMemo(() => generateMonthOptions(), []);
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

    useEffect(() => {
        if (!db) return;
        setIsLoading(true);
        const unsubPayments = subscribeToData(db, 'payments', data => setAllPayments(data as DetailedPayment[]));
        const unsubMembers = subscribeToData(db, 'members', data => setAllMembers(data as Member[]));
        const unsubGroups = subscribeToData(db, 'groups', data => setAllGroups(data as Group[]));
        const unsubExpenses = subscribeToData(db, 'expenses', data => setAllExpenses(data as Expense[]));
        const unsubSettings = subscribeToData(db, 'contributionSettings', data => {
            if (data.length > 0) setContributionSettings(data[0] as ContributionSettings);
        });

        Promise.all([
            new Promise(resolve => { const unsub = subscribeToData(db, 'payments', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'members', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'groups', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'expenses', () => { resolve(true); unsub(); }); }),
            new Promise(resolve => { const unsub = subscribeToData(db, 'contributionSettings', () => { resolve(true); unsub(); }); }),
        ]).finally(() => setIsLoading(false));

        return () => {
            unsubPayments();
            unsubMembers();
            unsubGroups();
            unsubExpenses();
            unsubSettings();
        };
    }, [db]);


    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const mainGroup = allGroups.find(g => g.name === 'Arisan Utama');
        
        const paymentsForMonth = allPayments.filter(p => {
            const paymentDueDate = new Date(p.dueDate);
            return getYear(paymentDueDate) === year && getMonth(paymentDueDate) === month && p.status === 'Paid';
        });

        const expensesForMonth = allExpenses.filter(e => {
            const expenseDate = new Date(e.date);
            return getYear(expenseDate) === year && getMonth(expenseDate) === month;
        });

        const cashIn = paymentsForMonth.reduce((sum, p) => sum + p.totalAmount, 0);
        const cashOut = expensesForMonth.reduce((sum, e) => sum + e.amount, 0);

        const endingBalance = cashIn - cashOut;

        const winnerEntry = mainGroup?.winnerHistory?.find(wh => {
            const whDate = new Date(wh.month);
            return getYear(whDate) === year && getMonth(whDate) === month;
        });
        
        const winner = winnerEntry ? allMembers.find(m => m.id === winnerEntry.memberId) : null;
        
        const incomeTransactions = paymentsForMonth.map(p => {
            const member = allMembers.find(m => m.id === p.memberId);
            const group = allGroups.find(g => g.id === p.groupId);
            return {
                type: 'Pemasukan' as const,
                date: p.dueDate,
                description: `${group?.name} - ${member?.name}`,
                amount: p.totalAmount,
            };
        });
        
        const expenseTransactions = expensesForMonth.map(e => ({
            type: 'Pengeluaran' as const,
            date: e.date,
            description: e.description,
            amount: e.amount,
            category: e.category,
        }));

        const allTransactions = [...incomeTransactions, ...expenseTransactions].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const sickFundCollected = paymentsForMonth.reduce((sum, p) => sum + (p.contributions.sick?.paid ? p.contributions.sick.amount : 0), 0);
        const bereavementFundCollected = paymentsForMonth.reduce((sum, p) => sum + (p.contributions.bereavement?.paid ? p.contributions.bereavement.amount : 0), 0);

        const sickFundSpent = expensesForMonth.filter(e => e.category === 'Sakit').reduce((sum, e) => sum + e.amount, 0);
        const bereavementFundSpent = expensesForMonth.filter(e => e.category === 'Kemalangan').reduce((sum, e) => sum + e.amount, 0);


        return { cashIn, cashOut, endingBalance, winner, transactions: allTransactions, sickFundCollected, bereavementFundCollected, sickFundSpent, bereavementFundSpent };
    }, [selectedMonth, allPayments, allGroups, allMembers, allExpenses]);


    if (isLoading || !contributionSettings) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Laporan Bulanan</CardTitle>
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
                <CardTitle>Laporan Bulanan</CardTitle>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">ANGGOTA SUDAH NARIK</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportData.winner ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={reportData.winner.avatarUrl} data-ai-hint={reportData.winner.avatarHint} />
                                    <AvatarFallback>{reportData.winner.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-sm">{reportData.winner.name}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Tidak ada data</p>
                        )}
                         <p className="text-xs text-muted-foreground mt-2">Penarik arisan siklus terpilih</p>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Detail Transaksi Bulan {format(new Date(selectedMonth.split('-')[0], parseInt(selectedMonth.split('-')[1])), 'MMMM yyyy', { locale: id })}</CardTitle>
            <CardDescription>Daftar semua pemasukan dan pengeluaran yang tercatat pada bulan yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.transactions.length > 0 ? (
                        reportData.transactions.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>{format(new Date(tx.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                                <TableCell className="font-medium">{tx.description}</TableCell>
                                <TableCell>
                                    <Badge variant={tx.type === 'Pemasukan' ? 'secondary' : 'destructive'} className={tx.type === 'Pemasukan' ? 'bg-green-500/20 text-green-400 border-green-500/20' : ''}>
                                        {tx.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Tidak ada data transaksi untuk bulan ini.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
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


    

    