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
    const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

    const reportData = useMemo(() => {
        const [year, month] = selectedMonth.split('-').map(Number);
        const previousMonthDate = subMonths(new Date(year, month), 1);
        const prevYear = getYear(previousMonthDate);
        const prevMonth = getMonth(previousMonthDate);

        const group = arisanData.groups[0]; // Assuming one main group
        const contributionAmount = group.contributionAmount;

        const cashIn = arisanData.payments.filter(p => {
            const paymentDate = new Date(p.dueDate);
            return p.status === 'Paid' && getYear(paymentDate) === year && getMonth(paymentDate) === month;
        }).reduce((sum, p) => sum + p.amount, 0);
        
        // Find winner from the PREVIOUS month
        const previousWinnerPayment = arisanData.payments.find(p => {
            const paymentDate = new Date(p.dueDate);
            return getYear(paymentDate) === prevYear && getMonth(paymentDate) === prevMonth;
        });
        
        let cashOut = 0;
        let previousWinner = null;
        
        // This is a simplification. A real app would have a record of who won each month.
        // We'll pick a "winner" from the previous month's members for demonstration.
        const prevWinnerId = arisanData.groups[0].currentWinnerId; // use current winner as stand-in
        const potentialPreviousWinner = arisanData.members.find(m => m.id === prevWinnerId);

        if (potentialPreviousWinner) {
            previousWinner = potentialPreviousWinner;
            cashOut = group.contributionAmount * group.memberIds.length;
        }

        const endingBalance = cashIn - cashOut;

        const transactions = arisanData.payments
            .filter(p => {
                const paymentDate = new Date(p.dueDate);
                return getYear(paymentDate) === year && getMonth(paymentDate) === month && p.status === 'Paid';
            })
            .map(p => {
                const member = arisanData.members.find(m => m.id === p.memberId);
                return {
                    member: member?.name || 'Unknown',
                    amount: p.amount,
                    date: p.dueDate,
                };
            });

        return { cashIn, cashOut, endingBalance, previousWinner, transactions };
    }, [selectedMonth]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
                <CardTitle>Ringkasan Laporan</CardTitle>
                <CardDescription>Menampilkan data keuangan untuk bulan yang dipilih.</CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih Bulan" />
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
                        <p className="text-xs text-muted-foreground">Pencairan untuk pemenang</p>
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
                        <CardTitle className="text-sm font-medium">Pemenang Bulan Lalu</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {reportData.previousWinner ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={reportData.previousWinner.avatarUrl} data-ai-hint={reportData.previousWinner.avatarHint} />
                                    <AvatarFallback>{reportData.previousWinner.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-semibold text-sm">{reportData.previousWinner.name}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Tidak ada data</p>
                        )}
                         <p className="text-xs text-muted-foreground mt-2">Pemenang arisan siklus sebelumnya</p>
                    </CardContent>
                </Card>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Detail Transaksi Masuk</CardTitle>
            <CardDescription>Daftar semua iuran yang telah dibayarkan pada bulan ini.</CardDescription>
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
                                <TableCell>{tx.member}</TableCell>
                                <TableCell>{format(new Date(tx.date), 'd MMMM yyyy', { locale: id })}</TableCell>
                                <TableCell className="text-right">{formatCurrency(tx.amount)}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground">
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
