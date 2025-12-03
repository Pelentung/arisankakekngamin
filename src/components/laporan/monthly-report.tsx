'use client';

import React, { useState, useMemo } from 'react';
import { arisanData } from '@/app/data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownCircle, ArrowUpCircle, Banknote, UserCheck } from 'lucide-react';
import { format, getMonth, getYear, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);

const generateMonthOptions = () => {
    const options = [];
    // Go back 12 months from the current month
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
    const monthOptions = useMemo(() => generateMonthOptions(), []);
    // Set default to be the latest month available in options
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        
        const group = arisanData.groups.find(g => g.id === 'g1');
        if (!group) return { cashIn: 0, cashOut: 0, endingBalance: 0, winner: null, transactions: [] };

        const transactions = arisanData.payments
            .filter(p => {
                const paymentDueDate = new Date(p.dueDate);
                return p.groupId === group.id && 
                       getYear(paymentDueDate) === year && 
                       getMonth(paymentDueDate) === month;
            });
        
        const paidTransactions = transactions.filter(t => t.status === 'Paid');

        const cashIn = paidTransactions.reduce((sum, p) => sum + p.amount, 0);
        
        const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        const winnerEntry = group.winnerHistory?.find(wh => wh.month.startsWith(`${year}-${month + 1}`) || wh.month === `${year}-${String(month + 1).padStart(2, '0')}`);
        
        let winner = null;
        if (winnerEntry) {
            winner = arisanData.members.find(m => m.id === winnerEntry.memberId);
        }
        
        const cashOut = winner ? group.contributionAmount * group.memberIds.length : 0;

        const endingBalance = cashIn - cashOut;

        const detailedTransactions = paidTransactions
            .map(p => {
                const member = arisanData.members.find(m => m.id === p.memberId);
                const paymentHistoryEntry = member?.paymentHistory.find(ph => {
                    const phDate = new Date(ph.date);
                    return getYear(phDate) === year && getMonth(phDate) === month;
                })
                return {
                    member: member?.name || 'Tidak diketahui',
                    avatarUrl: member?.avatarUrl,
                    avatarHint: member?.avatarHint,
                    amount: p.amount,
                    date: paymentHistoryEntry ? paymentHistoryEntry.date : p.dueDate,
                };
            });

        return { cashIn, cashOut, endingBalance, winner, transactions: detailedTransactions };
    }, [selectedMonth]);


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
                        <CardTitle className="text-sm font-medium">Kas Masuk</CardTitle>
                        <ArrowDownCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashIn)}</div>
                        <p className="text-xs text-muted-foreground">Total iuran anggota bulan ini</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Kas Keluar</CardTitle>
                        <ArrowUpCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.cashOut)}</div>
                        <p className="text-xs text-muted-foreground">Pencairan untuk yang menarik</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Saldo Akhir</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(reportData.endingBalance)}</div>
                        <p className="text-xs text-muted-foreground">Selisih kas masuk dan keluar</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Yang Menarik Bulan Terpilih</CardTitle>
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
            <CardTitle>Detail Pemasukan Bulan {format(new Date(selectedMonth.split('-')[0], selectedMonth.split('-')[1]), 'MMMM yyyy', { locale: id })}</CardTitle>
            <CardDescription>Daftar semua iuran yang telah dibayarkan pada bulan yang dipilih.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Anggota</TableHead>
                        <TableHead>Tanggal Pembayaran</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reportData.transactions.length > 0 ? (
                        reportData.transactions.map((tx, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 hidden sm:flex">
                                            <AvatarImage src={tx.avatarUrl} data-ai-hint={tx.avatarHint} />
                                            <AvatarFallback>{tx.member.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="font-medium">{tx.member}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(tx.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                                <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                Tidak ada data transaksi untuk bulan ini.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
